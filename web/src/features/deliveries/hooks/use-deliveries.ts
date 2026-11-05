import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import {
  listDeliveries,
  getDelivery,
  type DeliveryListParams,
} from '../api/deliveries-api'

export function useDeliveriesList(params: DeliveryListParams) {
  return useQuery({
    queryKey: queryKeys.deliveries.list(params),
    queryFn: ({ signal }) => listDeliveries(params, signal),
    placeholderData: (prev) => prev,
  })
}

export function useDelivery(id: string) {
  return useQuery({
    queryKey: queryKeys.deliveries.detail(id),
    queryFn: ({ signal }) => getDelivery(id, signal),
    enabled: Boolean(id),
  })
}
