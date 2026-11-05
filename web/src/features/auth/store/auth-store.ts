import { create } from 'zustand'
import type { AuthUser, SessionInfo } from '@/types/auth'

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  user: AuthUser | null
  organization: SessionInfo['organization'] | null
  expiresAt: string | null
  status: AuthStatus
  setSession: (session: SessionInfo) => void
  clearSession: () => void
  setStatus: (status: AuthStatus) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  organization: null,
  expiresAt: null,
  status: 'idle',
  setSession: (session) => {
    // Guard against HTML/empty payloads from a misconfigured API base URL
    // (would set authenticated with no user and cause a login↔app redirect loop).
    if (!session || typeof session !== 'object' || !session.user?.id) {
      set({
        user: null,
        organization: null,
        expiresAt: null,
        status: 'unauthenticated',
      })
      return
    }
    set({
      user: session.user,
      organization: session.organization,
      expiresAt: session.expiresAt,
      status: 'authenticated',
    })
  },
  clearSession: () =>
    set({
      user: null,
      organization: null,
      expiresAt: null,
      status: 'unauthenticated',
    }),
  setStatus: (status) => set({ status }),
}))
