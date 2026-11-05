import { StyleSheet, Text, View } from 'react-native'
import { AlertTriangle } from 'lucide-react-native'
import { AppButton } from '@/components/ui/button'
import { getUserFacingErrorMessage } from '@/services/api/errors'
import { spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

interface ErrorStateProps {
  error?: unknown
  onRetry?: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const { colors, fonts } = useAppTheme()
  return (
    <View style={styles.wrap}>
      <AlertTriangle color={colors.danger} size={28} />
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>Unable to load</Text>
      <Text style={[styles.description, { color: colors.textSecondary, fontFamily: fonts.body }]}>
        {getUserFacingErrorMessage(error)}
      </Text>
      {onRetry ? <AppButton title="Try again" variant="outline" onPress={onRetry} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.xs,
  },
  title: { ...typography.cardTitle },
  description: { ...typography.body, textAlign: 'center' },
})
