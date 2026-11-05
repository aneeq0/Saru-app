import type { Permission, SystemRole, UserPermissions } from './permissions'

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
  scopes?: UserPermissions['scopes']
  lastLoginAt?: string | null
  mustChangePassword?: boolean
  mfaEnabled?: boolean
}

export interface SessionInfo {
  user: AuthUser
  expiresAt: string
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
  requiresMfa?: boolean
  mfaChallengeId?: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

export interface MfaVerifyRequest {
  challengeId: string
  code: string
}
