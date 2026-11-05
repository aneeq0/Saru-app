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
import { ContractStatus } from '@saru/database';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import type { AuthUserContext } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { NumberSequenceService } from '../numbering/number-sequence.service';
import { AppError, ErrorCodes } from '../common/errors/app-error';
import { normalizePage, toPaginated } from '../common/pagination/paginate';

@ApiTags('contracts')
@ApiBearerAuth()
@Controller('contracts')
class ContractsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbers: NumberSequenceService,
  ) {}

  @Get()
  @RequirePermissions('contracts:view')
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
      this.prisma.contract.findMany({
        where,
        skip: p.skip,
        take: p.take,
        orderBy: { updatedAt: 'desc' },
        include: { department: true, lines: true },
      }),
      this.prisma.contract.count({ where }),
    ]);
    return toPaginated(
      rows.map((c) => ({
        id: c.id,
        reference: c.reference,
        title: c.title,
        departmentName: c.department.name,
        status: c.status.toLowerCase(),
        totalValue: Number(c.totalValue),
        currency: c.currency,
        lineCount: c.lines.length,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      total,
      p.page,
      p.pageSize,
    );
  }

  @Get(':id')
  @RequirePermissions('contracts:view')
  async get(@Param('id') id: string) {
    const c = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        lines: true,
        schedules: true,
        amendments: true,
        department: true,
        tender: true,
      },
    });
    if (!c) throw new AppError(ErrorCodes.NOT_FOUND, 'Contract not found', 404);
    return { ...c, status: c.status.toLowerCase() };
  }

  @Get(':id/fulfilment')
  @RequirePermissions('contracts:view')
  async fulfilment(@Param('id') id: string) {
    const lines = await this.prisma.contractLine.findMany({
      where: { contractId: id },
    });
    return {
      data: lines.map((l) => ({
        id: l.id,
        lineNo: l.lineNo,
        description: l.description,
        awardedQty: Number(l.awardedQty),
        dispatchedQty: Number(l.dispatchedQty),
        deliveredQty: Number(l.deliveredQty),
        invoicedQty: Number(l.invoicedQty),
        remainingQty: Number(l.awardedQty) - Number(l.dispatchedQty),
      })),
    };
  }

  @Get(':id/delivery-schedules')
  @RequirePermissions('contracts:view')
  async schedules(@Param('id') id: string) {
    return {
      data: await this.prisma.contractDeliverySchedule.findMany({
        where: { contractId: id },
        orderBy: { sequence: 'asc' },
      }),
    };
  }

  @Post(':id/amendments')
  @RequirePermissions('contracts:edit_draft')
  async amend(
    @Param('id') id: string,
    @Body() body: { reason: string; effectiveAt: string },
    @CurrentUser() user: AuthUserContext,
  ) {
    const c = await this.prisma.contract.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!c) throw new AppError(ErrorCodes.NOT_FOUND, 'Contract not found', 404);
    const amendment = await this.prisma.contractAmendment.create({
      data: {
        contractId: id,
        reference: `${c.reference}-A${Date.now().toString().slice(-4)}`,
        reason: body.reason,
        effectiveAt: new Date(body.effectiveAt),
        snapshot: { contract: c, lines: c.lines },
        createdBy: user.id,
      },
    });
    await this.prisma.contract.update({
      where: { id },
      data: { status: ContractStatus.AMENDED, version: { increment: 1 } },
    });
    return amendment;
  }

  @Post(':id/close')
  @RequirePermissions('contracts:finalize')
  async close(@Param('id') id: string, @CurrentUser() user: AuthUserContext) {
    await this.prisma.contract.update({
      where: { id },
      data: {
        status: ContractStatus.CLOSED,
        closedAt: new Date(),
        updatedBy: user.id,
        version: { increment: 1 },
      },
    });
    return this.get(id);
  }
}

@Module({ controllers: [ContractsController] })
export class ContractsModule {}
