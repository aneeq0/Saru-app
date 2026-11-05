import * as ImagePicker from 'expo-image-picker'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Platform } from 'react-native'
import {
  clearProfileAvatarUri,
  getProfileAvatarUri,
  saveProfileAvatarUri,
} from '@/features/profile/avatar-storage'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { saveSession } from '@/services/auth/secure-session'

export function useProfileAvatar(userId?: string) {
  const sessionAvatar = useAuthStore((s) => (s.user && s.user.id === userId ? s.user.avatarUrl : null))
  const [localUri, setLocalUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(Boolean(userId))
  const [busy, setBusy] = useState(false)
  const setSession = useAuthStore((s) => s.setSession)
  const uri = localUri ?? sessionAvatar ?? null

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!userId) {
        setLocalUri(null)
        setLoading(false)
        return
      }
      setLoading(true)
      const stored = await getProfileAvatarUri(userId)
      if (!cancelled) {
        setLocalUri(stored)
        setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [userId])

  const syncSessionAvatar = useCallback(
    async (nextUri: string | null) => {
      const state = useAuthStore.getState()
      if (!state.user || !state.organization || !state.expiresAt) return
      const session = {
        user: { ...state.user, avatarUrl: nextUri },
        organization: state.organization,
        expiresAt: state.expiresAt,
        accessToken: state.accessToken ?? undefined,
      }
      setSession(session)
      await saveSession(session)
    },
    [setSession],
  )

  const applyUri = useCallback(
    async (nextUri: string | null) => {
      if (!userId) return
      setBusy(true)
      try {
        if (nextUri) {
          const saved = await saveProfileAvatarUri(userId, nextUri)
          setLocalUri(saved)
          await syncSessionAvatar(saved)
        } else {
          await clearProfileAvatarUri(userId)
          setLocalUri(null)
          await syncSessionAvatar(null)
        }
      } finally {
        setBusy(false)
      }
    },
    [syncSessionAvatar, userId],
  )

  const pickFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access to set your profile picture.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    })
    if (!result.canceled && result.assets[0]?.uri) {
      await applyUri(result.assets[0].uri)
    }
  }, [applyUri])

  const takePhoto = useCallback(async () => {
    if (Platform.OS === 'web') {
      await pickFromLibrary()
      return
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Allow camera access to take a profile picture.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    })
    if (!result.canceled && result.assets[0]?.uri) {
      await applyUri(result.assets[0].uri)
    }
  }, [applyUri, pickFromLibrary])

  const removePhoto = useCallback(async () => {
    await applyUri(null)
  }, [applyUri])

  return {
    uri,
    loading,
    busy,
    pickFromLibrary,
    takePhoto,
    removePhoto,
    hasPhoto: Boolean(uri),
  }
}
