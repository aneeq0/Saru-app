import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export function PageHeader({
  kicker,
  title,
  subtitle,
  right,
}: {
  kicker?: string
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  const { colors, fonts } = useAppTheme()
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {kicker ? (
          <Text style={[styles.kicker, { color: colors.teal, fontFamily: fonts.bodySemibold }]}>{kicker}</Text>
        ) : null}
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.displayBold }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: fonts.body }]}>{subtitle}</Text>
        ) : null}
      </View>
      {right}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  copy: { flex: 1, gap: 4 },
  kicker: { ...typography.label, letterSpacing: 0.6, textTransform: 'uppercase' },
  title: { ...typography.screenTitle },
  subtitle: { ...typography.body },
})
