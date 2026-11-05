import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { UnauthorizedPage } from '@/features/auth/pages/unauthorized-page'
import { useAuth } from '@/features/auth/hooks/use-auth'
import type { Permission } from '@/types/permissions'

interface ProtectedRouteProps {
  permission?: Permission | Permission[]
}

export function ProtectedRoute({ permission }: ProtectedRouteProps) {
  const { status, user, hasPermission: checkPermission } = useAuth()
  const location = useLocation()

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg p-8">
        <LoadingSkeleton className="h-32 w-full max-w-md" />
      </div>
    )
  }

  if (status !== 'authenticated' || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (permission && !checkPermission(permission)) {
    return <UnauthorizedPage embedded />
  }

  return <Outlet />
}
