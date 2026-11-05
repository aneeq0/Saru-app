import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/auth-api'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { canViewModule, hasAnyPermission, hasPermission } from '@/lib/permissions'
import { queryKeys } from '@/services/api/query-keys'
import type { LoginRequest } from '@/types/auth'
import type { Permission, PermissionModule } from '@/types/permissions'

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const organization = useAuthStore((s) => s.organization)
  const expiresAt = useAuthStore((s) => s.expiresAt)
  const status = useAuthStore((s) => s.status)
  const setSession = useAuthStore((s) => s.setSession)
  const clearSession = useAuthStore((s) => s.clearSession)
  const setStatus = useAuthStore((s) => s.setStatus)
  const queryClient = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: (payload: LoginRequest) => authApi.login(payload),
    onSuccess: (data) => {
      setSession(data.session)
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.session })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearSession()
      queryClient.clear()
    },
  })

  const login = useCallback(
    (payload: LoginRequest) => loginMutation.mutateAsync(payload),
    [loginMutation],
  )

  const logout = useCallback(() => logoutMutation.mutateAsync(), [logoutMutation])

  const checkPermission = useCallback(
    (permission: Permission | Permission[]) => hasPermission(user, permission),
    [user],
  )

  const checkAnyPermission = useCallback(
    (permissions: Permission[]) => hasAnyPermission(user, permissions),
    [user],
  )

  const checkModule = useCallback(
    (module: PermissionModule) => canViewModule(user, module),
    [user],
  )

  return {
    user,
    organization,
    expiresAt,
    status,
    isAuthenticated: status === 'authenticated' && Boolean(user),
    isLoading: status === 'idle' || status === 'loading',
    login,
    logout,
    setSession,
    clearSession,
    setStatus,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    canViewModule: checkModule,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  }
}
