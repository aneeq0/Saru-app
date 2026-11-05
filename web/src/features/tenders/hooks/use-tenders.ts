import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import {
  listTenders,
  getTender,
  createTender,
  type TenderListParams,
} from '../api/tenders-api'

export function useTendersList(params: TenderListParams) {
  return useQuery({
    queryKey: queryKeys.tenders.list(params),
    queryFn: ({ signal }) => listTenders(params, signal),
    placeholderData: (prev) => prev,
  })
}

export function useTender(id: string) {
  return useQuery({
    queryKey: queryKeys.tenders.detail(id),
    queryFn: ({ signal }) => getTender(id, signal),
    enabled: Boolean(id),
  })
}

export function useCreateTender() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTender,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.tenders.all })
    },
  })
}
