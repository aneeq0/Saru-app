import { buildListQuery } from '@/lib/build-list-query'
import { gateway } from '@/services/api/gateway'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { Invoice } from '@/types/entities'

export const invoicesApi = {
  listInvoices: (params?: PaginatedRequest) =>
    gateway.get<PaginatedResponse<Invoice>>(`/invoices${buildListQuery(params)}`),
}
