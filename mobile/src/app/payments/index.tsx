import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { AnimatedListItem } from '@/components/motion/surfaces'
import { Card, CardMeta, CardTitle } from '@/components/ui/card'
import { Screen } from '@/components/ui/screen'
import { StatusBadge } from '@/components/ui/status-badge'
import { usePaymentsList } from '@/features/payments/hooks/use-payments'
import { formatCurrency, formatDate } from '@/lib/format'
import { spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export default function PaymentsScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = usePaymentsList()
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
        ListEmptyComponent={<EmptyState title="No payments" description="Recorded receipts will appear here." />}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <Card>
              <View style={styles.top}>
                <CardTitle>{item.paymentReference}</CardTitle>
                <StatusBadge status={item.status} />
              </View>
              <CardMeta>{item.payer}</CardMeta>
              <Text style={[styles.amount, { color: colors.text, fontFamily: fonts.displayBold }]}>
                {formatCurrency(item.amount, item.currency)}
              </Text>
              <CardMeta>
                {item.method} · {formatDate(item.paymentDate)}
              </CardMeta>
            </Card>
          </AnimatedListItem>
        )}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  empty: { flexGrow: 1 },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  amount: { ...typography.sectionTitle, fontVariant: ['tabular-nums'] },
})
