import { api } from '@/services/api/client'
import { appendListQuery } from '@/services/api/list-query'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { ApprovalRequest } from '@/types/entities'

export interface ApprovalListParams extends PaginatedRequest {
  status?: string
}

export function listApprovals(params: ApprovalListParams, signal?: AbortSignal) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    status: params.status,
  })
  return api.get<PaginatedResponse<ApprovalRequest>>(`/approvals?${q.toString()}`, { signal })
}

export function getApproval(id: string, signal?: AbortSignal) {
  return api.get<ApprovalRequest>(`/approvals/${id}`, { signal })
}

export function approveApproval(id: string, body?: { comment?: string }) {
  return api.post<ApprovalRequest>(`/approvals/${id}/approve`, body)
}

export function rejectApproval(id: string, body?: { comment?: string }) {
  return api.post<ApprovalRequest>(`/approvals/${id}/reject`, body)
}
