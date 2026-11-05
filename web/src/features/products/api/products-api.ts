import { api } from '@/services/api/client'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { Product } from '@/types/entities'

export interface ProductListParams extends PaginatedRequest {
  status?: string
  categoryId?: string
  manufacturerId?: string
}

export function listProducts(params: ProductListParams, signal?: AbortSignal) {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.pageSize) q.set('pageSize', String(params.pageSize))
  if (params.search) q.set('q', params.search)
  if (params.sortBy) q.set('sortBy', params.sortBy)
  if (params.sortDir) q.set('sortDir', params.sortDir)
  if (params.status) q.set('status', params.status)
  if (params.categoryId) q.set('categoryId', params.categoryId)
  if (params.manufacturerId) q.set('manufacturerId', params.manufacturerId)
  return api.get<PaginatedResponse<Product>>(`/products?${q.toString()}`, { signal })
}

export function getProduct(id: string, signal?: AbortSignal) {
  return api.get<Product>(`/products/${id}`, { signal })
}

export function createProduct(body: Partial<Product>) {
  return api.post<Product>('/products', body)
}

export function updateProduct(id: string, body: Partial<Product>, ifMatch?: string) {
  return api.patch<Product>(`/products/${id}`, body, { ifMatch })
}
