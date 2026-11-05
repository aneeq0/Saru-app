import { useQuery } from '@tanstack/react-query'
import { tendersApi } from '@/features/tenders/api/tenders-api'
import { queryKeys } from '@/services/api/query-keys'
import type { PaginatedRequest } from '@/types/api'

export function useTendersList(params?: PaginatedRequest) {
  return useQuery({
    queryKey: queryKeys.tenders.list(params),
    queryFn: () => tendersApi.listTenders(params),
  })
}

export function useTender(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tenders.detail(id ?? ''),
    queryFn: () => tendersApi.getTender(id!),
    enabled: Boolean(id),
  })
}
