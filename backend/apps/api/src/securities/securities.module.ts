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
import { SecurityInstrumentStatus } from '@saru/database';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import type { AuthUserContext } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { NumberSequenceService } from '../numbering/number-sequence.service';
import { AppError, ErrorCodes } from '../common/errors/app-error';
import { normalizePage, toPaginated } from '../common/pagination/paginate';

@ApiTags('securities')
@ApiBearerAuth()
@Controller('securities')
class SecuritiesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbers: NumberSequenceService,
  ) {}

  @Get()
  @RequirePermissions('securities:view')
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const p = normalizePage({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.securityInstrument.findMany({
        skip: p.skip,
        take: p.take,
        orderBy: { expiryDate: 'asc' },
      }),
      this.prisma.securityInstrument.count(),
    ]);
    return toPaginated(
      rows.map((r) => ({
        ...r,
        status: r.status.toLowerCase(),
        type: r.type.toLowerCase(),
        amount: Number(r.amount),
      })),
      total,
      p.page,
      p.pageSize,
    );
  }

  @Get('expiring')
  @RequirePermissions('securities:view')
  async expiring() {
    const data = await this.prisma.securityInstrument.findMany({
      where: {
        status: { in: ['ACTIVE', 'ISSUED'] },
        expiryDate: { lte: new Date(Date.now() + 45 * 86400000) },
      },
      orderBy: { expiryDate: 'asc' },
    });
    return { data };
  }

  @Post()
  @RequirePermissions('securities:create')
  async create(@Body() body: any, @CurrentUser() user: AuthUserContext) {
    const reference = await this.numbers.next('SECURITY');
    return this.prisma.securityInstrument.create({
      data: {
        reference,
        type: body.type?.toUpperCase() ?? 'CDR',
        tenderId: body.tenderId,
        contractId: body.contractId,
        issuingBank: body.issuingBank,
        amount: body.amount,
        currency: body.currency ?? 'PKR',
        beneficiary: body.beneficiary,
        issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
        notes: body.notes,
        status: SecurityInstrumentStatus.DRAFT,
        createdBy: user.id,
      },
    });
  }

  @Get(':id')
  @RequirePermissions('securities:view')
  async get(@Param('id') id: string) {
    const row = await this.prisma.securityInstrument.findUnique({
      where: { id },
      include: { events: true },
    });
    if (!row)
      throw new AppError(
        ErrorCodes.NOT_FOUND,
        'Security instrument not found',
        404,
      );
    return row;
  }

  @Patch(':id')
  @RequirePermissions('securities:edit_draft')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.prisma.securityInstrument.update({
      where: { id },
      data: {
        issuingBank: body.issuingBank,
        amount: body.amount,
        beneficiary: body.beneficiary,
        issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
        status: body.status ? body.status.toUpperCase() : undefined,
        version: { increment: 1 },
      },
    });
  }

  @Post(':id/request-release')
  @RequirePermissions('securities:submit')
  async requestRelease(
    @Param('id') id: string,
    @Body() body: { note?: string },
    @CurrentUser() user: AuthUserContext,
  ) {
    return this.transition(
      id,
      SecurityInstrumentStatus.RELEASE_REQUESTED,
      user.id,
      body.note,
    );
  }

  @Post(':id/confirm-release')
  @RequirePermissions('securities:approve')
  async confirmRelease(
    @Param('id') id: string,
    @Body() body: { note?: string },
    @CurrentUser() user: AuthUserContext,
  ) {
    const row = await this.transition(
      id,
      SecurityInstrumentStatus.RELEASED,
      user.id,
      body.note,
    );
    await this.prisma.securityInstrument.update({
      where: { id },
      data: { releasedAt: new Date() },
    });
    return row;
  }

  private async transition(
    id: string,
    to: SecurityInstrumentStatus,
    actorId: string,
    note?: string,
  ) {
    const row = await this.prisma.securityInstrument.findUnique({
      where: { id },
    });
    if (!row) throw new AppError(ErrorCodes.NOT_FOUND, 'Not found', 404);
    await this.prisma.$transaction([
      this.prisma.securityInstrumentEvent.create({
        data: {
          instrumentId: id,
          fromStatus: row.status,
          toStatus: to,
          note,
          actorId,
        },
      }),
      this.prisma.securityInstrument.update({
        where: { id },
        data: { status: to, version: { increment: 1 } },
      }),
    ]);
    return this.get(id);
  }
}

@Module({ controllers: [SecuritiesController] })
export class SecuritiesModule {}
