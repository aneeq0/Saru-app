import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import type { AuthUserContext } from '../auth/auth.types';
import { CatalogueService } from './catalogue.service';

@ApiTags('catalogue')
@ApiBearerAuth()
@Controller()
export class CatalogueController {
  constructor(private readonly catalogue: CatalogueService) {}

  @Get('categories')
  @RequirePermissions('categories:view')
  categories(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
  ) {
    return this.catalogue.listCategories({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      q,
    });
  }

  @Get('manufacturers')
  @RequirePermissions('manufacturers:view')
  manufacturers(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
  ) {
    return this.catalogue.listManufacturers({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      q,
    });
  }

  @Post('manufacturers')
  @RequirePermissions('manufacturers:create')
  createManufacturer(
    @Body() body: { code: string; name: string; country: string },
    @CurrentUser() user: AuthUserContext,
  ) {
    return this.catalogue.createManufacturer(body, user.id);
  }

  @Get('suppliers')
  @RequirePermissions('suppliers:view')
  suppliers(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
  ) {
    return this.catalogue.listSuppliers({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      q,
    });
  }

  @Post('suppliers')
  @RequirePermissions('suppliers:create')
  createSupplier(
    @Body()
    body: {
      code: string;
      name: string;
      country: string;
      contactName?: string;
      email?: string;
      phone?: string;
    },
    @CurrentUser() user: AuthUserContext,
  ) {
    return this.catalogue.createSupplier(body, user.id);
  }

  @Get('departments')
  @RequirePermissions('departments:view')
  departments(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
  ) {
    return this.catalogue.listDepartments({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      q,
    });
  }
}
