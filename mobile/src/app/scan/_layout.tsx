import { Stack } from 'expo-router'
import { useStackScreenOptions } from '@/components/navigation/stack-screen-options'

export default function ScanLayout() {
  const screenOptions = useStackScreenOptions()
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="camera" options={{ headerShown: false, animation: 'slide_from_bottom', animationDuration: 320 }} />
      <Stack.Screen name="result" options={{ title: 'Scan result' }} />
    </Stack>
  )
}
