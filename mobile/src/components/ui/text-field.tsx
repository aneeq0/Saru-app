import { useState } from 'react'
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import { radii, spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

interface TextFieldProps extends TextInputProps {
  label: string
  error?: string
}

export function TextField({ label, error, style, onFocus, onBlur, ...props }: TextFieldProps) {
  const { colors, fonts } = useAppTheme()
  const [focused, setFocused] = useState(false)
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.text, fontFamily: fonts.bodyMedium }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.mutedText}
        accessibilityLabel={label}
        onFocus={(event) => {
          setFocused(true)
          onFocus?.(event)
        }}
        onBlur={(event) => {
          setFocused(false)
          onBlur?.(event)
        }}
        style={[
          styles.input,
          {
            borderColor: error ? colors.danger : focused ? colors.teal : colors.border,
            backgroundColor: colors.surface,
            color: colors.text,
            fontFamily: fonts.body,
          },
          style,
        ]}
        {...props}
      />
      {error ? <Text style={[styles.error, { color: colors.danger, fontFamily: fonts.body }]}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xxs },
  label: { ...typography.label },
  input: {
    minHeight: 48,
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    fontSize: 15,
  },
  error: { ...typography.meta },
})
