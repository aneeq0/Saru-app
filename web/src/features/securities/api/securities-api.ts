import { api } from '@/services/api/client'
import { appendListQuery } from '@/services/api/list-query'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { SecurityInstrument } from '@/types/entities'

export interface SecurityListParams extends PaginatedRequest {
  status?: string
}

export function listSecurities(params: SecurityListParams, signal?: AbortSignal) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    status: params.status,
  })
  return api.get<PaginatedResponse<SecurityInstrument>>(`/securities?${q.toString()}`, { signal })
}

export function getSecurity(id: string, signal?: AbortSignal) {
  return api.get<SecurityInstrument>(`/securities/${id}`, { signal })
}
