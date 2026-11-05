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
  async charts(@CurrentUser() user: AuthUserContext) {
    const payload = await this.buildPayload(user);
    return {
      data: {
        tenderPipeline: payload.tenderPipeline,
        contractFulfilment: payload.contractFulfilment,
        inventoryBreakdown: payload.inventoryBreakdown,
        invoicePaymentTrend: payload.invoicePaymentTrend,
        importPipeline: payload.importPipeline,
        weeklyThroughput: payload.weeklyThroughput,
      },
    };
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

  private async chartSeries() {
    const [
      tenderGroups,
      shipmentGroups,
      inventoryAgg,
      contracts,
      invoices,
      movements,
      securities,
      audit,
    ] = await Promise.all([
      this.prisma.tender.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.importShipment.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.inventoryBalance.aggregate({
        _sum: {
          available: true,
          reserved: true,
          quarantined: true,
          damaged: true,
          onHand: true,
        },
      }),
      this.prisma.contract.findMany({
        take: 6,
        orderBy: { updatedAt: 'desc' },
        include: { lines: true },
      }),
      this.prisma.invoice.findMany({
        where: { status: { not: 'CANCELLED' } },
        select: {
          grandTotal: true,
          amountPaid: true,
          issueDate: true,
          createdAt: true,
        },
        take: 500,
      }),
      this.prisma.inventoryMovement.findMany({
        where: {
          postedAt: { gte: new Date(Date.now() - 7 * 86400000) },
        },
        select: { postedAt: true },
      }),
      this.prisma.securityInstrument.findMany({
        where: {
          status: 'ACTIVE',
          expiryDate: { lte: new Date(Date.now() + 45 * 86400000) },
        },
        take: 5,
        orderBy: { expiryDate: 'asc' },
      }),
      this.prisma.auditEvent.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { actor: true },
      }),
    ]);

    const tenderLabel: Record<string, string> = {
      DRAFT: 'Draft',
      PREPARING: 'Preparing',
      COMPLIANCE_REVIEW: 'Compliance',
      READY: 'Ready',
      SUBMITTED: 'Submitted',
      UNDER_EVALUATION: 'Evaluation',
      AWARDED: 'Awarded',
      PARTIALLY_AWARDED: 'Partial',
      LOST: 'Lost',
      CANCELLED: 'Cancelled',
      CLOSED: 'Closed',
    };
    const tenderPipeline = tenderGroups.map((g) => ({
      label: tenderLabel[g.status] ?? g.status,
      value: g._count._all,
    }));

    const shipmentLabel: Record<string, string> = {
      DRAFT: 'draft',
      ORDERED: 'ordered',
      IN_TRANSIT: 'in transit',
      ARRIVED: 'arrived',
      PARTIALLY_RECEIVED: 'partial',
      RECEIVED: 'received',
      DISCREPANCY: 'discrepancy',
      CLOSED: 'closed',
      CANCELLED: 'cancelled',
    };
    const importPipeline = shipmentGroups
      .map((g) => ({
        label: shipmentLabel[g.status] ?? g.status.toLowerCase(),
        value: g._count._all,
      }))
      .filter((r) => r.value > 0);

    const sum = (v: { toString(): string } | null | undefined) =>
      v != null ? Number(v) : 0;
    const inventoryBreakdown = [
      { label: 'Available', value: sum(inventoryAgg._sum.available) },
      { label: 'Reserved', value: sum(inventoryAgg._sum.reserved) },
      { label: 'Quarantine', value: sum(inventoryAgg._sum.quarantined) },
      { label: 'Damaged', value: sum(inventoryAgg._sum.damaged) },
    ].filter((r) => r.value > 0);

    const contractFulfilment = contracts.map((c) => {
      const awarded = Number(c.totalValue) / 1_000_000;
      const delivered = c.lines.reduce(
        (s, l) => s + Number(l.deliveredQty) * Number(l.unitPrice),
        0,
      );
      return {
        label: c.reference.replace(/^CTR-?/i, '').slice(0, 10) || c.reference,
        value: Number(awarded.toFixed(2)),
        secondary: Number((delivered / 1_000_000).toFixed(2)),
      };
    });

    const monthKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = (key: string) => {
      const [y, m] = key.split('-').map(Number);
      return new Date(y, m - 1, 1).toLocaleString('en', { month: 'short' });
    };
    const trendMap = new Map<string, { value: number; secondary: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      trendMap.set(monthKey(d), { value: 0, secondary: 0 });
    }
    for (const inv of invoices) {
      const d = inv.issueDate ?? inv.createdAt;
      const key = monthKey(d);
      const bucket = trendMap.get(key);
      if (!bucket) continue;
      bucket.value += Number(inv.grandTotal) / 1_000_000;
      bucket.secondary += Number(inv.amountPaid) / 1_000_000;
    }
    const invoicePaymentTrend = [...trendMap.entries()].map(([key, v]) => ({
      label: monthLabel(key),
      value: Number(v.value.toFixed(2)),
      secondary: Number(v.secondary.toFixed(2)),
    }));

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekly = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      weekly.set(dayNames[d.getDay()], 0);
    }
    for (const m of movements) {
      const label = dayNames[m.postedAt.getDay()];
      weekly.set(label, (weekly.get(label) ?? 0) + 1);
    }
    const weeklyThroughput = [...weekly.entries()].map(([label, value]) => ({
      label,
      value,
    }));

    return {
      tenderPipeline,
      importPipeline,
      inventoryBreakdown,
      contractFulfilment,
      invoicePaymentTrend,
      weeklyThroughput,
      securities,
      audit,
      onHand: sum(inventoryAgg._sum.onHand),
    };
  }

  private async buildPayload(user: AuthUserContext) {
    const [c, charts, pendingApprovals] = await Promise.all([
      this.counts(),
      this.chartSeries(),
      this.prisma.approvalRequest.findMany({
        where: { status: 'PENDING' },
        take: 8,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const healthScore = Math.max(
      55,
      Math.min(98, 92 - c.lowStock * 2 - c.approvals * 3),
    );

    const upcomingDeadlines = charts.securities.map((s) => ({
      id: s.id,
      title: `${s.type} expiring`,
      reference: s.reference,
      dueDate: s.expiryDate?.toISOString() ?? new Date().toISOString(),
      type: 'security',
      severity: 'high' as const,
    }));

    const recentActivity = charts.audit.map((e) => ({
      id: e.id,
      actor: e.actor?.displayName ?? e.actor?.email ?? 'system',
      action: e.action,
      timestamp: e.createdAt.toISOString(),
      module: e.module,
      result: e.outcome,
      details: e.reference ?? undefined,
    }));

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
      tenderPipeline: charts.tenderPipeline,
      contractFulfilment: charts.contractFulfilment,
      inventoryBreakdown: charts.inventoryBreakdown,
      invoicePaymentTrend: charts.invoicePaymentTrend,
      importPipeline: charts.importPipeline,
      weeklyThroughput: charts.weeklyThroughput,
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
          label: 'On hand',
          value: charts.onHand.toLocaleString('en-PK'),
          detail: `${c.lowStock} low SKUs`,
          href: '/inventory/stock',
          tone: c.lowStock > 0 ? ('danger' as const) : ('amber' as const),
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
      upcomingDeadlines,
      pendingApprovals: pendingApprovals.map((a) => ({
        id: a.id,
        title: a.title,
        reference: a.reference,
        dueDate: a.createdAt.toISOString(),
        type: a.module,
        severity: 'medium' as const,
      })),
      recentActivity,
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
