import { Stack } from 'expo-router'
import { useStackScreenOptions } from '@/components/navigation/stack-screen-options'

export default function PaymentsLayout() {
  const screenOptions = useStackScreenOptions()
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: 'Payments' }} />
    </Stack>
  )
}
