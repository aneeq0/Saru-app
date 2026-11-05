import { gateway } from '@/services/api/gateway'
import type { DashboardPayload } from '@/types/entities'

export const dashboardApi = {
  fetchDashboard: () => gateway.get<DashboardPayload>('/dashboard'),
}
