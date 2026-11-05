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
import { ContractStatus, TenderStatus } from '@saru/database';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import type { AuthUserContext } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { NumberSequenceService } from '../numbering/number-sequence.service';
import { AuditService } from '../audit/audit.service';
import { AppError, ErrorCodes } from '../common/errors/app-error';
import { normalizePage, toPaginated } from '../common/pagination/paginate';
import { OutboxService } from '../realtime/outbox.service';
import { RealtimeEventType, roomForEntity } from '../realtime/events';

@ApiTags('tenders')
@ApiBearerAuth()
@Controller('tenders')
class TendersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbers: NumberSequenceService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  @Get()
  @RequirePermissions('tenders:view')
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
  ) {
    const p = normalizePage({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
    const where: any = {};
    if (status) where.status = status.toUpperCase();
    if (q)
      where.OR = [
        { reference: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
      ];
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.tender.findMany({
        where,
        skip: p.skip,
        take: p.take,
        orderBy: { updatedAt: 'desc' },
        include: { department: true, lines: true },
      }),
      this.prisma.tender.count({ where }),
    ]);
    return toPaginated(
      rows.map((t) => ({
        id: t.id,
        reference: t.reference,
        title: t.title,
        departmentId: t.departmentId,
        departmentName: t.department.name,
        status: t.status.toLowerCase(),
        submissionDeadline: t.submissionDeadline?.toISOString() ?? null,
        estimatedValue: t.estimatedValue ? Number(t.estimatedValue) : null,
        currency: t.currency,
        lineCount: t.lines.length,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        version: t.version,
      })),
      total,
      p.page,
      p.pageSize,
    );
  }

  @Post()
  @RequirePermissions('tenders:create')
  async create(@Body() body: any, @CurrentUser() user: AuthUserContext) {
    const reference = await this.numbers.next('TENDER');
    const tender = await this.prisma.$transaction(async (tx) => {
      const created = await tx.tender.create({
        data: {
          reference,
          title: body.title,
          departmentId: body.departmentId,
          procuringAgency: body.procuringAgency,
          publishedAt: body.publishedAt
            ? new Date(body.publishedAt)
            : undefined,
          submissionDeadline: body.submissionDeadline
            ? new Date(body.submissionDeadline)
            : undefined,
          estimatedValue: body.estimatedValue,
          currency: body.currency ?? 'PKR',
          notes: body.notes,
          createdBy: user.id,
          updatedBy: user.id,
          lines: body.lines?.length
            ? {
                create: body.lines.map((l: any, i: number) => ({
                  lineNo: i + 1,
                  productId: l.productId,
                  variantId: l.variantId,
                  description: l.description,
                  quantity: l.quantity,
                  unit: l.unit,
                  estimatedUnitPrice: l.estimatedUnitPrice,
                })),
              }
            : undefined,
        },
      });
      await this.outbox.enqueue(tx, {
        type: RealtimeEventType.TENDER_CREATED,
        entityType: 'Tender',
        entityId: created.id,
        changeSummary: `Tender ${reference} created`,
        scope: { rooms: [roomForEntity('Tender', created.id)] },
        meta: { reference },
      });
      return created;
    });
    await this.audit.append({
      actorId: user.id,
      action: 'tender.create',
      module: 'tenders',
      entityType: 'Tender',
      entityId: tender.id,
      reference,
      outcome: 'success',
    });
    return this.get(tender.id);
  }

  @Get(':id')
  @RequirePermissions('tenders:view')
  async get(@Param('id') id: string) {
    const t = await this.prisma.tender.findUnique({
      where: { id },
      include: {
        department: true,
        lines: true,
        bids: true,
        contracts: true,
        checklist: true,
      },
    });
    if (!t) throw new AppError(ErrorCodes.NOT_FOUND, 'Tender not found', 404);
    return { ...t, status: t.status.toLowerCase() };
  }

  @Patch(':id')
  @RequirePermissions('tenders:edit_draft')
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthUserContext,
  ) {
    await this.prisma.tender.update({
      where: { id },
      data: {
        title: body.title,
        notes: body.notes,
        submissionDeadline: body.submissionDeadline
          ? new Date(body.submissionDeadline)
          : undefined,
        updatedBy: user.id,
        version: { increment: 1 },
      },
    });
    return this.get(id);
  }

  @Post(':id/submit')
  @RequirePermissions('tenders:submit')
  async submit(@Param('id') id: string, @CurrentUser() user: AuthUserContext) {
    const t = await this.prisma.tender.findUnique({ where: { id } });
    if (
      !t ||
      !(
        t.status === TenderStatus.DRAFT ||
        t.status === TenderStatus.PREPARING ||
        t.status === TenderStatus.READY
      )
    ) {
      throw new AppError(
        ErrorCodes.INVALID_STATE,
        'Tender cannot be submitted',
        422,
      );
    }
    await this.prisma.tender.update({
      where: { id },
      data: {
        status: TenderStatus.SUBMITTED,
        updatedBy: user.id,
        version: { increment: 1 },
      },
    });
    return this.get(id);
  }

  @Post(':id/record-outcome')
  @RequirePermissions('tenders:finalize')
  async outcome(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthUserContext,
  ) {
    const t = await this.prisma.tender.findUnique({
      where: { id },
      include: { lines: true, department: true },
    });
    if (!t) throw new AppError(ErrorCodes.NOT_FOUND, 'Tender not found', 404);
    const status = String(
      body.status || 'AWARDED',
    ).toUpperCase() as TenderStatus;
    await this.prisma.tender.update({
      where: { id },
      data: {
        status,
        outcomeNotes: body.notes,
        updatedBy: user.id,
        version: { increment: 1 },
      },
    });

    if (
      status === TenderStatus.AWARDED ||
      status === TenderStatus.PARTIALLY_AWARDED
    ) {
      const awards: Array<{
        tenderLineId: string;
        awardedQty: number;
        unitPrice: number;
      }> = body.awards ?? [];
      const reference = await this.numbers.next('CONTRACT');
      const contract = await this.prisma.contract.create({
        data: {
          reference,
          tenderId: t.id,
          departmentId: t.departmentId,
          title: body.contractTitle ?? t.title,
          status: ContractStatus.ACTIVE,
          awardedAt: new Date(),
          currency: t.currency,
          totalValue: awards.reduce(
            (s, a) => s + a.awardedQty * a.unitPrice,
            0,
          ),
          createdBy: user.id,
          updatedBy: user.id,
          lines: {
            create: awards.map((a, i) => {
              const tl = t.lines.find((l) => l.id === a.tenderLineId);
              return {
                lineNo: i + 1,
                tenderLineId: a.tenderLineId,
                productId: tl?.productId,
                variantId: tl?.variantId,
                description: tl?.description ?? 'Award line',
                awardedQty: a.awardedQty,
                unitPrice: a.unitPrice,
                unit: tl?.unit ?? 'EA',
              };
            }),
          },
        },
      });
      await this.audit.append({
        actorId: user.id,
        action: 'contract.award',
        module: 'contracts',
        entityType: 'Contract',
        entityId: contract.id,
        reference,
        outcome: 'success',
      });
    }
    return this.get(id);
  }

  @Get(':id/lines')
  @RequirePermissions('tenders:view')
  async lines(@Param('id') id: string) {
    return {
      data: await this.prisma.tenderLine.findMany({
        where: { tenderId: id },
        orderBy: { lineNo: 'asc' },
      }),
    };
  }

  @Post(':id/lines')
  @RequirePermissions('tenders:edit_draft')
  async addLine(@Param('id') id: string, @Body() body: any) {
    const count = await this.prisma.tenderLine.count({
      where: { tenderId: id },
    });
    return this.prisma.tenderLine.create({
      data: {
        tenderId: id,
        lineNo: count + 1,
        productId: body.productId,
        variantId: body.variantId,
        description: body.description,
        quantity: body.quantity,
        unit: body.unit,
        estimatedUnitPrice: body.estimatedUnitPrice,
      },
    });
  }

  @Get(':id/contracts')
  @RequirePermissions('contracts:view')
  async contracts(@Param('id') id: string) {
    return {
      data: await this.prisma.contract.findMany({ where: { tenderId: id } }),
    };
  }

  @Get(':id/checklist')
  @RequirePermissions('tender_compliance:view')
  async checklist(@Param('id') id: string) {
    return {
      data: await this.prisma.tenderChecklistItem.findMany({
        where: { tenderId: id },
      }),
    };
  }

  @Post(':id/checklist')
  @RequirePermissions('tender_compliance:edit_draft')
  async upsertChecklist(
    @Param('id') id: string,
    @Body()
    body: {
      code: string;
      title: string;
      required?: boolean;
      completed?: boolean;
      notes?: string;
    },
  ) {
    return this.prisma.tenderChecklistItem.upsert({
      where: { tenderId_code: { tenderId: id, code: body.code } },
      create: {
        tenderId: id,
        code: body.code,
        title: body.title,
        required: body.required ?? true,
        completed: body.completed ?? false,
        notes: body.notes,
        completedAt: body.completed ? new Date() : null,
      },
      update: {
        title: body.title,
        completed: body.completed,
        notes: body.notes,
        completedAt: body.completed ? new Date() : null,
      },
    });
  }
}

@Module({ controllers: [TendersController] })
export class TendersModule {}
