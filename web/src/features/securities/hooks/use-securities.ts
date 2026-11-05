import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import {
  listSecurities,
  getSecurity,
  type SecurityListParams,
} from '../api/securities-api'

export function useSecuritiesList(params: SecurityListParams) {
  return useQuery({
    queryKey: queryKeys.securities.list(params),
    queryFn: ({ signal }) => listSecurities(params, signal),
    placeholderData: (prev) => prev,
  })
}

export function useSecurity(id: string) {
  return useQuery({
    queryKey: queryKeys.securities.detail(id),
    queryFn: ({ signal }) => getSecurity(id, signal),
    enabled: Boolean(id),
  })
}
