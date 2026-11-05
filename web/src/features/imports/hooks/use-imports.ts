import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import {
  listImports,
  getImport,
  type ImportListParams,
} from '../api/imports-api'

export function useImportsList(params: ImportListParams) {
  return useQuery({
    queryKey: queryKeys.imports.list(params),
    queryFn: ({ signal }) => listImports(params, signal),
    placeholderData: (prev) => prev,
  })
}

export function useImport(id: string) {
  return useQuery({
    queryKey: queryKeys.imports.detail(id),
    queryFn: ({ signal }) => getImport(id, signal),
    enabled: Boolean(id),
  })
}
