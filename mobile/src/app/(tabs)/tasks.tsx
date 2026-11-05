import { FlatList, RefreshControl, StyleSheet } from 'react-native'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { AnimatedTaskCard } from '@/components/motion/surfaces'
import { StatusBadge } from '@/components/ui/status-badge'
import { PageHeader } from '@/components/ui/page-header'
import { Screen } from '@/components/ui/screen'
import { useTasksList } from '@/features/tasks/hooks/use-tasks'
import { formatDate } from '@/lib/format'
import { deadlineLabel } from '@/lib/presentation'
import { spacing } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'
import type { TaskItem } from '@/types/entities'

function taskTone(item: TaskItem): 'neutral' | 'warning' | 'danger' | 'info' | 'success' {
  if (item.status === 'done') return 'success'
  if (item.priority === 'critical') return 'danger'
  if (item.priority === 'high') return 'warning'
  if (item.status === 'in_progress') return 'info'
  return deadlineLabel(item.dueDate)?.tone ?? 'neutral'
}

export default function TasksScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useTasksList()
  const { colors } = useAppTheme()
  const items = data?.data ?? []

  return (
    <Screen style={styles.screen}>
      <PageHeader kicker="Work queue" title="Tasks" subtitle="Open work assigned across operations." />
      {isLoading ? <LoadingState /> : null}
      {isError ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {!isLoading && !isError ? (
        <FlatList
          style={styles.listView}
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch() }} tintColor={colors.teal} colors={[colors.teal]} />}
          contentContainerStyle={items.length === 0 ? styles.empty : styles.list}
          ListEmptyComponent={<EmptyState title="No open tasks" description="You're caught up for now." />}
          renderItem={({ item, index }) => (
            <AnimatedTaskCard
              index={index}
              title={item.title}
              reference={`${item.module}${item.relatedReference ? ` · ${item.relatedReference}` : ''}`}
              due={item.dueDate ? `Due ${formatDate(item.dueDate)}` : undefined}
              tone={taskTone(item)}
              status={<StatusBadge status={item.status} />}
            />
          )}
        />
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  listView: { flex: 1 },
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  empty: { flexGrow: 1 },
})
