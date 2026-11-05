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
import { useTendersList } from '@/features/tenders/hooks/use-tenders'
import { formatCurrency, formatDate } from '@/lib/format'
import { deadlineLabel, tenderDeadlineTone } from '@/lib/presentation'
import { spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export default function TendersListScreen() {
  const [search, setSearch] = useState('')
  const params = useMemo(() => ({ search: search.trim() || undefined }), [search])
  const { data, isLoading, isError, error, refetch, isRefetching } = useTendersList(params)
  const { colors, fonts } = useAppTheme()
  const items = data?.data ?? []

  return (
    <Screen style={styles.screen} edges={['left', 'right']}>
      <AnimatedSearchBar value={search} onChangeText={setSearch} placeholder="Tender number or title" />
      {isLoading && !data ? <LoadingState /> : null}
      {isError ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      <FlatList
        style={styles.listView}
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch() }} tintColor={colors.teal} colors={[colors.teal]} />}
        contentContainerStyle={items.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={<EmptyState title="No tenders" description="New opportunities will show up here." />}
        renderItem={({ item, index }) => {
          const due = deadlineLabel(item.submissionDeadline)
          const tone = tenderDeadlineTone(item.stage, item.submissionDeadline)
          const toneColor = tone === 'danger' ? colors.danger : tone === 'warning' ? colors.warning : colors.textSecondary
          return (
            <AnimatedListItem index={index}>
              <Card onPress={() => router.push(`/tenders/${item.id}`)}>
                <View style={styles.top}>
                  <CardTitle>{item.title}</CardTitle>
                  <StatusBadge status={item.stage} />
                </View>
                <CardMeta>
                  {item.tenderNumber} · {item.departmentName}
                </CardMeta>
                <View style={styles.dueRow}>
                  <Text style={[styles.due, { color: toneColor, fontFamily: fonts.bodySemibold }]}>
                    {due?.text ?? formatDate(item.submissionDeadline)}
                  </Text>
                  <Text style={[styles.date, { color: colors.mutedText, fontFamily: fonts.body }]}>{formatDate(item.submissionDeadline)}</Text>
                </View>
                {item.estimatedValue != null ? (
                  <Text style={[styles.value, { color: colors.text, fontFamily: fonts.bodySemibold }]}>
                    {formatCurrency(item.estimatedValue, item.currency)}
                  </Text>
                ) : null}
                {item.assignedManager ? <CardMeta>{item.assignedManager}</CardMeta> : null}
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
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, alignItems: 'flex-start' },
  dueRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  due: { ...typography.label },
  date: { ...typography.meta },
  value: { ...typography.body, fontVariant: ['tabular-nums'] },
})
