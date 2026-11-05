import { useEffect, useState } from 'react'
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { motion } from '@/theme/motion'
import { useAppTheme } from '@/theme/theme-context'
import { useReducedMotion } from '@/theme/use-reduced-motion'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

function clamp(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function AnimatedProgressBar({
  progress,
  color,
  trackColor,
  height = 6,
  style,
}: {
  progress: number
  color?: string
  trackColor?: string
  height?: number
  style?: StyleProp<ViewStyle>
}) {
  const { colors } = useAppTheme()
  const reduced = useReducedMotion()
  const width = useSharedValue(reduced ? clamp(progress) : 0)

  useEffect(() => {
    width.value = withTiming(clamp(progress), {
      duration: reduced ? 0 : motion.progress,
      easing: Easing.out(Easing.cubic),
    })
  }, [progress, reduced, width])

  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }))

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamp(progress) * 100) }}
      style={[styles.track, { height, backgroundColor: trackColor ?? colors.muted, borderRadius: height }, style]}
    >
      <Animated.View
        style={[
          styles.fill,
          fillStyle,
          { backgroundColor: color ?? colors.teal, borderRadius: height },
        ]}
      />
    </View>
  )
}

export function AnimatedProgressRing({
  progress,
  size = 72,
  stroke = 7,
  color,
  label,
}: {
  progress: number
  size?: number
  stroke?: number
  color?: string
  label?: string
}) {
  const { colors, fonts } = useAppTheme()
  const reduced = useReducedMotion()
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = useSharedValue(circumference)

  useEffect(() => {
    const next = circumference * (1 - clamp(progress))
    offset.value = withTiming(next, { duration: reduced ? 0 : motion.progress, easing: Easing.out(Easing.cubic) })
  }, [circumference, offset, progress, reduced])

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }))
  const ringColor = color ?? colors.teal

  return (
    <View style={{ width: size, height: size }} accessibilityRole="image" accessibilityLabel={label}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.muted}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {label ? (
        <View style={styles.ringLabel}>
          <Text style={[styles.ringText, { color: colors.text, fontFamily: fonts.bodySemibold }]}>{label}</Text>
        </View>
      ) : null}
    </View>
  )
}

export function AnimatedCounter({
  value,
  format,
  style,
}: {
  value: number
  format?: (value: number) => string
  style?: StyleProp<TextStyle>
}) {
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(reduced ? value : 0)
  const shared = useSharedValue(reduced ? value : 0)

  useEffect(() => {
    shared.value = withTiming(value, { duration: reduced ? 0 : motion.progress, easing: Easing.out(Easing.cubic) })
  }, [reduced, shared, value])

  useAnimatedReaction(
    () => Math.round(shared.value),
    (current, previous) => {
      if (current !== previous) runOnJS(setDisplay)(current)
    },
    [shared],
  )

  const text = format ? format(display) : String(display)
  return (
    <Text style={style} accessibilityLabel={format ? format(value) : String(value)}>
      {text}
    </Text>
  )
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
  ringLabel: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  ringText: { fontSize: 13, fontVariant: ['tabular-nums'] },
})
