import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DashboardChartPoint, DashboardSparkPoint } from '../types'

const NAVY = '#102A43'
const TEAL = '#0F766E'
const AMBER = '#C08735'
const SLATE = '#64748B'
const COLORS = [NAVY, TEAL, AMBER, '#3D5A80', '#1D4E4A', '#8B5E34']

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid #E2E8F0',
  boxShadow: '0 8px 24px rgba(16,42,67,0.08)',
  fontSize: 12,
}

function Panel({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={`dash-panel flex min-h-0 min-w-0 flex-col overflow-hidden ${className}`}
    >
      <header className="flex items-start justify-between gap-3 border-b border-border/80 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h3 className="font-display text-[15px] font-semibold tracking-tight text-navy">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p> : null}
        </div>
      </header>
      <div className="min-h-0 flex-1 px-2 pb-3 pt-2 sm:px-3">{children}</div>
    </section>
  )
}

export function TenderPipelineChart({ data }: { data: DashboardChartPoint[] }) {
  return (
    <Panel title="Tender pipeline" subtitle="Stage distribution across the active portfolio" className="h-full">
      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF5" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: SLATE }} allowDecimals={false} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(15,118,110,0.06)' }} />
            <Bar dataKey="value" radius={[5, 5, 0, 0]} name="Tenders" maxBarSize={36}>
              {data.map((_, i) => (
                <Cell key={i} fill={i % 2 === 0 ? TEAL : NAVY} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}

export function ContractFulfilmentChart({ data }: { data: DashboardChartPoint[] }) {
  return (
    <Panel title="Contract fulfilment" subtitle="Awarded vs fulfilled value (PKR M)" className="h-full">
      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF5" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="value" fill={NAVY} name="Awarded" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="secondary" fill={TEAL} name="Fulfilled" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}

export function InventoryBreakdownChart({ data }: { data: DashboardChartPoint[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <Panel title="Inventory posture" subtitle="On-hand composition by stock state" className="h-full">
      <div className="flex h-56 flex-col gap-3 sm:h-64 sm:flex-row sm:items-center">
        <div className="h-40 min-w-0 flex-1 sm:h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={2}
                stroke="#fff"
                strokeWidth={2}
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-2 px-3 text-xs sm:w-44 sm:grid-cols-1">
          {data.map((row, i) => (
            <li key={row.label} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-text-secondary">
                <span
                  className="inline-block size-2.5 rounded-[3px]"
                  style={{ background: COLORS[i % COLORS.length] }}
                  aria-hidden
                />
                {row.label}
              </span>
              <span className="tabular-nums font-medium text-navy">
                {row.value.toLocaleString('en-PK')}
                <span className="ml-1 font-normal text-text-secondary">
                  ({total ? Math.round((row.value / total) * 100) : 0}%)
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}

export function InvoicePaymentTrendChart({ data }: { data: DashboardChartPoint[] }) {
  return (
    <Panel title="Collections trajectory" subtitle="Invoiced vs collected (PKR M), last 6 months" className="h-full">
      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="invFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={NAVY} stopOpacity={0.22} />
                <stop offset="100%" stopColor={NAVY} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="colFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={TEAL} stopOpacity={0.28} />
                <stop offset="100%" stopColor={TEAL} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF5" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="value" stroke={NAVY} fill="url(#invFill)" strokeWidth={2} name="Invoiced" />
            <Area type="monotone" dataKey="secondary" stroke={TEAL} fill="url(#colFill)" strokeWidth={2} name="Collected" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}

export function ImportPipelineChart({ data }: { data: DashboardChartPoint[] }) {
  return (
    <Panel title="Import funnel" subtitle="Shipments by operational status" className="h-full">
      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF5" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: SLATE }} axisLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={108}
              tick={{ fontSize: 10, fill: SLATE }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill={TEAL} radius={[0, 4, 4, 0]} maxBarSize={18} name="Shipments" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}

export function ThroughputSparkChart({ data }: { data: DashboardSparkPoint[] }) {
  return (
    <Panel title="Ops throughput" subtitle="Movements & documents processed (demo week)" className="h-full">
      <div className="h-40 sm:h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF5" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={TEAL}
              strokeWidth={2.5}
              dot={{ r: 3, fill: TEAL, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              name="Events"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}
