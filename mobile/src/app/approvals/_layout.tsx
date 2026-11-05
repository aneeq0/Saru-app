import { Stack } from 'expo-router'
import { useStackScreenOptions } from '@/components/navigation/stack-screen-options'

export default function ApprovalsLayout() {
  const screenOptions = useStackScreenOptions()
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: 'Approvals' }} />
    </Stack>
  )
}
