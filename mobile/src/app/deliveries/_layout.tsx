import { Stack } from 'expo-router'
import { useStackScreenOptions } from '@/components/navigation/stack-screen-options'

export default function DeliveriesLayout() {
  const screenOptions = useStackScreenOptions()
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: 'Deliveries' }} />
      <Stack.Screen name="[id]" options={{ title: 'Delivery' }} />
    </Stack>
  )
}
