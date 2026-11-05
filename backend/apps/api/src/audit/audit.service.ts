import { Injectable } from '@nestjs/common';
import { AuthChannel, Prisma } from '@saru/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async append(input: {
    actorId?: string | null;
    action: string;
    module: string;
    entityType?: string;
    entityId?: string;
    reference?: string;
    outcome: string;
    reason?: string;
    channel?: AuthChannel;
    requestId?: string;
    ipAddress?: string;
    before?: Prisma.InputJsonValue;
    after?: Prisma.InputJsonValue;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.auditEvent.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        module: input.module,
        entityType: input.entityType,
        entityId: input.entityId,
        reference: input.reference,
        outcome: input.outcome,
        reason: input.reason,
        channel: input.channel,
        requestId: input.requestId,
        ipAddress: input.ipAddress,
        before: input.before,
        after: input.after,
        metadata: input.metadata,
      },
    });
  }
}
