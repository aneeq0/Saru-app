import { Controller, Get, Module } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import type { AuthUserContext } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';

function kpi(id: string, label: string, value: number, hint?: string) {
  return {
    id,
    label,
    value,
    formattedValue: Number.isInteger(value)
      ? value.toLocaleString('en-PK')
      : value.toLocaleString('en-PK', { maximumFractionDigits: 1 }),
    hint,
  };
}

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  /** Frontend-compatible aggregate dashboard (web + mobile). */
  @Get()
  @RequirePermissions('dashboard:view')
  async root(@CurrentUser() user: AuthUserContext) {
    return this.buildPayload(user);
  }

  @Get('summary')
  @RequirePermissions('dashboard:view')
  async summary() {
    const counts = await this.counts();
    return {
      activeTenders: counts.tenders,
      activeContracts: counts.contracts,
      pendingDeliveries: counts.deliveries,
      shipmentsInTransit: counts.shipments,
      openInvoices: counts.invoices,
      pendingApprovals: counts.approvals,
    };
  }

  @Get('alerts')
  @RequirePermissions('dashboard:view')
  async alerts() {
    const expiring = await this.prisma.securityInstrument.count({
      where: {
        status: 'ACTIVE',
        expiryDate: { lte: new Date(Date.now() + 30 * 86400000) },
      },
    });
    return { data: [{ type: 'cdr_expiring', count: expiring }] };
  }

  @Get('tasks')
  @RequirePermissions('dashboard:view')
  async tasks() {
    const approvals = await this.prisma.approvalRequest.findMany({
      where: { status: 'PENDING' },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
    return {
      data: approvals.map((a) => ({
        id: a.id,
        title: a.title,
        type: a.module,
        status: a.status.toLowerCase(),
        dueDate: null,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }

  @Get('charts')
  @RequirePermissions('dashboard:view')
  charts() {
    return { data: [] };
  }

  private async counts() {
    const [
      tenders,
      contracts,
      deliveries,
      shipments,
      invoices,
      approvals,
      products,
      lowStock,
    ] = await Promise.all([
      this.prisma.tender.count({
        where: {
          status: {
            in: ['DRAFT', 'PREPARING', 'SUBMITTED', 'UNDER_EVALUATION'],
          },
        },
      }),
      this.prisma.contract.count({ where: { status: 'ACTIVE' } }),
      this.prisma.delivery.count({
        where: { status: { in: ['DRAFT', 'ASSIGNED', 'PICKING', 'READY'] } },
      }),
      this.prisma.importShipment.count({
        where: {
          status: {
            in: ['ORDERED', 'IN_TRANSIT', 'ARRIVED', 'PARTIALLY_RECEIVED'],
          },
        },
      }),
      this.prisma.invoice.count({
        where: { status: { in: ['FINALIZED', 'PARTIALLY_PAID'] } },
      }),
      this.prisma.approvalRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.product.count({ where: { status: 'ACTIVE' } }),
      this.prisma.inventoryBalance.count({ where: { available: { lt: 50 } } }),
    ]);
    return {
      tenders,
      contracts,
      deliveries,
      shipments,
      invoices,
      approvals,
      products,
      lowStock,
    };
  }

  private async buildPayload(user: AuthUserContext) {
    const c = await this.counts();
    const pendingApprovals = await this.prisma.approvalRequest.findMany({
      where: { status: 'PENDING' },
      take: 8,
      orderBy: { createdAt: 'desc' },
    });
    const healthScore = Math.max(
      55,
      Math.min(98, 92 - c.lowStock * 2 - c.approvals * 3),
    );

    return {
      role: user.role,
      generatedAt: new Date().toISOString(),
      summary:
        'Live operations snapshot from the central Saru International database.',
      healthScore,
      kpis: [
        kpi('tenders', 'Active tenders', c.tenders),
        kpi('contracts', 'Active contracts', c.contracts),
        kpi('deliveries', 'Pending deliveries', c.deliveries),
        kpi('imports', 'Shipments in transit', c.shipments),
        kpi('invoices', 'Open invoices', c.invoices),
        kpi('approvals', 'Pending approvals', c.approvals),
        kpi('products', 'Active products', c.products),
        kpi('low_stock', 'Low stock lines', c.lowStock, 'Available < 50'),
      ],
      tenderPipeline: [],
      contractFulfilment: [],
      inventoryBreakdown: [],
      invoicePaymentTrend: [],
      importPipeline: [],
      weeklyThroughput: [],
      modulePulse: [
        {
          id: 'tenders',
          label: 'Tenders',
          value: String(c.tenders),
          detail: 'Active pipeline',
          href: '/tenders',
          tone: 'navy' as const,
        },
        {
          id: 'inventory',
          label: 'Low stock',
          value: String(c.lowStock),
          detail: 'Needs attention',
          href: '/inventory/stock',
          tone: 'amber' as const,
        },
        {
          id: 'deliveries',
          label: 'Deliveries',
          value: String(c.deliveries),
          detail: 'Pending fulfilment',
          href: '/deliveries',
          tone: 'teal' as const,
        },
        {
          id: 'approvals',
          label: 'Approvals',
          value: String(c.approvals),
          detail: 'Awaiting decision',
          href: '/approvals',
          tone: 'danger' as const,
        },
      ],
      upcomingDeadlines: [],
      pendingApprovals: pendingApprovals.map((a) => ({
        id: a.id,
        title: a.title,
        reference: a.reference,
        dueDate: a.createdAt.toISOString(),
        type: a.module,
        severity: 'medium' as const,
      })),
      recentActivity: [],
      attentionItems: c.lowStock
        ? [
            {
              id: 'low-stock',
              title: `${c.lowStock} inventory lines below threshold`,
              reference: 'INV',
              dueDate: new Date().toISOString(),
              type: 'inventory',
              severity: 'high' as const,
            },
          ]
        : [],
    };
  }
}

/** Alias so mobile/web `GET /tasks` resolves without a separate tasks module. */
@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
class TasksController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions('dashboard:view')
  async list() {
    const approvals = await this.prisma.approvalRequest.findMany({
      where: { status: 'PENDING' },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });
    return {
      data: approvals.map((a) => ({
        id: a.id,
        title: a.title,
        module: a.module,
        status: a.status.toLowerCase(),
        priority: 'medium',
        dueDate: null,
        createdAt: a.createdAt.toISOString(),
      })),
      meta: {
        page: 1,
        pageSize: 50,
        total: approvals.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }
}

@Module({ controllers: [DashboardController, TasksController] })
export class DashboardModule {}
