import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system/legacy'
import { Platform } from 'react-native'

const STORAGE_KEY = 'saru.profile.avatars.v1'

type AvatarMap = Record<string, string>

async function readMap(): Promise<AvatarMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as AvatarMap
  } catch {
    return {}
  }
}

async function writeMap(map: AvatarMap): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

async function persistLocalCopy(userId: string, sourceUri: string): Promise<string> {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return sourceUri
  }
  const extension = sourceUri.split('?')[0]?.split('.').pop()?.toLowerCase()
  const safeExt = extension && extension.length <= 4 ? extension : 'jpg'
  const destination = `${FileSystem.documentDirectory}avatars/${userId}.${safeExt}`
  await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}avatars`, { intermediates: true }).catch(
    () => undefined,
  )
  await FileSystem.copyAsync({ from: sourceUri, to: destination })
  return destination
}

export async function getProfileAvatarUri(userId: string): Promise<string | null> {
  const map = await readMap()
  return map[userId] ?? null
}

export async function saveProfileAvatarUri(userId: string, sourceUri: string): Promise<string> {
  const uri = await persistLocalCopy(userId, sourceUri)
  const map = await readMap()
  map[userId] = uri
  await writeMap(map)
  return uri
}

export async function clearProfileAvatarUri(userId: string): Promise<void> {
  const map = await readMap()
  const existing = map[userId]
  delete map[userId]
  await writeMap(map)
  if (existing && Platform.OS !== 'web' && existing.startsWith(FileSystem.documentDirectory ?? '___')) {
    await FileSystem.deleteAsync(existing, { idempotent: true }).catch(() => undefined)
  }
}
