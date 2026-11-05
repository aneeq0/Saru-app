import { api } from '@/services/api/client'
import { appendListQuery } from '@/services/api/list-query'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { ImportShipment } from '@/types/entities'

export interface ImportListParams extends PaginatedRequest {
  status?: string
}

export function listImports(params: ImportListParams, signal?: AbortSignal) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    status: params.status,
  })
  return api.get<PaginatedResponse<ImportShipment>>(`/imports?${q.toString()}`, { signal })
}

export function getImport(id: string, signal?: AbortSignal) {
  return api.get<ImportShipment>(`/imports/${id}`, { signal })
}
