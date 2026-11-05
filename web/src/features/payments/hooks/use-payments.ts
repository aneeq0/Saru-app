import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import {
  listPayments,
  getPayment,
  type PaymentListParams,
} from '../api/payments-api'

export function usePaymentsList(params: PaymentListParams) {
  return useQuery({
    queryKey: queryKeys.payments.list(params),
    queryFn: ({ signal }) => listPayments(params, signal),
    placeholderData: (prev) => prev,
  })
}

export function usePayment(id: string) {
  return useQuery({
    queryKey: queryKeys.payments.detail(id),
    queryFn: ({ signal }) => getPayment(id, signal),
    enabled: Boolean(id),
  })
}
