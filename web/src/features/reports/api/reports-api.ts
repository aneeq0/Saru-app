import { api } from '@/services/api/client'
import type { ReportCatalogItem } from '@/types/entities'

export interface ReportCatalogResponse {
  data: ReportCatalogItem[]
}

export function getReportCatalog(signal?: AbortSignal) {
  return api.get<ReportCatalogResponse>('/reports/catalog', { signal })
}
