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
import { OutboxStatus, SyncOpStatus } from '@saru/database';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUserContext } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { AppError, ErrorCodes } from '../common/errors/app-error';
import {
  LEGACY_OUTBOX_TYPE_MAP,
  REALTIME_SCHEMA_VERSION,
  RealtimeEventEnvelope,
  userCanReceiveEvent,
} from '../realtime/events';

const ALLOWED = new Set([
  'GOODS_RECEIPT_DRAFT',
  'STOCK_COUNT_DRAFT',
  'DELIVERY_PICK_DRAFT',
  'POD_DRAFT',
]);
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

@ApiTags('sync')
@ApiBearerAuth()
@Controller('sync')
class SyncController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('operations')
  async submit(
    @CurrentUser() user: AuthUserContext,
    @Body()
    body: {
      operationId: string;
      type: string;
      entityId?: string;
      expectedVersion?: number;
      payload: object;
      clientCreatedAt: string;
    },
  ) {
    if (!ALLOWED.has(body.type)) {
      throw new AppError(
        ErrorCodes.VALIDATION,
        'Unsupported sync operation type',
        400,
      );
    }
    const existing = await this.prisma.syncOperation.findUnique({
      where: { operationId: body.operationId },
    });
    if (existing) {
      return {
        operationId: existing.operationId,
        status: existing.status.toLowerCase(),
        result: existing.result,
      };
    }
    const row = await this.prisma.syncOperation.create({
      data: {
        operationId: body.operationId,
        userId: user.id,
        type: body.type,
        entityId: body.entityId,
        expectedVersion: body.expectedVersion,
        payload: body.payload,
        status: SyncOpStatus.ACCEPTED,
        clientCreatedAt: new Date(body.clientCreatedAt),
      },
    });
    return { operationId: row.operationId, status: 'accepted' };
  }

  @Get('operations/:id')
  async get(@Param('id') id: string, @CurrentUser() user: AuthUserContext) {
    const row = await this.prisma.syncOperation.findFirst({
      where: { operationId: id, userId: user.id },
    });
    if (!row)
      throw new AppError(ErrorCodes.NOT_FOUND, 'Sync operation not found', 404);
    return {
      operationId: row.operationId,
      status: row.status.toLowerCase(),
      result: row.result,
      conflict: row.conflict,
    };
  }

  /**
   * Cursor-based missed-event reconciliation.
   * Cursor format: `<isoOccurredAt>|<eventId>` from the last successfully applied event.
   */
  @Get('changes')
  async changes(
    @CurrentUser() user: AuthUserContext,
    @Query('cursor') cursor?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const limit = Math.min(200, Math.max(1, Number(limitRaw) || 50));
    const retentionFloor = new Date(Date.now() - RETENTION_MS);

    let afterCreatedAt: Date | null = null;
    let afterId: string | null = null;
    if (cursor) {
      const [ts, id] = cursor.split('|');
      const parsed = new Date(ts);
      if (Number.isNaN(parsed.getTime()) || !id) {
        throw new AppError(ErrorCodes.VALIDATION, 'Invalid cursor', 400);
      }
      if (parsed < retentionFloor) {
        return {
          data: [],
          meta: {
            cursor: null,
            nextCursor: null,
            exhausted: true,
            reason: 'CURSOR_EXPIRED',
            requireFullRevalidation: true,
          },
        };
      }
      afterCreatedAt = parsed;
      afterId = id;
    }

    const rows = await this.prisma.outboxEvent.findMany({
      where: {
        status: OutboxStatus.PROCESSED,
        createdAt: { gte: retentionFloor },
        ...(afterCreatedAt
          ? {
              OR: [
                { createdAt: { gt: afterCreatedAt } },
                { createdAt: afterCreatedAt, id: { gt: afterId! } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: limit,
    });

    const events: RealtimeEventEnvelope[] = [];
    for (const row of rows) {
      const envelope = this.rowToEnvelope(row);
      const scope = envelope.scope ?? {};
      if (scope.userIds?.length && !scope.userIds.includes(user.id)) continue;
      if (!userCanReceiveEvent(user.permissions, envelope.type, scope, user.id))
        continue;
      events.push(envelope);
    }

    const last = rows[rows.length - 1];
    const nextCursor = last
      ? `${last.createdAt.toISOString()}|${last.id}`
      : (cursor ?? null);

    return {
      data: events,
      meta: {
        cursor: cursor ?? null,
        nextCursor,
        exhausted: rows.length < limit,
        requireFullRevalidation: false,
      },
    };
  }

  private rowToEnvelope(row: {
    id: string;
    type: string;
    aggregateType: string;
    aggregateId: string;
    payload: unknown;
    createdAt: Date;
  }): RealtimeEventEnvelope {
    const raw = (
      row.payload && typeof row.payload === 'object' ? row.payload : {}
    ) as Record<string, unknown>;
    if (raw.eventId && raw.type && raw.entityType && raw.entityId) {
      return raw as unknown as RealtimeEventEnvelope;
    }
    return {
      eventId: row.id,
      type: LEGACY_OUTBOX_TYPE_MAP[row.type] ?? row.type,
      schemaVersion: REALTIME_SCHEMA_VERSION,
      entityType: row.aggregateType,
      entityId: row.aggregateId,
      occurredAt: row.createdAt.toISOString(),
      scope: {},
      changeSummary: 'Business record updated',
    };
  }
}

@Module({ controllers: [SyncController] })
export class SyncModule {}
