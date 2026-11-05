import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { AnimatedListItem } from '@/components/motion/surfaces'
import { Card, CardMeta, CardTitle } from '@/components/ui/card'
import { Screen } from '@/components/ui/screen'
import { StatusBadge } from '@/components/ui/status-badge'
import { useDocumentsList } from '@/features/documents/hooks/use-documents'
import { formatDate } from '@/lib/format'
import { spacing } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export default function DocumentsScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useDocumentsList()
  const { colors } = useAppTheme()
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
        ListEmptyComponent={<EmptyState title="No documents" description="Uploaded files will be listed here." />}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <Card>
              <View style={styles.top}>
                <CardTitle>{item.name}</CardTitle>
                <StatusBadge status={item.status} />
              </View>
              <CardMeta>{item.category}</CardMeta>
              {item.relatedReference ? <CardMeta>{item.relatedReference}</CardMeta> : null}
              {item.expiryDate ? <CardMeta>Expires {formatDate(item.expiryDate)}</CardMeta> : null}
              <CardMeta>Uploaded by {item.uploadedBy}</CardMeta>
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
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, alignItems: 'flex-start' },
})
