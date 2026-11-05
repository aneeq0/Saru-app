import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import type { SessionInfo } from '@/types/auth'

const SESSION_KEY = 'saru.session.v1'

function readWebSession(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(SESSION_KEY)
}

export async function saveSession(session: SessionInfo): Promise<void> {
  const raw = JSON.stringify(session)
  if (Platform.OS === 'web') {
    localStorage.setItem(SESSION_KEY, raw)
    return
  }
  await SecureStore.setItemAsync(SESSION_KEY, raw)
}

export async function loadSession(): Promise<SessionInfo | null> {
  const raw = Platform.OS === 'web' ? readWebSession() : await SecureStore.getItemAsync(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionInfo
  } catch {
    await clearSession()
    return null
  }
}

export async function clearSession(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(SESSION_KEY)
    return
  }
  await SecureStore.deleteItemAsync(SESSION_KEY)
}
