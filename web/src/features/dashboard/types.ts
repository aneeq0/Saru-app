export interface DashboardKpi {
  id: string
  label: string
  value: number
  formattedValue: string
  hint?: string
  delta?: string
  deltaTone?: 'up' | 'down' | 'flat'
  unit?: string
}

export interface DashboardChartPoint {
  label: string
  value: number
  secondary?: number
}

export interface DashboardDeadlineItem {
  id: string
  title: string
  reference: string
  dueDate: string
  type: string
  severity?: 'critical' | 'high' | 'medium' | 'low'
}

export interface DashboardActivityItem {
  id: string
  actor: string
  action: string
  timestamp: string
  module: string
  result?: string
  details?: string
}

export interface DashboardModulePulse {
  id: string
  label: string
  value: string
  detail: string
  href: string
  tone: 'navy' | 'teal' | 'amber' | 'danger'
}

export interface DashboardSparkPoint {
  label: string
  value: number
}

export interface DashboardPayload {
  role: string
  generatedAt: string
  summary: string
  healthScore: number
  kpis: DashboardKpi[]
  tenderPipeline: DashboardChartPoint[]
  contractFulfilment: DashboardChartPoint[]
  inventoryBreakdown: DashboardChartPoint[]
  invoicePaymentTrend: DashboardChartPoint[]
  importPipeline: DashboardChartPoint[]
  weeklyThroughput: DashboardSparkPoint[]
  modulePulse: DashboardModulePulse[]
  upcomingDeadlines: DashboardDeadlineItem[]
  pendingApprovals: DashboardDeadlineItem[]
  recentActivity: DashboardActivityItem[]
  attentionItems: DashboardDeadlineItem[]
}
