import { buildListQuery } from '@/lib/build-list-query'
import { gateway } from '@/services/api/gateway'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { Product } from '@/types/entities'

export const productsApi = {
  listProducts: (params?: PaginatedRequest) =>
    gateway.get<PaginatedResponse<Product>>(`/products${buildListQuery(params)}`),
  getProduct: (id: string) => gateway.get<Product>(`/products/${id}`),
  getProductByBarcode: (code: string) =>
    gateway.get<Product>(`/products/barcode/${encodeURIComponent(code)}`),
}
