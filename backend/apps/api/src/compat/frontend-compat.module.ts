import { Controller, Get, Module, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { AppError, ErrorCodes } from '../common/errors/app-error';
import { normalizePage, toPaginated } from '../common/pagination/paginate';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Extra GET list routes expected by the web admin that are not yet full domain modules.
 * Keeps pages from crashing with "record not found" (Nest 404 → frontend NOT_FOUND copy).
 */
@ApiTags('compat')
@ApiBearerAuth()
@Controller()
class FrontendCompatController {
  constructor(private readonly prisma: PrismaService) {}

  private page(page?: string, pageSize?: string) {
    return normalizePage({
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Get('employees')
  @RequirePermissions('employees:view')
  async employees(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
  ) {
    const p = this.page(page, pageSize);
    const where = q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' as const } },
            { firstName: { contains: q, mode: 'insensitive' as const } },
            { lastName: { contains: q, mode: 'insensitive' as const } },
            { displayName: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: p.skip,
        take: p.take,
        orderBy: { displayName: 'asc' },
        include: { employeeProfile: true, department: true, roles: { include: { role: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);
    return toPaginated(
      rows.map((u) => ({
        id: u.id,
        employeeCode:
          u.employeeProfile?.employeeCode ??
          u.email.split('@')[0].toUpperCase(),
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        displayName: u.displayName,
        department: u.department?.name ?? undefined,
        role: u.roles[0]?.role.code?.toLowerCase() ?? 'user',
        status: u.status.toLowerCase(),
        lastLoginAt: u.lastLoginAt?.toISOString() ?? undefined,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
      total,
      p.page,
      p.pageSize,
    );
  }

  @Get('audit')
  @RequirePermissions('audit:view')
  async audit(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
  ) {
    const p = this.page(page, pageSize);
    const where = q
      ? {
          OR: [
            { action: { contains: q, mode: 'insensitive' as const } },
            { module: { contains: q, mode: 'insensitive' as const } },
            { reference: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditEvent.findMany({
        where,
        skip: p.skip,
        take: p.take,
        orderBy: { createdAt: 'desc' },
        include: { actor: true },
      }),
      this.prisma.auditEvent.count({ where }),
    ]);
    return toPaginated(
      rows.map((e) => ({
        id: e.id,
        user: e.actor?.displayName ?? e.actor?.email ?? 'system',
        action: e.action,
        module: e.module,
        recordReference: e.reference ?? e.entityId ?? null,
        outcome: e.outcome,
        createdAt: e.createdAt.toISOString(),
      })),
      total,
      p.page,
      p.pageSize,
    );
  }

  @Get('analytics/summary')
  @RequirePermissions('analytics:view')
  async analyticsSummary() {
    const [products, tenders, contracts, invoices, shipments, openInvoices] =
      await Promise.all([
        this.prisma.product.count(),
        this.prisma.tender.count(),
        this.prisma.contract.count(),
        this.prisma.invoice.count(),
        this.prisma.importShipment.count(),
        this.prisma.invoice.count({
          where: { status: { in: ['FINALIZED', 'PARTIALLY_PAID'] } },
        }),
      ]);
    const period = new Date().toLocaleString('en', {
      month: 'short',
      year: 'numeric',
    });
    return toPaginated(
      [
        {
          id: 'products',
          metric: 'Active catalogue SKUs',
          period,
          value: products,
          unit: 'count',
          trend: 'stable',
          note: 'Products in catalogue',
        },
        {
          id: 'tenders',
          metric: 'Tenders (all statuses)',
          period,
          value: tenders,
          unit: 'count',
          trend: 'up',
          note: 'Pipeline volume',
        },
        {
          id: 'contracts',
          metric: 'Contracts',
          period,
          value: contracts,
          unit: 'count',
          trend: 'stable',
          note: 'Awarded / active portfolio',
        },
        {
          id: 'shipments',
          metric: 'Import shipments',
          period,
          value: shipments,
          unit: 'count',
          trend: 'up',
          note: 'Inbound logistics',
        },
        {
          id: 'invoices',
          metric: 'Invoices issued',
          period,
          value: invoices,
          unit: 'count',
          trend: 'stable',
          note: `${openInvoices} still open`,
        },
      ],
      5,
      1,
      20,
    );
  }

  @Get('reports/catalog')
  @RequirePermissions('reports:view')
  reportsCatalog() {
    return {
      data: [
        {
          id: 'inventory-on-hand',
          name: 'Inventory on hand',
          description: 'Current stock balances by warehouse',
          module: 'inventory',
          formats: ['pdf', 'xlsx', 'csv'] as const,
        },
        {
          id: 'open-tenders',
          name: 'Open tenders',
          description: 'Active tender pipeline',
          module: 'tenders',
          formats: ['pdf', 'xlsx'] as const,
        },
        {
          id: 'receivables-aging',
          name: 'Receivables aging',
          description: 'Outstanding invoice balances',
          module: 'finance',
          formats: ['pdf', 'xlsx', 'csv'] as const,
        },
      ],
    };
  }

  @Get('employees/:id')
  @RequirePermissions('employees:view')
  async employee(@Param('id') id: string) {
    const u = await this.prisma.user.findUnique({
      where: { id },
      include: {
        employeeProfile: true,
        department: true,
        roles: { include: { role: true } },
      },
    });
    if (!u) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Employee not found', 404);
    }
    return {
      id: u.id,
      employeeCode:
        u.employeeProfile?.employeeCode ?? u.email.split('@')[0].toUpperCase(),
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      department: u.department?.name ?? undefined,
      role: u.roles[0]?.role.code?.toLowerCase() ?? 'user',
      status: u.status.toLowerCase(),
      lastLoginAt: u.lastLoginAt?.toISOString() ?? undefined,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    };
  }

  @Get('settings/company')
  @RequirePermissions('company_settings:view')
  async companySettings() {
    const org = await this.prisma.organization.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    return {
      organization: {
        id: org?.id ?? '00000000-0000-4000-8000-000000000001',
        name: org?.name ?? 'Saru International Pvt. Ltd.',
        shortName: org?.shortName ?? 'Saru',
      },
      legalName: org?.name ?? 'Saru International Pvt. Ltd.',
      taxRegistration: 'PENDING',
      defaultCurrency: 'PKR',
      fiscalYearStartMonth: 7,
      timezone: 'Asia/Karachi',
      supportEmail: 'ops@saru.demo',
      updatedAt: org?.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  @Get('settings/health')
  @RequirePermissions('system_health:view')
  async settingsHealth() {
    const started = Date.now();
    let dbOk = true;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbOk = false;
    }
    const latencyMs = Date.now() - started;
    return {
      status: dbOk ? 'healthy' : 'unhealthy',
      checkedAt: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      services: [
        { name: 'api', status: 'up', latencyMs: 1 },
        {
          name: 'database',
          status: dbOk ? 'up' : 'down',
          latencyMs,
        },
        {
          name: 'storage',
          status: process.env.S3_BUCKET ? 'up' : 'degraded',
        },
      ],
    };
  }

  @Get('settings/roles')
  @RequirePermissions('roles:view')
  async roles() {
    const roles = await this.prisma.role.findMany({ orderBy: { name: 'asc' } });
    return {
      data: roles.map((r) => ({
        id: r.id,
        code: r.code.toLowerCase(),
        name: r.name,
        description: r.description,
        isSystem: r.isSystem,
      })),
      meta: {
        page: 1,
        pageSize: roles.length || 20,
        total: roles.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        nextCursor: null,
      },
    };
  }

  @Get('settings/integrations')
  @RequirePermissions('integrations:view')
  integrations() {
    return toPaginated(
      [
        {
          id: 's3',
          name: 'Object storage',
          status: 'configured',
          provider: 'S3-compatible',
        },
        {
          id: 'redis',
          name: 'Realtime fan-out',
          status: process.env.REDIS_URL ? 'connected' : 'optional',
          provider: 'Redis',
        },
      ],
      2,
      1,
      20,
    );
  }

  @Get('settings/notification-config')
  @RequirePermissions('notification_config:view')
  notificationConfig() {
    return toPaginated(
      [
        {
          id: 'email',
          channel: 'email',
          enabled: false,
          description: 'Transactional email (not configured in demo)',
        },
        {
          id: 'in-app',
          channel: 'in_app',
          enabled: true,
          description: 'In-app notification centre',
        },
      ],
      2,
      1,
      20,
    );
  }

  @Get('system-health')
  @RequirePermissions('system_health:view')
  async systemHealth() {
    let dbOk = true;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbOk = false;
    }
    return {
      data: [
        { id: 'api', name: 'API', status: 'ok' },
        { id: 'database', name: 'PostgreSQL', status: dbOk ? 'ok' : 'down' },
        {
          id: 'redis',
          name: 'Redis',
          status: process.env.REDIS_URL ? 'configured' : 'not_set',
        },
      ],
      meta: {
        page: 1,
        pageSize: 20,
        total: 3,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        nextCursor: null,
      },
    };
  }
}

@Module({ controllers: [FrontendCompatController] })
export class FrontendCompatModule {}
