import { useQuery } from '@tanstack/react-query'
import { invoicesApi } from '@/features/invoices/api/invoices-api'
import { queryKeys } from '@/services/api/query-keys'
import type { PaginatedRequest } from '@/types/api'

export function useInvoicesList(params?: PaginatedRequest) {
  return useQuery({
    queryKey: queryKeys.invoices.list(params),
    queryFn: () => invoicesApi.listInvoices(params),
  })
}
