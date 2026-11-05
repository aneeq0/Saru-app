import { buildListQuery } from '@/lib/build-list-query'
import { gateway } from '@/services/api/gateway'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { Tender } from '@/types/entities'

export const tendersApi = {
  listTenders: (params?: PaginatedRequest) =>
    gateway.get<PaginatedResponse<Tender>>(`/tenders${buildListQuery(params)}`),
  getTender: (id: string) => gateway.get<Tender>(`/tenders/${id}`),
}
