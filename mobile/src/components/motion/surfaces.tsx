import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Modal, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native'
import Animated, {
  FadeInDown,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AnimatedPrimaryButton, AnimatedSecondaryButton } from '@/components/motion/buttons'
import { PressableScale } from '@/components/motion/pressable-scale'
import { hapticWarning } from '@/lib/haptics'
import { motion, staggerDelay } from '@/theme/motion'
import { radii, shadows, spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'
import { useReducedMotion } from '@/theme/use-reduced-motion'

export function AnimatedSection({
  title,
  action,
  children,
  delay = 0,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  delay?: number
}) {
  const { colors, fonts } = useAppTheme()
  const reduced = useReducedMotion()
  return (
    <Animated.View entering={reduced ? undefined : FadeInDown.duration(motion.cardEnter).delay(delay)}>
      {title ? (
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.display }]}>{title}</Text>
          {action}
        </View>
      ) : null}
      <View style={styles.sectionBody}>{children}</View>
    </Animated.View>
  )
}

export function AnimatedListItem({ index = 0, children }: { index?: number; children: ReactNode }) {
  const reduced = useReducedMotion()
  const delay = staggerDelay(index)
  return (
    <Animated.View entering={reduced || index > motion.staggerCap ? undefined : FadeInDown.duration(motion.cardEnter).delay(delay)}>
      {children}
    </Animated.View>
  )
}

export function PressableScaleCard({
  children,
  onPress,
  style,
  disabled,
}: {
  children: ReactNode
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  disabled?: boolean
}) {
  const { colors } = useAppTheme()
  const cardStyle = [
    styles.card,
    { backgroundColor: colors.surface, borderColor: colors.border },
    shadows.card,
    style,
  ]
  if (!onPress) return <View style={cardStyle}>{children}</View>
  return (
    <PressableScale disabled={disabled} onPress={onPress} style={cardStyle}>
      {children}
    </PressableScale>
  )
}

export function AnimatedMetricCard({
  label,
  value,
  hint,
  icon,
  accent,
  index = 0,
  onPress,
  wide,
}: {
  label: string
  value: string
  hint?: string
  icon?: ReactNode
  accent?: string
  index?: number
  onPress?: () => void
  wide?: boolean
}) {
  const { colors, fonts } = useAppTheme()
  const reduced = useReducedMotion()
  return (
    <Animated.View
      style={wide ? styles.wide : styles.metricWrap}
      entering={reduced ? undefined : FadeInDown.duration(motion.cardEnter).delay(staggerDelay(index))}
    >
      <PressableScaleCard onPress={onPress} style={styles.metric}>
        <View style={styles.metricTop}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary, fontFamily: fonts.bodyMedium }]}>{label}</Text>
          {icon ? (
            <View style={[styles.iconBubble, { backgroundColor: accent ?? colors.tealHighlight }]}>{icon}</View>
          ) : null}
        </View>
        <Text style={[styles.metricValue, { color: colors.text, fontFamily: fonts.displayBold }]}>{value}</Text>
        {hint ? (
          <Text style={[styles.hint, { color: colors.mutedText, fontFamily: fonts.body }]}>{hint}</Text>
        ) : null}
      </PressableScaleCard>
    </Animated.View>
  )
}

export function AnimatedTaskCard({
  title,
  reference,
  due,
  status,
  tone = 'neutral',
  onPress,
  index = 0,
  action,
}: {
  title: string
  reference?: string
  due?: string
  status?: ReactNode
  tone?: 'neutral' | 'warning' | 'danger' | 'success' | 'info'
  onPress?: () => void
  index?: number
  action?: ReactNode
}) {
  const { colors, fonts } = useAppTheme()
  const rail = {
    neutral: colors.mutedText,
    warning: colors.warning,
    danger: colors.danger,
    success: colors.success,
    info: colors.info,
  }[tone]
  return (
    <AnimatedListItem index={index}>
      <PressableScaleCard onPress={onPress} style={styles.task}>
        <View style={[styles.rail, { backgroundColor: rail }]} />
        <View style={styles.taskBody}>
          <Text style={[styles.taskTitle, { color: colors.text, fontFamily: fonts.bodySemibold }]}>{title}</Text>
          {reference ? (
            <Text style={[styles.hint, { color: colors.textSecondary, fontFamily: fonts.body }]}>{reference}</Text>
          ) : null}
          <View style={styles.taskMeta}>
            {due ? <Text style={[styles.hint, { color: colors.mutedText, fontFamily: fonts.body }]}>{due}</Text> : null}
            {status}
          </View>
          {action}
        </View>
      </PressableScaleCard>
    </AnimatedListItem>
  )
}

