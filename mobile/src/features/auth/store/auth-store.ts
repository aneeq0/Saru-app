import { create } from 'zustand'
import type { AuthUser, SessionInfo } from '@/types/auth'

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  organization: SessionInfo['organization'] | null
  expiresAt: string | null
  accessToken: string | null
  refreshToken: string | null
  setSession: (session: SessionInfo) => void
  clearSession: () => void
  setStatus: (status: AuthStatus) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'idle',
  user: null,
  organization: null,
  expiresAt: null,
  accessToken: null,
  refreshToken: null,
  setSession: (session) =>
    set({
      status: 'authenticated',
      user: session.user,
      organization: session.organization,
      expiresAt: session.expiresAt,
      accessToken: session.accessToken ?? null,
      refreshToken: session.refreshToken ?? null,
    }),
  clearSession: () =>
    set({
      status: 'unauthenticated',
      user: null,
      organization: null,
      expiresAt: null,
      accessToken: null,
      refreshToken: null,
    }),
  setStatus: (status) => set({ status }),
}))
