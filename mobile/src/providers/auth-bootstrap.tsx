import { router } from 'expo-router'
import { useEffect } from 'react'
import { authApi } from '@/features/auth/api/auth-api'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { env } from '@/constants/env'
import { restoreMockSession } from '@/mocks/mock-api'
import { setAccessTokenProvider, setUnauthorizedHandler } from '@/services/api/client'
import { clearSession, loadSession } from '@/services/auth/secure-session'

export function AuthBootstrap() {
  const setSession = useAuthStore((s) => s.setSession)
  const clear = useAuthStore((s) => s.clearSession)
  const setStatus = useAuthStore((s) => s.setStatus)

  useEffect(() => {
    setAccessTokenProvider(() => useAuthStore.getState().accessToken)
    setUnauthorizedHandler(() => {
      void (async () => {
        await clearSession()
        clear()
        router.replace('/(auth)/login')
      })()
    })
  }, [clear])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      setStatus('loading')
      let stored: Awaited<ReturnType<typeof loadSession>> = null
      try {
        stored = await loadSession()
      } catch {
        stored = null
      }
      if (cancelled) return

      if (!stored) {
        setStatus('unauthenticated')
        return
      }

      if (env.enableMockApi) {
        restoreMockSession(stored)
        setSession(stored)
        return
      }

      try {
        const fresh = await authApi.getSession()
        if (!cancelled) {
          setSession({
            ...fresh,
            accessToken: stored.accessToken,
            refreshToken: stored.refreshToken,
          })
        }
      } catch {
        if (stored.refreshToken) {
          try {
            const refreshed = await authApi.refresh(stored.refreshToken)
            if (!cancelled) {
              const session = {
                ...refreshed.session,
                accessToken: refreshed.accessToken,
                refreshToken: refreshed.refreshToken,
              }
              setSession(session)
              const { saveSession } = await import('@/services/auth/secure-session')
              await saveSession(session)
              return
            }
          } catch {
            /* fall through */
          }
        }
        if (!cancelled) {
          await clearSession()
          clear()
        }
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [setSession, clear, setStatus])

  return null
}
