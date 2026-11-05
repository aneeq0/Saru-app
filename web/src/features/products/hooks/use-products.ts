import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import {
  createProduct,
  getProduct,
  listProducts,
  updateProduct,
  type ProductListParams,
} from '../api/products-api'

export function useProductList(params: ProductListParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: ({ signal }) => listProducts(params, signal),
    placeholderData: (prev) => prev,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: ({ signal }) => getProduct(id, signal),
    enabled: Boolean(id),
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.products.all })
    },
  })
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof updateProduct>[1]) => updateProduct(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.products.all })
      void qc.invalidateQueries({ queryKey: queryKeys.products.detail(id) })
    },
  })
}
