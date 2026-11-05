import { api } from '@/services/api/client'
import { appendListQuery } from '@/services/api/list-query'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { AuditLogEntry, CompanySettings, SystemHealth } from '@/types/entities'

export function getCompanySettings(signal?: AbortSignal) {
  return api.get<CompanySettings>('/settings/company', { signal })
}

export function getSystemHealth(signal?: AbortSignal) {
  return api.get<SystemHealth>('/settings/health', { signal })
}

export function listAuditLogs(params: PaginatedRequest, signal?: AbortSignal) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
  })
  return api.get<PaginatedResponse<AuditLogEntry>>(`/audit?${q.toString()}`, { signal })
}
