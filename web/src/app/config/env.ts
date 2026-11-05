function readBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback
  return value === 'true' || value === '1'
}

/**
 * Normalize Vercel/Railway env mistakes like:
 * - saru-app-production.up.railway.app
 * - https://saru-app-production.up.railway.app
 * into https://…/api
 */
export function normalizeApiBaseUrl(raw: string | undefined, fallback = '/api'): string {
  let value = (raw ?? '').trim()
  if (!value) return fallback

  // Protocol-relative or missing scheme → https
  if (value.startsWith('//')) value = `https:${value}`
  if (!value.startsWith('/') && !/^https?:\/\//i.test(value)) {
    value = `https://${value}`
  }

  // Absolute host without /api → append it
  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value)
    const path = url.pathname.replace(/\/$/, '')
    if (path === '' || path === '/') {
      url.pathname = '/api'
    } else if (!path.endsWith('/api')) {
      url.pathname = `${path}/api`
    }
    return url.toString().replace(/\/$/, '')
  }

  return value.replace(/\/$/, '') || fallback
}

/** Mock API only in local Vite DEV unless explicitly overridden. */
const defaultEnableMockApi = import.meta.env.DEV

export const env = {
  apiBaseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  socketUrl: (() => {
    const raw = import.meta.env.VITE_SOCKET_URL as string | undefined
    if (!raw?.trim()) return undefined
    let value = raw.trim()
    if (value.startsWith('//')) value = `https:${value}`
    if (!/^https?:\/\//i.test(value)) value = `https://${value}`
    return value.replace(/\/$/, '')
  })(),
  enableMockApi: readBool(import.meta.env.VITE_ENABLE_MOCK_API, defaultEnableMockApi),
  appName: import.meta.env.VITE_APP_NAME ?? 'Saru International',
  appEnv: import.meta.env.VITE_APP_ENV ?? (import.meta.env.PROD ? 'production' : 'development'),
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const

if (import.meta.env.PROD && env.enableMockApi) {
  console.warn(
    '[env] VITE_ENABLE_MOCK_API is enabled in a production build. Set it to false for Railway-backed deploys.',
  )
}

if (
  import.meta.env.PROD &&
  (!env.apiBaseUrl || env.apiBaseUrl === '/api' || env.apiBaseUrl.startsWith('/'))
) {
  console.warn(
    '[env] VITE_API_BASE_URL should be an absolute Railway API URL in production (e.g. https://….up.railway.app/api).',
  )
}
