import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import { getReportCatalog } from '../api/reports-api'

export function useReportCatalog() {
  return useQuery({
    queryKey: queryKeys.reports.catalog,
    queryFn: ({ signal }) => getReportCatalog(signal),
  })
}
