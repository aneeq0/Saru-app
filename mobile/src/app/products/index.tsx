import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { Package } from 'lucide-react-native'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { AnimatedListItem, AnimatedSearchBar } from '@/components/motion/surfaces'
import { Card, CardMeta, CardTitle } from '@/components/ui/card'
import { FilterChips } from '@/components/ui/filter-chips'
import { Screen } from '@/components/ui/screen'
import { StatusBadge } from '@/components/ui/status-badge'
import { useProductsList } from '@/features/products/hooks/use-products'
import { formatNumber, humanize } from '@/lib/format'
import { spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export default function ProductsListScreen() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const params = useMemo(() => ({ search: search.trim() || undefined }), [search])
  const { data, isLoading, isError, error, refetch, isRefetching } = useProductsList(params)
  const { colors, fonts } = useAppTheme()
  const loaded = data?.data ?? []
  const statuses = Array.from(new Set(loaded.map((item) => item.status)))
  const items = status === 'all' ? loaded : loaded.filter((item) => item.status === status)

  return (
    <Screen style={styles.screen} edges={['left', 'right']}>
      <AnimatedSearchBar value={search} onChangeText={setSearch} placeholder="Search SKU or product" autoCapitalize="none" />
      <FilterChips
        value={status}
        onChange={setStatus}
        options={[{ id: 'all', label: 'All' }, ...statuses.map((item) => ({ id: item, label: humanize(item) }))]}
      />
      {isLoading && !data ? <LoadingState /> : null}
      {isError ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      <FlatList
        style={styles.listView}
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch() }} tintColor={colors.teal} colors={[colors.teal]} />}
        contentContainerStyle={items.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={!isLoading ? <EmptyState title="No matching products" description="Try another name, SKU, or status." /> : undefined}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <Card onPress={() => router.push(`/products/${item.id}`)}>
              <View style={styles.row}>
                <View style={[styles.icon, { backgroundColor: colors.tealHighlight }]}>
                  <Package size={18} color={colors.deepTeal} />
                </View>
                <View style={styles.copy}>
                  <CardTitle>{item.name}</CardTitle>
                  <CardMeta>
                    {item.sku} · {item.categoryName}
                  </CardMeta>
                  <Text style={[styles.stock, { color: colors.text, fontFamily: fonts.bodySemibold }]}>
                    {formatNumber(item.stockAvailable)} available
                  </Text>
                </View>
                <StatusBadge status={item.status} />
              </View>
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
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
  stock: { ...typography.meta, fontVariant: ['tabular-nums'] },
})
