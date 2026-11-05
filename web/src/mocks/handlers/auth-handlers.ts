import { http, HttpResponse } from 'msw'
import {
  createDemoSession,
  DEMO_PASSWORD,
  findDemoUserByEmail,
} from '@/mocks/data/store'
import { delay } from '@/mocks/utils/pagination'
import { getMockSession, setMockSession } from '@/mocks/session'
import type { LoginRequest, LoginResponse } from '@/types/auth'
import type { ApiErrorBody } from '@/types/api'

const API = '*/api'

function readSessionEmail(request: Request): string | null {
  const cookie = request.headers.get('cookie') ?? ''
  const match = cookie.match(/(?:^|;\s*)saru_session=([^;]+)/)
  if (match) return decodeURIComponent(match[1])
  return getMockSession()?.user.email ?? null
}

function unauthorized(): HttpResponse<ApiErrorBody> {
  return HttpResponse.json(
    { statusCode: 401, message: 'No active session', error: 'Unauthorized', code: 'UNAUTHORIZED' },
    { status: 401 },
  )
}

export const authHandlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    await delay()
    const body = (await request.json()) as LoginRequest
    const email = body.email?.trim().toLowerCase()
    const record = email ? findDemoUserByEmail(email) : undefined
    if (!record || body.password !== DEMO_PASSWORD) {
      return HttpResponse.json(
        {
          statusCode: 401,
          message: 'Invalid email or password',
          error: 'Unauthorized',
          code: 'INVALID_CREDENTIALS',
        } satisfies ApiErrorBody,
        { status: 401 },
      )
    }
    if (record.user.status !== 'active') {
      return HttpResponse.json(
        {
          statusCode: 403,
          message: 'Account is not active',
          error: 'Forbidden',
          code: 'ACCOUNT_INACTIVE',
        } satisfies ApiErrorBody,
        { status: 403 },
      )
    }
    const session = createDemoSession({
      ...record.user,
      lastLoginAt: new Date().toISOString(),
    })
    setMockSession(session)
    const response: LoginResponse = { session }
    return HttpResponse.json(response, {
      headers: {
        'Set-Cookie': `saru_session=${encodeURIComponent(email)}; Path=/; SameSite=Lax`,
      },
    })
  }),

  http.get(`${API}/auth/session`, async ({ request }) => {
    await delay()
    const existing = getMockSession()
    if (existing) return HttpResponse.json(existing)
    const email = readSessionEmail(request)
    if (!email) return unauthorized()
    const record = findDemoUserByEmail(email)
    if (!record || record.user.status !== 'active') return unauthorized()
    const session = createDemoSession(record.user)
    setMockSession(session)
    return HttpResponse.json(session)
  }),

  http.post(`${API}/auth/logout`, async () => {
    await delay()
    setMockSession(null)
    return new HttpResponse(null, {
      status: 204,
      headers: {
        'Set-Cookie': 'saru_session=; Path=/; Max-Age=0; SameSite=Lax',
      },
    })
  }),

  http.post(`${API}/auth/forgot-password`, async () => {
    await delay()
    return HttpResponse.json({
      message:
        'If the email exists in the demo directory, reset instructions were sent (simulated demonstration).',
    })
  }),

  http.post(`${API}/auth/reset-password`, async () => {
    await delay()
    return new HttpResponse(null, { status: 204 })
  }),
]
