import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/features/dashboard/api/dashboard-api'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { queryKeys } from '@/services/api/query-keys'

export function useDashboard() {
  const role = useAuthStore((s) => s.user?.role ?? 'owner')
  const status = useAuthStore((s) => s.status)
  return useQuery({
    queryKey: queryKeys.dashboard.byRole(role),
    queryFn: () => dashboardApi.fetchDashboard(),
    enabled: status === 'authenticated',
  })
}
