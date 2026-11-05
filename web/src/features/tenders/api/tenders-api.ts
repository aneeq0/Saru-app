import { api } from '@/services/api/client'
import { appendListQuery } from '@/services/api/list-query'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { Tender } from '@/types/entities'

export interface TenderListParams extends PaginatedRequest {
  stage?: string
}

export function listTenders(params: TenderListParams, signal?: AbortSignal) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    stage: params.stage,
  })
  return api.get<PaginatedResponse<Tender>>(`/tenders?${q.toString()}`, { signal })
}

export function getTender(id: string, signal?: AbortSignal) {
  return api.get<Tender>(`/tenders/${id}`, { signal })
}

export function createTender(body: Partial<Tender>) {
  return api.post<Tender>('/tenders', body)
}
