import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import {
  listApprovals,
  getApproval,
  approveApproval,
  rejectApproval,
  type ApprovalListParams,
} from '../api/approvals-api'

export function useApprovalsList(params: ApprovalListParams) {
  return useQuery({
    queryKey: queryKeys.approvals.list(params),
    queryFn: ({ signal }) => listApprovals(params, signal),
    placeholderData: (prev) => prev,
  })
}

export function useApproval(id: string) {
  return useQuery({
    queryKey: queryKeys.approvals.detail(id),
    queryFn: ({ signal }) => getApproval(id, signal),
    enabled: Boolean(id),
  })
}

export function useApproveApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => approveApproval(id, { comment }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.approvals.all })
    },
  })
}

export function useRejectApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) => rejectApproval(id, { comment }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.approvals.all })
    },
  })
}
