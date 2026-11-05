import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

async function run(task: () => Promise<void>) {
  if (Platform.OS === 'web') return
  try {
    await task()
  } catch {
    // Haptics are optional feedback. A missing vibrator should not block the action.
  }
}

export function hapticLight() {
  return run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light))
}

export function hapticMedium() {
  return run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium))
}

export function hapticSelection() {
  return run(() => Haptics.selectionAsync())
}

export function hapticSuccess() {
  return run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success))
}

export function hapticWarning() {
  return run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning))
}
