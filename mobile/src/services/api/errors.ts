import type { ApiErrorBody } from '@/types/api'

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: Record<string, string[]>

  constructor(status: number, body?: ApiErrorBody | string) {
    const message =
      typeof body === 'string'
        ? body
        : Array.isArray(body?.message)
          ? body.message.join(', ')
          : (body?.message ?? `Request failed (${status})`)
    super(message)
    this.name = 'ApiError'
    this.status = status
    if (typeof body !== 'string' && body) {
      this.code = body.code
      this.details = body.details
    }
  }

  get isUnauthorized() {
    return this.status === 401
  }

  get isForbidden() {
    return this.status === 403
  }

  get isConflict() {
    return this.status === 409
  }

  get isValidation() {
    return this.status === 422
  }
}

export function getUserFacingErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isUnauthorized) return 'Your session has expired. Please sign in again.'
    if (error.isForbidden) return 'You do not have permission for this action.'
    if (error.isConflict) return 'This record changed. Refresh and try again.'
    if (error.status >= 500) return 'A server error occurred. Please try again later.'
    return error.message
  }
  if (error instanceof TypeError) return 'Unable to reach the server. Check your connection.'
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred.'
}
