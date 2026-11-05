import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { OutboxStatus, Prisma } from '@saru/database';
import { PrismaService } from '../prisma/prisma.service';
import {
  LEGACY_OUTBOX_TYPE_MAP,
  REALTIME_SCHEMA_VERSION,
  RealtimeEventEnvelope,
  RealtimeEventType,
  roomForEntity,
  roomForUser,
  roomForWarehouse,
} from './events';
import { RealtimeGateway } from './realtime.gateway';

const BATCH = 50;
const POLL_MS = 750;
const MAX_ATTEMPTS = 8;

@Injectable()
export class OutboxPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisherService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private metrics = {
    published: 0,
    failures: 0,
    pending: 0,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: RealtimeGateway,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.tick();
    }, POLL_MS);
    this.logger.log('Outbox publisher started');
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  getMetrics() {
    return {
      ...this.metrics,
      realtimeConnections: this.gateway.activeConnectionCount(),
    };
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      await this.processBatch();
    } catch (err) {
      this.logger.error(
        `Outbox tick failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      this.running = false;
    }
  }

  private async processBatch() {
    const pending = await this.prisma.outboxEvent.findMany({
      where: {
        status: { in: [OutboxStatus.PENDING, OutboxStatus.FAILED] },
        availableAt: { lte: new Date() },
        attempts: { lt: MAX_ATTEMPTS },
      },
      orderBy: { createdAt: 'asc' },
      take: BATCH,
    });
    this.metrics.pending = pending.length;
    if (!pending.length) return;

    for (const row of pending) {
      const claimed = await this.prisma.outboxEvent.updateMany({
        where: {
          id: row.id,
          status: { in: [OutboxStatus.PENDING, OutboxStatus.FAILED] },
        },
        data: { status: OutboxStatus.PROCESSING, attempts: { increment: 1 } },
      });
      if (claimed.count === 0) continue;

      try {
        const envelope = this.toEnvelope(row);
        await this.fanOutSideEffects(envelope);
        this.gateway.publish(envelope);
        await this.prisma.outboxEvent.update({
          where: { id: row.id },
          data: {
            status: OutboxStatus.PROCESSED,
            processedAt: new Date(),
            lastError: null,
          },
        });
        this.metrics.published += 1;
      } catch (err) {
        this.metrics.failures += 1;
        const attempts = row.attempts + 1;
        const message = err instanceof Error ? err.message : String(err);
        const dead = attempts >= MAX_ATTEMPTS;
        const backoffMs = Math.min(60_000, 1_000 * 2 ** Math.min(attempts, 6));
        await this.prisma.outboxEvent.update({
          where: { id: row.id },
          data: {
            status: dead ? OutboxStatus.DEAD : OutboxStatus.FAILED,
            lastError: message.slice(0, 1000),
            availableAt: new Date(Date.now() + backoffMs),
          },
        });
        this.logger.warn(
          `Outbox ${row.id} failed (attempt ${attempts}): ${message}`,
        );
      }
    }
  }

  private toEnvelope(row: {
    id: string;
    type: string;
    aggregateType: string;
    aggregateId: string;
    payload: Prisma.JsonValue;
    createdAt: Date;
  }): RealtimeEventEnvelope {
    const raw = (
      row.payload && typeof row.payload === 'object' ? row.payload : {}
    ) as Record<string, unknown>;
    if (raw.eventId && raw.type && raw.entityType && raw.entityId) {
      return raw as unknown as RealtimeEventEnvelope;
    }

    const type = LEGACY_OUTBOX_TYPE_MAP[row.type] ?? row.type;
    const warehouseId =
      typeof raw.warehouseId === 'string' ? raw.warehouseId : undefined;
    const rooms = [roomForEntity(row.aggregateType, row.aggregateId)];
    if (warehouseId) rooms.push(roomForWarehouse(warehouseId));

    return {
      eventId: row.id,
      type,
      schemaVersion: REALTIME_SCHEMA_VERSION,
      entityType: row.aggregateType,
      entityId: row.aggregateId,
      occurredAt: row.createdAt.toISOString(),
      scope: {
        rooms,
        warehouseIds: warehouseId ? [warehouseId] : undefined,
      },
      changeSummary:
        type === RealtimeEventType.IMPORT_RECEIPT_POSTED
          ? 'Goods receipt posted to inventory'
          : type === RealtimeEventType.DELIVERY_DISPATCHED
            ? 'Delivery dispatch confirmed'
            : 'Business record updated',
      meta: {
        movementId: typeof raw.movementId === 'string' ? raw.movementId : null,
        variantId: typeof raw.variantId === 'string' ? raw.variantId : null,
      },
    };
  }

  /**
   * Create durable in-app notifications for targeted userIds after commit.
   */
  private async fanOutSideEffects(envelope: RealtimeEventEnvelope) {
    const userIds = envelope.scope.userIds ?? [];
    if (!userIds.length) return;

    for (const userId of userIds) {
      const existing = await this.prisma.notification.findFirst({
        where: {
          userId,
          type: envelope.type,
          entityType: envelope.entityType,
          entityId: envelope.entityId,
          createdAt: { gte: new Date(Date.now() - 60_000) },
        },
      });
      if (existing) continue;

      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type: envelope.type,
          title: envelope.changeSummary,
          body: envelope.changeSummary,
          entityType: envelope.entityType,
          entityId: envelope.entityId,
        },
      });

      const notifyEnvelope: RealtimeEventEnvelope = {
        eventId: `${envelope.eventId}:notify:${notification.id}`,
        type: RealtimeEventType.NOTIFICATION_CREATED,
        schemaVersion: REALTIME_SCHEMA_VERSION,
        entityType: 'Notification',
        entityId: notification.id,
        occurredAt: new Date().toISOString(),
        scope: { rooms: [roomForUser(userId)], userIds: [userId] },
        changeSummary: 'New notification',
        correlationId: envelope.eventId,
        meta: {
          relatedType: envelope.entityType,
          relatedId: envelope.entityId,
        },
      };
      this.gateway.publish(notifyEnvelope);
    }
  }
}
