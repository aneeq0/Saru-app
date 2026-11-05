import { Injectable } from '@nestjs/common';
import { InventoryCondition, MovementType, Prisma } from '@saru/database';
import Decimal from 'decimal.js';
import { PrismaService } from '../prisma/prisma.service';
import { NumberSequenceService } from '../numbering/number-sequence.service';
import { AppError, ErrorCodes } from '../common/errors/app-error';
import { normalizePage, toPaginated } from '../common/pagination/paginate';
import { AuditService } from '../audit/audit.service';
import { OutboxService } from '../realtime/outbox.service';
import {
  RealtimeEventType,
  roomForEntity,
  roomForWarehouse,
} from '../realtime/events';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbers: NumberSequenceService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  async listBalances(query: {
    page?: number;
    pageSize?: number;
    warehouseId?: string;
    q?: string;
  }) {
    const { page, pageSize, skip, take } = normalizePage(query);
    const where: Prisma.InventoryBalanceWhereInput = {};
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.q) {
      where.variant = {
        OR: [
          { sku: { contains: query.q, mode: 'insensitive' } },
          { name: { contains: query.q, mode: 'insensitive' } },
          { product: { name: { contains: query.q, mode: 'insensitive' } } },
        ],
      };
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.inventoryBalance.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          warehouse: true,
          variant: { include: { product: true } },
          lot: true,
        },
      }),
      this.prisma.inventoryBalance.count({ where }),
    ]);

    return toPaginated(
      rows.map((b) => ({
        id: b.id,
        sku: b.variant.sku,
        productName: b.variant.product.name,
        variantName: b.variant.name,
        warehouseId: b.warehouseId,
        warehouseName: b.warehouse.name,
        location: undefined,
        batch: b.lot?.lotNumber,
        expiryDate: b.lot?.expiryDate?.toISOString().slice(0, 10),
        onHand: Number(b.onHand),
        reserved: Number(b.reserved),
        available: Number(b.available),
        quarantined: Number(b.quarantined),
        damaged: Number(b.damaged),
      })),
      total,
      page,
      pageSize,
    );
  }

  async listMovements(query: {
    page?: number;
    pageSize?: number;
    warehouseId?: string;
    variantId?: string;
  }) {
    const { page, pageSize, skip, take } = normalizePage(query);
    const where: Prisma.InventoryMovementWhereInput = {};
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    if (query.variantId) where.variantId = query.variantId;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.inventoryMovement.findMany({
        where,
        skip,
        take,
        orderBy: { postedAt: 'desc' },
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return toPaginated(
      rows.map((m) => ({
        id: m.id,
        reference: m.reference,
        type: m.type.toLowerCase(),
        warehouseId: m.warehouseId,
        variantId: m.variantId,
        lotId: m.lotId,
        quantity: Number(m.quantity),
        sourceType: m.sourceType,
        sourceId: m.sourceId,
        sourceReference: m.sourceReference,
        postedAt: m.postedAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    );
  }

  /**
   * Atomically post a stock receipt into the ledger + balance projection.
   * Uses SELECT FOR UPDATE on balance rows to prevent concurrent races.
   */
  async postStockIn(params: {
    warehouseId: string;
    variantId: string;
    quantity: Decimal.Value;
    lotNumber?: string | null;
    expiryDate?: Date | null;
    unitCost?: Decimal.Value;
    sourceType: string;
    sourceId: string;
    sourceReference?: string;
    postedById?: string;
    condition?: InventoryCondition;
    tx?: Prisma.TransactionClient;
  }) {
    const qty = new Decimal(params.quantity);
    if (qty.lte(0)) {
      throw new AppError(
        ErrorCodes.VALIDATION,
        'Quantity must be positive',
        400,
      );
    }
    const condition = params.condition ?? InventoryCondition.AVAILABLE;
    const run = async (tx: Prisma.TransactionClient) => {
      let lotId: string | null = null;
      if (params.lotNumber) {
        const lot = await tx.inventoryLot.upsert({
          where: {
            warehouseId_variantId_lotNumber: {
              warehouseId: params.warehouseId,
              variantId: params.variantId,
              lotNumber: params.lotNumber,
            },
          },
          create: {
            warehouseId: params.warehouseId,
            variantId: params.variantId,
            lotNumber: params.lotNumber,
            expiryDate: params.expiryDate ?? undefined,
            condition,
            receivedAt: new Date(),
            sourceShipmentId:
              params.sourceType === 'ImportShipment'
                ? params.sourceId
                : undefined,
          },
          update: {
            expiryDate: params.expiryDate ?? undefined,
          },
        });
        lotId = lot.id;
      }

      // Lock balance row (create if missing)
      await tx.$executeRaw`
        INSERT INTO "InventoryBalance" (id, "warehouseId", "variantId", "lotId", condition, "onHand", reserved, available, quarantined, damaged, "updatedAt", version)
        VALUES (gen_random_uuid(), ${params.warehouseId}::uuid, ${params.variantId}::uuid, ${lotId}::uuid, ${condition}::"InventoryCondition", 0, 0, 0, 0, 0, NOW(), 1)
        ON CONFLICT ("warehouseId", "variantId", "lotId", condition) DO NOTHING
      `;

      const locked = await tx.$queryRaw<
        Array<{
          id: string;
          onHand: string;
          available: string;
          version: number;
        }>
      >`
        SELECT id, "onHand"::text, available::text, version
        FROM "InventoryBalance"
        WHERE "warehouseId" = ${params.warehouseId}::uuid
          AND "variantId" = ${params.variantId}::uuid
          AND condition = ${condition}::"InventoryCondition"
          AND (("lotId" IS NULL AND ${lotId}::uuid IS NULL) OR "lotId" = ${lotId}::uuid)
        FOR UPDATE
      `;

      if (!locked[0]) {
        throw new AppError(
          ErrorCodes.CONFLICT,
          'Failed to lock inventory balance',
          409,
        );
      }

      const onHand = new Decimal(locked[0].onHand).plus(qty);
      const available =
        condition === InventoryCondition.AVAILABLE
          ? new Decimal(locked[0].available).plus(qty)
          : new Decimal(locked[0].available);

      await tx.inventoryBalance.update({
        where: { id: locked[0].id },
        data: {
          onHand: onHand.toFixed(6),
          available: available.toFixed(6),
          version: { increment: 1 },
        },
      });

      const reference = await this.numbers.next('MOVEMENT');
      const movement = await tx.inventoryMovement.create({
        data: {
          reference,
          type: MovementType.RECEIPT,
          warehouseId: params.warehouseId,
          variantId: params.variantId,
          lotId,
          quantity: qty.toFixed(6),
          unitCost:
            params.unitCost != null
              ? new Decimal(params.unitCost).toFixed(6)
              : undefined,
          sourceType: params.sourceType,
          sourceId: params.sourceId,
          sourceReference: params.sourceReference,
          postedById: params.postedById,
        },
      });

      await this.outbox.enqueue(tx, {
        type: RealtimeEventType.INVENTORY_STOCK_CHANGED,
        entityType: 'InventoryBalance',
        entityId: locked?.[0]?.id ?? params.variantId,
        changeSummary: 'Stock balance increased after goods receipt',
        scope: {
          rooms: [
            roomForWarehouse(params.warehouseId),
            roomForEntity('ProductVariant', params.variantId),
          ],
          warehouseIds: [params.warehouseId],
        },
        meta: {
          movementId: movement.id,
          warehouseId: params.warehouseId,
          variantId: params.variantId,
          sourceType: params.sourceType,
          sourceId: params.sourceId,
        },
      });
      await this.outbox.enqueue(tx, {
        type: RealtimeEventType.IMPORT_RECEIPT_POSTED,
        entityType: params.sourceType,
        entityId: params.sourceId,
        changeSummary: 'Goods receipt posted',
        scope: {
          rooms: [roomForEntity(params.sourceType, params.sourceId)],
          warehouseIds: [params.warehouseId],
        },
        meta: { movementId: movement.id, variantId: params.variantId },
      });

      return movement;
    };

    if (params.tx) return run(params.tx);
    return this.prisma.$transaction((tx) => run(tx));
  }

  /**
   * Atomically post stock-out for dispatch. Prevents overselling under concurrency.
   */
  async postStockOut(params: {
    warehouseId: string;
    variantId: string;
    quantity: Decimal.Value;
    lotId?: string | null;
    sourceType: string;
    sourceId: string;
    sourceReference?: string;
    postedById?: string;
    tx?: Prisma.TransactionClient;
  }) {
    const qty = new Decimal(params.quantity);
    if (qty.lte(0)) {
      throw new AppError(
        ErrorCodes.VALIDATION,
        'Quantity must be positive',
        400,
      );
    }

    const run = async (tx: Prisma.TransactionClient) => {
      const locked = await tx.$queryRaw<
        Array<{
          id: string;
          onHand: string;
          available: string;
          reserved: string;
          version: number;
        }>
      >`
        SELECT id, "onHand"::text, available::text, reserved::text, version
        FROM "InventoryBalance"
        WHERE "warehouseId" = ${params.warehouseId}::uuid
          AND "variantId" = ${params.variantId}::uuid
          AND condition = 'AVAILABLE'::"InventoryCondition"
          AND (("lotId" IS NULL AND ${params.lotId ?? null}::uuid IS NULL) OR "lotId" = ${params.lotId ?? null}::uuid)
        FOR UPDATE
      `;

      if (!locked[0]) {
        throw new AppError(
          ErrorCodes.INSUFFICIENT_STOCK,
          'No available stock for this item',
          422,
        );
      }

      const available = new Decimal(locked[0].available);
      if (available.lt(qty)) {
        throw new AppError(
          ErrorCodes.INSUFFICIENT_STOCK,
          'The available stock is insufficient.',
          422,
          { available: available.toFixed(6), requested: qty.toFixed(6) },
        );
      }

      const onHand = new Decimal(locked[0].onHand).minus(qty);
      const nextAvailable = available.minus(qty);

      await tx.inventoryBalance.update({
        where: { id: locked[0].id },
        data: {
          onHand: onHand.toFixed(6),
          available: nextAvailable.toFixed(6),
          version: { increment: 1 },
        },
      });

      const reference = await this.numbers.next('MOVEMENT');
      const movement = await tx.inventoryMovement.create({
        data: {
          reference,
          type: MovementType.DISPATCH,
          warehouseId: params.warehouseId,
          variantId: params.variantId,
          lotId: params.lotId ?? undefined,
          quantity: qty.neg().toFixed(6),
          sourceType: params.sourceType,
          sourceId: params.sourceId,
          sourceReference: params.sourceReference,
          postedById: params.postedById,
        },
      });

      await this.outbox.enqueue(tx, {
        type: RealtimeEventType.INVENTORY_STOCK_CHANGED,
        entityType: 'InventoryBalance',
        entityId: locked[0].id,
        entityVersion: locked[0].version + 1,
        changeSummary: 'Stock balance decreased after dispatch',
        scope: {
          rooms: [
            roomForWarehouse(params.warehouseId),
            roomForEntity('ProductVariant', params.variantId),
            roomForEntity(params.sourceType, params.sourceId),
          ],
          warehouseIds: [params.warehouseId],
        },
        meta: {
          movementId: movement.id,
          warehouseId: params.warehouseId,
          variantId: params.variantId,
          sourceType: params.sourceType,
          sourceId: params.sourceId,
        },
      });
      await this.outbox.enqueue(tx, {
        type: RealtimeEventType.DELIVERY_DISPATCHED,
        entityType: params.sourceType,
        entityId: params.sourceId,
        changeSummary: 'Delivery dispatch confirmed',
        scope: {
          rooms: [roomForEntity(params.sourceType, params.sourceId)],
          warehouseIds: [params.warehouseId],
        },
        meta: { movementId: movement.id, variantId: params.variantId },
      });

      return movement;
    };

    if (params.tx) return run(params.tx);
    return this.prisma.$transaction((tx) => run(tx));
  }

  async listWarehouses() {
    const rows = await this.prisma.warehouse.findMany({
      orderBy: { name: 'asc' },
    });
    return {
      data: rows.map((w) => ({
        id: w.id,
        code: w.code,
        name: w.name,
        city: w.city,
        status: w.status.toLowerCase(),
      })),
      meta: {
        page: 1,
        pageSize: rows.length || 20,
        total: rows.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        nextCursor: null,
      },
    };
  }

  emptyList(query: { page?: number; pageSize?: number }) {
    const { page, pageSize } = normalizePage(query);
    return toPaginated([], 0, page, pageSize);
  }

  async listReservations(query: {
    page?: number;
    pageSize?: number;
    q?: string;
    status?: string;
  }) {
    const { page, pageSize, skip, take } = normalizePage(query);
    const where: Prisma.StockReservationWhereInput = {};
    if (query.status) where.status = query.status.toUpperCase();
    if (query.q) {
      where.OR = [
        { sourceType: { contains: query.q, mode: 'insensitive' } },
        { status: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.stockReservation.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockReservation.count({ where }),
    ]);
    const warehouseIds = [...new Set(rows.map((r) => r.warehouseId))];
    const variantIds = [...new Set(rows.map((r) => r.variantId))];
    const [warehouses, variants] = await Promise.all([
      warehouseIds.length
        ? this.prisma.warehouse.findMany({ where: { id: { in: warehouseIds } } })
        : Promise.resolve([]),
      variantIds.length
        ? this.prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            include: { product: true },
          })
        : Promise.resolve([]),
    ]);
    const warehouseById = new Map(warehouses.map((w) => [w.id, w]));
    const variantById = new Map(variants.map((v) => [v.id, v]));
    return toPaginated(
      rows.map((r) => {
        const variant = variantById.get(r.variantId);
        const warehouse = warehouseById.get(r.warehouseId);
        return {
          id: r.id,
          sku: variant?.sku ?? '—',
          productName: variant?.product?.name ?? variant?.name ?? '—',
          warehouseName: warehouse?.name ?? '—',
          quantity: Number(r.quantity),
          sourceType: r.sourceType,
          sourceReference: r.sourceId,
          status: r.status.toLowerCase(),
          expiresAt: r.expiresAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        };
      }),
      total,
      page,
      pageSize,
    );
  }

  async listReceipts(query: {
    page?: number;
    pageSize?: number;
    q?: string;
    status?: string;
  }) {
    const { page, pageSize, skip, take } = normalizePage(query);
    const where: Prisma.GoodsReceiptWhereInput = {};
    if (query.status) {
      where.status = query.status.toUpperCase() as never;
    }
    if (query.q) {
      where.OR = [
        { reference: { contains: query.q, mode: 'insensitive' } },
        { notes: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.goodsReceipt.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { warehouse: true, shipment: true, lines: true },
      }),
      this.prisma.goodsReceipt.count({ where }),
    ]);
    return toPaginated(
      rows.map((r) => ({
        id: r.id,
        reference: r.reference,
        status: r.status.toLowerCase(),
        warehouseName: r.warehouse.name,
        shipmentReference: r.shipment.reference,
        receivedQty: r.lines.reduce((s, l) => s + Number(l.receivedQty), 0),
        acceptedQty: r.lines.reduce((s, l) => s + Number(l.acceptedQty), 0),
        lineCount: r.lines.length,
        receivedAt: r.receivedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    );
  }
}
