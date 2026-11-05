import { ActivityIndicator, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'
import { PressableScale } from '@/components/motion/pressable-scale'
import { radii, spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

type Tone = 'primary' | 'danger'

interface ButtonProps {
  title: string
  onPress?: () => void
  loading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}

export function AnimatedPrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  style,
  tone = 'primary',
  accessibilityLabel,
}: ButtonProps & { tone?: Tone }) {
  const { colors, fonts } = useAppTheme()
  const isDisabled = disabled || loading
  const background = tone === 'danger' ? colors.danger : colors.teal
  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={isDisabled}
      haptic
      onPress={onPress}
      style={[styles.base, { backgroundColor: background }, isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={[styles.label, { color: colors.white, fontFamily: fonts.bodySemibold }]}>{title}</Text>
      )}
    </PressableScale>
  )
}

type SecondaryVariant = 'secondary' | 'outline' | 'ghost'

export function AnimatedSecondaryButton({
  title,
  onPress,
  loading,
  disabled,
  style,
  variant = 'outline',
  accessibilityLabel,
}: ButtonProps & { variant?: SecondaryVariant }) {
  const { colors, fonts } = useAppTheme()
  const isDisabled = disabled || loading
  const background = variant === 'secondary' ? colors.navy : 'transparent'
  const borderColor = variant === 'outline' ? colors.border : 'transparent'
  const labelColor = variant === 'secondary' ? colors.white : variant === 'ghost' ? colors.teal : colors.text
  return (
    <PressableScale
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={isDisabled}
      haptic={variant !== 'ghost'}
      onPress={onPress}
      style={[
        styles.base,
        {
          backgroundColor: background,
          borderColor,
          borderWidth: variant === 'outline' ? 1 : 0,
        },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.white : colors.teal} />
      ) : (
        <Text style={[styles.label, { color: labelColor, fontFamily: fonts.bodySemibold }]}>{title}</Text>
      )}
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.button },
  disabled: { opacity: 0.5 },
})
