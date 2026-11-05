import { useEffect, useState, type ReactNode } from 'react'
import { Pressable, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { hapticLight } from '@/lib/haptics'
import { motion } from '@/theme/motion'
import { useReducedMotion } from '@/theme/use-reduced-motion'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface PressableScaleProps {
  children: ReactNode
  onPress?: () => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  haptic?: boolean
  accessibilityLabel?: string
  accessibilityRole?: 'button' | 'link'
}

export function PressableScale({
  children,
  onPress,
  disabled,
  style,
  haptic,
  accessibilityLabel,
  accessibilityRole = 'button',
}: PressableScaleProps) {
  const reduced = useReducedMotion()
  const scale = useSharedValue(1)
  const [pressed, setPressed] = useState(false)
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  useEffect(() => {
    const next = pressed && !disabled && !reduced ? 0.97 : 1
    scale.set(withTiming(next, { duration: motion.press }))
  }, [disabled, pressed, reduced, scale])

  return (
    <AnimatedPressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={() => {
        if (haptic) void hapticLight()
        onPress?.()
      }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  )
}
