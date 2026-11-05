import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import {
  listContracts,
  getContract,
  type ContractListParams,
} from '../api/contracts-api'

export function useContractsList(params: ContractListParams) {
  return useQuery({
    queryKey: queryKeys.contracts.list(params),
    queryFn: ({ signal }) => listContracts(params, signal),
    placeholderData: (prev) => prev,
  })
}

export function useContract(id: string) {
  return useQuery({
    queryKey: queryKeys.contracts.detail(id),
    queryFn: ({ signal }) => getContract(id, signal),
    enabled: Boolean(id),
  })
}
