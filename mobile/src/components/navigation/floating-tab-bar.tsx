import { Bell, ClipboardList, Home, ScanLine, User } from 'lucide-react-native'
import { useEffect, useState, type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AnimatedTabIndicator } from '@/components/motion/surfaces'
import { motion } from '@/theme/motion'
import { radii, shadows, spacing } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'
import { useReducedMotion } from '@/theme/use-reduced-motion'

const ICONS = {
  index: Home,
  tasks: ClipboardList,
  scan: ScanLine,
  alerts: Bell,
  profile: User,
} as const

type TabRoute = { key: string; name: string }

type FloatingTabBarProps = {
  state: { index: number; routes: TabRoute[] }
  descriptors: Record<string, { options: { title?: string } }>
  onPress: (route: TabRoute, index: number) => void
  onLongPress: (route: TabRoute) => void
}

export function FloatingTabBar({ state, descriptors, onPress, onLongPress }: FloatingTabBarProps) {
  const { colors, fonts } = useAppTheme()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()
  const [width, setWidth] = useState(0)
  const tabWidth = state.routes.length > 0 ? width / state.routes.length : 0

  return (
    <View style={[styles.host, { paddingBottom: Math.max(insets.bottom, spacing.xs) }]} pointerEvents="box-none">
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.float]}
      >
        {tabWidth > 0 ? <AnimatedTabIndicator index={state.index} width={tabWidth} /> : null}
        {state.routes.map((route, index) => {
          const focused = state.index === index
          const { options } = descriptors[route.key]
          const label = options.title ?? route.name
          const Icon = ICONS[route.name as keyof typeof ICONS] ?? Home
          const isScan = route.name === 'scan'
          return (
            <TabButton
              key={route.key}
              label={label}
              focused={focused}
              reduced={reduced}
              isScan={isScan}
              color={focused ? colors.deepTeal : colors.mutedText}
              labelColor={focused ? colors.deepTeal : colors.mutedText}
              scanBackground={colors.teal}
              fontFamily={fonts.bodySemibold}
              onPress={() => onPress(route, index)}
              onLongPress={() => onLongPress(route)}
              icon={<Icon color={isScan ? colors.white : focused ? colors.deepTeal : colors.mutedText} size={isScan ? 20 : 22} strokeWidth={focused ? 2.4 : 2} />}
            />
          )
        })}
      </View>
    </View>
  )
}

function TabButton({
  label,
  focused,
  reduced,
  isScan,
  color,
  labelColor,
  scanBackground,
  fontFamily,
  onPress,
  onLongPress,
  icon,
}: {
  label: string
  focused: boolean
  reduced: boolean
  isScan: boolean
  color: string
  labelColor: string
  scanBackground: string
  fontFamily?: string
  onPress: () => void
  onLongPress: () => void
  icon: ReactNode
}) {
  const scale = useSharedValue(focused ? 1 : 0.96)
  useEffect(() => {
    scale.value = withTiming(focused ? 1 : 0.96, { duration: reduced ? 0 : motion.tab })
  }, [focused, reduced, scale])
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tab}
      hitSlop={8}
    >
      <Animated.View style={[styles.tabInner, animated]}>
        {isScan ? <View style={[styles.scan, { backgroundColor: scanBackground }, shadows.soft]}>{icon}</View> : icon}
        <Text style={[styles.label, { color: isScan ? color : labelColor, fontFamily }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  host: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  bar: {
    height: 68,
    borderRadius: radii.xxl,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  tabInner: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  scan: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 11, lineHeight: 14 },
})
