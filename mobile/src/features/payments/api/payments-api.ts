import { buildListQuery } from '@/lib/build-list-query'
import { gateway } from '@/services/api/gateway'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { Payment } from '@/types/entities'

export const paymentsApi = {
  listPayments: (params?: PaginatedRequest) =>
    gateway.get<PaginatedResponse<Payment>>(`/payments${buildListQuery(params)}`),
}
