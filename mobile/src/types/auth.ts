import type { Permission, SystemRole } from './permissions'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  role: SystemRole
  roleLabel: string
  department?: string
  avatarUrl?: string | null
  status: 'active' | 'inactive' | 'locked' | 'pending'
  permissions: Permission[]
  lastLoginAt?: string | null
  mfaEnabled?: boolean
}

export interface SessionInfo {
  user: AuthUser
  expiresAt: string
  accessToken?: string
  refreshToken?: string
  organization: {
    id: string
    name: string
    shortName: string
  }
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  session: SessionInfo
  accessToken?: string
  refreshToken?: string
  requiresMfa?: boolean
  mfaChallengeId?: string
}
