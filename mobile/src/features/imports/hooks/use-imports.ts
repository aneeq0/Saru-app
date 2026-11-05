import { useQuery } from '@tanstack/react-query'
import { importsApi } from '@/features/imports/api/imports-api'
import { queryKeys } from '@/services/api/query-keys'
import type { PaginatedRequest } from '@/types/api'

export function useImportsList(params?: PaginatedRequest) {
  return useQuery({
    queryKey: queryKeys.imports.list(params),
    queryFn: () => importsApi.listImports(params),
  })
}

export function useImport(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.imports.detail(id ?? ''),
    queryFn: () => importsApi.getImport(id!),
    enabled: Boolean(id),
  })
}
