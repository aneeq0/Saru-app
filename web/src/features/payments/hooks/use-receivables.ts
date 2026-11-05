import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import { listReceivables } from '../api/receivables-api'
import type { PaginatedRequest } from '@/types/api'

export function useReceivablesList(params: PaginatedRequest) {
  return useQuery({
    queryKey: queryKeys.payments.receivables(params),
    queryFn: ({ signal }) => listReceivables(params, signal),
    placeholderData: (prev) => prev,
  })
}
