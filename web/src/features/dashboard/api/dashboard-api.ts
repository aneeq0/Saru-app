import { api } from '@/services/api/client'
import type { DashboardPayload } from '../types'

export function fetchDashboard(signal?: AbortSignal) {
  return api.get<DashboardPayload>('/dashboard', { signal })
}
