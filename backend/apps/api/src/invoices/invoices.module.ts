import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InvoiceStatus } from '@saru/database';
import Decimal from 'decimal.js';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import type { AuthUserContext } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { NumberSequenceService } from '../numbering/number-sequence.service';
import { AuditService } from '../audit/audit.service';
import { AppError, ErrorCodes } from '../common/errors/app-error';
import { normalizePage, toPaginated } from '../common/pagination/paginate';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
class InvoicesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbers: NumberSequenceService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermissions('invoices:view')
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
  ) {
    const p = normalizePage({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
    const where: any = status ? { status: status.toUpperCase() } : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        skip: p.skip,
        take: p.take,
        orderBy: { updatedAt: 'desc' },
        include: { department: true },
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return toPaginated(
      rows.map((i) => ({
        id: i.id,
        reference: i.reference,
        status: i.status.toLowerCase(),
        departmentName: i.department.name,
        grandTotal: Number(i.grandTotal),
        amountPaid: Number(i.amountPaid),
        currency: i.currency,
        dueDate: i.dueDate?.toISOString().slice(0, 10),
        createdAt: i.createdAt.toISOString(),
      })),
      total,
      p.page,
      p.pageSize,
    );
  }

  @Post()
  @RequirePermissions('invoices:create')
  async create(@Body() body: any, @CurrentUser() user: AuthUserContext) {
    const reference = await this.numbers.next('INVOICE');
    const lines = body.lines ?? [];
    let subtotal = new Decimal(0);
    let taxTotal = new Decimal(0);
    const lineData = lines.map((l: any) => {
      const lineTotal = new Decimal(l.quantity).mul(l.unitPrice);
      const tax = lineTotal.mul(l.taxRate ?? 0);
      subtotal = subtotal.plus(lineTotal);
      taxTotal = taxTotal.plus(tax);
      return {
        contractLineId: l.contractLineId,
        variantId: l.variantId,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: l.taxRate ?? 0,
        lineTotal: lineTotal.plus(tax).toFixed(6),
      };
    });
    const invoice = await this.prisma.invoice.create({
      data: {
        reference,
        contractId: body.contractId,
        departmentId: body.departmentId,
        deliveryId: body.deliveryId,
        currency: body.currency ?? 'PKR',
        subtotal: subtotal.toFixed(6),
        taxTotal: taxTotal.toFixed(6),
        grandTotal: subtotal.plus(taxTotal).toFixed(6),
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        createdBy: user.id,
        lines: { create: lineData },
      },
    });
    return this.get(invoice.id);
  }

  @Get(':id')
  @RequirePermissions('invoices:view')
  async get(@Param('id') id: string) {
    const inv = await this.prisma.invoice.findUnique({
      where: { id },
      include: { lines: true, versions: true, department: true },
    });
    if (!inv)
      throw new AppError(ErrorCodes.NOT_FOUND, 'Invoice not found', 404);
    return {
      ...inv,
      status: inv.status.toLowerCase(),
      grandTotal: Number(inv.grandTotal),
      amountPaid: Number(inv.amountPaid),
    };
  }

  @Patch(':id')
  @RequirePermissions('invoices:edit_draft')
  async update(@Param('id') id: string, @Body() body: any) {
    const inv = await this.prisma.invoice.findUnique({ where: { id } });
    if (!inv || inv.status !== InvoiceStatus.DRAFT)
      throw new AppError(ErrorCodes.INVALID_STATE, 'Only drafts editable', 422);
    await this.prisma.invoice.update({
      where: { id },
      data: {
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        version: { increment: 1 },
      },
    });
    return this.get(id);
  }

  @Post(':id/submit')
  @RequirePermissions('invoices:submit')
  async submit(@Param('id') id: string) {
    await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.SUBMITTED, version: { increment: 1 } },
    });
    return this.get(id);
  }

  @Post(':id/approve')
  @RequirePermissions('invoices:approve')
  async approve(@Param('id') id: string) {
    await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.APPROVED, version: { increment: 1 } },
    });
    return this.get(id);
  }

  @Post(':id/finalize')
  @RequirePermissions('invoices:finalize')
  async finalize(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserContext,
  ) {
    const inv = await this.prisma.invoice.findUnique({
      where: { id },
      include: { lines: true, department: true },
    });
    if (!inv)
      throw new AppError(ErrorCodes.NOT_FOUND, 'Invoice not found', 404);
    if (!(
      inv.status === InvoiceStatus.DRAFT ||
      inv.status === InvoiceStatus.SUBMITTED ||
      inv.status === InvoiceStatus.APPROVED
    )) {
      throw new AppError(
        ErrorCodes.INVALID_STATE,
        'Invoice cannot be finalized',
        422,
      );
    }
    const snapshot = {
      reference: inv.reference,
      department: inv.department.name,
      currency: inv.currency,
      subtotal: inv.subtotal,
      taxTotal: inv.taxTotal,
      grandTotal: inv.grandTotal,
      lines: inv.lines,
      finalizedAt: new Date().toISOString(),
    };
    await this.prisma.$transaction([
      this.prisma.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.FINALIZED,
          issueDate: new Date(),
          finalizedAt: new Date(),
          snapshot,
          version: { increment: 1 },
        },
      }),
      this.prisma.invoiceVersion.create({
        data: {
          invoiceId: id,
          versionNo: 1,
          snapshot,
          createdBy: user.id,
        },
      }),
    ]);
    await this.audit.append({
      actorId: user.id,
      action: 'invoice.finalize',
      module: 'invoices',
      entityType: 'Invoice',
      entityId: id,
      reference: inv.reference,
      outcome: 'success',
    });
    return this.get(id);
  }

  @Get(':id/versions')
  @RequirePermissions('invoices:view')
  async versions(@Param('id') id: string) {
    return {
      data: await this.prisma.invoiceVersion.findMany({
        where: { invoiceId: id },
        orderBy: { versionNo: 'asc' },
      }),
    };
  }

  @Get(':id/pdf')
  @RequirePermissions('invoices:export')
  async pdf(@Param('id') id: string) {
    const inv = await this.prisma.invoice.findUnique({ where: { id } });
    if (!inv?.snapshot)
      throw new AppError(
        ErrorCodes.INVALID_STATE,
        'Invoice has no finalized snapshot',
        422,
      );
    return {
      message: 'PDF generation queued',
      invoiceId: id,
      snapshot: inv.snapshot,
    };
  }
}

@Module({ controllers: [InvoicesController] })
export class InvoicesModule {}
