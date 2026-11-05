import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import type { AuthUserContext } from '../auth/auth.types';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @RequirePermissions('products:view')
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('manufacturerId') manufacturerId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: 'asc' | 'desc',
  ) {
    return this.products.list({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      q,
      status,
      categoryId,
      manufacturerId,
      sortBy,
      sortDir,
    });
  }

  @Get('lookup/barcode/:code')
  @RequirePermissions('products:view')
  lookup(@Param('code') code: string) {
    return this.products.lookupBarcode(code);
  }

  /** Mobile alias */
  @Get('barcode/:code')
  @RequirePermissions('products:view')
  lookupAlias(@Param('code') code: string) {
    return this.products.lookupBarcode(code);
  }

  @Get(':id')
  @RequirePermissions('products:view')
  get(@Param('id') id: string) {
    return this.products.get(id);
  }

  @Post()
  @RequirePermissions('products:create')
  create(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthUserContext,
  ) {
    return this.products.create(body as never, user.id);
  }

  @Patch(':id')
  @RequirePermissions('products:edit_draft')
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthUserContext,
  ) {
    return this.products.update(id, body, user.id);
  }
}
