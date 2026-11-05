import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { OutboxPublisherService } from './outbox-publisher.service';

@ApiTags('realtime')
@ApiBearerAuth()
@Controller('realtime')
export class RealtimeMetricsController {
  constructor(private readonly publisher: OutboxPublisherService) {}

  @Get('metrics')
  @RequirePermissions('system_health:view')
  metrics() {
    const m = this.publisher.getMetrics();
    return {
      realtime_connections_active: m.realtimeConnections,
      realtime_events_published_total: m.published,
      outbox_publish_failures_total: m.failures,
      outbox_pending_batch: m.pending,
    };
  }
}
