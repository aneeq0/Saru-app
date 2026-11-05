import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller()
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get('inventory/balances')
  @RequirePermissions('inventory:view')
  balances(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('q') q?: string,
  ) {
    return this.inventory.listBalances({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      warehouseId,
      q,
    });
  }

  /** Frontend alias used by web + mobile stock screens */
  @Get('inventory/stock')
  @RequirePermissions('inventory:view')
  stock(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('q') q?: string,
  ) {
    return this.balances(page, pageSize, warehouseId, q);
  }

  @Get('inventory/movements')
  @RequirePermissions('stock_movements:view')
  movements(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('variantId') variantId?: string,
  ) {
    return this.inventory.listMovements({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      warehouseId,
      variantId,
    });
  }

  @Get('warehouses')
  @RequirePermissions('warehouses:view')
  warehouses() {
    return this.inventory.listWarehouses();
  }

  /** Frontend alias used by web warehouses list */
  @Get('inventory/warehouses')
  @RequirePermissions('warehouses:view')
  inventoryWarehouses() {
    return this.inventory.listWarehouses();
  }

  @Get('inventory/reservations')
  @RequirePermissions('reservations:view')
  reservations(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
  ) {
    return this.inventory.listReservations({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      q,
      status,
    });
  }

  @Get('inventory/receipts')
  @RequirePermissions('receipts:view')
  receipts(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
  ) {
    return this.inventory.listReceipts({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      q,
      status,
    });
  }

  @Get('inventory/transfers')
  @RequirePermissions('transfers:view')
  transfers(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.inventory.emptyList({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get('inventory/stock-counts')
  @RequirePermissions('stock_counts:view')
  stockCounts(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.inventory.emptyList({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get('inventory/quality')
  @RequirePermissions('quality:view')
  quality(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.inventory.emptyList({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }
}
