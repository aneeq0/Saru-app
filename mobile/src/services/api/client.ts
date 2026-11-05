import { env } from '@/constants/env'
import { ApiError } from './errors'
import type { ApiErrorBody } from '@/types/api'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
  idempotencyKey?: string
  accessToken?: string | null
}

type UnauthorizedHandler = () => void

let onUnauthorized: UnauthorizedHandler | null = null
let tokenProvider: (() => string | null | undefined) | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  onUnauthorized = handler
}

export function setAccessTokenProvider(provider: () => string | null | undefined) {
  tokenProvider = provider
}

function buildUrl(path: string): string {
  if (path.startsWith('http')) return path
  const base = env.apiBaseUrl.replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, signal, idempotencyKey, accessToken } = options
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    'X-Client': 'mobile',
    ...headers,
  }

  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json'
  if (idempotencyKey) requestHeaders['Idempotency-Key'] = idempotencyKey

  const token = accessToken ?? tokenProvider?.()
  if (token) requestHeaders.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(buildUrl(path), {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error
    throw new ApiError(0, 'Network request failed')
  }

  if (response.status === 204) return undefined as T

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => undefined)
    : await response.text()

  if (!response.ok) {
    if (response.status === 401) onUnauthorized?.()
    throw new ApiError(response.status, payload as ApiErrorBody | string)
  }

  return payload as T
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
}

export function createIdempotencyKey(): string {
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
