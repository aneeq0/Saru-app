import { Bell, Package, Shield, Truck } from 'lucide-react-native'
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { AnimatedNotificationRow } from '@/components/motion/surfaces'
import { PageHeader } from '@/components/ui/page-header'
import { Screen } from '@/components/ui/screen'
import { useMarkNotificationRead, useNotificationsList } from '@/features/notifications/hooks/use-notifications'
import { formatRelative } from '@/lib/format'
import { notificationGroup, type NotificationGroup } from '@/lib/presentation'
import { hapticSelection } from '@/lib/haptics'
import { spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'
import type { AppNotification } from '@/types/entities'

function iconFor(category: string, color: string) {
  const value = category.toLowerCase()
  if (value.includes('deliver')) return <Truck size={16} color={color} />
  if (value.includes('stock') || value.includes('invent')) return <Package size={16} color={color} />
  if (value.includes('approv') || value.includes('tender')) return <Shield size={16} color={color} />
  return <Bell size={16} color={color} />
}

export default function AlertsScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useNotificationsList()
  const markRead = useMarkNotificationRead()
  const { colors, fonts } = useAppTheme()
  const items = data?.data ?? []
  const groups: NotificationGroup[] = ['Today', 'Yesterday', 'Earlier']
  const sections = groups
    .map((title) => ({
      title,
      data: items.filter((item) => notificationGroup(item.createdAt) === title),
    }))
    .filter((section) => section.data.length > 0)

  const mark = (item: AppNotification) => {
    if (item.read || markRead.isPending) return
    void hapticSelection()
    markRead.mutate(item.id)
  }

  return (
    <Screen style={styles.screen}>
      <PageHeader kicker="Inbox" title="Alerts" subtitle="Updates that need a look, grouped by day." />
      {isLoading ? <LoadingState /> : null}
      {isError ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {!isLoading && !isError ? (
        <SectionList
          style={styles.listView}
          sections={sections}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch() }} tintColor={colors.teal} colors={[colors.teal]} />}
          contentContainerStyle={sections.length === 0 ? styles.empty : styles.list}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={<EmptyState title="No alerts" description="Notifications will appear here." />}
          renderSectionHeader={({ section }) => (
            <Text style={[styles.section, { color: colors.textSecondary, fontFamily: fonts.bodySemibold }]}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <Swipeable
              enabled={!item.read}
              overshootRight={false}
              renderRightActions={() => (
                <View style={[styles.swipe, { backgroundColor: colors.teal }]}>
                  <Text style={[styles.swipeText, { color: colors.white, fontFamily: fonts.bodySemibold }]}>Read</Text>
                </View>
              )}
              onSwipeableOpen={() => mark(item)}
            >
              <AnimatedNotificationRow
                title={item.title}
                body={item.body}
                time={`${item.category} · ${formatRelative(item.createdAt)}`}
                unread={!item.read}
                icon={iconFor(item.category, colors.deepTeal)}
                onPress={() => mark(item)}
              />
            </Swipeable>
          )}
        />
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  listView: { flex: 1 },
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  empty: { flexGrow: 1 },
  section: { ...typography.label, marginTop: spacing.sm, letterSpacing: 0.4, textTransform: 'uppercase' },
  swipe: { width: 88, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs },
  swipeText: { ...typography.label },
})
