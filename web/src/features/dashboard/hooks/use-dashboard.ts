import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { fetchDashboard } from '../api/dashboard-api'

export function useDashboard() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.dashboard.byRole(user?.role ?? 'unknown'),
    queryFn: ({ signal }) => fetchDashboard(signal),
    enabled: Boolean(user),
    staleTime: 60_000,
  })
}
