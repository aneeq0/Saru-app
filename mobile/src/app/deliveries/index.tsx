import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { AnimatedListItem, AnimatedSearchBar } from '@/components/motion/surfaces'
import { Card, CardMeta, CardTitle } from '@/components/ui/card'
import { Screen } from '@/components/ui/screen'
import { StatusBadge } from '@/components/ui/status-badge'
import { useDeliveriesList } from '@/features/deliveries/hooks/use-deliveries'
import { formatDate } from '@/lib/format'
import { spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export default function DeliveriesListScreen() {
  const [search, setSearch] = useState('')
  const params = useMemo(() => ({ search: search.trim() || undefined }), [search])
  const { data, isLoading, isError, error, refetch, isRefetching } = useDeliveriesList(params)
  const { colors, fonts } = useAppTheme()
  const items = data?.data ?? []

  return (
    <Screen style={styles.screen} edges={['left', 'right']}>
      <AnimatedSearchBar value={search} onChangeText={setSearch} placeholder="Delivery number or department" />
      {isLoading && !data ? <LoadingState /> : null}
      {isError ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      <FlatList
        style={styles.listView}
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch() }} tintColor={colors.teal} colors={[colors.teal]} />}
        contentContainerStyle={items.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={<EmptyState title="No deliveries assigned" description="Scheduled drops will appear here." />}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <Card onPress={() => router.push(`/deliveries/${item.id}`)}>
              <View style={styles.top}>
                <CardTitle>{item.deliveryNumber}</CardTitle>
                <StatusBadge status={item.status} />
              </View>
              <CardMeta>
                {item.departmentName} · {item.destination}
              </CardMeta>
              <Text style={[styles.meta, { color: colors.text, fontFamily: fonts.bodyMedium }]}>
                {formatDate(item.scheduledDate)} · {item.itemCount} items
              </Text>
              {item.assignedStaff ? <CardMeta>{item.assignedStaff}</CardMeta> : null}
            </Card>
          </AnimatedListItem>
        )}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  listView: { flex: 1 },
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  empty: { flexGrow: 1 },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  meta: { ...typography.label, fontVariant: ['tabular-nums'] },
})
