import { Stack } from 'expo-router'
import { useStackScreenOptions } from '@/components/navigation/stack-screen-options'

export default function TendersLayout() {
  const screenOptions = useStackScreenOptions()
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: 'Tenders' }} />
      <Stack.Screen name="[id]" options={{ title: 'Tender' }} />
    </Stack>
  )
}
