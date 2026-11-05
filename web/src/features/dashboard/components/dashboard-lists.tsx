import { Link } from 'react-router-dom'
import { formatDate, formatDateTime, formatRelative } from '@/lib/format'
import type { DashboardActivityItem, DashboardDeadlineItem, DashboardModulePulse } from '../types'

const severityClass: Record<string, string> = {
  critical: 'bg-danger/10 text-danger ring-danger/20',
  high: 'bg-amber/15 text-amber ring-amber/25',
  medium: 'bg-info/10 text-info ring-info/20',
  low: 'bg-muted text-text-secondary ring-border',
}

const pulseTone: Record<DashboardModulePulse['tone'], string> = {
  navy: 'from-navy/95 to-navy/80',
  teal: 'from-teal to-teal-hover',
  amber: 'from-amber to-[#9a6a28]',
  danger: 'from-danger to-[#8f1a1a]',
}

export function ModulePulseStrip({ items }: { items: DashboardModulePulse[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {items.map((item, index) => (
        <Link
          key={item.id}
          to={item.href}
          className={`dash-rise group relative overflow-hidden rounded-xl bg-gradient-to-br p-3 text-white shadow-[0_8px_24px_rgba(16,42,67,0.12)] transition-transform duration-300 hover:-translate-y-0.5 ${pulseTone[item.tone]}`}
          style={{ animationDelay: `${80 + index * 40}ms` }}
        >
          <div
            className="pointer-events-none absolute -right-4 -top-4 size-16 rounded-full bg-white/10"
            aria-hidden
          />
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75">{item.label}</p>
          <p className="font-display mt-1 text-xl font-semibold tabular-nums tracking-tight">{item.value}</p>
          <p className="mt-0.5 text-[11px] text-white/80">{item.detail}</p>
        </Link>
      ))}
    </div>
  )
}

export function AttentionQueue({ items }: { items: DashboardDeadlineItem[] }) {
  return (
    <section className="dash-panel h-full">
      <header className="flex items-center justify-between border-b border-border/80 px-4 py-3 sm:px-5">
        <div>
          <h3 className="font-display text-[15px] font-semibold text-navy">Needs attention</h3>
          <p className="text-xs text-text-secondary">Priority signals across modules</p>
        </div>
        <span className="rounded-md bg-danger/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-danger">
          {items.length}
        </span>
      </header>
      <ul className="divide-y divide-border/70">
        {items.length === 0 ? (
          <li className="px-5 py-6 text-sm text-text-secondary">No critical items right now.</li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="flex gap-3 px-4 py-3 sm:px-5">
              <span
                className={`mt-0.5 h-fit shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${severityClass[item.severity ?? 'medium']}`}
              >
                {item.severity ?? 'medium'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-navy">{item.title}</p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {item.reference} · {item.type}
                </p>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}

export function DeadlineRail({ items }: { items: DashboardDeadlineItem[] }) {
  return (
    <section className="dash-panel h-full">
      <header className="border-b border-border/80 px-4 py-3 sm:px-5">
        <h3 className="font-display text-[15px] font-semibold text-navy">Upcoming deadlines</h3>
        <p className="text-xs text-text-secondary">Tenders, securities, and delivery windows</p>
      </header>
      <ol className="relative space-y-0 px-4 py-2 sm:px-5">
        <div className="absolute bottom-4 left-[27px] top-4 w-px bg-border sm:left-[31px]" aria-hidden />
        {items.map((item) => (
          <li key={item.id} className="relative flex gap-3 py-2.5">
            <span className="relative z-[1] mt-1.5 size-2.5 shrink-0 rounded-full bg-teal ring-4 ring-surface" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium text-navy">{item.title}</p>
                <time className="shrink-0 text-[11px] tabular-nums text-text-secondary">
                  {formatDate(item.dueDate)}
                </time>
              </div>
              <p className="text-xs text-text-secondary">
                {item.reference} · {item.type}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function ApprovalsBoard({ items }: { items: DashboardDeadlineItem[] }) {
  return (
    <section className="dash-panel h-full">
      <header className="flex items-center justify-between border-b border-border/80 px-4 py-3 sm:px-5">
        <div>
          <h3 className="font-display text-[15px] font-semibold text-navy">Pending approvals</h3>
          <p className="text-xs text-text-secondary">Waiting on decision</p>
        </div>
        <Link to="/approvals" className="text-xs font-semibold text-teal hover:underline">
          Open queue
        </Link>
      </header>
      <div className="space-y-2 p-3 sm:p-4">
        {items.length === 0 ? (
          <p className="px-1 py-4 text-sm text-text-secondary">No pending approvals.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border/80 bg-gradient-to-r from-muted/40 to-transparent px-3 py-2.5"
            >
              <p className="text-sm font-medium text-navy">{item.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-text-secondary">
                <span className="rounded bg-navy/5 px-1.5 py-0.5 font-medium text-navy/80">{item.type}</span>
                <span className="tabular-nums">{item.reference}</span>
                <span>· due {formatDate(item.dueDate)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export function ActivityFeed({ items }: { items: DashboardActivityItem[] }) {
  return (
    <section className="dash-panel h-full">
      <header className="flex items-center justify-between border-b border-border/80 px-4 py-3 sm:px-5">
        <div>
          <h3 className="font-display text-[15px] font-semibold text-navy">Live activity</h3>
          <p className="text-xs text-text-secondary">Recent audit trail events</p>
        </div>
        <Link to="/admin/audit" className="text-xs font-semibold text-teal hover:underline">
          Full log
        </Link>
      </header>
      <ul className="max-h-[28rem] space-y-0 overflow-y-auto scrollbar-thin">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex gap-3 border-b border-border/60 px-4 py-3 last:border-0 sm:px-5"
          >
            <div className="mt-1 flex w-10 shrink-0 flex-col items-center" aria-hidden>
              <span
                className={`size-2 rounded-full ${item.result === 'failure' ? 'bg-danger' : 'bg-teal'}`}
              />
              <span className="mt-1 w-px flex-1 bg-border" />
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <p className="text-sm text-text">
                <span className="font-semibold text-navy">{item.actor}</span>{' '}
                <span className="text-text-secondary">{item.action}</span>
              </p>
              {item.details ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{item.details}</p>
              ) : null}
              <p className="mt-1 text-[11px] text-text-secondary">
                <span className="rounded bg-muted px-1.5 py-0.5 font-medium uppercase tracking-wide text-navy/70">
                  {item.module}
                </span>
                <span className="mx-1.5">·</span>
                <time dateTime={item.timestamp} title={formatDateTime(item.timestamp)}>
                  {formatRelative(item.timestamp)}
                </time>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
