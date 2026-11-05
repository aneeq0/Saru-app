import { http, HttpResponse } from 'msw'
import { store } from '@/mocks/data/store'
import { getMockSession } from '@/mocks/session'
import { delay } from '@/mocks/utils/pagination'
import type {
  DashboardKpi,
  DashboardPayload,
} from '@/features/dashboard/types'
import type { ApiErrorBody } from '@/types/api'
import type { SystemRole } from '@/types/permissions'

const API = '*/api'

function kpi(
  id: string,
  label: string,
  value: number,
  extras?: Partial<Pick<DashboardKpi, 'hint' | 'delta' | 'deltaTone' | 'unit'>>,
): DashboardKpi {
  return {
    id,
    label,
    value,
    formattedValue: Number.isInteger(value)
      ? value.toLocaleString('en-PK')
      : value.toLocaleString('en-PK', { maximumFractionDigits: 1 }),
    ...extras,
  }
}

function buildDashboard(role: SystemRole): DashboardPayload {
  const openTenders = store.tenders.filter((t) =>
    ['identified', 'under_review', 'preparing', 'submitted'].includes(t.stage),
  ).length
  const awardedTenders = store.tenders.filter((t) =>
    ['awarded', 'partially_awarded'].includes(t.stage),
  ).length
  const inTransitImports = store.imports.filter((i) =>
    ['ordered', 'in_transit', 'arrived'].includes(i.status),
  ).length
  const lowStock = store.stock.filter((s) => s.available < 500).length
  const receivablesM = store.invoices.reduce((sum, inv) => sum + inv.balanceDue, 0) / 1_000_000
  const pendingApprovalsCount = store.approvals.filter((a) => a.status === 'pending').length
  const activeSecurities = store.securities.filter((s) =>
    ['active', 'submitted', 'prepared'].includes(s.status),
  ).length
  const qcHolds = store.qualityInspections?.filter((q) =>
    ['pending', 'quarantined', 'failed'].includes(q.status),
  ).length ?? store.stock.filter((s) => s.quarantined > 0).length
  const deliveriesDue = store.deliveries.filter((d) =>
    ['scheduled', 'preparing', 'dispatched'].includes(d.status),
  ).length
  const expiringDocs = store.documents.filter((d) => d.status === 'expiring').length
  const onHand = store.stock.reduce((s, r) => s + r.onHand, 0)
  const reserved = store.stock.reduce((s, r) => s + r.reserved, 0)
  const tenderValueM =
    store.tenders.reduce((s, t) => s + (t.estimatedValue ?? 0), 0) / 1_000_000

  const healthScore = Math.max(
    55,
    Math.min(
      98,
      92 -
        lowStock * 2 -
        pendingApprovalsCount * 3 -
        (store.imports.filter((i) => i.status === 'discrepancy').length * 4) -
        expiringDocs * 2,
    ),
  )

  const summaryByRole: Record<string, string> = {
    owner:
      'Cross-module pulse across tenders, imports, inventory, and receivables — demo operations snapshot.',
    tender_manager: 'Tender pipeline, bid readiness, and securities requiring release or renewal.',
    import_manager: 'Inbound shipments, receiving backlog, and discrepancy follow-ups.',
    inventory_manager: 'Warehouse availability, reservations, QC holds, and transfer movement.',
    documentation_officer: 'Document validity, expiry risk, and pending review queue.',
    accounts_officer: 'Receivables aging, invoice issuance, and unallocated collections.',
    auditor: 'Read-only control view of audit events, access failures, and system activity.',
  }

  let kpis: DashboardKpi[]
  switch (role) {
    case 'tender_manager':
      kpis = [
        kpi('open-tenders', 'Open tenders', openTenders, { delta: '+2 vs last week', deltaTone: 'up' }),
        kpi('awarded', 'Awarded YTD', awardedTenders, { delta: '41% win rate', deltaTone: 'flat' }),
        kpi('active-securities', 'Active securities', activeSecurities, { delta: '2 near expiry', deltaTone: 'down' }),
        kpi('pending-approvals', 'Pending approvals', pendingApprovalsCount, { deltaTone: 'flat' }),
        kpi('pipeline-value', 'Pipeline value', tenderValueM, { unit: 'PKR M', delta: '+8.2%', deltaTone: 'up' }),
        kpi('compliance-open', 'Open compliance', store.complianceItems?.filter((c) => c.status !== 'complete').length ?? 3, { delta: '1 overdue', deltaTone: 'down' }),
      ]
      break
    case 'import_manager':
      kpis = [
        kpi('in-transit', 'Active imports', inTransitImports, { delta: '1 arriving today', deltaTone: 'flat' }),
        kpi('discrepancy', 'Discrepancies', store.imports.filter((i) => i.status === 'discrepancy').length, { deltaTone: 'down' }),
        kpi('grn-open', 'Open GRNs', store.goodsReceipts?.filter((g) => g.status !== 'posted').length ?? 2, { deltaTone: 'flat' }),
        kpi('open-value', 'Open import value', store.imports.filter((i) => !['closed', 'received'].includes(i.status)).reduce((s, i) => s + i.totalValue, 0) / 1_000_000, { unit: 'PKR M' }),
        kpi('suppliers', 'Active suppliers', store.suppliers.filter((s) => s.status === 'active').length),
        kpi('qc-holds', 'QC holds', qcHolds, { deltaTone: 'down' }),
      ]
      break
    case 'inventory_manager':
      kpis = [
        kpi('on-hand', 'On-hand units', onHand, { delta: '+3.1%', deltaTone: 'up' }),
        kpi('reserved', 'Reserved', reserved, { deltaTone: 'flat' }),
        kpi('low-stock', 'Low-stock SKUs', lowStock, { hint: 'Available < 500', deltaTone: 'down' }),
        kpi('warehouses', 'Warehouses', store.warehouses.filter((w) => w.status === 'active').length),
        kpi('transfers', 'Transfers in transit', store.transfers?.filter((t) => t.status === 'in_transit').length ?? 1),
        kpi('qc-holds', 'QC / quarantine', qcHolds, { deltaTone: 'down' }),
      ]
      break
    case 'documentation_officer':
      kpis = [
        kpi('valid-docs', 'Valid documents', store.documents.filter((d) => d.status === 'valid').length, { deltaTone: 'up' }),
        kpi('expiring', 'Expiring soon', expiringDocs, { deltaTone: 'down' }),
        kpi('review', 'Pending review', store.documents.filter((d) => d.status === 'pending_review').length),
        kpi('templates', 'Active templates', store.documentTemplates?.filter((t) => t.status === 'active').length ?? 4),
        kpi('tenders-docs', 'Tenders missing docs', store.tenders.filter((t) => (t.missingDocuments ?? 0) > 0).length),
        kpi('approvals', 'Doc approvals', pendingApprovalsCount),
      ]
      break
    case 'accounts_officer':
      kpis = [
        kpi('ar', 'Outstanding AR', receivablesM, { unit: 'PKR M', delta: '-4.2%', deltaTone: 'up', hint: 'Lower is better' }),
        kpi('issued', 'Issued invoices', store.invoices.filter((i) => i.status === 'issued').length),
        kpi('partial', 'Partially paid', store.invoices.filter((i) => i.status === 'partially_paid').length),
        kpi('unallocated', 'Unallocated payments', store.payments.filter((p) => p.status === 'recorded').length),
        kpi('securities', 'Active securities', activeSecurities),
        kpi('collections', 'Collected MTD', store.payments.reduce((s, p) => s + p.amount, 0) / 1_000_000, { unit: 'PKR M', delta: '+12%', deltaTone: 'up' }),
      ]
      break
    case 'auditor':
      kpis = [
        kpi('audit-events', 'Audit events', store.auditLogs.length),
        kpi('employees', 'Active employees', store.employees.filter((e) => e.status === 'active').length),
        kpi('failed-auth', 'Failed auth', store.auditLogs.filter((a) => a.module === 'auth' && a.result === 'failure').length, { deltaTone: 'down' }),
        kpi('approvals', 'Open approvals', pendingApprovalsCount),
        kpi('health', 'Ops health', healthScore, { unit: '/100' }),
        kpi('modules', 'Tracked modules', 12),
      ]
      break
    case 'owner':
    default:
      kpis = [
        kpi('open-tenders', 'Open tenders', openTenders, { delta: '+2 this week', deltaTone: 'up', hint: 'Active pipeline stages' }),
        kpi('imports', 'Active imports', inTransitImports, { delta: 'Sea + air', deltaTone: 'flat' }),
        kpi('low-stock', 'Low-stock SKUs', lowStock, { delta: '3 critical', deltaTone: 'down' }),
        kpi('ar', 'Outstanding AR', receivablesM, { unit: 'PKR M', delta: '-0.8 M', deltaTone: 'up' }),
        kpi('approvals', 'Pending approvals', pendingApprovalsCount, { delta: 'SLA risk', deltaTone: 'down' }),
        kpi('deliveries', 'Open deliveries', deliveriesDue, { delta: '+1 scheduled', deltaTone: 'flat' }),
      ]
  }

  const stages = ['draft', 'ordered', 'in_transit', 'arrived', 'partially_received', 'received', 'discrepancy', 'closed'] as const
  const importPipeline = stages
    .map((status) => ({
      label: status.replaceAll('_', ' '),
      value: store.imports.filter((i) => i.status === status).length,
    }))
    .filter((row) => row.value > 0)

  return {
    role,
    generatedAt: new Date().toISOString(),
    summary: summaryByRole[role] ?? summaryByRole.owner,
    healthScore,
    kpis,
    tenderPipeline: [
      { label: 'Identified', value: store.tenders.filter((t) => t.stage === 'identified').length },
      { label: 'Review', value: store.tenders.filter((t) => t.stage === 'under_review').length },
      { label: 'Preparing', value: store.tenders.filter((t) => t.stage === 'preparing').length },
      { label: 'Submitted', value: store.tenders.filter((t) => t.stage === 'submitted').length },
      { label: 'Awarded', value: store.tenders.filter((t) => t.stage === 'awarded').length },
      { label: 'Partial', value: store.tenders.filter((t) => t.stage === 'partially_awarded').length },
      { label: 'Closed', value: store.tenders.filter((t) => t.stage === 'closed').length },
    ],
    contractFulfilment: store.contracts.slice(0, 5).map((c) => ({
      label: c.contractNumber.replace('CTR-', ''),
      value: Number((c.awardedValue / 1_000_000).toFixed(2)),
      secondary: Number((c.fulfilledValue / 1_000_000).toFixed(2)),
    })),
    inventoryBreakdown: [
      { label: 'Available', value: store.stock.reduce((s, r) => s + r.available, 0) },
      { label: 'Reserved', value: reserved },
      { label: 'Quarantine', value: store.stock.reduce((s, r) => s + r.quarantined, 0) },
      { label: 'Damaged', value: store.stock.reduce((s, r) => s + r.damaged, 0) },
      { label: 'Expired', value: store.stock.reduce((s, r) => s + (r.expired ?? 0), 0) },
    ].filter((row) => row.value > 0),
    invoicePaymentTrend: [
      { label: 'May', value: 8.2, secondary: 6.1 },
      { label: 'Jun', value: 9.4, secondary: 7.8 },
      { label: 'Jul', value: 11.1, secondary: 8.9 },
      { label: 'Aug', value: 10.6, secondary: 9.4 },
      { label: 'Sep', value: 12.8, secondary: 10.2 },
      { label: 'Oct', value: 14.2, secondary: 11.6 },
    ],
    importPipeline,
    weeklyThroughput: [
      { label: 'Mon', value: 12 },
      { label: 'Tue', value: 18 },
      { label: 'Wed', value: 15 },
      { label: 'Thu', value: 22 },
      { label: 'Fri', value: 19 },
      { label: 'Sat', value: 8 },
      { label: 'Sun', value: 4 },
    ],
    modulePulse: [
      {
        id: 'pulse-tenders',
        label: 'Tenders',
        value: String(openTenders),
        detail: `${awardedTenders} awarded`,
        href: '/tenders',
        tone: 'navy',
      },
      {
        id: 'pulse-imports',
        label: 'Imports',
        value: String(inTransitImports),
        detail: 'in flight',
        href: '/imports',
        tone: 'teal',
      },
      {
        id: 'pulse-stock',
        label: 'Inventory',
        value: onHand.toLocaleString('en-PK'),
        detail: `${lowStock} low SKUs`,
        href: '/inventory/stock',
        tone: lowStock > 4 ? 'danger' : 'amber',
      },
      {
        id: 'pulse-ar',
        label: 'Receivables',
        value: `${receivablesM.toFixed(1)}M`,
        detail: 'PKR outstanding',
        href: '/receivables',
        tone: 'amber',
      },
      {
        id: 'pulse-qc',
        label: 'Quality',
        value: String(qcHolds),
        detail: 'holds open',
        href: '/quality',
        tone: qcHolds > 0 ? 'danger' : 'teal',
      },
      {
        id: 'pulse-sec',
        label: 'Securities',
        value: String(activeSecurities),
        detail: 'instruments',
        href: '/securities',
        tone: 'navy',
      },
    ],
    upcomingDeadlines: [
      ...store.tenders
        .slice()
        .sort((a, b) => +new Date(a.submissionDeadline) - +new Date(b.submissionDeadline))
        .slice(0, 4)
        .map((t) => ({
          id: t.id,
          title: t.title,
          reference: t.tenderNumber,
          dueDate: t.submissionDeadline,
          type: 'tender',
          severity: (t.missingDocuments ?? 0) > 0 ? ('high' as const) : ('medium' as const),
        })),
      ...store.securities
        .slice(0, 2)
        .map((s) => ({
          id: s.id,
          title: `${s.type} · ${s.beneficiary}`,
          reference: s.reference,
          dueDate: s.expiryDate,
          type: 'security',
          severity: 'critical' as const,
        })),
    ].slice(0, 6),
    pendingApprovals: store.approvals
      .filter((a) => a.status === 'pending')
      .slice(0, 6)
      .map((a) => ({
        id: a.id,
        title: a.requestType,
        reference: a.recordReference,
        dueDate: a.deadline ?? a.requestedAt,
        type: a.module,
        severity: 'high' as const,
      })),
    recentActivity: store.auditLogs.slice(0, 10).map((a) => ({
      id: a.id,
      actor: a.user,
      action: a.action,
      timestamp: a.timestamp,
      module: a.module,
      result: a.result,
      details: a.details,
    })),
    attentionItems: [
      ...store.notifications
        .filter((n) => !n.read && (n.priority === 'high' || n.priority === 'critical'))
        .slice(0, 4)
        .map((n) => ({
          id: n.id,
          title: n.title,
          reference: n.relatedId ?? n.category,
          dueDate: n.createdAt,
          type: n.category,
          severity: (n.priority === 'critical' ? 'critical' : 'high') as 'critical' | 'high',
        })),
      ...store.stock
        .filter((s) => s.available < 200)
        .slice(0, 2)
        .map((s) => ({
          id: `attn-${s.id}`,
          title: `Low stock · ${s.productName}`,
          reference: s.sku,
          dueDate: new Date().toISOString(),
          type: 'inventory',
          severity: 'critical' as const,
        })),
    ].slice(0, 6),
  }
}

export const dashboardHandlers = [
  http.get(`${API}/dashboard`, async () => {
    await delay()
    const session = getMockSession()
    if (!session) {
      return HttpResponse.json(
        { statusCode: 401, message: 'No active session', error: 'Unauthorized' } satisfies ApiErrorBody,
        { status: 401 },
      )
    }
    return HttpResponse.json(buildDashboard(session.user.role))
  }),
]
