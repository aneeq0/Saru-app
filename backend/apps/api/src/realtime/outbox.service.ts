import { Injectable } from '@nestjs/common';
import { OutboxStatus, Prisma } from '@saru/database';
import { randomUUID } from 'crypto';
import {
  LEGACY_OUTBOX_TYPE_MAP,
  REALTIME_SCHEMA_VERSION,
  RealtimeEventEnvelope,
  RealtimeScope,
} from './events';

export type OutboxWriteInput = {
  type: string;
  entityType: string;
  entityId: string;
  entityVersion?: number;
  changeSummary: string;
  scope?: RealtimeScope;
  correlationId?: string;
  meta?: Record<string, string | number | boolean | null>;
  /** When omitted, generated */
  eventId?: string;
};

@Injectable()
export class OutboxService {
  /**
   * Insert an outbox row inside an existing Prisma transaction (preferred).
   */
  async enqueue(
    tx: Prisma.TransactionClient,
    input: OutboxWriteInput,
  ): Promise<{ id: string }> {
    const eventId = input.eventId ?? randomUUID();
    const envelope: RealtimeEventEnvelope = {
      eventId,
      type: LEGACY_OUTBOX_TYPE_MAP[input.type] ?? input.type,
      schemaVersion: REALTIME_SCHEMA_VERSION,
      entityType: input.entityType,
      entityId: input.entityId,
      entityVersion: input.entityVersion,
      occurredAt: new Date().toISOString(),
      scope: input.scope ?? {},
      changeSummary: input.changeSummary,
      correlationId: input.correlationId,
      meta: input.meta,
    };

    const row = await tx.outboxEvent.create({
      data: {
        id: eventId,
        type: envelope.type,
        aggregateType: input.entityType,
        aggregateId: input.entityId,
        payload: envelope as unknown as Prisma.InputJsonValue,
        status: OutboxStatus.PENDING,
      },
    });
    return { id: row.id };
  }
}
