import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import { getCompanySettings, getSystemHealth, listAuditLogs } from '../api/admin-api'
import type { PaginatedRequest } from '@/types/api'

export function useCompanySettings() {
  return useQuery({
    queryKey: queryKeys.settings.company,
    queryFn: ({ signal }) => getCompanySettings(signal),
  })
}

export function useSystemHealth() {
  return useQuery({
    queryKey: queryKeys.settings.health,
    queryFn: ({ signal }) => getSystemHealth(signal),
  })
}

export function useAuditLogList(params: PaginatedRequest) {
  return useQuery({
    queryKey: queryKeys.audit.list(params),
    queryFn: ({ signal }) => listAuditLogs(params, signal),
    placeholderData: (prev) => prev,
  })
}
