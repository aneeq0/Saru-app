import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { AnimatedListItem } from '@/components/motion/surfaces'
import { Card, CardMeta, CardTitle } from '@/components/ui/card'
import { Screen } from '@/components/ui/screen'
import { StatusBadge } from '@/components/ui/status-badge'
import { useSecuritiesList } from '@/features/securities/hooks/use-securities'
import { formatCurrency, formatDate } from '@/lib/format'
import { deadlineLabel } from '@/lib/presentation'
import { spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export default function SecuritiesScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useSecuritiesList()
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
        ListEmptyComponent={<EmptyState title="No securities" description="CDRs and guarantees will appear here." />}
        renderItem={({ item, index }) => {
          const due = deadlineLabel(item.expiryDate)
          const toneColor = due?.tone === 'danger' ? colors.danger : due?.tone === 'warning' ? colors.warning : colors.textSecondary
          return (
            <AnimatedListItem index={index}>
              <Card>
                <View style={styles.top}>
                  <CardTitle>
                    {item.type} · {item.reference}
                  </CardTitle>
                  <StatusBadge status={item.status} />
                </View>
                <CardMeta>{item.issuingBank}</CardMeta>
                <Text style={[styles.amount, { color: colors.text, fontFamily: fonts.displayBold }]}>
                  {formatCurrency(item.amount, item.currency)}
                </Text>
                <Text style={[styles.expiry, { color: toneColor, fontFamily: fonts.bodySemibold }]}>
                  {due?.text ?? 'Expiry'} · {formatDate(item.expiryDate)}
                </Text>
                <CardMeta>{item.beneficiary}</CardMeta>
                {item.linkedTenderNumber ? <CardMeta>Tender {item.linkedTenderNumber}</CardMeta> : null}
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
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, alignItems: 'flex-start' },
  amount: { ...typography.sectionTitle, fontVariant: ['tabular-nums'] },
  expiry: { ...typography.label },
})
