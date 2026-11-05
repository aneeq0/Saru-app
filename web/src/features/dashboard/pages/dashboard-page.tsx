import { useMemo } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus, Radio } from 'lucide-react'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import {
  ContractFulfilmentChart,
  ImportPipelineChart,
  InventoryBreakdownChart,
  InvoicePaymentTrendChart,
  TenderPipelineChart,
  ThroughputSparkChart,
} from '@/features/dashboard/components/dashboard-charts'
import {
  ActivityFeed,
  ApprovalsBoard,
  AttentionQueue,
  DeadlineRail,
  ModulePulseStrip,
} from '@/features/dashboard/components/dashboard-lists'
import { useDashboard } from '@/features/dashboard/hooks/use-dashboard'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DashboardKpi } from '../types'

function DeltaBadge({ kpi }: { kpi: DashboardKpi }) {
  if (!kpi.delta) return null
  const Icon =
    kpi.deltaTone === 'up' ? ArrowUpRight : kpi.deltaTone === 'down' ? ArrowDownRight : Minus
  const tone =
    kpi.deltaTone === 'up'
      ? 'text-success bg-success/10'
      : kpi.deltaTone === 'down'
        ? 'text-danger bg-danger/10'
        : 'text-text-secondary bg-muted'
  return (
    <span className={cn('inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium', tone)}>
      <Icon className="size-3" aria-hidden />
      {kpi.delta}
    </span>
  )
}

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard()
  const { user } = useAuth()

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  if (isLoading) {
    return (
      <div className="dashboard-ops space-y-4">
        <LoadingSkeleton rows={10} />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="dashboard-ops">
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    )
  }

  const healthTone =
    data.healthScore >= 85 ? 'text-success' : data.healthScore >= 70 ? 'text-amber' : 'text-danger'

  return (
    <div className="dashboard-ops relative min-w-0 space-y-5 pb-2">
      <div className="dash-atmosphere" aria-hidden />

      <section className="dash-rise relative overflow-hidden rounded-2xl border border-white/10 bg-navy text-white shadow-[0_20px_50px_rgba(16,42,67,0.22)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 10% 0%, rgba(15,118,110,0.45), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 20%, rgba(192,135,53,0.18), transparent 50%), linear-gradient(135deg, #0b1f33 0%, #102a43 55%, #0f3d3a 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.4fr_auto] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-100 ring-1 ring-white/15">
              <Radio className="size-3.5 animate-pulse text-teal" aria-hidden />
              Operations command
            </div>
            <h1 className="font-display mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              {user?.firstName ? `${greeting}, ${user.firstName}` : greeting}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">{data.summary}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/65">
              <span className="rounded-md bg-white/10 px-2 py-1 capitalize ring-1 ring-white/10">
                {data.role.replaceAll('_', ' ')}
              </span>
              <span>Updated {formatDateTime(data.generatedAt)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 lg:flex-col lg:items-end">
            <div className="min-w-[9.5rem] rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">Ops health</p>
              <p className={cn('font-display mt-1 text-3xl font-semibold tabular-nums', healthTone)}>
                <span className="text-white">{data.healthScore}</span>
                <span className="text-lg text-white/50">/100</span>
              </p>
            </div>
            <div className="min-w-[9.5rem] rounded-xl bg-teal/25 px-4 py-3 ring-1 ring-teal/30 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-100">Open signals</p>
              <p className="font-display mt-1 text-3xl font-semibold tabular-nums text-white">
                {data.attentionItems.length + data.pendingApprovals.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <ModulePulseStrip items={data.modulePulse} />

      <section className="dash-rise grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-[0_12px_32px_rgba(16,42,67,0.06)] sm:grid-cols-3 xl:grid-cols-6">
        {data.kpis.map((kpi, index) => (
          <article
            key={kpi.id}
            className="bg-surface px-4 py-4 transition-colors hover:bg-muted/40"
            style={{ animationDelay: `${120 + index * 35}ms` }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text-secondary">{kpi.label}</p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <p className="font-display text-2xl font-semibold tabular-nums tracking-tight text-navy">
                {kpi.formattedValue}
              </p>
              {kpi.unit ? <span className="text-xs font-medium text-text-secondary">{kpi.unit}</span> : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <DeltaBadge kpi={kpi} />
              {kpi.hint ? <span className="text-[11px] text-text-secondary">{kpi.hint}</span> : null}
            </div>
          </article>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="dash-rise min-w-0 xl:col-span-7" style={{ animationDelay: '180ms' }}>
          <TenderPipelineChart data={data.tenderPipeline} />
        </div>
        <div className="dash-rise min-w-0 xl:col-span-5" style={{ animationDelay: '220ms' }}>
          <ImportPipelineChart data={data.importPipeline} />
        </div>
        <div className="dash-rise min-w-0 xl:col-span-4" style={{ animationDelay: '260ms' }}>
          <InventoryBreakdownChart data={data.inventoryBreakdown} />
        </div>
        <div className="dash-rise min-w-0 xl:col-span-4" style={{ animationDelay: '300ms' }}>
          <ContractFulfilmentChart data={data.contractFulfilment} />
        </div>
        <div className="dash-rise min-w-0 xl:col-span-4" style={{ animationDelay: '340ms' }}>
          <ThroughputSparkChart data={data.weeklyThroughput} />
        </div>
        <div className="dash-rise min-w-0 xl:col-span-8" style={{ animationDelay: '380ms' }}>
          <InvoicePaymentTrendChart data={data.invoicePaymentTrend} />
        </div>
        <div className="dash-rise min-w-0 xl:col-span-4" style={{ animationDelay: '420ms' }}>
          <AttentionQueue items={data.attentionItems} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="dash-rise" style={{ animationDelay: '460ms' }}>
          <DeadlineRail items={data.upcomingDeadlines} />
        </div>
        <div className="dash-rise" style={{ animationDelay: '500ms' }}>
          <ApprovalsBoard items={data.pendingApprovals} />
        </div>
        <div className="dash-rise" style={{ animationDelay: '540ms' }}>
          <ActivityFeed items={data.recentActivity} />
        </div>
      </div>

      <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[11px] text-text-secondary">
        Demonstration data for Saru International operations
        <ArrowRight className="size-3 opacity-50" aria-hidden />
        figures refresh with mock API session
      </p>
    </div>
  )
}
