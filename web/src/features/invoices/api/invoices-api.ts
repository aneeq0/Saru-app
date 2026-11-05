import { api } from '@/services/api/client'
import { appendListQuery } from '@/services/api/list-query'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { Invoice } from '@/types/entities'

export interface InvoiceListParams extends PaginatedRequest {
  status?: string
}

export function listInvoices(params: InvoiceListParams, signal?: AbortSignal) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    status: params.status,
  })
  return api.get<PaginatedResponse<Invoice>>(`/invoices?${q.toString()}`, { signal })
}

export function getInvoice(id: string, signal?: AbortSignal) {
  return api.get<Invoice>(`/invoices/${id}`, { signal })
}

export function finalizeInvoice(id: string) {
  return api.post<Invoice>(`/invoices/${id}/finalize`)
}
