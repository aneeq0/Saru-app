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
import { DeliveryStatus } from '@saru/database';
import Decimal from 'decimal.js';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import type { AuthUserContext } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { NumberSequenceService } from '../numbering/number-sequence.service';
import { InventoryService } from '../inventory/inventory.service';
import { InventoryModule } from '../inventory/inventory.module';
import { AuditService } from '../audit/audit.service';
import { AppError, ErrorCodes } from '../common/errors/app-error';
import { normalizePage, toPaginated } from '../common/pagination/paginate';

@ApiTags('deliveries')
@ApiBearerAuth()
@Controller('deliveries')
class DeliveriesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly numbers: NumberSequenceService,
    private readonly inventory: InventoryService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermissions('deliveries:view')
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
  ) {
    const p = normalizePage({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
    const where: any = status ? { status: status.toUpperCase() } : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.delivery.findMany({
        where,
        skip: p.skip,
        take: p.take,
        orderBy: { updatedAt: 'desc' },
        include: { warehouse: true, lines: true },
      }),
      this.prisma.delivery.count({ where }),
    ]);
    return toPaginated(
      rows.map((d) => ({
        id: d.id,
        reference: d.reference,
        status: d.status.toLowerCase(),
        warehouseName: d.warehouse.name,
        challanNo: d.challanNo,
        lineCount: d.lines.length,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
      total,
      p.page,
      p.pageSize,
    );
  }

  @Post()
  @RequirePermissions('deliveries:create')
  async create(@Body() body: any, @CurrentUser() user: AuthUserContext) {
    // DRAFT creation must NEVER deduct stock
    const reference = await this.numbers.next('DELIVERY');
    const delivery = await this.prisma.delivery.create({
      data: {
        reference,
        contractId: body.contractId,
        warehouseId: body.warehouseId,
        status: DeliveryStatus.DRAFT,
        notes: body.notes,
        createdBy: user.id,
        lines: {
          create: (body.lines ?? []).map((l: any) => ({
            contractLineId: l.contractLineId,
            variantId: l.variantId,
            lotId: l.lotId,
            quantity: l.quantity,
            unit: l.unit ?? 'EA',
          })),
        },
      },
    });
    await this.audit.append({
      actorId: user.id,
      action: 'delivery.create_draft',
      module: 'deliveries',
      entityType: 'Delivery',
      entityId: delivery.id,
      reference,
      outcome: 'success',
    });
    return this.get(delivery.id);
  }

  @Get(':id')
  @RequirePermissions('deliveries:view')
  async get(@Param('id') id: string) {
    const d = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        lines: { include: { variant: true } },
        warehouse: true,
        evidence: true,
      },
    });
    if (!d) throw new AppError(ErrorCodes.NOT_FOUND, 'Delivery not found', 404);
    return { ...d, status: d.status.toLowerCase() };
  }

  @Patch(':id')
  @RequirePermissions('deliveries:edit_draft')
  async update(@Param('id') id: string, @Body() body: any) {
    const d = await this.prisma.delivery.findUnique({ where: { id } });
    if (!d || d.status !== DeliveryStatus.DRAFT)
      throw new AppError(
        ErrorCodes.INVALID_STATE,
        'Only draft deliveries can be edited',
        422,
      );
    await this.prisma.delivery.update({
      where: { id },
      data: {
        notes: body.notes,
        vehicleRef: body.vehicleRef,
        driverName: body.driverName,
        version: { increment: 1 },
      },
    });
    return this.get(id);
  }

  @Post(':id/assign')
  @RequirePermissions('deliveries:edit_draft')
  async assign(
    @Param('id') id: string,
    @Body() body: { assignedToId: string },
  ) {
    await this.prisma.delivery.update({
      where: { id },
      data: {
        assignedToId: body.assignedToId,
        status: DeliveryStatus.ASSIGNED,
        version: { increment: 1 },
      },
    });
    return this.get(id);
  }

  @Post(':id/pick')
  @RequirePermissions('deliveries:edit_draft')
  async pick(
    @Param('id') id: string,
    @Body()
    body: {
      lines: Array<{ lineId: string; pickedQty: number; lotId?: string }>;
    },
  ) {
    await this.prisma.$transaction(async (tx) => {
      for (const l of body.lines ?? []) {
        await tx.deliveryLine.update({
          where: { id: l.lineId },
          data: { pickedQty: l.pickedQty, lotId: l.lotId },
        });
      }
      await tx.delivery.update({
        where: { id },
        data: { status: DeliveryStatus.PICKING, version: { increment: 1 } },
      });
    });
    return this.get(id);
  }

  @Post(':id/confirm-dispatch')
  @RequirePermissions('deliveries:finalize')
  async confirmDispatch(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserContext,
  ) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!delivery)
      throw new AppError(ErrorCodes.NOT_FOUND, 'Delivery not found', 404);
    if (
      delivery.status === DeliveryStatus.DISPATCHED ||
      delivery.status === DeliveryStatus.DELIVERED
    ) {
      throw new AppError(
        ErrorCodes.INVALID_STATE,
        'Delivery already dispatched',
        409,
      );
    }
    if (delivery.status === DeliveryStatus.DRAFT) {
      throw new AppError(
        ErrorCodes.INVALID_STATE,
        'Cannot dispatch a draft without assignment/pick',
        422,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      for (const line of delivery.lines) {
        const qty = new Decimal(line.pickedQty).gt(0)
          ? line.pickedQty
          : line.quantity;
        await this.inventory.postStockOut({
          warehouseId: delivery.warehouseId,
          variantId: line.variantId,
          quantity: qty,
          lotId: line.lotId,
          sourceType: 'Delivery',
          sourceId: delivery.id,
          sourceReference: delivery.reference,
          postedById: user.id,
          tx,
        });
        await tx.deliveryLine.update({
          where: { id: line.id },
          data: { dispatchedQty: qty },
        });
        if (line.contractLineId) {
          await tx.contractLine.update({
            where: { id: line.contractLineId },
            data: { dispatchedQty: { increment: qty } },
          });
        }
      }
      const challanNo = delivery.challanNo ?? delivery.reference;
      await tx.delivery.update({
        where: { id },
        data: {
          status: DeliveryStatus.DISPATCHED,
          challanNo,
          dispatchedAt: new Date(),
          version: { increment: 1 },
        },
      });
    });

    await this.audit.append({
      actorId: user.id,
      action: 'delivery.confirm_dispatch',
      module: 'deliveries',
      entityType: 'Delivery',
      entityId: id,
      reference: delivery.reference,
      outcome: 'success',
    });
    return this.get(id);
  }

  @Post(':id/proof-of-delivery')
  @RequirePermissions('deliveries:submit')
  async pod(
    @Param('id') id: string,
    @Body() body: { type?: string; documentId?: string; notes?: string },
    @CurrentUser() user: AuthUserContext,
  ) {
    await this.prisma.deliveryEvidence.create({
      data: {
        deliveryId: id,
        type: body.type ?? 'SIGNATURE',
        documentId: body.documentId,
        notes: body.notes,
        capturedBy: user.id,
      },
    });
    await this.prisma.delivery.update({
      where: { id },
      data: {
        status: DeliveryStatus.DELIVERED,
        deliveredAt: new Date(),
        version: { increment: 1 },
      },
    });
    return this.get(id);
  }

  @Post(':id/record-exception')
  @RequirePermissions('deliveries:edit_draft')
  async exception(@Param('id') id: string, @Body() body: { notes: string }) {
    await this.prisma.delivery.update({
      where: { id },
      data: {
        status: DeliveryStatus.EXCEPTION,
        notes: body.notes,
        version: { increment: 1 },
      },
    });
    return this.get(id);
  }

  @Post(':id/returns')
  @RequirePermissions('deliveries:create')
  async returns(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.prisma.deliveryReturn.create({
      data: { deliveryId: id, reason: body.reason },
    });
  }

  @Get(':id/challan')
  @RequirePermissions('challans:view')
  async challan(@Param('id') id: string) {
    const d = await this.get(id);
    return {
      deliveryId: id,
      challanNo: (d as any).challanNo ?? (d as any).reference,
      status: (d as any).status,
    };
  }
}

@Module({ imports: [InventoryModule], controllers: [DeliveriesController] })
export class DeliveriesModule {}
