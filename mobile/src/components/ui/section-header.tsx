import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  const { colors, fonts } = useAppTheme()
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>{title}</Text>
      {action}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  title: { ...typography.sectionTitle },
})
