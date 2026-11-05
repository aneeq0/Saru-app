import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import { listStock, listStockMovements, listWarehouses, type StockListParams } from '../api/inventory-api'
import type { PaginatedRequest } from '@/types/api'

export function useStockList(params: StockListParams) {
  return useQuery({
    queryKey: queryKeys.inventory.stock(params),
    queryFn: ({ signal }) => listStock(params, signal),
    placeholderData: (prev) => prev,
  })
}

export function useStockMovementsList(params: PaginatedRequest) {
  return useQuery({
    queryKey: queryKeys.inventory.movements(params),
    queryFn: ({ signal }) => listStockMovements(params, signal),
    placeholderData: (prev) => prev,
  })
}

export function useWarehousesList(params: PaginatedRequest) {
  return useQuery({
    queryKey: [...queryKeys.inventory.warehouses, params],
    queryFn: ({ signal }) => listWarehouses(params, signal),
    placeholderData: (prev) => prev,
  })
}
