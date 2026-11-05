import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text } from 'react-native'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { AnimatedListItem, AnimatedSearchBar } from '@/components/motion/surfaces'
import { Card, CardMeta, CardTitle } from '@/components/ui/card'
import { Screen } from '@/components/ui/screen'
import { StatusBadge } from '@/components/ui/status-badge'
import { useImportsList } from '@/features/imports/hooks/use-imports'
import { formatCurrency, formatDate } from '@/lib/format'
import { spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export default function ImportsListScreen() {
  const [search, setSearch] = useState('')
  const params = useMemo(() => ({ search: search.trim() || undefined }), [search])
  const { data, isLoading, isError, error, refetch, isRefetching } = useImportsList(params)
  const { colors, fonts } = useAppTheme()
  const items = data?.data ?? []

  return (
    <Screen style={styles.screen} edges={['left', 'right']}>
      <AnimatedSearchBar value={search} onChangeText={setSearch} placeholder="Reference or supplier" />
      {isLoading && !data ? <LoadingState /> : null}
      {isError ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      <FlatList
        style={styles.listView}
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch() }} tintColor={colors.teal} colors={[colors.teal]} />}
        contentContainerStyle={items.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={<EmptyState title="No shipments" description="Inbound shipments will appear here." />}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <Card onPress={() => router.push(`/imports/${item.id}`)}>
              <CardTitle>{item.reference}</CardTitle>
              <CardMeta>{item.supplierName}</CardMeta>
              <Text style={[styles.value, { color: colors.text, fontFamily: fonts.bodySemibold }]}>
                {formatCurrency(item.totalValue, item.currency)} · {item.itemCount} lines
              </Text>
              {item.expectedArrival ? <CardMeta>ETA {formatDate(item.expectedArrival)}</CardMeta> : null}
              <StatusBadge status={item.status} />
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
  value: { ...typography.body, fontVariant: ['tabular-nums'] },
})
