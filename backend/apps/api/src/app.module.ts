import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { HealthModule } from './health/health.module';
import { InventoryModule } from './inventory/inventory.module';
import { NumberingModule } from './numbering/numbering.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { ImportsModule } from './imports/imports.module';
import { CatalogueModule } from './catalogue/catalogue.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TendersModule } from './tenders/tenders.module';
import { ContractsModule } from './contracts/contracts.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { SecuritiesModule } from './securities/securities.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SyncModule } from './sync/sync.module';
import { DocumentsModule } from './documents/documents.module';
import { RealtimeModule } from './realtime/realtime.module';
import { FrontendCompatModule } from './compat/frontend-compat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuditModule,
    NumberingModule,
    AuthModule,
    HealthModule,
    ProductsModule,
    CatalogueModule,
    InventoryModule,
    ImportsModule,
    TendersModule,
    ContractsModule,
    SecuritiesModule,
    DeliveriesModule,
    InvoicesModule,
    PaymentsModule,
    DashboardModule,
    ApprovalsModule,
    NotificationsModule,
    SyncModule,
    DocumentsModule,
    RealtimeModule,
    FrontendCompatModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
