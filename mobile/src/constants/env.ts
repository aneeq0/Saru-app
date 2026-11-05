import Constants from 'expo-constants'

type Extra = {
  apiBaseUrl?: string
  enableMockApi?: boolean | string
  appName?: string
  apiVersion?: string
}

const extra = (Constants.expoConfig?.extra ?? {}) as Extra

function readBool(value: boolean | string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback
  if (typeof value === 'boolean') return value
  return value === 'true' || value === '1'
}

export const env = {
  apiBaseUrl: extra.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api',
  socketUrl:
    (extra as Extra & { socketUrl?: string }).socketUrl ??
    process.env.EXPO_PUBLIC_SOCKET_URL,
  enableMockApi: readBool(
    extra.enableMockApi ?? process.env.EXPO_PUBLIC_ENABLE_MOCK_API,
    true,
  ),
  appName: extra.appName ?? 'Saru International',
  apiVersion: extra.apiVersion ?? 'v1',
} as const
