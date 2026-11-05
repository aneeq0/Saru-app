import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/auth-api'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { canViewModule, hasAnyPermission, hasPermission } from '@/lib/permissions'
import { clearSession, saveSession } from '@/services/auth/secure-session'
import { queryKeys } from '@/services/api/query-keys'
import type { LoginRequest } from '@/types/auth'
import type { Permission, PermissionModule } from '@/types/permissions'

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const organization = useAuthStore((s) => s.organization)
  const status = useAuthStore((s) => s.status)
  const accessToken = useAuthStore((s) => s.accessToken)
  const setSession = useAuthStore((s) => s.setSession)
  const clear = useAuthStore((s) => s.clearSession)
  const setStatus = useAuthStore((s) => s.setStatus)
  const queryClient = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: (payload: LoginRequest) => authApi.login(payload),
    onSuccess: async (data) => {
      const session = {
        ...data.session,
        accessToken: data.accessToken ?? data.session.accessToken,
        refreshToken: data.refreshToken ?? data.session.refreshToken,
      }
      setSession(session)
      await saveSession(session)
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.session })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout()
      } finally {
        await clearSession()
        clear()
        queryClient.clear()
      }
    },
  })

  return {
    user,
    organization,
    status,
    accessToken,
    isAuthenticated: status === 'authenticated' && Boolean(user),
    isLoading: status === 'idle' || status === 'loading',
    login: useCallback((payload: LoginRequest) => loginMutation.mutateAsync(payload), [loginMutation]),
    logout: useCallback(() => logoutMutation.mutateAsync(), [logoutMutation]),
    setSession,
    clearSession: clear,
    setStatus,
    hasPermission: useCallback(
      (permission: Permission | Permission[]) => hasPermission(user, permission),
      [user],
    ),
    hasAnyPermission: useCallback(
      (permissions: Permission[]) => hasAnyPermission(user, permissions),
      [user],
    ),
    canViewModule: useCallback(
      (module: PermissionModule) => canViewModule(user, module),
      [user],
    ),
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  }
}
