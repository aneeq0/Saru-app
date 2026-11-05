import { buildListQuery } from '@/lib/build-list-query'
import { gateway } from '@/services/api/gateway'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { Delivery } from '@/types/entities'

export const deliveriesApi = {
  listDeliveries: (params?: PaginatedRequest) =>
    gateway.get<PaginatedResponse<Delivery>>(`/deliveries${buildListQuery(params)}`),
  getDelivery: (id: string) => gateway.get<Delivery>(`/deliveries/${id}`),
  confirmDispatch: (id: string) => gateway.post<Delivery>(`/deliveries/${id}/confirm-dispatch`),
}
