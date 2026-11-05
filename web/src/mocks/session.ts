import type { SessionInfo } from '@/types/auth'

let currentSession: SessionInfo | null = null

export function getMockSession(): SessionInfo | null {
  return currentSession
}

export function setMockSession(session: SessionInfo | null): void {
  currentSession = session
}

export function __resetMockSession(): void {
  currentSession = null
}

export function __setMockSession(session: SessionInfo | null): void {
  currentSession = session
}
