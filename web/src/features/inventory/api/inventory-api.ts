import { api } from '@/services/api/client'
import { appendListQuery } from '@/services/api/list-query'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { StockBalance, StockMovement, Warehouse } from '@/types/entities'

export interface StockListParams extends PaginatedRequest {
  warehouseId?: string
}

export function listStock(params: StockListParams, signal?: AbortSignal) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    warehouseId: params.warehouseId,
  })
  return api.get<PaginatedResponse<StockBalance>>(`/inventory/stock?${q.toString()}`, { signal })
}

export function listStockMovements(params: PaginatedRequest, signal?: AbortSignal) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
  })
  return api.get<PaginatedResponse<StockMovement>>(`/inventory/movements?${q.toString()}`, { signal })
}

export function listWarehouses(params: PaginatedRequest, signal?: AbortSignal) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
  })
  return api.get<PaginatedResponse<Warehouse>>(`/inventory/warehouses?${q.toString()}`, { signal })
}
