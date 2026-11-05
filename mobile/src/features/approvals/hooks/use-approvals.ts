import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { approvalsApi } from '@/features/approvals/api/approvals-api'
import { queryKeys } from '@/services/api/query-keys'
import type { PaginatedRequest } from '@/types/api'

export function useApprovalsList(params?: PaginatedRequest) {
  return useQuery({
    queryKey: queryKeys.approvals.list(params),
    queryFn: () => approvalsApi.listApprovals(params),
  })
}

export function useApproveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => approvalsApi.approveRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['approvals', 'list'] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}

export function useRejectRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => approvalsApi.rejectRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['approvals', 'list'] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}
