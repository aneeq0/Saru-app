import { useLocalSearchParams } from 'expo-router'
import { StyleSheet, Text } from 'react-native'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { Card, CardMeta, CardTitle } from '@/components/ui/card'
import { Screen } from '@/components/ui/screen'
import { StatusBadge } from '@/components/ui/status-badge'
import { WorkflowTimeline } from '@/components/ui/workflow-timeline'
import { useImport } from '@/features/imports/hooks/use-imports'
import { formatCurrency, formatDate } from '@/lib/format'
import { typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'
import type { ShipmentStatus } from '@/types/entities'

const STEPS = ['Ordered', 'In transit', 'Arrived', 'Receiving', 'Closed']

function stepIndex(status: ShipmentStatus): number | null {
  switch (status) {
    case 'draft':
    case 'ordered':
      return 0
    case 'in_transit':
      return 1
    case 'arrived':
      return 2
    case 'partially_received':
    case 'discrepancy':
      return 3
    case 'received':
    case 'closed':
      return 4
    default:
      return null
  }
}

export default function ImportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, isLoading, isError, error, refetch } = useImport(id)
  const { colors, fonts } = useAppTheme()

  if (isLoading) return <Screen><LoadingState variant="detail" /></Screen>
  if (isError || !data) return <Screen><ErrorState error={error} onRetry={() => refetch()} /></Screen>

  const current = stepIndex(data.status)

  return (
    <Screen scroll edges={['left', 'right', 'bottom']}>
      <Text style={[styles.kicker, { color: colors.teal, fontFamily: fonts.bodySemibold }]}>SHIPMENT</Text>
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.displayBold }]}>{data.reference}</Text>
      <StatusBadge status={data.status} />
      <Card>
        <CardTitle>Receiving progress</CardTitle>
        {current == null ? (
          <CardMeta>This shipment is {data.status.replaceAll('_', ' ')} and is off the receiving path.</CardMeta>
        ) : (
          <WorkflowTimeline steps={STEPS} current={current} />
        )}
        <CardMeta>Quantities are recorded on the server. This screen shows the current shipment status.</CardMeta>
      </Card>
      <Card>
        <CardTitle>Supplier</CardTitle>
        <CardMeta>{data.supplierName}</CardMeta>
      </Card>
      <Card>
        <CardTitle>Timeline</CardTitle>
        {data.expectedArrival ? <CardMeta>Expected {formatDate(data.expectedArrival)}</CardMeta> : null}
        {data.actualArrival ? <CardMeta>Arrived {formatDate(data.actualArrival)}</CardMeta> : null}
      </Card>
      <Card>
        <CardTitle>Value</CardTitle>
        <Text style={[styles.value, { color: colors.text, fontFamily: fonts.displayBold }]}>
          {formatCurrency(data.totalValue, data.currency)}
        </Text>
        <CardMeta>{data.itemCount} line items</CardMeta>
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  kicker: { ...typography.label, letterSpacing: 1 },
  title: { ...typography.screenTitle },
  value: { ...typography.metric, fontVariant: ['tabular-nums'] },
})
