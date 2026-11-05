import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deliveriesApi } from '@/features/deliveries/api/deliveries-api'
import { queryKeys } from '@/services/api/query-keys'
import type { PaginatedRequest } from '@/types/api'

export function useDeliveriesList(params?: PaginatedRequest) {
  return useQuery({
    queryKey: queryKeys.deliveries.list(params),
    queryFn: () => deliveriesApi.listDeliveries(params),
  })
}

export function useDelivery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.deliveries.detail(id ?? ''),
    queryFn: () => deliveriesApi.getDelivery(id!),
    enabled: Boolean(id),
  })
}

export function useConfirmDispatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deliveriesApi.confirmDispatch(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.deliveries.detail(id) })
      void queryClient.invalidateQueries({ queryKey: ['deliveries', 'list'] })
    },
  })
}
