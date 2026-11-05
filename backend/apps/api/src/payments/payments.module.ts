import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InvoiceStatus, PaymentStatus } from '@saru/database';
import Decimal from 'decimal.js';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import type { AuthUserContext } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { NumberSequenceService } from '../numbering/number-sequence.service';
import { AuditService } from '../audit/audit.service';
import { AppError, ErrorCodes } from '../common/errors/app-error';
import { normalizePage, toPaginated } from '../common/pagination/paginate';

@ApiTags('payments')
@ApiBearerAuth()
@Controller()
class PaymentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbers: NumberSequenceService,
    private readonly audit: AuditService,
  ) {}

  @Get('payments')
  @RequirePermissions('payments:view')
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const p = normalizePage({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        skip: p.skip,
        take: p.take,
        orderBy: { paidAt: 'desc' },
        include: { allocations: true },
      }),
      this.prisma.payment.count(),
    ]);
    return toPaginated(
      rows.map((r) => ({
        ...r,
        status: r.status.toLowerCase(),
        amount: Number(r.amount),
      })),
      total,
      p.page,
      p.pageSize,
    );
  }

  @Post('payments')
  @RequirePermissions('payments:create')
  async create(@Body() body: any, @CurrentUser() user: AuthUserContext) {
    const reference = await this.numbers.next('PAYMENT');
    return this.prisma.payment.create({
      data: {
        reference,
        amount: body.amount,
        currency: body.currency ?? 'PKR',
        method: body.method,
        paidAt: new Date(body.paidAt ?? Date.now()),
        bankReference: body.bankReference,
        notes: body.notes,
        status: PaymentStatus.RECORDED,
        createdBy: user.id,
      },
    });
  }

  @Get('payments/:id')
  @RequirePermissions('payments:view')
  async get(@Param('id') id: string) {
    const p = await this.prisma.payment.findUnique({
      where: { id },
      include: { allocations: { include: { invoice: true } } },
    });
    if (!p) throw new AppError(ErrorCodes.NOT_FOUND, 'Payment not found', 404);
    return p;
  }

  @Post('payments/:id/allocate')
  @RequirePermissions('payments:finalize')
  async allocate(
    @Param('id') id: string,
    @Body() body: { allocations: Array<{ invoiceId: string; amount: number }> },
    @CurrentUser() user: AuthUserContext,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { allocations: true },
    });
    if (!payment)
      throw new AppError(ErrorCodes.NOT_FOUND, 'Payment not found', 404);

    const already = payment.allocations.reduce(
      (s, a) => s.plus(a.amount),
      new Decimal(0),
    );
    const incoming = (body.allocations ?? []).reduce(
      (s, a) => s.plus(a.amount),
      new Decimal(0),
    );
    if (already.plus(incoming).gt(payment.amount)) {
      throw new AppError(
        ErrorCodes.VALIDATION,
        'Allocation exceeds payment amount',
        422,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      for (const a of body.allocations ?? []) {
        const invoice = await tx.invoice.findUnique({
          where: { id: a.invoiceId },
        });
        if (!invoice)
          throw new AppError(ErrorCodes.NOT_FOUND, 'Invoice not found', 404);
        const outstanding = new Decimal(invoice.grandTotal).minus(
          invoice.amountPaid,
        );
        if (new Decimal(a.amount).gt(outstanding)) {
          throw new AppError(
            ErrorCodes.VALIDATION,
            'Allocation exceeds invoice outstanding',
            422,
            { outstanding: outstanding.toFixed(6) },
          );
        }
        await tx.paymentAllocation.create({
          data: { paymentId: id, invoiceId: a.invoiceId, amount: a.amount },
        });
        const newPaid = new Decimal(invoice.amountPaid).plus(a.amount);
        const status = newPaid.gte(invoice.grandTotal)
          ? InvoiceStatus.PAID
          : newPaid.gt(0)
            ? InvoiceStatus.PARTIALLY_PAID
            : invoice.status;
        await tx.invoice.update({
          where: { id: a.invoiceId },
          data: { amountPaid: newPaid.toFixed(6), status },
        });
      }
      await tx.payment.update({
        where: { id },
        data: { status: PaymentStatus.ALLOCATED, version: { increment: 1 } },
      });
    });

    await this.audit.append({
      actorId: user.id,
      action: 'payment.allocate',
      module: 'payments',
      entityType: 'Payment',
      entityId: id,
      reference: payment.reference,
      outcome: 'success',
    });
    return this.get(id);
  }

  @Get('receivables')
  @RequirePermissions('receivables:view')
  async receivables(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const p = normalizePage({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
    const where = {
      status: {
        in: [
          InvoiceStatus.FINALIZED,
          InvoiceStatus.PARTIALLY_PAID,
        ] as InvoiceStatus[],
      },
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        skip: p.skip,
        take: p.take,
        include: { department: true },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return toPaginated(
      rows.map((i) => ({
        id: i.id,
        reference: i.reference,
        departmentName: i.department.name,
        grandTotal: Number(i.grandTotal),
        amountPaid: Number(i.amountPaid),
        outstanding: Number(i.grandTotal) - Number(i.amountPaid),
        dueDate: i.dueDate?.toISOString().slice(0, 10),
        overdueDays: i.dueDate
          ? Math.max(
              0,
              Math.floor((Date.now() - i.dueDate.getTime()) / 86400000),
            )
          : 0,
      })),
      total,
      p.page,
      p.pageSize,
    );
  }

  @Get('receivables/overdue')
  @RequirePermissions('receivables:view')
  async overdue() {
    const data = await this.prisma.invoice.findMany({
      where: {
        status: { in: [InvoiceStatus.FINALIZED, InvoiceStatus.PARTIALLY_PAID] },
        dueDate: { lt: new Date() },
      },
      include: { department: true },
      orderBy: { dueDate: 'asc' },
    });
    return { data };
  }
}

@Module({ controllers: [PaymentsController] })
export class PaymentsModule {}
