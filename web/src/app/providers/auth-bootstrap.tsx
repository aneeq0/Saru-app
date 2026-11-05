import { useEffect, type ReactNode } from 'react'
import { authApi } from '@/features/auth/api/auth-api'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { setUnauthorizedHandler } from '@/services/api/client'

export function AuthBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    setUnauthorizedHandler(() => {
      useAuthStore.getState().clearSession()
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    const { setStatus, setSession, clearSession } = useAuthStore.getState()

    async function bootstrap() {
      setStatus('loading')
      try {
        const session = await authApi.getSession()
        if (cancelled) return
        setSession(session)
      } catch {
        if (cancelled) return
        clearSession()
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  return children
}
