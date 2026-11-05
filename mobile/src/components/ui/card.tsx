import type { ReactNode } from 'react'
import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'
import { PressableScaleCard } from '@/components/motion/surfaces'
import { typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

interface CardProps {
  children: ReactNode
  onPress?: () => void
  style?: StyleProp<ViewStyle>
}

export function Card({ children, onPress, style }: CardProps) {
  return (
    <PressableScaleCard onPress={onPress} style={style}>
      {children}
    </PressableScaleCard>
  )
}

export function CardTitle({ children }: { children: ReactNode }) {
  const { colors, fonts } = useAppTheme()
  return <Text style={[styles.title, { color: colors.text, fontFamily: fonts.bodySemibold }]}>{children}</Text>
}

export function CardMeta({ children }: { children: ReactNode }) {
  const { colors, fonts } = useAppTheme()
  return <Text style={[styles.meta, { color: colors.textSecondary, fontFamily: fonts.body }]}>{children}</Text>
}

const styles = StyleSheet.create({
  title: { ...typography.cardTitle },
  meta: { ...typography.meta },
})
