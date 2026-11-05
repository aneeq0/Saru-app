function readBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback
  return value === 'true' || value === '1'
}

/** Mock API only in local Vite DEV unless explicitly overridden. */
const defaultEnableMockApi = import.meta.env.DEV

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL as string | undefined,
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
