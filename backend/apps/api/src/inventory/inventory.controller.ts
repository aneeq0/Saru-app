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
}
