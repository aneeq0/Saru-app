import { useMemo, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { AnimatedListItem, AnimatedSearchBar } from '@/components/motion/surfaces'
import { AnimatedProgressBar } from '@/components/motion/progress'
import { Card, CardMeta, CardTitle } from '@/components/ui/card'
import { FilterChips } from '@/components/ui/filter-chips'
import { Screen } from '@/components/ui/screen'
import { useStockList, useWarehouses } from '@/features/inventory/hooks/use-inventory'
import { formatDate, formatQuantity } from '@/lib/format'
import { daysUntil } from '@/lib/presentation'
import { spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export default function InventoryScreen() {
  const [search, setSearch] = useState('')
  const [warehouseId, setWarehouseId] = useState('all')
  const params = useMemo(() => ({ search: search.trim() || undefined }), [search])
  const stock = useStockList(params)
  const warehouses = useWarehouses()
  const { colors, fonts } = useAppTheme()
  const loaded = stock.data?.data ?? []
  const items = warehouseId === 'all' ? loaded : loaded.filter((item) => item.warehouseId === warehouseId)
  const available = items.reduce((sum, item) => sum + item.available, 0)

  return (
    <Screen style={styles.screen} edges={['left', 'right']}>
      <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontFamily: fonts.bodyMedium }]}>Shown availability</Text>
        <Text style={[styles.summaryValue, { color: colors.text, fontFamily: fonts.displayBold }]}>{formatQuantity(available)}</Text>
        <Text style={[styles.summaryHint, { color: colors.mutedText, fontFamily: fonts.body }]}>
          {items.length} balance{items.length === 1 ? '' : 's'} in this list
        </Text>
      </View>
      <AnimatedSearchBar value={search} onChangeText={setSearch} placeholder="Search SKU or product" />
      <FilterChips
        value={warehouseId}
        onChange={setWarehouseId}
        options={[
          { id: 'all', label: 'All warehouses' },
          ...(warehouses.data ?? []).map((warehouse) => ({ id: warehouse.id, label: warehouse.name })),
        ]}
      />
      {stock.isLoading && !stock.data ? <LoadingState /> : null}
      {stock.isError ? <ErrorState error={stock.error} onRetry={() => stock.refetch()} /> : null}
      <FlatList
        style={styles.listView}
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={stock.isRefetching} onRefresh={() => { void stock.refetch() }} tintColor={colors.teal} colors={[colors.teal]} />
        }
        contentContainerStyle={items.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={<EmptyState title="No stock rows" description="Try another warehouse or search." />}
        renderItem={({ item, index }) => {
          const ratio = item.onHand > 0 ? Math.min(1, item.available / item.onHand) : 0
          const expiryDays = daysUntil(item.expiryDate)
          const expiryTone = expiryDays != null && expiryDays < 0 ? colors.danger : expiryDays != null && expiryDays <= 30 ? colors.warning : colors.textSecondary
          return (
            <AnimatedListItem index={index}>
              <Card>
                <CardTitle>{item.productName}</CardTitle>
                <CardMeta>
                  {item.sku} · {item.variantName} · {item.warehouseName}
                </CardMeta>
                <Text style={[styles.qty, { color: colors.text, fontFamily: fonts.bodySemibold }]}>
                  {formatQuantity(item.available, item.unit)} available
                </Text>
                <AnimatedProgressBar progress={ratio} color={ratio === 0 ? colors.danger : colors.teal} />
                <CardMeta>On hand {formatQuantity(item.onHand, item.unit)}</CardMeta>
                {item.batch ? <CardMeta>Batch {item.batch}</CardMeta> : null}
                {item.expiryDate ? (
                  <Text style={[styles.expiry, { color: expiryTone, fontFamily: fonts.bodyMedium }]}>
                    Expires {formatDate(item.expiryDate)}
                  </Text>
                ) : null}
                {item.quarantined > 0 ? <CardMeta>Quarantined {formatQuantity(item.quarantined, item.unit)}</CardMeta> : null}
                {item.expired > 0 ? <CardMeta>Expired {formatQuantity(item.expired, item.unit)}</CardMeta> : null}
              </Card>
            </AnimatedListItem>
          )
        }}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  listView: { flex: 1 },
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  empty: { flexGrow: 1 },
  summary: { borderWidth: 1, borderRadius: 16, padding: spacing.md, gap: 2 },
  summaryLabel: { ...typography.label },
  summaryValue: { ...typography.metric, fontVariant: ['tabular-nums'] },
  summaryHint: { ...typography.meta },
  qty: { ...typography.body, fontVariant: ['tabular-nums'] },
  expiry: { ...typography.meta },
})
