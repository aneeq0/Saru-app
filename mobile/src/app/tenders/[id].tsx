import { useLocalSearchParams } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { Card, CardMeta, CardTitle } from '@/components/ui/card'
import { Screen } from '@/components/ui/screen'
import { StatusBadge } from '@/components/ui/status-badge'
import { useTender } from '@/features/tenders/hooks/use-tenders'
import { formatCurrency, formatDate } from '@/lib/format'
import { deadlineLabel, tenderDeadlineTone } from '@/lib/presentation'
import { typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export default function TenderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, isLoading, isError, error, refetch } = useTender(id)
  const { colors, fonts } = useAppTheme()

  if (isLoading) return <Screen><LoadingState variant="detail" /></Screen>
  if (isError || !data) return <Screen><ErrorState error={error} onRetry={() => refetch()} /></Screen>

  const due = deadlineLabel(data.submissionDeadline)
  const tone = tenderDeadlineTone(data.stage, data.submissionDeadline)
  const toneColor = tone === 'danger' ? colors.danger : tone === 'warning' ? colors.warning : colors.heroText

  return (
    <Screen scroll edges={['left', 'right', 'bottom']}>
      <Text style={[styles.kicker, { color: colors.teal, fontFamily: fonts.bodySemibold }]}>{data.tenderNumber}</Text>
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.displayBold }]}>{data.title}</Text>
      <StatusBadge status={data.stage} />
      <View style={[styles.deadline, { backgroundColor: colors.deepNavy }]}>
        <Text style={[styles.deadlineValue, { color: toneColor, fontFamily: fonts.displayBold }]}>
          {due?.text ?? formatDate(data.submissionDeadline)}
        </Text>
        <Text style={[styles.deadlineMeta, { color: colors.heroMuted, fontFamily: fonts.body }]}>
          Submission {formatDate(data.submissionDeadline)} · {data.departmentName}
        </Text>
      </View>
      <Card>
        <CardTitle>Assignment</CardTitle>
        {data.assignedManager ? <CardMeta>Manager {data.assignedManager}</CardMeta> : <CardMeta>No manager assigned</CardMeta>}
        {data.missingDocuments != null ? <CardMeta>{data.missingDocuments} documents still missing</CardMeta> : null}
      </Card>
      {data.estimatedValue != null ? (
        <Card>
          <CardTitle>Estimated value</CardTitle>
          <Text style={[styles.value, { color: colors.text, fontFamily: fonts.displayBold }]}>
            {formatCurrency(data.estimatedValue, data.currency)}
          </Text>
        </Card>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  kicker: { ...typography.label, letterSpacing: 0.4 },
  title: { ...typography.screenTitle },
  deadline: { borderRadius: 20, padding: 20, gap: 4 },
  deadlineValue: { fontSize: 28, lineHeight: 34 },
  deadlineMeta: { ...typography.body },
  value: { ...typography.metric, fontVariant: ['tabular-nums'] },
})
