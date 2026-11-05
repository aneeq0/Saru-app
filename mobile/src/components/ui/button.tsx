import type { StyleProp, ViewStyle } from 'react-native'
import { AnimatedPrimaryButton, AnimatedSecondaryButton } from '@/components/motion/buttons'

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'

interface AppButtonProps {
  title: string
  variant?: Variant
  loading?: boolean
  disabled?: boolean
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}

export function AppButton({ variant = 'primary', ...props }: AppButtonProps) {
  if (variant === 'primary' || variant === 'danger') {
    return <AnimatedPrimaryButton {...props} tone={variant === 'danger' ? 'danger' : 'primary'} />
  }
  return <AnimatedSecondaryButton {...props} variant={variant} />
}
