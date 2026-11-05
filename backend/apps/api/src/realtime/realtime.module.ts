import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OutboxPublisherService } from './outbox-publisher.service';
import { OutboxService } from './outbox.service';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeMetricsController } from './realtime-metrics.controller';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [RealtimeMetricsController],
  providers: [RealtimeGateway, OutboxService, OutboxPublisherService],
  exports: [RealtimeGateway, OutboxService, OutboxPublisherService],
})
export class RealtimeModule {}
