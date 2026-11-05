import { useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import { AppButton } from '@/components/ui/button'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { AnimatedConfirmation, useToast } from '@/components/motion/surfaces'
import { AnimatedSuccessState } from '@/components/motion/status'
import { Card, CardMeta, CardTitle } from '@/components/ui/card'
import { Screen } from '@/components/ui/screen'
import { StatusBadge } from '@/components/ui/status-badge'
import { WorkflowTimeline } from '@/components/ui/workflow-timeline'
import { useConfirmDispatch, useDelivery } from '@/features/deliveries/hooks/use-deliveries'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { formatDate } from '@/lib/format'
import { hapticSuccess } from '@/lib/haptics'
import { getUserFacingErrorMessage } from '@/services/api/errors'
import { typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'
import type { DeliveryStatus } from '@/types/entities'

const STEPS = ['Assigned', 'Picking', 'Dispatched', 'Delivered', 'Acknowledged']

function stepIndex(status: DeliveryStatus): number {
  switch (status) {
    case 'scheduled':
      return 0
    case 'preparing':
      return 1
    case 'dispatched':
      return 2
    case 'delivered':
      return 3
    case 'acknowledged':
      return 4
    default:
      return 0
  }
}

export default function DeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, isLoading, isError, error, refetch } = useDelivery(id)
  const confirmDispatch = useConfirmDispatch()
  const { hasPermission } = useAuth()
  const { colors, fonts } = useAppTheme()
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)

  const canDispatch =
    hasPermission('deliveries:submit') &&
    data &&
    data.status !== 'dispatched' &&
    data.status !== 'delivered' &&
    data.status !== 'acknowledged' &&
    data.status !== 'cancelled'

  const onConfirmDispatch = () => {
    if (!data) return
    confirmDispatch.mutate(data.id, {
      onSuccess: () => {
        setConfirming(false)
        void hapticSuccess()
        toast.show({ title: 'Dispatched', message: `${data.deliveryNumber} was confirmed by the server.` })
        void refetch()
      },
      onError: (err) => {
        toast.show({ title: 'Unable to confirm', message: getUserFacingErrorMessage(err), tone: 'danger' })
      },
    })
  }

  if (isLoading) return <Screen><LoadingState variant="detail" /></Screen>
  if (isError || !data) return <Screen><ErrorState error={error} onRetry={() => refetch()} /></Screen>

  const terminal = data.status === 'cancelled' || data.status === 'returned' || data.status === 'partially_rejected'
  const confirmed = data.status === 'dispatched' || data.status === 'delivered' || data.status === 'acknowledged'

  return (
    <Screen scroll edges={['left', 'right', 'bottom']}>
      <Text style={[styles.kicker, { color: colors.teal, fontFamily: fonts.bodySemibold }]}>{data.contractNumber}</Text>
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.displayBold }]}>{data.deliveryNumber}</Text>
      <StatusBadge status={data.status} />
      {confirmed ? (
        <AnimatedSuccessState
          title="Server confirmed this stage"
          description="Status below matches the latest delivery record."
        />
      ) : null}
      <Card>
        <CardTitle>Journey</CardTitle>
        {terminal ? (
          <CardMeta>This delivery is {data.status.replaceAll('_', ' ')} and is no longer on the active path.</CardMeta>
        ) : (
          <WorkflowTimeline steps={STEPS} current={stepIndex(data.status)} />
        )}
      </Card>
      <Card>
        <CardTitle>Destination</CardTitle>
        <CardMeta>{data.departmentName}</CardMeta>
        <CardMeta>{data.destination}</CardMeta>
      </Card>
      <Card>
        <CardTitle>Schedule</CardTitle>
        <CardMeta>{formatDate(data.scheduledDate)}</CardMeta>
        {data.assignedStaff ? <CardMeta>Staff {data.assignedStaff}</CardMeta> : null}
        <CardMeta>{data.itemCount} items</CardMeta>
      </Card>
      {canDispatch ? (
        <AppButton title="Confirm dispatch" onPress={() => setConfirming(true)} loading={confirmDispatch.isPending} />
      ) : null}
      <AnimatedConfirmation
        visible={confirming}
        title="Confirm dispatch"
        message={`Mark ${data.deliveryNumber} as dispatched? Stock updates only after the server accepts this.`}
        confirmLabel="Confirm dispatch"
        loading={confirmDispatch.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={onConfirmDispatch}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  kicker: { ...typography.label, letterSpacing: 0.4 },
  title: { ...typography.screenTitle },
})
