import { buildListQuery } from '@/lib/build-list-query'
import { gateway } from '@/services/api/gateway'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { ImportShipment } from '@/types/entities'

export const importsApi = {
  listImports: (params?: PaginatedRequest) =>
    gateway.get<PaginatedResponse<ImportShipment>>(`/imports${buildListQuery(params)}`),
  getImport: (id: string) => gateway.get<ImportShipment>(`/imports/${id}`),
}
