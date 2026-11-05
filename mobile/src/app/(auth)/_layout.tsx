import { Stack } from 'expo-router'
import { useAppTheme } from '@/theme/theme-context'

export default function AuthLayout() {
  const { colors } = useAppTheme()
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
        animationDuration: 220,
      }}
    />
  )
}
