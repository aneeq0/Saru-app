import { setStatusBarStyle } from 'expo-status-bar'
import { router, useFocusEffect } from 'expo-router'
import {
  Bell,
  Box,
  ChevronRight,
  FileText,
  Package,
  ScanLine,
  Shield,
  Ship,
  Truck,
  Wallet,
} from 'lucide-react-native'
import { useCallback, type ReactNode } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { PressableScale } from '@/components/motion/pressable-scale'
import { AnimatedTaskCard } from '@/components/motion/surfaces'
import { UserAvatar } from '@/components/ui/user-avatar'
import { formatDate } from '@/lib/format'
import { deadlineLabel, greeting, hrefForRecordType } from '@/lib/presentation'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useDashboard } from '@/features/dashboard/hooks/use-dashboard'
import { useNotificationsList } from '@/features/notifications/hooks/use-notifications'
import { useProfileAvatar } from '@/features/profile/use-profile-avatar'
import { radii, shadows, spacing, TAB_BAR_CLEARANCE, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'
import type { PermissionModule } from '@/types/permissions'
import type { DashboardKpi } from '@/types/entities'

type ModuleLink = {
  module: PermissionModule
  title: string
  href: string
  icon: (color: string) => ReactNode
}

const MODULE_LINKS: ModuleLink[] = [
  { module: 'products', title: 'Products', href: '/products', icon: (color) => <Package size={18} color={color} /> },
  { module: 'inventory', title: 'Inventory', href: '/inventory', icon: (color) => <Box size={18} color={color} /> },
  { module: 'imports', title: 'Shipments', href: '/imports', icon: (color) => <Ship size={18} color={color} /> },
  { module: 'tenders', title: 'Tenders', href: '/tenders', icon: (color) => <FileText size={18} color={color} /> },
  { module: 'contracts', title: 'Contracts', href: '/contracts', icon: (color) => <FileText size={18} color={color} /> },
  { module: 'securities', title: 'Securities', href: '/securities', icon: (color) => <Shield size={18} color={color} /> },
  { module: 'deliveries', title: 'Deliveries', href: '/deliveries', icon: (color) => <Truck size={18} color={color} /> },
  { module: 'invoices', title: 'Invoices', href: '/invoices', icon: (color) => <Wallet size={18} color={color} /> },
  { module: 'payments', title: 'Payments', href: '/payments', icon: (color) => <Wallet size={18} color={color} /> },
  { module: 'documents', title: 'Documents', href: '/documents', icon: (color) => <FileText size={18} color={color} /> },
  { module: 'approvals', title: 'Approvals', href: '/approvals', icon: (color) => <Shield size={18} color={color} /> },
]

const QUICK_ACTIONS: { module: PermissionModule; title: string; href: string; icon: (color: string) => ReactNode }[] = [
  { module: 'products', title: 'Scan', href: '/(tabs)/scan', icon: (color) => <ScanLine size={18} color={color} /> },
  { module: 'imports', title: 'Shipments', href: '/imports', icon: (color) => <Ship size={18} color={color} /> },
  { module: 'tenders', title: 'Tenders', href: '/tenders', icon: (color) => <FileText size={18} color={color} /> },
  { module: 'deliveries', title: 'Dispatch', href: '/deliveries', icon: (color) => <Truck size={18} color={color} /> },
  { module: 'approvals', title: 'Approvals', href: '/approvals', icon: (color) => <Shield size={18} color={color} /> },
  { module: 'documents', title: 'Documents', href: '/documents', icon: (color) => <FileText size={18} color={color} /> },
]

function kpiIcon(label: string, color: string) {
  const value = label.toLowerCase()
  if (value.includes('tender')) return <FileText size={16} color={color} />
  if (value.includes('deliver') || value.includes('dispatch')) return <Truck size={16} color={color} />
  if (value.includes('ship') || value.includes('receipt')) return <Ship size={16} color={color} />
  if (value.includes('stock') || value.includes('quarant')) return <Package size={16} color={color} />
  if (value.includes('invoice') || value.includes('balance') || value.includes('payment')) return <Wallet size={16} color={color} />
  return <Shield size={16} color={color} />
}

export default function HomeScreen() {
  const { user, organization, canViewModule } = useAuth()
  const dashboard = useDashboard()
  const notifications = useNotificationsList()
  const avatar = useProfileAvatar(user?.id)
  const { colors, fonts, mode } = useAppTheme()
  const insets = useSafeAreaInsets()
  const unread = notifications.data?.data.filter((item) => !item.read).length ?? 0
  const visibleModules = MODULE_LINKS.filter((item) => canViewModule(item.module))
  const quickActions = QUICK_ACTIONS.filter((item) => item.href === '/(tabs)/scan' || canViewModule(item.module))
  const kpis = dashboard.data?.kpis ?? []
  const attention = dashboard.data?.attentionItems ?? []
  const upcoming = dashboard.data?.upcomingDeadlines ?? []

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light')
      return () => setStatusBarStyle(mode === 'dark' ? 'light' : 'dark')
    }, [mode]),
  )

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.deepNavy, paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.topRow}>
          <View style={styles.topCopy}>
            <Text style={[styles.brand, { color: colors.gold, fontFamily: fonts.bodySemibold }]}>SARU INTERNATIONAL</Text>
            <Text style={[styles.hello, { color: colors.heroText, fontFamily: fonts.displayBold }]} numberOfLines={2}>
              {greeting()}, {user?.firstName ?? 'there'}
            </Text>
            <Text style={[styles.role, { color: colors.heroMuted, fontFamily: fonts.body }]} numberOfLines={1}>
              {user?.roleLabel ?? 'Team member'} · {organization?.shortName ?? 'Saru'}
            </Text>
          </View>
          <View style={styles.topActions}>
            <Pressable
              accessibilityLabel={unread ? `${unread} unread alerts` : 'Alerts'}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => router.push('/(tabs)/alerts')}
              style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)' }]}
            >
              <Bell color={colors.heroText} size={18} />
              {unread > 0 ? (
                <View style={[styles.badge, { backgroundColor: colors.teal }]}>
                  <Text style={[styles.badgeText, { color: colors.white, fontFamily: fonts.bodySemibold }]}>
                    {unread > 9 ? '9+' : unread}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable accessibilityLabel="Open profile" onPress={() => router.push('/(tabs)/profile')}>
              <UserAvatar name={user?.displayName} uri={avatar.uri} size={40} />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={dashboard.isRefetching}
            onRefresh={() => {
              void dashboard.refetch()
              void notifications.refetch()
            }}
            tintColor={colors.teal}
            colors={[colors.teal]}
          />
        }
      >
        {dashboard.isLoading ? <LoadingState variant="dashboard" /> : null}
        {dashboard.isError ? <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} /> : null}

        {kpis.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.display }]}>Overview</Text>
            <View style={styles.kpiGrid}>
              {kpis.slice(0, 4).map((kpi) => (
                <KpiTile key={kpi.id} kpi={kpi} onPress={() => router.push(hrefForRecordType(kpi.label) as never)} />
              ))}
            </View>
          </View>
        ) : null}

        {quickActions.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.display }]}>Quick actions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionRow}>
              {quickActions.map((action) => (
                <PressableScale
                  key={action.href + action.title}
                  onPress={() => router.push(action.href as never)}
                  style={[styles.actionChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  accessibilityLabel={action.title}
                >
                  <View style={[styles.actionIcon, { backgroundColor: colors.tealHighlight }]}>
                    {action.icon(colors.deepTeal)}
                  </View>
                  <Text style={[styles.actionLabel, { color: colors.text, fontFamily: fonts.bodySemibold }]}>
                    {action.title}
                  </Text>
                </PressableScale>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {attention.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.display }]}>Needs attention</Text>
            <View style={styles.stack}>
              {attention.map((item, index) => {
                const due = deadlineLabel(item.dueDate)
                return (
                  <AnimatedTaskCard
                    key={item.id}
                    index={index}
                    title={item.title}
                    reference={`${item.type} · ${item.reference}`}
                    due={due ? `${due.text} · ${formatDate(item.dueDate)}` : formatDate(item.dueDate)}
                    tone={due?.tone ?? 'neutral'}
                    onPress={() => router.push(hrefForRecordType(item.type) as never)}
                  />
                )
              })}
            </View>
          </View>
        ) : null}

        {upcoming.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.display }]}>Upcoming</Text>
            <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.soft]}>
              {upcoming.map((item, index) => {
                const due = deadlineLabel(item.dueDate)
                const toneColor =
                  due?.tone === 'danger' ? colors.danger : due?.tone === 'warning' ? colors.warning : colors.deepTeal
                return (
                  <View key={item.id}>
                    {index > 0 ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => router.push(hrefForRecordType(item.type) as never)}
                      style={styles.upcomingRow}
                    >
                      <View style={[styles.upcomingDot, { backgroundColor: toneColor }]} />
                      <View style={styles.upcomingCopy}>
                        <Text style={[styles.upcomingTitle, { color: colors.text, fontFamily: fonts.bodySemibold }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={[styles.upcomingMeta, { color: colors.textSecondary, fontFamily: fonts.body }]} numberOfLines={1}>
                          {item.type} · {item.reference}
                        </Text>
                      </View>
                      <Text style={[styles.upcomingDue, { color: toneColor, fontFamily: fonts.bodySemibold }]}>
                        {due?.text ?? formatDate(item.dueDate)}
                      </Text>
                    </Pressable>
                  </View>
                )
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.display }]}>Workspace</Text>
          <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.soft]}>
            {visibleModules.map((item, index) => (
              <View key={item.href}>
                {index > 0 ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
                <PressableScale
                  accessibilityLabel={item.title}
                  onPress={() => router.push(item.href as never)}
                  style={styles.moduleRow}
                >
                  <View style={[styles.moduleIcon, { backgroundColor: colors.tealHighlight }]}>
                    {item.icon(colors.deepTeal)}
                  </View>
                  <Text style={[styles.moduleTitle, { color: colors.text, fontFamily: fonts.bodySemibold }]}>{item.title}</Text>
                  <ChevronRight size={18} color={colors.mutedText} />
                </PressableScale>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

function KpiTile({ kpi, onPress }: { kpi: DashboardKpi; onPress: () => void }) {
  const { colors, fonts } = useAppTheme()
  return (
    <PressableScale
      onPress={onPress}
      style={[styles.kpi, { backgroundColor: colors.surface, borderColor: colors.border }, shadows.soft]}
    >
      <View style={styles.kpiTop}>
        <Text style={[styles.kpiLabel, { color: colors.textSecondary, fontFamily: fonts.bodyMedium }]} numberOfLines={2}>
          {kpi.label}
        </Text>
        <View style={[styles.kpiIcon, { backgroundColor: colors.tealHighlight }]}>
          {kpiIcon(kpi.label, colors.deepTeal)}
        </View>
      </View>
      <Text style={[styles.kpiValue, { color: colors.text, fontFamily: fonts.displayBold }]}>{kpi.formattedValue}</Text>
      {kpi.hint ? (
        <Text style={[styles.kpiHint, { color: colors.mutedText, fontFamily: fonts.body }]} numberOfLines={1}>
          {kpi.hint}
        </Text>
      ) : null}
    </PressableScale>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  topCopy: { flex: 1, gap: 2, minWidth: 0 },
  brand: { ...typography.meta, letterSpacing: 1.1, marginBottom: 4 },
  hello: { fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  role: { ...typography.meta },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10 },
  scrollView: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: TAB_BAR_CLEARANCE,
    gap: spacing.lg,
  },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.sectionTitle },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
  },
  kpi: {
    width: '48%',
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 6,
    minHeight: 104,
  },
  kpiTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs, alignItems: 'flex-start' },
  kpiLabel: { ...typography.meta, flex: 1 },
  kpiIcon: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: { fontSize: 26, lineHeight: 30, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  kpiHint: { ...typography.meta },
  actionRow: { gap: spacing.sm, paddingRight: spacing.sm },
  actionChip: {
    width: 108,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { ...typography.label },
  stack: { gap: spacing.sm },
  listCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: spacing.md },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  upcomingDot: { width: 8, height: 8, borderRadius: 4 },
  upcomingCopy: { flex: 1, gap: 2, minWidth: 0 },
  upcomingTitle: { ...typography.cardTitle },
  upcomingMeta: { ...typography.meta },
  upcomingDue: { ...typography.meta, fontVariant: ['tabular-nums'] },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 56,
  },
  moduleIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTitle: { ...typography.cardTitle, flex: 1 },
})
