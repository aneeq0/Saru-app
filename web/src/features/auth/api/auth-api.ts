import { api } from '@/services/api/client'
import type {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  ResetPasswordRequest,
  SessionInfo,
} from '@/types/auth'

export const authApi = {
  login(body: LoginRequest) {
    return api.post<LoginResponse>('/auth/login', body)
  },

  logout() {
    return api.post<void>('/auth/logout')
  },

  getSession() {
    return api.get<SessionInfo>('/auth/session')
  },

  forgotPassword(body: ForgotPasswordRequest) {
    return api.post<void>('/auth/forgot-password', body)
  },

  resetPassword(body: ResetPasswordRequest) {
    return api.post<void>('/auth/reset-password', body)
  },
}
