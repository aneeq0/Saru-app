import { buildListQuery } from '@/lib/build-list-query'
import { gateway } from '@/services/api/gateway'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { Contract } from '@/types/entities'

export const contractsApi = {
  listContracts: (params?: PaginatedRequest) =>
    gateway.get<PaginatedResponse<Contract>>(`/contracts${buildListQuery(params)}`),
}
