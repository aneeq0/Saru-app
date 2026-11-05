import type { ComponentProps } from 'react'
import { Stack } from 'expo-router'
import { colors, fontFamily } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export const moduleStackScreenOptions: NonNullable<ComponentProps<typeof Stack>['screenOptions']> = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.deepTeal,
  headerTitleStyle: { fontFamily: fontFamily.display, fontWeight: '600', fontSize: 17, color: colors.text },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
  animation: 'slide_from_right',
  animationDuration: 280,
}

export function useStackScreenOptions(): NonNullable<ComponentProps<typeof Stack>['screenOptions']> {
  const { colors: palette, fonts } = useAppTheme()
  return {
    headerStyle: { backgroundColor: palette.background },
    headerTintColor: palette.deepTeal,
    headerTitleStyle: {
      fontFamily: fonts.display,
      fontWeight: '600',
      fontSize: 17,
      color: palette.text,
    },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal',
    contentStyle: { backgroundColor: palette.background },
    animation: 'slide_from_right',
    animationDuration: 280,
  }
}
