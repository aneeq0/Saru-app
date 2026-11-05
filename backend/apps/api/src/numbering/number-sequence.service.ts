import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULTS: Record<
  string,
  { prefix: string; padLength: number; yearly: boolean }
> = {
  SHIPMENT: { prefix: 'SHP', padLength: 6, yearly: true },
  RECEIPT: { prefix: 'GRN', padLength: 6, yearly: true },
  TENDER: { prefix: 'TND', padLength: 6, yearly: true },
  CONTRACT: { prefix: 'CTR', padLength: 6, yearly: true },
  DELIVERY: { prefix: 'DC', padLength: 6, yearly: true },
  INVOICE: { prefix: 'INV', padLength: 6, yearly: true },
  PAYMENT: { prefix: 'PAY', padLength: 6, yearly: true },
  SECURITY: { prefix: 'CDR', padLength: 6, yearly: true },
  MOVEMENT: { prefix: 'MOV', padLength: 8, yearly: true },
  APPROVAL: { prefix: 'APR', padLength: 6, yearly: true },
  DOCUMENT: { prefix: 'DOC', padLength: 6, yearly: true },
};

@Injectable()
export class NumberSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async next(key: keyof typeof DEFAULTS): Promise<string> {
    const def = DEFAULTS[key] ?? {
      prefix: key.slice(0, 3).toUpperCase(),
      padLength: 6,
      yearly: true,
    };
    const year = def.yearly ? new Date().getUTCFullYear() : null;
    const sequenceKey = year ? `${key}:${year}` : key;

    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.numberSequence.findUnique({
        where: { key: sequenceKey },
      });
      if (!existing) {
        const created = await tx.numberSequence.create({
          data: {
            key: sequenceKey,
            prefix: def.prefix,
            year: year ?? undefined,
            nextValue: 2,
            padLength: def.padLength,
          },
        });
        return {
          prefix: created.prefix,
          year: created.year,
          value: 1,
          pad: created.padLength,
        };
      }
      const updated = await tx.numberSequence.update({
        where: { key: sequenceKey },
        data: { nextValue: { increment: 1 } },
      });
      return {
        prefix: updated.prefix,
        year: updated.year,
        value: updated.nextValue - 1,
        pad: updated.padLength,
      };
    });

    const num = String(result.value).padStart(result.pad, '0');
    return result.year
      ? `${result.prefix}-${result.year}-${num}`
      : `${result.prefix}-${num}`;
  }
}