export function AnimatedNotificationRow({
  title,
  body,
  time,
  unread,
  icon,
  onPress,
}: {
  title: string
  body: string
  time: string
  unread?: boolean
  icon?: ReactNode
  onPress?: () => void
}) {
  const { colors, fonts } = useAppTheme()
  return (
    <PressableScaleCard onPress={onPress} style={[styles.notice, unread && { backgroundColor: colors.tealHighlight }]}>
      <View style={[styles.noticeIcon, { backgroundColor: unread ? colors.surface : colors.muted }]}>{icon}</View>
      <View style={styles.noticeBody}>
        <View style={styles.noticeTitleRow}>
          <Text style={[styles.taskTitle, { color: colors.text, fontFamily: fonts.bodySemibold, flex: 1 }]}>{title}</Text>
          {unread ? <View style={[styles.unread, { backgroundColor: colors.teal }]} /> : null}
        </View>
        <Text style={[styles.body, { color: colors.textSecondary, fontFamily: fonts.body }]} numberOfLines={2}>
          {body}
        </Text>
        <Text style={[styles.hint, { color: colors.mutedText, fontFamily: fonts.body }]}>{time}</Text>
      </View>
    </PressableScaleCard>
  )
}

export function AnimatedSearchBar({
  value,
  onChangeText,
  placeholder = 'Search',
  onFocus,
  onBlur,
  ...props
}: TextInputProps & { value: string; onChangeText: (value: string) => void }) {
  const { colors, fonts } = useAppTheme()
  const reduced = useReducedMotion()
  const focus = useSharedValue(0)
  const [focused, setFocused] = useState(false)
  const idleBorder = colors.border
  const activeBorder = colors.teal
  const ring = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.value, [0, 1], [idleBorder, activeBorder]),
    transform: [{ scale: reduced ? 1 : 1 + focus.value * 0.005 }],
  }))

  useEffect(() => {
    focus.set(withTiming(focused ? 1 : 0, { duration: reduced ? 0 : motion.status }))
  }, [focus, focused, reduced])

  return (
    <Animated.View style={[styles.search, { backgroundColor: colors.surface }, ring]}>
      <TextInput
        {...props}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedText}
        onFocus={(event) => {
          setFocused(true)
          onFocus?.(event)
        }}
        onBlur={(event) => {
          setFocused(false)
          onBlur?.(event)
        }}
        style={[styles.searchInput, { color: colors.text, fontFamily: fonts.body }]}
        accessibilityLabel={typeof props.accessibilityLabel === 'string' ? props.accessibilityLabel : placeholder}
      />
    </Animated.View>
  )
}

export function AnimatedTabIndicator({ width, index }: { width: number; index: number }) {
  const { colors } = useAppTheme()
  const reduced = useReducedMotion()
  const x = useSharedValue(0)

  useEffect(() => {
    const next = index * width
    x.value = reduced ? next : withSpring(next, motion.spring)
  }, [index, reduced, width, x])

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.indicator, { width: Math.max(width - 12, 0), backgroundColor: colors.tealHighlight }, style]}
    />
  )
}

export function AnimatedBottomSheet({
  visible,
  onClose,
  title,
  children,
  dismissable = true,
}: {
  visible: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  dismissable?: boolean
}) {
  const { colors, fonts } = useAppTheme()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()
  const translate = useSharedValue(420)

  useEffect(() => {
    translate.value = visible
      ? reduced
        ? 0
        : withSpring(0, motion.springSoft)
      : withTiming(420, { duration: motion.sheet })
  }, [reduced, translate, visible])

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translate.value }] }))

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={dismissable ? onClose : undefined}>
      <View style={styles.sheetRoot}>
        <Pressable
          accessibilityLabel="Close sheet"
          style={[styles.backdrop, { backgroundColor: colors.overlay }]}
          onPress={dismissable ? onClose : undefined}
        />
        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, spacing.md) },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          {title ? (
            <Text style={[styles.sheetTitle, { color: colors.text, fontFamily: fonts.display }]}>{title}</Text>
          ) : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  )
}

