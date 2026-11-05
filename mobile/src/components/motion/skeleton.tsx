import { useEffect, type ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { radii, spacing } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'
import { useReducedMotion } from '@/theme/use-reduced-motion'

export function ShimmerPlaceholder({
  width = '100%',
  height = 14,
  radius = radii.sm,
  style,
}: {
  width?: number | `${number}%`
  height?: number
  radius?: number
  style?: StyleProp<ViewStyle>
}) {
  const { colors } = useAppTheme()
  const reduced = useReducedMotion()
  const travel = useSharedValue(-1)

  useEffect(() => {
    if (reduced) return
    travel.value = withRepeat(withTiming(1, { duration: 1200 }), -1, false)
    return () => cancelAnimation(travel)
  }, [reduced, travel])

  const shine = useAnimatedStyle(() => ({
    transform: [{ translateX: travel.value * 180 }],
    opacity: reduced ? 0 : 0.45,
  }))

  return (
    <View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.muted, overflow: 'hidden' },
        style,
      ]}
    >
      <Animated.View style={[styles.shine, { backgroundColor: colors.surface }, shine]} />
    </View>
  )
}

function Bone({ height = 14, width = '100%' as number | `${number}%` }: { height?: number; width?: number | `${number}%` }) {
  return <ShimmerPlaceholder height={height} width={width} />
}

export function SkeletonLoader({ variant = 'list' }: { variant?: 'list' | 'dashboard' | 'detail' }) {
  if (variant === 'dashboard') {
    return (
      <View style={styles.stack}>
        <ShimmerPlaceholder height={148} radius={radii.xl} />
        <View style={styles.grid}>
          <ShimmerPlaceholder height={108} radius={radii.lg} style={styles.half} />
          <ShimmerPlaceholder height={108} radius={radii.lg} style={styles.half} />
        </View>
        <ShimmerPlaceholder height={72} radius={radii.lg} />
        <ShimmerPlaceholder height={72} radius={radii.lg} />
      </View>
    )
  }

  if (variant === 'detail') {
    return (
      <View style={styles.stack}>
        <Bone height={28} width="72%" />
        <Bone height={18} width="40%" />
        <ShimmerPlaceholder height={96} radius={radii.lg} />
        <ShimmerPlaceholder height={96} radius={radii.lg} />
      </View>
    )
  }

  return (
    <View style={styles.stack}>
      {Array.from({ length: 5 }, (_, index) => (
        <ShimmerPlaceholder key={index} height={84} radius={radii.lg} />
      ))}
    </View>
  )
}

export function SkeletonBlock({ children }: { children?: ReactNode }) {
  return <View style={styles.stack}>{children}</View>
}

const styles = StyleSheet.create({
  shine: { position: 'absolute', top: 0, bottom: 0, width: 80 },
  stack: { gap: spacing.sm },
  grid: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
})
