import { zodResolver } from '@hookform/resolvers/zod'
import { setStatusBarStyle } from 'expo-status-bar'
import { Link, Redirect, useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { z } from 'zod'
import { AppButton } from '@/components/ui/button'
import { TextField } from '@/components/ui/text-field'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { getUserFacingErrorMessage } from '@/services/api/errors'
import { radii, shadows, spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginScreen() {
  const { login, isLoggingIn, isAuthenticated } = useAuth()
  const { colors, fonts, mode } = useAppTheme()
  const insets = useSafeAreaInsets()
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'owner@saru.demo', password: 'Demo@1234' },
  })

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light')
      return () => setStatusBarStyle(mode === 'dark' ? 'light' : 'dark')
    }, [mode]),
  )

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values)
    } catch (error) {
      setError('root', { message: getUserFacingErrorMessage(error) })
    }
  })

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.deepNavy }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bounces={false}>
          <View style={[styles.hero, { paddingTop: insets.top + spacing.xxl }]}>
            <View style={[styles.rule, { backgroundColor: colors.gold }]} />
            <Text style={[styles.brand, { color: colors.heroText, fontFamily: fonts.displayBold }]}>Saru International</Text>
            <Text style={[styles.flow, { color: colors.gold, fontFamily: fonts.bodySemibold }]}>SARU FLOW</Text>
            <Text style={[styles.subtitle, { color: colors.heroMuted, fontFamily: fonts.body }]}>
              Tenders, inventory, and deliveries for the teams who keep supply moving.
            </Text>
          </View>
          <View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + spacing.lg }, shadows.float]}>
            <Text style={[styles.sheetTitle, { color: colors.text, fontFamily: fonts.display }]}>Sign in</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Email"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Password"
                  secureTextEntry
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />
            {errors.root?.message ? (
              <Text style={[styles.formError, { color: colors.danger, fontFamily: fonts.body }]}>{errors.root.message}</Text>
            ) : null}
            <AppButton title="Sign in" onPress={() => void onSubmit()} loading={isLoggingIn} />
            <Link href="/(auth)/forgot-password" style={[styles.link, { color: colors.teal, fontFamily: fonts.bodySemibold }]}>
              Forgot password?
            </Link>
            <View style={[styles.demo, { backgroundColor: colors.muted }]}>
              <Text style={[styles.demoTitle, { color: colors.text, fontFamily: fonts.bodySemibold }]}>Demo access</Text>
              <Text style={[styles.demoText, { color: colors.text, fontFamily: fonts.body }]}>owner@saru.demo / Demo@1234</Text>
              <Text style={[styles.demoHint, { color: colors.textSecondary, fontFamily: fonts.body }]}>
                Mock API is on, so field workflows use simulated records.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xs },
  rule: { width: 36, height: 3, borderRadius: 2, marginBottom: spacing.sm },
  brand: { ...typography.screenTitle },
  flow: { ...typography.label, letterSpacing: 1.4 },
  subtitle: { ...typography.body, marginTop: spacing.xs },
  sheet: {
    flexGrow: 1,
    marginTop: -spacing.md,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sheetTitle: { ...typography.sectionTitle },
  formError: { ...typography.meta },
  link: { ...typography.label, textAlign: 'center' },
  demo: { marginTop: spacing.sm, padding: spacing.md, borderRadius: radii.lg, gap: spacing.xxs },
  demoTitle: { ...typography.label },
  demoText: { ...typography.body },
  demoHint: { ...typography.meta },
})
