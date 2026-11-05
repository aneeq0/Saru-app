import { buildListQuery } from '@/lib/build-list-query'
import { gateway } from '@/services/api/gateway'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { SecurityInstrument } from '@/types/entities'

export const securitiesApi = {
  listSecurities: (params?: PaginatedRequest) =>
    gateway.get<PaginatedResponse<SecurityInstrument>>(`/securities${buildListQuery(params)}`),
}
