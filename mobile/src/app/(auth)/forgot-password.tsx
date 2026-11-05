import { zodResolver } from '@hookform/resolvers/zod'
import { router } from 'expo-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { StyleSheet, Text } from 'react-native'
import { z } from 'zod'
import { AppButton } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { Screen } from '@/components/ui/screen'
import { TextField } from '@/components/ui/text-field'
import { useToast } from '@/components/motion/surfaces'
import { authApi } from '@/features/auth/api/auth-api'
import { getUserFacingErrorMessage } from '@/services/api/errors'
import { spacing } from '@/theme/tokens'

const schema = z.object({
  email: z.email('Enter a valid email'),
})

type ForgotForm = z.infer<typeof schema>

export default function ForgotPasswordScreen() {
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const onSubmit = handleSubmit(async ({ email }) => {
    setSubmitting(true)
    try {
      const result = await authApi.forgotPassword(email)
      toast.show({ title: 'Check your inbox', message: result.message, tone: 'success' })
      router.back()
    } catch (error) {
      toast.show({ title: 'Unable to send reset', message: getUserFacingErrorMessage(error), tone: 'danger' })
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <Screen scroll edges={['top', 'left', 'right', 'bottom']}>
      <PageHeader
        kicker="Account"
        title="Reset password"
        subtitle="Enter the email linked to your Saru account. Instructions are sent when the account exists."
      />
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.email?.message}
          />
        )}
      />
      <AppButton title="Send instructions" onPress={() => void onSubmit()} loading={submitting} />
      <AppButton title="Back to sign in" variant="ghost" onPress={() => router.back()} />
      <Text style={styles.spacer} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  spacer: { height: spacing.xl },
})
