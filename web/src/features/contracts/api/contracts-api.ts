import { api } from '@/services/api/client'
import { appendListQuery } from '@/services/api/list-query'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { Contract } from '@/types/entities'

export interface ContractListParams extends PaginatedRequest {
  status?: string
}

export function listContracts(params: ContractListParams, signal?: AbortSignal) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    status: params.status,
  })
  return api.get<PaginatedResponse<Contract>>(`/contracts?${q.toString()}`, { signal })
}

export function getContract(id: string, signal?: AbortSignal) {
  return api.get<Contract>(`/contracts/${id}`, { signal })
}