export function AnimatedConfirmation({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  loading,
  onConfirm,
  onCancel,
}: {
  visible: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  tone?: 'primary' | 'danger'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const { colors, fonts } = useAppTheme()
  useEffect(() => {
    if (visible && tone === 'danger') void hapticWarning()
  }, [tone, visible])

  return (
    <AnimatedBottomSheet visible={visible} onClose={onCancel} title={title} dismissable={!loading}>
      <Text style={[styles.confirmMessage, { color: colors.textSecondary, fontFamily: fonts.body }]}>{message}</Text>
      <View style={styles.confirmActions}>
        <AnimatedSecondaryButton title={cancelLabel} onPress={onCancel} disabled={loading} style={styles.flex} />
        <AnimatedPrimaryButton
          title={confirmLabel}
          tone={tone}
          onPress={onConfirm}
          loading={loading}
          style={styles.flex}
        />
      </View>
    </AnimatedBottomSheet>
  )
}

type ToastTone = 'success' | 'danger' | 'info'

type ToastPayload = { title: string; message?: string; tone?: ToastTone }

const ToastContext = createContext<{ show: (toast: ToastPayload) => void } | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastPayload | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hide = useCallback(() => setToast(null), [])
  const show = useCallback((next: ToastPayload) => {
    if (timer.current) clearTimeout(timer.current)
    setToast(next)
    timer.current = setTimeout(() => setToast(null), 2800)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <AnimatedToast toast={toast} onHide={hide} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used within ToastProvider')
  return value
}

function AnimatedToast({ toast, onHide }: { toast: ToastPayload | null; onHide: () => void }) {
  const { colors, fonts } = useAppTheme()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()
  const y = useSharedValue(-120)
  const [shown, setShown] = useState<ToastPayload | null>(toast)
  if (toast && shown !== toast) {
    setShown(toast)
  }

  useEffect(() => {
    if (toast) {
      y.value = reduced ? 0 : withSpring(0, motion.spring)
      return
    }
    y.value = withTiming(-120, { duration: reduced ? 0 : motion.status }, (finished) => {
      if (finished) runOnJS(setShown)(null)
    })
  }, [reduced, toast, y])

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }))
  if (!shown) return null
  const toneColor = shown.tone === 'danger' ? colors.danger : shown.tone === 'info' ? colors.info : colors.teal

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.toastWrap, { top: insets.top + spacing.xs }, style]}
    >
      <Pressable
        accessibilityRole="alert"
        onPress={onHide}
        style={[styles.toast, { backgroundColor: colors.navy }, shadows.float]}
      >
        <View style={[styles.toastBar, { backgroundColor: toneColor }]} />
        <View style={styles.noticeBody}>
          <Text style={[styles.taskTitle, { color: colors.heroText, fontFamily: fonts.bodySemibold }]}>{shown.title}</Text>
          {shown.message ? (
            <Text style={[styles.hint, { color: colors.heroMuted, fontFamily: fonts.body }]}>{shown.message}</Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.sectionTitle },
  sectionBody: { gap: spacing.sm },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  metricWrap: { width: '48%' },
  wide: { width: '100%' },
  metric: { minHeight: 112, gap: spacing.xs },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  metricLabel: { ...typography.label, flex: 1 },
  metricValue: { ...typography.metric, fontVariant: ['tabular-nums'] },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { ...typography.meta },
  task: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  rail: { width: 3, borderRadius: radii.full },
  taskBody: { flex: 1, gap: 4 },
  taskTitle: { ...typography.cardTitle },
  taskMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  notice: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  noticeIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeBody: { flex: 1, gap: 2 },
  noticeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  unread: { width: 8, height: 8, borderRadius: 4 },
  body: { ...typography.body },
  search: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  searchInput: { ...typography.body, minHeight: 44 },
  indicator: {
    position: 'absolute',
    left: 6,
    top: 6,
    bottom: 6,
    borderRadius: radii.lg,
  },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill },
  sheet: {
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
    maxHeight: '86%',
  },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: radii.full, marginBottom: spacing.xs },
  sheetTitle: { ...typography.sectionTitle },
  confirmMessage: { ...typography.body },
  confirmActions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  toastWrap: { position: 'absolute', left: spacing.md, right: spacing.md },
  toast: { borderRadius: radii.lg, flexDirection: 'row', overflow: 'hidden', padding: spacing.md, gap: spacing.sm },
  toastBar: { width: 3, borderRadius: radii.full },
})
