import { api } from '@/services/api/client'
import { appendListQuery } from '@/services/api/list-query'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { Manufacturer } from '@/types/entities'

export interface ManufacturerListParams extends PaginatedRequest {
  status?: string
}

export function listManufacturers(params: ManufacturerListParams, signal?: AbortSignal) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    status: params.status,
  })
  return api.get<PaginatedResponse<Manufacturer>>(`/manufacturers?${q.toString()}`, { signal })
}

export function getManufacturer(id: string, signal?: AbortSignal) {
  return api.get<Manufacturer>(`/manufacturers/${id}`, { signal })
}
