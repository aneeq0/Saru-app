import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/features/products/api/products-api'
import { queryKeys } from '@/services/api/query-keys'
import type { PaginatedRequest } from '@/types/api'

export function useProductsList(params?: PaginatedRequest) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => productsApi.listProducts(params),
  })
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.products.detail(id ?? ''),
    queryFn: () => productsApi.getProduct(id!),
    enabled: Boolean(id),
  })
}

export function useProductByBarcode(code: string | undefined) {
  return useQuery({
    queryKey: queryKeys.products.barcode(code ?? ''),
    queryFn: () => productsApi.getProductByBarcode(code!),
    enabled: Boolean(code?.trim()),
    retry: false,
  })
}
