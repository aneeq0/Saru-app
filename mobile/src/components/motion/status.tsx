import { useEffect, type ReactNode } from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { AnimatedSecondaryButton } from '@/components/motion/buttons'
import { humanize } from '@/lib/format'
import { motion } from '@/theme/motion'
import { radii, spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'
import { useReducedMotion } from '@/theme/use-reduced-motion'

const SUCCESS = new Set([
  'active',
  'awarded',
  'issued',
  'paid',
  'approved',
  'delivered',
  'done',
  'valid',
  'received',
  'acknowledged',
  'allocated',
  'released',
  'completed',
])
const WARNING = new Set([
  'pending',
  'expiring',
  'partially_received',
  'partially_paid',
  'partially_awarded',
  'partially_rejected',
  'release_requested',
  'pending_approval',
  'pending_review',
  'discrepancy',
  'quarantined',
])
const DANGER = new Set(['expired', 'rejected', 'cancelled', 'reversed', 'encashed', 'returned'])
const INFO = new Set([
  'preparing',
  'in_transit',
  'scheduled',
  'open',
  'in_progress',
  'ordered',
  'arrived',
  'identified',
  'under_review',
  'submitted',
  'prepared',
  'draft',
])
const TEAL = new Set(['dispatched'])

export function toneForStatus(status: string): 'success' | 'warning' | 'danger' | 'info' | 'teal' | 'neutral' {
  if (SUCCESS.has(status)) return 'success'
  if (WARNING.has(status)) return 'warning'
  if (DANGER.has(status)) return 'danger'
  if (TEAL.has(status)) return 'teal'
  if (INFO.has(status)) return 'info'
  return 'neutral'
}

export function AnimatedStatusBadge({ status, style }: { status: string; style?: StyleProp<ViewStyle> }) {
  const { colors, fonts } = useAppTheme()
  const reduced = useReducedMotion()
  const tone = toneForStatus(status)
  const palette = {
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    info: { bg: colors.infoSoft, fg: colors.info },
    teal: { bg: colors.tealHighlight, fg: colors.deepTeal },
    neutral: { bg: colors.muted, fg: colors.textSecondary },
  }[tone]
  const opacity = useSharedValue(reduced ? 1 : 0.4)

  useEffect(() => {
    opacity.value = withTiming(1, { duration: reduced ? 0 : motion.status })
  }, [opacity, reduced, status])

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      accessibilityLabel={`Status ${humanize(status)}`}
      style={[styles.badge, { backgroundColor: palette.bg }, animated, style]}
    >
      <View style={[styles.dot, { backgroundColor: palette.fg }]} />
      <Text style={[styles.text, { color: palette.fg, fontFamily: fonts.bodySemibold }]}>{humanize(status)}</Text>
    </Animated.View>
  )
}

export function AnimatedEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}) {
  const { colors, fonts } = useAppTheme()
  const reduced = useReducedMotion()
  return (
    <Animated.View entering={reduced ? undefined : FadeIn.duration(motion.cardEnter)} style={styles.empty}>
      {icon}
      <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: fonts.display }]}>{title}</Text>
      {description ? (
        <Text style={[styles.emptyBody, { color: colors.textSecondary, fontFamily: fonts.body }]}>{description}</Text>
      ) : null}
      {actionLabel && onAction ? <AnimatedSecondaryButton title={actionLabel} onPress={onAction} /> : null}
    </Animated.View>
  )
}

export function AnimatedSuccessState({ title, description }: { title: string; description?: string }) {
  const { colors, fonts } = useAppTheme()
  const reduced = useReducedMotion()
  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn.duration(motion.status)}
      style={[styles.success, { backgroundColor: colors.successSoft, borderColor: colors.success }]}
    >
      <Text style={[styles.emptyTitle, { color: colors.success, fontFamily: fonts.display }]}>{title}</Text>
      {description ? (
        <Text style={[styles.emptyBody, { color: colors.text, fontFamily: fonts.body }]}>{description}</Text>
      ) : null}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { ...typography.meta },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.sectionTitle, textAlign: 'center' },
  emptyBody: { ...typography.body, textAlign: 'center' },
  success: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xxs,
  },
})
