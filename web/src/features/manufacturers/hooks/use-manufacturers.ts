import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import {
  listManufacturers,
  getManufacturer,
  type ManufacturerListParams,
} from '../api/manufacturers-api'

export function useManufacturersList(params: ManufacturerListParams) {
  return useQuery({
    queryKey: queryKeys.manufacturers.list(params),
    queryFn: ({ signal }) => listManufacturers(params, signal),
    placeholderData: (prev) => prev,
  })
}

export function useManufacturer(id: string) {
  return useQuery({
    queryKey: queryKeys.manufacturers.detail(id),
    queryFn: ({ signal }) => getManufacturer(id, signal),
    enabled: Boolean(id),
  })
}
