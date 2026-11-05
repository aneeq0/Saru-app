import { api } from '@/services/api/client'
import { appendListQuery } from '@/services/api/list-query'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { Supplier } from '@/types/entities'

export interface SupplierListParams extends PaginatedRequest {
  status?: string
}

export function listSuppliers(params: SupplierListParams, signal?: AbortSignal) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    status: params.status,
  })
  return api.get<PaginatedResponse<Supplier>>(`/suppliers?${q.toString()}`, { signal })
}

export function getSupplier(id: string, signal?: AbortSignal) {
  return api.get<Supplier>(`/suppliers/${id}`, { signal })
}
