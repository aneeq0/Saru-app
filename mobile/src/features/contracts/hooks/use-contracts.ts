import { useQuery } from '@tanstack/react-query'
import { contractsApi } from '@/features/contracts/api/contracts-api'
import { queryKeys } from '@/services/api/query-keys'
import type { PaginatedRequest } from '@/types/api'

export function useContractsList(params?: PaginatedRequest) {
  return useQuery({
    queryKey: queryKeys.contracts.list(params),
    queryFn: () => contractsApi.listContracts(params),
  })
}
