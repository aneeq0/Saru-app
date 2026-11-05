import { Stack } from 'expo-router'
import { useStackScreenOptions } from '@/components/navigation/stack-screen-options'

export default function InvoicesLayout() {
  const screenOptions = useStackScreenOptions()
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: 'Invoices' }} />
    </Stack>
  )
}
