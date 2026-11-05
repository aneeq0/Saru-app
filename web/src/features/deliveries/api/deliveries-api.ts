import { api } from '@/services/api/client'
import { appendListQuery } from '@/services/api/list-query'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { Delivery } from '@/types/entities'

export interface DeliveryListParams extends PaginatedRequest {
  status?: string
}

export function listDeliveries(params: DeliveryListParams, signal?: AbortSignal) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    status: params.status,
  })
  return api.get<PaginatedResponse<Delivery>>(`/deliveries?${q.toString()}`, { signal })
}

export function getDelivery(id: string, signal?: AbortSignal) {
  return api.get<Delivery>(`/deliveries/${id}`, { signal })
}
