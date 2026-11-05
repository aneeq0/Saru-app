import { io, type Socket } from 'socket.io-client'
import { env } from '@/app/config/env'
import { REALTIME_NAMESPACE, REALTIME_PATH, type RealtimeEventEnvelope } from './events'

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'offline'
  | 'error'

type StatusListener = (status: ConnectionStatus) => void
type EventListener = (event: RealtimeEventEnvelope) => void

function socketOrigin(): string {
  if (env.socketUrl) return env.socketUrl.replace(/\/$/, '')
  try {
    const api = new URL(env.apiBaseUrl, window.location.origin)
    return api.origin
  } catch {
    return window.location.origin
  }
}

class SocketConnectionManager {
  private socket: Socket | null = null
  private status: ConnectionStatus = 'idle'
  private statusListeners = new Set<StatusListener>()
  private eventListeners = new Set<EventListener>()
  private lastCursor: string | null = null

  getStatus() {
    return this.status
  }

  getLastCursor() {
    return this.lastCursor
  }

  setLastCursor(cursor: string | null) {
    this.lastCursor = cursor
    if (cursor) localStorage.setItem('saru.realtime.cursor', cursor)
  }

  loadCursor() {
    this.lastCursor = localStorage.getItem('saru.realtime.cursor')
  }

  onStatus(listener: StatusListener) {
    this.statusListeners.add(listener)
    listener(this.status)
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  onEvent(listener: EventListener) {
    this.eventListeners.add(listener)
    return () => {
      this.eventListeners.delete(listener)
    }
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status
    for (const l of this.statusListeners) l(status)
  }

  connect() {
    if (env.enableMockApi) {
      this.setStatus('idle')
      return
    }
    if (this.socket?.connected) return

    this.loadCursor()
    this.setStatus('connecting')

    this.socket = io(`${socketOrigin()}${REALTIME_NAMESPACE}`, {
      path: REALTIME_PATH,
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 8_000,
      auth: {},
    })

    this.socket.on('connect', () => this.setStatus('connected'))
    this.socket.on('disconnect', () => this.setStatus('reconnecting'))
    this.socket.io.on('reconnect_attempt', () => this.setStatus('reconnecting'))
    this.socket.io.on('reconnect', () => this.setStatus('connected'))
    this.socket.on('connect_error', () => this.setStatus('error'))
    this.socket.on('realtime:event', (event: RealtimeEventEnvelope) => {
      for (const l of this.eventListeners) l(event)
      this.setLastCursor(`${event.occurredAt}|${event.eventId}`)
    })
    this.socket.on('realtime:ready', () => {
      void this.socket?.emit('subscribe', { scope: 'notifications' })
      void this.socket?.emit('subscribe', { scope: 'dashboard' })
    })
  }

  disconnect() {
    this.socket?.removeAllListeners()
    this.socket?.disconnect()
    this.socket = null
    this.setStatus('offline')
  }

  subscribeRecord(entityType: string, entityId: string) {
    this.socket?.emit('subscribe', { scope: 'record', entityType, entityId })
  }
}

export const socketManager = new SocketConnectionManager()
