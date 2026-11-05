import { ScrollView, StyleSheet, Text } from 'react-native'
import { PressableScale } from '@/components/motion/pressable-scale'
import { radii, spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export function FilterChips({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
}) {
  const { colors, fonts } = useAppTheme()
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => {
        const selected = option.id === value
        return (
          <PressableScale
            key={option.id}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.id)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? colors.teal : colors.surface,
                borderColor: selected ? colors.teal : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: selected ? colors.white : colors.text, fontFamily: fonts.bodyMedium },
              ]}
            >
              {option.label}
            </Text>
          </PressableScale>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroller: { flexGrow: 0, flexShrink: 0, maxHeight: 44 },
  row: { gap: spacing.xs, alignItems: 'center', paddingVertical: 2 },
  chip: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.label },
})
