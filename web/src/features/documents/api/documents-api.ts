import { api } from '@/services/api/client'
import { appendListQuery } from '@/services/api/list-query'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { DocumentRecord } from '@/types/entities'

export interface DocumentListParams extends PaginatedRequest {
  status?: string
}

export function listDocuments(params: DocumentListParams, signal?: AbortSignal) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    status: params.status,
  })
  return api.get<PaginatedResponse<DocumentRecord>>(`/documents?${q.toString()}`, { signal })
}

export function getDocument(id: string, signal?: AbortSignal) {
  return api.get<DocumentRecord>(`/documents/${id}`, { signal })
}
