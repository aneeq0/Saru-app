import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import {
  listInvoices,
  getInvoice,
  finalizeInvoice,
  type InvoiceListParams,
} from '../api/invoices-api'

export function useInvoicesList(params: InvoiceListParams) {
  return useQuery({
    queryKey: queryKeys.invoices.list(params),
    queryFn: ({ signal }) => listInvoices(params, signal),
    placeholderData: (prev) => prev,
  })
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id),
    queryFn: ({ signal }) => getInvoice(id, signal),
    enabled: Boolean(id),
  })
}

export function useFinalizeInvoice(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => finalizeInvoice(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.invoices.all })
      void qc.invalidateQueries({ queryKey: queryKeys.invoices.detail(id) })
    },
  })
}
