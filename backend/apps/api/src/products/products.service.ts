import { Injectable } from '@nestjs/common';
import { EntityLifecycleStatus, Prisma } from '@saru/database';
import { PrismaService } from '../prisma/prisma.service';
import { AppError, ErrorCodes } from '../common/errors/app-error';
import { normalizePage, toPaginated } from '../common/pagination/paginate';
import { AuditService } from '../audit/audit.service';
import { OutboxService } from '../realtime/outbox.service';
import { RealtimeEventType, roomForEntity } from '../realtime/events';

function statusOut(s: EntityLifecycleStatus) {
  return s.toLowerCase() as 'active' | 'inactive' | 'draft' | 'archived';
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  async list(query: {
    page?: number;
    pageSize?: number;
    q?: string;
    status?: string;
    categoryId?: string;
    manufacturerId?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) {
    const { page, pageSize, skip, take } = normalizePage(query);
    const where: Prisma.ProductWhereInput = {};
    if (query.q) {
      where.OR = [
        { sku: { contains: query.q, mode: 'insensitive' } },
        { name: { contains: query.q, mode: 'insensitive' } },
        { barcode: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    if (query.status) {
      where.status = query.status.toUpperCase() as EntityLifecycleStatus;
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.manufacturerId) where.manufacturerId = query.manufacturerId;

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sortBy === 'sku'
        ? { sku: query.sortDir === 'desc' ? 'desc' : 'asc' }
        : query.sortBy === 'name'
          ? { name: query.sortDir === 'desc' ? 'desc' : 'asc' }
          : { updatedAt: 'desc' };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: true,
          manufacturer: true,
          variants: { select: { id: true } },
          _count: { select: { variants: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const variantIds = rows.flatMap((r) => r.variants.map((v) => v.id));
    const balances = variantIds.length
      ? await this.prisma.inventoryBalance.groupBy({
          by: ['variantId'],
          where: { variantId: { in: variantIds }, condition: 'AVAILABLE' },
          _sum: { available: true },
        })
      : [];
    const stockMap = new Map(
      balances.map((b) => [b.variantId, Number(b._sum.available ?? 0)]),
    );

    const data = rows.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description ?? undefined,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      manufacturerId: p.manufacturerId,
      manufacturerName: p.manufacturer.name,
      brand: p.brand ?? undefined,
      countryOfOrigin: p.countryOfOrigin ?? undefined,
      packagingUnit: p.packagingUnit,
      variantCount: p._count.variants,
      stockAvailable: p.variants.reduce(
        (sum, v) => sum + (stockMap.get(v.id) ?? 0),
        0,
      ),
      status: statusOut(p.status),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      createdBy: p.createdBy ?? undefined,
      updatedBy: p.updatedBy ?? undefined,
      version: p.version,
    }));

    return toPaginated(data, total, page, pageSize);
  }

  async get(id: string) {
    const p = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        manufacturer: true,
        variants: true,
      },
    });
    if (!p) throw new AppError(ErrorCodes.NOT_FOUND, 'Product not found', 404);

    const stock = await this.prisma.inventoryBalance.aggregate({
      where: {
        variantId: { in: p.variants.map((v) => v.id) },
        condition: 'AVAILABLE',
      },
      _sum: { available: true },
    });

    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description ?? undefined,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      manufacturerId: p.manufacturerId,
      manufacturerName: p.manufacturer.name,
      brand: p.brand ?? undefined,
      countryOfOrigin: p.countryOfOrigin ?? undefined,
      packagingUnit: p.packagingUnit,
      variantCount: p.variants.length,
      stockAvailable: Number(stock._sum.available ?? 0),
      status: statusOut(p.status),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      version: p.version,
      variants: p.variants.map((v) => ({
        id: v.id,
        productId: v.productId,
        sku: v.sku,
        name: v.name,
        size: v.size ?? undefined,
        purchaseUnit: v.purchaseUnit,
        sellingUnit: v.sellingUnit,
        conversionFactor: Number(v.conversionFactor),
        status: statusOut(v.status),
      })),
    };
  }

  async create(
    body: {
      sku: string;
      name: string;
      description?: string;
      categoryId: string;
      manufacturerId: string;
      brand?: string;
      countryOfOrigin?: string;
      packagingUnit: string;
      barcode?: string;
      status?: string;
    },
    userId: string,
  ) {
    const existing = await this.prisma.product.findUnique({
      where: { sku: body.sku },
    });
    if (existing) {
      throw new AppError(ErrorCodes.CONFLICT, 'SKU already exists', 409);
    }

    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          sku: body.sku.trim(),
          name: body.name.trim(),
          description: body.description,
          categoryId: body.categoryId,
          manufacturerId: body.manufacturerId,
          brand: body.brand,
          countryOfOrigin: body.countryOfOrigin,
          packagingUnit: body.packagingUnit,
          barcode: body.barcode,
          status:
            (body.status?.toUpperCase() as EntityLifecycleStatus) ?? 'ACTIVE',
          createdBy: userId,
          updatedBy: userId,
          variants: {
            create: {
              sku: `${body.sku.trim()}-01`,
              name: 'Default',
              purchaseUnit: body.packagingUnit,
              sellingUnit: body.packagingUnit,
              conversionFactor: 1,
            },
          },
        },
        include: { category: true, manufacturer: true, variants: true },
      });
      await this.outbox.enqueue(tx, {
        type: RealtimeEventType.PRODUCT_CREATED,
        entityType: 'Product',
        entityId: created.id,
        changeSummary: `Product ${created.sku} created`,
        scope: { rooms: [roomForEntity('Product', created.id)] },
        meta: { sku: created.sku },
      });
      return created;
    });

    await this.audit.append({
      actorId: userId,
      action: 'product.create',
      module: 'products',
      entityType: 'Product',
      entityId: product.id,
      reference: product.sku,
      outcome: 'success',
    });

    return this.get(product.id);
  }

  async update(
    id: string,
    body: Partial<{
      name: string;
      description: string;
      brand: string;
      countryOfOrigin: string;
      packagingUnit: string;
      status: string;
      categoryId: string;
      manufacturerId: string;
    }>,
    userId: string,
  ) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing)
      throw new AppError(ErrorCodes.NOT_FOUND, 'Product not found', 404);

    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name: body.name,
          description: body.description,
          brand: body.brand,
          countryOfOrigin: body.countryOfOrigin,
          packagingUnit: body.packagingUnit,
          categoryId: body.categoryId,
          manufacturerId: body.manufacturerId,
          status: body.status
            ? (body.status.toUpperCase() as EntityLifecycleStatus)
            : undefined,
          updatedBy: userId,
          version: { increment: 1 },
        },
      });
      const eventType =
        body.status && body.status.toUpperCase() !== 'ACTIVE'
          ? RealtimeEventType.PRODUCT_DEACTIVATED
          : RealtimeEventType.PRODUCT_UPDATED;
      await this.outbox.enqueue(tx, {
        type: eventType,
        entityType: 'Product',
        entityId: id,
        entityVersion: existing.version + 1,
        changeSummary: 'Product updated',
        scope: { rooms: [roomForEntity('Product', id)] },
      });
    });

    await this.audit.append({
      actorId: userId,
      action: 'product.update',
      module: 'products',
      entityType: 'Product',
      entityId: id,
      outcome: 'success',
      before: { name: existing.name, status: existing.status },
      after: body,
    });

    return this.get(id);
  }

  async lookupBarcode(code: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        OR: [
          { barcode: code },
          { sku: code },
          { product: { barcode: code, sku: code } },
        ],
      },
      include: { product: { include: { category: true, manufacturer: true } } },
    });
    if (!variant) {
      const product = await this.prisma.product.findFirst({
        where: { OR: [{ barcode: code }, { sku: code }] },
        include: { category: true, manufacturer: true, variants: true },
      });
      if (!product)
        throw new AppError(ErrorCodes.NOT_FOUND, 'Barcode not found', 404);
      return this.get(product.id);
    }
    return this.get(variant.productId);
  }
}
