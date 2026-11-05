import { buildListQuery } from '@/lib/build-list-query'
import { gateway } from '@/services/api/gateway'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { StockBalance, Warehouse } from '@/types/entities'

export const inventoryApi = {
  listStock: (params?: PaginatedRequest) =>
    gateway.get<PaginatedResponse<StockBalance>>(`/inventory/stock${buildListQuery(params)}`),
  listWarehouses: () => gateway.get<Warehouse[]>('/inventory/warehouses'),
}
