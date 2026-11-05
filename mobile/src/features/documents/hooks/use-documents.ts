import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/features/documents/api/documents-api'
import { queryKeys } from '@/services/api/query-keys'
import type { PaginatedRequest } from '@/types/api'

export function useDocumentsList(params?: PaginatedRequest) {
  return useQuery({
    queryKey: queryKeys.documents.list(params),
    queryFn: () => documentsApi.listDocuments(params),
  })
}
