import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { AnimatedListItem } from '@/components/motion/surfaces'
import { AnimatedProgressBar, AnimatedProgressRing } from '@/components/motion/progress'
import { Card, CardMeta, CardTitle } from '@/components/ui/card'
import { Screen } from '@/components/ui/screen'
import { StatusBadge } from '@/components/ui/status-badge'
import { useContractsList } from '@/features/contracts/hooks/use-contracts'
import { formatCurrency } from '@/lib/format'
import { spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export default function ContractsScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useContractsList()
  const { colors, fonts } = useAppTheme()
  const items = data?.data ?? []

  if (isLoading && !data) return <Screen><LoadingState /></Screen>
  if (isError) return <Screen><ErrorState error={error} onRetry={() => refetch()} /></Screen>

  return (
    <Screen style={styles.screen} edges={['left', 'right']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch() }} tintColor={colors.teal} colors={[colors.teal]} />}
        contentContainerStyle={items.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={<EmptyState title="No contracts" description="Awarded contracts will appear here." />}
        renderItem={({ item, index }) => {
          const ratio = item.awardedValue > 0 ? Math.min(1, item.fulfilledValue / item.awardedValue) : 0
          return (
            <AnimatedListItem index={index}>
              <Card>
                <View style={styles.top}>
                  <View style={styles.copy}>
                    <CardTitle>{item.contractNumber}</CardTitle>
                    <CardMeta>
                      Tender {item.tenderNumber} · {item.departmentName}
                    </CardMeta>
                  </View>
                  <AnimatedProgressRing progress={ratio} size={54} stroke={6} label={`${Math.round(ratio * 100)}%`} />
                </View>
                <AnimatedProgressBar progress={ratio} />
                <Text style={[styles.value, { color: colors.text, fontFamily: fonts.bodySemibold }]}>
                  {formatCurrency(item.fulfilledValue, item.currency)} of {formatCurrency(item.awardedValue, item.currency)}
                </Text>
                <StatusBadge status={item.status} />
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
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  empty: { flexGrow: 1 },
  top: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  copy: { flex: 1, gap: 2 },
  value: { ...typography.meta, fontVariant: ['tabular-nums'] },
})
