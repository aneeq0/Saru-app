import { Redirect } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth()
  const { colors, fonts } = useAppTheme()

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.deepNavy }]}>
        <View style={[styles.rule, { backgroundColor: colors.gold }]} />
        <Text style={[styles.brand, { color: colors.heroText, fontFamily: fonts.displayBold }]}>Saru International</Text>
        <Text style={[styles.caption, { color: colors.heroMuted, fontFamily: fonts.body }]}>Preparing your workspace</Text>
      </View>
    )
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />
  }

  return <Redirect href="/(auth)/login" />
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg },
  rule: { width: 36, height: 3, borderRadius: 2, marginBottom: spacing.xs },
  brand: { ...typography.screenTitle, textAlign: 'center' },
  caption: { ...typography.body },
})
