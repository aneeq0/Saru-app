import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { AnimatedListItem } from '@/components/motion/surfaces'
import { AnimatedProgressBar } from '@/components/motion/progress'
import { Card, CardMeta, CardTitle } from '@/components/ui/card'
import { Screen } from '@/components/ui/screen'
import { StatusBadge } from '@/components/ui/status-badge'
import { useInvoicesList } from '@/features/invoices/hooks/use-invoices'
import { formatCurrency, formatDate } from '@/lib/format'
import { spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export default function InvoicesScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useInvoicesList()
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
        ListEmptyComponent={<EmptyState title="No invoices" description="Issued invoices will appear here." />}
        renderItem={({ item, index }) => {
          const settled = item.grandTotal > 0 ? Math.min(1, item.amountPaid / item.grandTotal) : 0
          return (
            <AnimatedListItem index={index}>
              <Card>
                <View style={styles.top}>
                  <CardTitle>{item.invoiceNumber}</CardTitle>
                  <StatusBadge status={item.status} />
                </View>
                <CardMeta>{item.departmentName}</CardMeta>
                <Text style={[styles.amount, { color: colors.text, fontFamily: fonts.displayBold }]}>
                  {formatCurrency(item.balanceDue, item.currency)}
                </Text>
                <CardMeta>Balance due · issued {formatDate(item.invoiceDate)}</CardMeta>
                <AnimatedProgressBar progress={settled} />
                <CardMeta>
                  Paid {formatCurrency(item.amountPaid, item.currency)} of {formatCurrency(item.grandTotal, item.currency)}
                </CardMeta>
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
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  amount: { ...typography.sectionTitle, fontVariant: ['tabular-nums'] },
})
