import { api } from '@/services/api/client'
import { appendListQuery } from '@/services/api/list-query'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { ReceivableLine } from '@/types/entities'

export function listReceivables(params: PaginatedRequest, signal?: AbortSignal) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
  })
  return api.get<PaginatedResponse<ReceivableLine>>(`/receivables?${q.toString()}`, { signal })
}
