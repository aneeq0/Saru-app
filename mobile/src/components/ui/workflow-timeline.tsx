import { StyleSheet, Text, View } from 'react-native'
import { AnimatedProgressBar } from '@/components/motion/progress'
import { spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export function WorkflowTimeline({ steps, current }: { steps: string[]; current: number }) {
  const { colors, fonts } = useAppTheme()
  const progress = steps.length <= 1 ? 1 : Math.max(0, current) / (steps.length - 1)

  return (
    <View style={styles.wrap}>
      <AnimatedProgressBar progress={progress} />
      <View style={styles.row}>
        {steps.map((step, index) => {
          const reached = index <= current
          return (
            <View key={step} style={styles.step}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: reached ? colors.teal : colors.border, borderColor: reached ? colors.teal : colors.border },
                ]}
              />
              <Text
                style={[
                  styles.label,
                  { color: reached ? colors.text : colors.mutedText, fontFamily: reached ? fonts.bodySemibold : fonts.body },
                ]}
              >
                {step}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xxs },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1 },
  label: { ...typography.meta, textAlign: 'center' },
})
