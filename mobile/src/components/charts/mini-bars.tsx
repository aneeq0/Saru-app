import { StyleSheet, Text, View } from 'react-native'
import { AnimatedProgressBar } from '@/components/motion/progress'
import { spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export function MiniBars({
  items,
}: {
  items: { id: string; label: string; value: number; formatted?: string; color?: string }[]
}) {
  const { colors, fonts } = useAppTheme()
  const max = Math.max(...items.map((item) => item.value), 0)
  if (max <= 0) return null

  return (
    <View style={styles.wrap}>
      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <View style={styles.meta}>
            <Text style={[styles.label, { color: colors.textSecondary, fontFamily: fonts.bodyMedium }]}>{item.label}</Text>
            <Text style={[styles.value, { color: colors.text, fontFamily: fonts.bodySemibold }]}>
              {item.formatted ?? String(item.value)}
            </Text>
          </View>
          <AnimatedProgressBar progress={item.value / max} color={item.color ?? colors.teal} />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { gap: 6 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  label: { ...typography.meta, flex: 1 },
  value: { ...typography.meta, fontVariant: ['tabular-nums'] },
})
