import { buildListQuery } from '@/lib/build-list-query'
import { gateway } from '@/services/api/gateway'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { ApprovalRequest } from '@/types/entities'

export const approvalsApi = {
  listApprovals: (params?: PaginatedRequest) =>
    gateway.get<PaginatedResponse<ApprovalRequest>>(`/approvals${buildListQuery(params)}`),
  approveRequest: (id: string) => gateway.post<ApprovalRequest>(`/approvals/${id}/approve`),
  rejectRequest: (id: string) => gateway.post<ApprovalRequest>(`/approvals/${id}/reject`),
}
