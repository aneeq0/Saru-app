import { Stack } from 'expo-router'
import { useStackScreenOptions } from '@/components/navigation/stack-screen-options'

export default function ImportsLayout() {
  const screenOptions = useStackScreenOptions()
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: 'Imports' }} />
      <Stack.Screen name="[id]" options={{ title: 'Shipment' }} />
    </Stack>
  )
}
