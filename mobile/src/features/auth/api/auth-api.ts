import { gateway } from '@/services/api/gateway'
import type { LoginRequest, LoginResponse, SessionInfo } from '@/types/auth'

export const authApi = {
  login: (body: LoginRequest) => gateway.post<LoginResponse>('/auth/mobile/login', body),
  logout: () => gateway.post<void>('/auth/mobile/logout'),
  getSession: () => gateway.get<SessionInfo>('/auth/session'),
  refresh: (refreshToken: string) =>
    gateway.post<{ accessToken: string; refreshToken: string; session: SessionInfo }>(
      '/auth/mobile/refresh',
      { refreshToken },
    ),
  forgotPassword: (email: string) =>
    gateway.post<{ message: string }>('/auth/forgot-password', { email }),
}
