import { useQuery } from '@tanstack/react-query'
import { securitiesApi } from '@/features/securities/api/securities-api'
import { queryKeys } from '@/services/api/query-keys'
import type { PaginatedRequest } from '@/types/api'

export function useSecuritiesList(params?: PaginatedRequest) {
  return useQuery({
    queryKey: queryKeys.securities.list(params),
    queryFn: () => securitiesApi.listSecurities(params),
  })
}
