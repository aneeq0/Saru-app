import {
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Patch,
  Post,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import type { AuthUserContext } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller()
class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('notifications')
  @RequirePermissions('notifications:view')
  async list(@CurrentUser() user: AuthUserContext) {
    const data = await this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return { data };
  }

  @Post('notifications/:id/read')
  @RequirePermissions('notifications:view')
  async read(@Param('id') id: string, @CurrentUser() user: AuthUserContext) {
    await this.prisma.notification.updateMany({
      where: { id, userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  /** Mobile client uses PATCH */
  @Patch('notifications/:id/read')
  @RequirePermissions('notifications:view')
  async readPatch(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserContext,
  ) {
    return this.read(id, user);
  }

  @Post('notifications/mark-all-read')
  @RequirePermissions('notifications:view')
  async markAll(@CurrentUser() user: AuthUserContext) {
    await this.prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  @Get('notifications/preferences')
  @RequirePermissions('notifications:view')
  async prefs(@CurrentUser() user: AuthUserContext) {
    return {
      data: await this.prisma.notificationPreference.findMany({
        where: { userId: user.id },
      }),
    };
  }

  @Patch('notifications/preferences')
  @RequirePermissions('notification_config:edit_draft')
  async updatePrefs(
    @CurrentUser() user: AuthUserContext,
    @Body() body: { channel: string; type: string; enabled: boolean },
  ) {
    const row = await this.prisma.notificationPreference.upsert({
      where: {
        userId_channel_type: {
          userId: user.id,
          channel: body.channel,
          type: body.type,
        },
      },
      create: {
        userId: user.id,
        channel: body.channel,
        type: body.type,
        enabled: body.enabled,
      },
      update: { enabled: body.enabled },
    });
    return row;
  }

  @Post('devices/push-tokens')
  async registerToken(
    @CurrentUser() user: AuthUserContext,
    @Body() body: { token: string; platform: string; deviceId?: string },
  ) {
    return this.prisma.devicePushToken.upsert({
      where: { token: body.token },
      create: {
        userId: user.id,
        token: body.token,
        platform: body.platform,
        deviceId: body.deviceId,
      },
      update: {
        userId: user.id,
        platform: body.platform,
        deviceId: body.deviceId,
        revokedAt: null,
      },
    });
  }

  @Delete('devices/push-tokens/:id')
  async revokeToken(
    @Param('id') id: string,
    @CurrentUser() user: AuthUserContext,
  ) {
    await this.prisma.devicePushToken.updateMany({
      where: { id, userId: user.id },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }
}

@Module({ controllers: [NotificationsController] })
export class NotificationsModule {}
