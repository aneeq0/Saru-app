import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/decorators/permissions.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    let users = 0;
    let schemaOk = true;
    try {
      users = await this.prisma.user.count();
    } catch {
      schemaOk = false;
    }
    return {
      status: schemaOk ? 'ready' : 'degraded',
      schemaOk,
      users,
    };
  }
}
