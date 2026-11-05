import type { ReactNode } from 'react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { hasAnyPermission, hasPermission } from '@/lib/permissions'
import type { Permission } from '@/types/permissions'

interface PermissionGuardProps {
  permission?: Permission | Permission[]
  anyOf?: Permission[]
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGuard({ permission, anyOf, fallback = null, children }: PermissionGuardProps) {
  const { user } = useAuth()

  const allowed = anyOf
    ? hasAnyPermission(user, anyOf)
    : permission
      ? hasPermission(user, permission)
      : true

  if (!allowed) return <>{fallback}</>
  return <>{children}</>
}
