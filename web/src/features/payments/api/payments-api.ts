import { api } from '@/services/api/client'
import { appendListQuery } from '@/services/api/list-query'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { Payment } from '@/types/entities'

export interface PaymentListParams extends PaginatedRequest {
  status?: string
}

export function listPayments(params: PaymentListParams, signal?: AbortSignal) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    status: params.status,
  })
  return api.get<PaginatedResponse<Payment>>(`/payments?${q.toString()}`, { signal })
}

export function getPayment(id: string, signal?: AbortSignal) {
  return api.get<Payment>(`/payments/${id}`, { signal })
}
