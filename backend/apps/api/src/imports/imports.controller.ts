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
import { ImportsService } from './imports.service';

@ApiTags('imports')
@ApiBearerAuth()
@Controller()
export class ImportsController {
  constructor(private readonly imports: ImportsService) {}

  @Get('imports')
  @RequirePermissions('imports:view')
  list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
  ) {
    return this.imports.list({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      status,
      q,
    });
  }

  @Post('imports')
  @RequirePermissions('imports:create')
  create(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthUserContext,
  ) {
    return this.imports.create(body as never, user.id);
  }

  @Get('imports/:id')
  @RequirePermissions('imports:view')
  get(@Param('id') id: string) {
    return this.imports.get(id);
  }

  @Patch('imports/:id')
  @RequirePermissions('imports:edit_draft')
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthUserContext,
  ) {
    return this.imports.update(id, body, user.id);
  }

  @Post('imports/:id/receipts')
  @RequirePermissions('receipts:create')
  createReceipt(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthUserContext,
  ) {
    return this.imports.createReceipt(id, body as never, user.id);
  }

  @Post('receipts/:id/submit')
  @RequirePermissions('receipts:submit')
  submit(@Param('id') id: string, @CurrentUser() user: AuthUserContext) {
    return this.imports.submitReceipt(id, user.id);
  }

  @Post('receipts/:id/approve')
  @RequirePermissions('receipts:approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthUserContext) {
    return this.imports.approveReceipt(id, user.id);
  }

  @Post('receipts/:id/post')
  @RequirePermissions('receipts:finalize')
  post(@Param('id') id: string, @CurrentUser() user: AuthUserContext) {
    return this.imports.postReceipt(id, user.id);
  }
}
