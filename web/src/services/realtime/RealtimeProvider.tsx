import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useState,
  type ReactNode,
} from 'react'
import { env } from '@/app/config/env'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { api } from '@/services/api/client'
import type { RealtimeEventEnvelope } from './events'
import { applyRealtimeEvent, applyRealtimeEvents } from './query-invalidation'
import { socketManager, type ConnectionStatus } from './socket-manager'

type RealtimeContextValue = {
  status: ConnectionStatus
  lastEventAt: string | null
}

const RealtimeContext = createContext<RealtimeContextValue>({
  status: 'idle',
  lastEventAt: null,
})

export function useRealtimeConnectionStatus() {
  return useContext(RealtimeContext)
}

async function reconcileMissed(cursor: string | null) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
  return api.get<{
    data: RealtimeEventEnvelope[]
    meta: { nextCursor: string | null; requireFullRevalidation?: boolean }
  }>(`/sync/changes${qs}`)
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const status = useAuthStore((s) => s.status)
  const [conn, setConn] = useState<ConnectionStatus>(socketManager.getStatus())
  const [lastEventAt, setLastEventAt] = useState<string | null>(null)

  const onEvent = useEffectEvent((event: RealtimeEventEnvelope) => {
    applyRealtimeEvent(queryClient, event)
    setLastEventAt(event.occurredAt)
  })

  const onReconnect = useEffectEvent(async () => {
    try {
      const result = await reconcileMissed(socketManager.getLastCursor())
      if (result.meta.requireFullRevalidation) {
        await queryClient.invalidateQueries()
        return
      }
      applyRealtimeEvents(queryClient, result.data)
      if (result.meta.nextCursor) socketManager.setLastCursor(result.meta.nextCursor)
    } catch {
      await queryClient.invalidateQueries({ predicate: (q) => q.isActive() })
    }
  })

  useEffect(() => {
    const unsubscribe = socketManager.onStatus(setConn)
    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    const unsubscribe = socketManager.onEvent(onEvent)
    return () => {
      unsubscribe()
    }
  }, [onEvent])

  useEffect(() => {
    if (env.enableMockApi) return
    if (status !== 'authenticated') {
      socketManager.disconnect()
      return
    }
    socketManager.connect()
    return () => socketManager.disconnect()
  }, [status])

  useEffect(() => {
    if (conn === 'connected') void onReconnect()
  }, [conn, onReconnect])

  useEffect(() => {
    const onFocus = () => {
      if (status === 'authenticated' && !env.enableMockApi) void onReconnect()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [status, onReconnect])

  return (
    <RealtimeContext.Provider value={{ status: conn, lastEventAt }}>
      {children}
    </RealtimeContext.Provider>
  )
}
