import { useQueryClient } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { io, type Socket } from 'socket.io-client'
import { env } from '@/constants/env'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { api } from '@/services/api/client'
import {
  REALTIME_NAMESPACE,
  REALTIME_PATH,
  type RealtimeEventEnvelope,
} from './events'
import { applyRealtimeEvent } from './query-invalidation'

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'offline' | 'error'

const RealtimeContext = createContext<{ status: ConnectionStatus }>({ status: 'idle' })

export function useRealtimeConnectionStatus() {
  return useContext(RealtimeContext)
}

function socketOrigin(): string {
  if (env.socketUrl) return env.socketUrl.replace(/\/$/, '')
  try {
    return new URL(env.apiBaseUrl).origin
  } catch {
    return env.apiBaseUrl.replace(/\/api\/?$/, '')
  }
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const authStatus = useAuthStore((s) => s.status)
  const accessToken = useAuthStore((s) => s.accessToken)
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const socketRef = useRef<Socket | null>(null)
  const cursorRef = useRef<string | null>(null)
  const appState = useRef<AppStateStatus>((AppState.currentState as AppStateStatus) || 'active')

  useEffect(() => {
    if (env.enableMockApi) return
    if (authStatus !== 'authenticated' || !accessToken) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setStatus('offline')
      return
    }

    const socket = io(`${socketOrigin()}${REALTIME_NAMESPACE}`, {
      path: REALTIME_PATH,
      transports: ['websocket'],
      auth: { token: accessToken },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
    })
    socketRef.current = socket
    setStatus('connecting')

    socket.on('connect', () => {
      setStatus('connected')
      socket.emit('subscribe', { scope: 'notifications' })
      socket.emit('subscribe', { scope: 'dashboard' })
      void reconcile()
    })
    socket.on('disconnect', () => setStatus('reconnecting'))
    socket.on('connect_error', () => setStatus('error'))
    socket.on('realtime:event', (event: RealtimeEventEnvelope) => {
      applyRealtimeEvent(queryClient, event)
      cursorRef.current = `${event.occurredAt}|${event.eventId}`
    })

    async function reconcile() {
      try {
        const cursor = cursorRef.current
        const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
        const result = await api.get<{
          data: RealtimeEventEnvelope[]
          meta: { nextCursor: string | null; requireFullRevalidation?: boolean }
        }>(`/sync/changes${qs}`)
        if (result.meta.requireFullRevalidation) {
          await queryClient.invalidateQueries()
          return
        }
        for (const e of result.data) applyRealtimeEvent(queryClient, e)
        if (result.meta.nextCursor) cursorRef.current = result.meta.nextCursor
      } catch {
        await queryClient.invalidateQueries({ predicate: (q) => q.isActive() })
      }
    }

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
    }
  }, [authStatus, accessToken, queryClient])

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      const prev: AppStateStatus = appState.current ?? 'active'
      appState.current = next
      if (env.enableMockApi) return
      if (prev.match(/inactive|background/) && next === 'active') {
        if (authStatus === 'authenticated') {
          if (!socketRef.current?.connected) {
            socketRef.current?.connect()
          }
          void queryClient.invalidateQueries({ predicate: (q) => q.isActive() })
        }
      } else if (next.match(/inactive|background/)) {
        // OS may suspend sockets; avoid aggressive background work
        setStatus((s) => (s === 'connected' ? 'offline' : s))
      }
    }
    const sub = AppState.addEventListener('change', onChange)
    return () => sub.remove()
  }, [authStatus, queryClient])

  return <RealtimeContext.Provider value={{ status }}>{children}</RealtimeContext.Provider>
}
