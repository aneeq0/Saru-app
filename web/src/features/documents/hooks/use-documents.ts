import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import {
  listDocuments,
  getDocument,
  type DocumentListParams,
} from '../api/documents-api'

export function useDocumentsList(params: DocumentListParams) {
  return useQuery({
    queryKey: queryKeys.documents.list(params),
    queryFn: ({ signal }) => listDocuments(params, signal),
    placeholderData: (prev) => prev,
  })
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: queryKeys.documents.detail(id),
    queryFn: ({ signal }) => getDocument(id, signal),
    enabled: Boolean(id),
  })
}
