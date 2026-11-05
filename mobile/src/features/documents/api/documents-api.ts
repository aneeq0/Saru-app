import { buildListQuery } from '@/lib/build-list-query'
import { gateway } from '@/services/api/gateway'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { DocumentRecord } from '@/types/entities'

export const documentsApi = {
  listDocuments: (params?: PaginatedRequest) =>
    gateway.get<PaginatedResponse<DocumentRecord>>(`/documents${buildListQuery(params)}`),
}
