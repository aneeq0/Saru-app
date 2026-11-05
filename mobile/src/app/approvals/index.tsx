import { useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native'
import { EmptyState } from '@/components/feedback/empty-state'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { AnimatedConfirmation, AnimatedTaskCard, useToast } from '@/components/motion/surfaces'
import { AppButton } from '@/components/ui/button'
import { Screen } from '@/components/ui/screen'
import { StatusBadge } from '@/components/ui/status-badge'
import { useApproveRequest, useApprovalsList, useRejectRequest } from '@/features/approvals/hooks/use-approvals'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { formatDate } from '@/lib/format'
import { hapticSuccess } from '@/lib/haptics'
import { getUserFacingErrorMessage } from '@/services/api/errors'
import { spacing } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'
import type { ApprovalRequest } from '@/types/entities'

type PendingAction = { id: string; action: 'approve' | 'reject'; reference: string }

export default function ApprovalsScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useApprovalsList()
  const approve = useApproveRequest()
  const reject = useRejectRequest()
  const { hasPermission } = useAuth()
  const canAct = hasPermission('approvals:approve')
  const { colors } = useAppTheme()
  const toast = useToast()
  const [pending, setPending] = useState<PendingAction | null>(null)
  const items = data?.data ?? []
  const busy = approve.isPending || reject.isPending

  const commit = () => {
    if (!pending) return
    const mutation = pending.action === 'approve' ? approve : reject
    mutation.mutate(pending.id, {
      onSuccess: () => {
        void hapticSuccess()
        toast.show({
          title: pending.action === 'approve' ? 'Approved' : 'Rejected',
          message: `${pending.reference} was updated by the server.`,
          tone: pending.action === 'approve' ? 'success' : 'info',
        })
        setPending(null)
      },
      onError: (err) => {
        toast.show({ title: 'Action failed', message: getUserFacingErrorMessage(err), tone: 'danger' })
      },
    })
  }

  if (isLoading && !data) return <Screen><LoadingState /></Screen>
  if (isError) return <Screen><ErrorState error={error} onRetry={() => refetch()} /></Screen>

  return (
    <Screen style={styles.screen} edges={['left', 'right']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch() }} tintColor={colors.teal} colors={[colors.teal]} />}
        contentContainerStyle={items.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={<EmptyState title="You're all caught up" description="No approval requests are waiting." />}
        renderItem={({ item, index }) => (
          <ApprovalCard item={item} index={index} canAct={canAct} onAction={setPending} />
        )}
      />
      <AnimatedConfirmation
        visible={pending != null}
        title={pending?.action === 'reject' ? 'Reject request?' : 'Approve request?'}
        message={
          pending
            ? `${pending.action === 'reject' ? 'Reject' : 'Approve'} ${pending.reference}? This is sent to the server before the list updates.`
            : ''
        }
        confirmLabel={pending?.action === 'reject' ? 'Reject' : 'Approve'}
        tone={pending?.action === 'reject' ? 'danger' : 'primary'}
        loading={busy}
        onCancel={() => setPending(null)}
        onConfirm={commit}
      />
    </Screen>
  )
}

function ApprovalCard({
  item,
  index,
  canAct,
  onAction,
}: {
  item: ApprovalRequest
  index: number
  canAct: boolean
  onAction: (action: PendingAction) => void
}) {
  return (
    <AnimatedTaskCard
      index={index}
      title={item.requestType}
      reference={`${item.recordReference} · ${item.module}`}
      due={`${item.requester} → ${item.assignedApprover}${item.deadline ? ` · due ${formatDate(item.deadline)}` : ''}`}
      tone={item.status === 'pending' ? 'warning' : item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'neutral'}
      status={<StatusBadge status={item.status} />}
      action={
        canAct && item.status === 'pending' ? (
          <View style={styles.actions}>
            <AppButton
              title="Approve"
              onPress={() => onAction({ id: item.id, action: 'approve', reference: item.recordReference })}
              style={styles.flex}
            />
            <AppButton
              title="Reject"
              variant="outline"
              onPress={() => onAction({ id: item.id, action: 'reject', reference: item.recordReference })}
              style={styles.flex}
            />
          </View>
        ) : null
      }
    />
  )
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  list: { gap: spacing.sm, paddingBottom: spacing.xl },
  empty: { flexGrow: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  flex: { flex: 1 },
})
