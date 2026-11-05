import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import {
  listSuppliers,
  getSupplier,
  type SupplierListParams,
} from '../api/suppliers-api'

export function useSuppliersList(params: SupplierListParams) {
  return useQuery({
    queryKey: queryKeys.suppliers.list(params),
    queryFn: ({ signal }) => listSuppliers(params, signal),
    placeholderData: (prev) => prev,
  })
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: queryKeys.suppliers.detail(id),
    queryFn: ({ signal }) => getSupplier(id, signal),
    enabled: Boolean(id),
  })
}
