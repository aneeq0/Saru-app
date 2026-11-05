import { useQuery } from '@tanstack/react-query'
import { paymentsApi } from '@/features/payments/api/payments-api'
import { queryKeys } from '@/services/api/query-keys'
import type { PaginatedRequest } from '@/types/api'

export function usePaymentsList(params?: PaginatedRequest) {
  return useQuery({
    queryKey: queryKeys.payments.list(params),
    queryFn: () => paymentsApi.listPayments(params),
  })
}
