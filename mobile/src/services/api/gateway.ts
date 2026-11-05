import { env } from '@/constants/env'
import { apiRequest, type RequestOptions } from '@/services/api/client'
import { ApiError } from '@/services/api/errors'
import { mockApi } from '@/mocks/mock-api'

/** Unified gateway: mock implementation when enabled, otherwise real HTTP. */
export async function gatewayRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = options.method ?? 'GET'

  if (env.enableMockApi) {
    try {
      return await mockApi.request<T>(method, path, options.body)
    } catch (error) {
      const status = (error as { status?: number }).status ?? 500
      throw new ApiError(status, error instanceof Error ? error.message : 'Mock request failed')
    }
  }

  return apiRequest<T>(path, options)
}

export const gateway = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    gatewayRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    gatewayRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    gatewayRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    gatewayRequest<T>(path, { ...options, method: 'DELETE' }),
}
