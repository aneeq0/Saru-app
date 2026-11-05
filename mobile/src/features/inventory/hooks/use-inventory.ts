import { useQuery } from '@tanstack/react-query'
import { inventoryApi } from '@/features/inventory/api/inventory-api'
import { queryKeys } from '@/services/api/query-keys'
import type { PaginatedRequest } from '@/types/api'

export function useStockList(params?: PaginatedRequest) {
  return useQuery({
    queryKey: queryKeys.inventory.stock(params),
    queryFn: () => inventoryApi.listStock(params),
  })
}

export function useWarehouses() {
  return useQuery({
    queryKey: queryKeys.inventory.warehouses,
    queryFn: () => inventoryApi.listWarehouses(),
  })
}
