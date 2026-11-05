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
import { ApprovalStatus } from '@saru/database';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import type { AuthUserContext } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { NumberSequenceService } from '../numbering/number-sequence.service';
import { AppError, ErrorCodes } from '../common/errors/app-error';
import { normalizePage, toPaginated } from '../common/pagination/paginate';
import { OutboxService } from '../realtime/outbox.service';
import {
  RealtimeEventType,
  roomForEntity,
  roomForUser,
} from '../realtime/events';

@ApiTags('approvals')
@ApiBearerAuth()
@Controller('approvals')
class ApprovalsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbers: NumberSequenceService,
    private readonly outbox: OutboxService,
  ) {}

  @Get()
  @RequirePermissions('approvals:view')
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const p = normalizePage({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
    const where = {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.approvalRequest.findMany({
        where,
        skip: p.skip,
        take: p.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.approvalRequest.count({ where }),
    ]);
    return toPaginated(rows, total, p.page, p.pageSize);
  }

  @Get('my-tasks')
  @RequirePermissions('approvals:view')
  async myTasks(@CurrentUser() user: AuthUserContext) {
    const rows = await this.prisma.approvalRequest.findMany({
      where: { status: ApprovalStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { data: rows, meta: { userId: user.id } };
  }

  @Get(':id')
  @RequirePermissions('approvals:view')
  async get(@Param('id') id: string) {
    const row = await this.prisma.approvalRequest.findUnique({
      where: { id },
      include: { decisions: true },
    });
    if (!row)
      throw new AppError(ErrorCodes.NOT_FOUND, 'Approval not found', 404);
    return row;
  }

  @Post(':id/approve')
  @RequirePermissions('approvals:approve')
  async approve(
    @Param('id') id: string,
    @Body() body: { comment?: string },
    @CurrentUser() user: AuthUserContext,
  ) {
    return this.decide(id, ApprovalStatus.APPROVED, user.id, body.comment);
  }

  @Post(':id/reject')
  @RequirePermissions('approvals:approve')
  async reject(
    @Param('id') id: string,
    @Body() body: { comment?: string },
    @CurrentUser() user: AuthUserContext,
  ) {
    return this.decide(id, ApprovalStatus.REJECTED, user.id, body.comment);
  }

  @Post(':id/return')
  @RequirePermissions('approvals:approve')
  async returnForChanges(
    @Param('id') id: string,
    @Body() body: { comment?: string },
    @CurrentUser() user: AuthUserContext,
  ) {
    return this.decide(id, ApprovalStatus.RETURNED, user.id, body.comment);
  }

  private async decide(
    id: string,
    decision: ApprovalStatus,
    actorId: string,
    comment?: string,
  ) {
    const req = await this.prisma.approvalRequest.findUnique({ where: { id } });
    if (!req || req.status !== ApprovalStatus.PENDING) {
      throw new AppError(
        ErrorCodes.INVALID_STATE,
        'Approval is not pending',
        422,
      );
    }
    const eventType =
      decision === ApprovalStatus.APPROVED
        ? RealtimeEventType.APPROVAL_APPROVED
        : decision === ApprovalStatus.REJECTED
          ? RealtimeEventType.APPROVAL_REJECTED
          : RealtimeEventType.APPROVAL_RETURNED;

    await this.prisma.$transaction(async (tx) => {
      await tx.approvalDecision.create({
        data: { requestId: id, actorId, decision, comment },
      });
      await tx.approvalRequest.update({
        where: { id },
        data: { status: decision },
      });
      const userIds = [actorId, req.requestedById].filter(Boolean) as string[];
      await this.outbox.enqueue(tx, {
        type: eventType,
        entityType: 'ApprovalRequest',
        entityId: id,
        changeSummary: `Approval ${decision.toLowerCase()}`,
        scope: {
          rooms: [
            roomForEntity('ApprovalRequest', id),
            ...userIds.map(roomForUser),
          ],
          userIds,
        },
      });
    });
    return this.prisma.approvalRequest.findUnique({
      where: { id },
      include: { decisions: true },
    });
  }
}

@Module({ controllers: [ApprovalsController] })
export class ApprovalsModule {}
