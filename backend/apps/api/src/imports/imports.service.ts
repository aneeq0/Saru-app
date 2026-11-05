import { Injectable } from '@nestjs/common';
import {
  InventoryCondition,
  Prisma,
  ReceiptStatus,
  ShipmentStatus,
} from '@saru/database';
import Decimal from 'decimal.js';
import { PrismaService } from '../prisma/prisma.service';
import { NumberSequenceService } from '../numbering/number-sequence.service';
import { InventoryService } from '../inventory/inventory.service';
import { AuditService } from '../audit/audit.service';
import { AppError, ErrorCodes } from '../common/errors/app-error';
import { normalizePage, toPaginated } from '../common/pagination/paginate';

@Injectable()
export class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbers: NumberSequenceService,
    private readonly inventory: InventoryService,
    private readonly audit: AuditService,
  ) {}

  async list(query: {
    page?: number;
    pageSize?: number;
    status?: string;
    q?: string;
  }) {
    const { page, pageSize, skip, take } = normalizePage(query);
    const where: Prisma.ImportShipmentWhereInput = {};
    if (query.status)
      where.status = query.status.toUpperCase() as ShipmentStatus;
    if (query.q) {
      where.OR = [
        { reference: { contains: query.q, mode: 'insensitive' } },
        { supplierOrderRef: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.importShipment.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: { supplier: true, lines: true },
      }),
      this.prisma.importShipment.count({ where }),
    ]);
    return toPaginated(
      rows.map((s) => ({
        id: s.id,
        reference: s.reference,
        supplierId: s.supplierId,
        supplierName: s.supplier.name,
        supplierOrderRef: s.supplierOrderRef ?? undefined,
        shippingMethod: s.shippingMethod,
        expectedArrival: s.expectedArrival?.toISOString().slice(0, 10),
        actualArrival: s.actualArrival?.toISOString().slice(0, 10),
        currency: s.currency,
        exchangeRate: Number(s.exchangeRate),
        status: s.status.toLowerCase(),
        itemCount: s.lines.length,
        totalValue: s.lines.reduce(
          (sum, l) => sum + Number(l.orderedQty) * Number(l.unitPrice),
          0,
        ),
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        version: s.version,
      })),
      total,
      page,
      pageSize,
    );
  }

  async get(id: string) {
    const s = await this.prisma.importShipment.findUnique({
      where: { id },
      include: {
        supplier: true,
        lines: { include: { product: true, variant: true } },
        receipts: true,
      },
    });
    if (!s) throw new AppError(ErrorCodes.NOT_FOUND, 'Shipment not found', 404);
    return {
      id: s.id,
      reference: s.reference,
      supplierId: s.supplierId,
      supplierName: s.supplier.name,
      supplierOrderRef: s.supplierOrderRef ?? undefined,
      shippingMethod: s.shippingMethod,
      expectedArrival: s.expectedArrival?.toISOString().slice(0, 10),
      actualArrival: s.actualArrival?.toISOString().slice(0, 10),
      currency: s.currency,
      exchangeRate: Number(s.exchangeRate),
      status: s.status.toLowerCase(),
      itemCount: s.lines.length,
      totalValue: s.lines.reduce(
        (sum, l) => sum + Number(l.orderedQty) * Number(l.unitPrice),
        0,
      ),
      lines: s.lines.map((l) => ({
        id: l.id,
        lineNo: l.lineNo,
        productId: l.productId,
        variantId: l.variantId,
        sku: l.variant.sku,
        description: l.description ?? l.product.name,
        orderedQty: Number(l.orderedQty),
        receivedQty: Number(l.receivedQty),
        acceptedQty: Number(l.acceptedQty),
        rejectedQty: Number(l.rejectedQty),
        unitPrice: Number(l.unitPrice),
        unit: l.unit,
      })),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      version: s.version,
    };
  }

  async create(
    body: {
      supplierId: string;
      supplierOrderRef?: string;
      shippingMethod: string;
      expectedArrival?: string;
      currency?: string;
      exchangeRate?: number;
      lines: Array<{
        productId: string;
        variantId: string;
        description?: string;
        orderedQty: number;
        unitPrice: number;
        unit: string;
      }>;
    },
    userId: string,
  ) {
    if (!body.lines?.length) {
      throw new AppError(
        ErrorCodes.VALIDATION,
        'At least one line is required',
        400,
      );
    }
    const reference = await this.numbers.next('SHIPMENT');
    const shipment = await this.prisma.importShipment.create({
      data: {
        reference,
        supplierId: body.supplierId,
        supplierOrderRef: body.supplierOrderRef,
        shippingMethod: body.shippingMethod,
        expectedArrival: body.expectedArrival
          ? new Date(body.expectedArrival)
          : undefined,
        currency: body.currency ?? 'USD',
        exchangeRate: body.exchangeRate ?? 1,
        status: ShipmentStatus.DRAFT,
        createdBy: userId,
        updatedBy: userId,
        lines: {
          create: body.lines.map((l, idx) => ({
            lineNo: idx + 1,
            productId: l.productId,
            variantId: l.variantId,
            description: l.description,
            orderedQty: l.orderedQty,
            unitPrice: l.unitPrice,
            unit: l.unit,
          })),
        },
      },
    });
    await this.audit.append({
      actorId: userId,
      action: 'import.create',
      module: 'imports',
      entityType: 'ImportShipment',
      entityId: shipment.id,
      reference,
      outcome: 'success',
    });
    return this.get(shipment.id);
  }

  async update(id: string, body: Record<string, unknown>, userId: string) {
    const existing = await this.prisma.importShipment.findUnique({
      where: { id },
    });
    if (!existing)
      throw new AppError(ErrorCodes.NOT_FOUND, 'Shipment not found', 404);
    if (!(
      existing.status === ShipmentStatus.DRAFT ||
      existing.status === ShipmentStatus.ORDERED
    )) {
      throw new AppError(
        ErrorCodes.INVALID_STATE,
        'Shipment cannot be edited in current status',
        422,
      );
    }
    await this.prisma.importShipment.update({
      where: { id },
      data: {
        supplierOrderRef: body.supplierOrderRef as string | undefined,
        shippingMethod: body.shippingMethod as string | undefined,
        expectedArrival: body.expectedArrival
          ? new Date(body.expectedArrival as string)
          : undefined,
        status:
          typeof body.status === 'string'
            ? (body.status.toUpperCase() as ShipmentStatus)
            : undefined,
        updatedBy: userId,
        version: { increment: 1 },
      },
    });
    return this.get(id);
  }

  async createReceipt(
    shipmentId: string,
    body: {
      warehouseId: string;
      notes?: string;
      lines: Array<{
        shipmentLineId: string;
        variantId: string;
        lotNumber?: string;
        expiryDate?: string;
        receivedQty: number;
        acceptedQty: number;
        rejectedQty?: number;
        damagedQty?: number;
        unit: string;
        notes?: string;
      }>;
    },
    userId: string,
  ) {
    const shipment = await this.prisma.importShipment.findUnique({
      where: { id: shipmentId },
      include: { lines: true },
    });
    if (!shipment)
      throw new AppError(ErrorCodes.NOT_FOUND, 'Shipment not found', 404);

    for (const line of body.lines) {
      const sl = shipment.lines.find((l) => l.id === line.shipmentLineId);
      if (!sl)
        throw new AppError(ErrorCodes.VALIDATION, 'Invalid shipment line', 400);
      const remaining = new Decimal(sl.orderedQty).minus(sl.acceptedQty);
      if (new Decimal(line.acceptedQty).gt(remaining)) {
        throw new AppError(
          ErrorCodes.VALIDATION,
          'Accepted quantity exceeds remaining ordered quantity',
          422,
          { remaining: remaining.toFixed(6) },
        );
      }
    }

    const reference = await this.numbers.next('RECEIPT');
    const receipt = await this.prisma.goodsReceipt.create({
      data: {
        reference,
        shipmentId,
        warehouseId: body.warehouseId,
        status: ReceiptStatus.DRAFT,
        notes: body.notes,
        createdBy: userId,
        lines: {
          create: body.lines.map((l) => ({
            shipmentLineId: l.shipmentLineId,
            variantId: l.variantId,
            lotNumber: l.lotNumber,
            expiryDate: l.expiryDate ? new Date(l.expiryDate) : undefined,
            receivedQty: l.receivedQty,
            acceptedQty: l.acceptedQty,
            rejectedQty: l.rejectedQty ?? 0,
            damagedQty: l.damagedQty ?? 0,
            unit: l.unit,
            notes: l.notes,
          })),
        },
      },
      include: { lines: true },
    });
    return receipt;
  }

  async submitReceipt(id: string, _userId: string) {
    return this.transitionReceipt(
      id,
      ReceiptStatus.DRAFT,
      ReceiptStatus.SUBMITTED,
    );
  }

  async approveReceipt(id: string, _userId: string) {
    return this.transitionReceipt(
      id,
      ReceiptStatus.SUBMITTED,
      ReceiptStatus.APPROVED,
    );
  }

  async postReceipt(id: string, userId: string) {
    const receipt = await this.prisma.goodsReceipt.findUnique({
      where: { id },
      include: { lines: true, shipment: true },
    });
    if (!receipt)
      throw new AppError(ErrorCodes.NOT_FOUND, 'Receipt not found', 404);
    if (
      receipt.status !== ReceiptStatus.APPROVED &&
      receipt.status !== ReceiptStatus.SUBMITTED
    ) {
      throw new AppError(
        ErrorCodes.INVALID_STATE,
        'Receipt must be approved before posting',
        422,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      for (const line of receipt.lines) {
        const accepted = new Decimal(line.acceptedQty);
        if (accepted.lte(0)) continue;

        const sl = await tx.importShipmentLine.findUnique({
          where: { id: line.shipmentLineId },
        });
        if (!sl)
          throw new AppError(
            ErrorCodes.NOT_FOUND,
            'Shipment line missing',
            404,
          );
        const remaining = new Decimal(sl.orderedQty).minus(sl.acceptedQty);
        if (accepted.gt(remaining)) {
          throw new AppError(
            ErrorCodes.VALIDATION,
            'Cannot post more than remaining ordered qty',
            422,
          );
        }

        await this.inventory.postStockIn({
          warehouseId: receipt.warehouseId,
          variantId: line.variantId,
          quantity: accepted,
          lotNumber: line.lotNumber,
          expiryDate: line.expiryDate,
          sourceType: 'GoodsReceipt',
          sourceId: receipt.id,
          sourceReference: receipt.reference,
          postedById: userId,
          condition: InventoryCondition.AVAILABLE,
          tx,
        });

        if (new Decimal(line.damagedQty).gt(0)) {
          await this.inventory.postStockIn({
            warehouseId: receipt.warehouseId,
            variantId: line.variantId,
            quantity: line.damagedQty,
            lotNumber: line.lotNumber ? `${line.lotNumber}-DMG` : undefined,
            sourceType: 'GoodsReceipt',
            sourceId: receipt.id,
            sourceReference: receipt.reference,
            postedById: userId,
            condition: InventoryCondition.DAMAGED,
            tx,
          });
        }

        await tx.importShipmentLine.update({
          where: { id: line.shipmentLineId },
          data: {
            receivedQty: { increment: line.receivedQty },
            acceptedQty: { increment: line.acceptedQty },
            rejectedQty: { increment: line.rejectedQty },
          },
        });
      }

      await tx.goodsReceipt.update({
        where: { id },
        data: {
          status: ReceiptStatus.POSTED,
          postedAt: new Date(),
          postedById: userId,
          version: { increment: 1 },
        },
      });

      const lines = await tx.importShipmentLine.findMany({
        where: { shipmentId: receipt.shipmentId },
      });
      const allReceived = lines.every((l) =>
        new Decimal(l.acceptedQty).gte(l.orderedQty),
      );
      const anyReceived = lines.some((l) => new Decimal(l.acceptedQty).gt(0));
      await tx.importShipment.update({
        where: { id: receipt.shipmentId },
        data: {
          status: allReceived
            ? ShipmentStatus.RECEIVED
            : anyReceived
              ? ShipmentStatus.PARTIALLY_RECEIVED
              : receipt.shipment.status,
          version: { increment: 1 },
        },
      });
    });

    await this.audit.append({
      actorId: userId,
      action: 'receipt.post',
      module: 'receipts',
      entityType: 'GoodsReceipt',
      entityId: id,
      reference: receipt.reference,
      outcome: 'success',
    });

    return this.prisma.goodsReceipt.findUnique({
      where: { id },
      include: { lines: true },
    });
  }

  private async transitionReceipt(
    id: string,
    from: ReceiptStatus,
    to: ReceiptStatus,
  ) {
    const receipt = await this.prisma.goodsReceipt.findUnique({
      where: { id },
    });
    if (!receipt)
      throw new AppError(ErrorCodes.NOT_FOUND, 'Receipt not found', 404);
    if (receipt.status !== from) {
      throw new AppError(
        ErrorCodes.INVALID_STATE,
        `Receipt must be ${from} to transition`,
        422,
      );
    }
    return this.prisma.goodsReceipt.update({
      where: { id },
      data: { status: to, updatedAt: new Date(), version: { increment: 1 } },
    });
  }
}
