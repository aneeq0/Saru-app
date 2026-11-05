import { useLocalSearchParams } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { AnimatedSection } from '@/components/motion/surfaces'
import { Card, CardMeta, CardTitle } from '@/components/ui/card'
import { Screen } from '@/components/ui/screen'
import { StatusBadge } from '@/components/ui/status-badge'
import { useProduct } from '@/features/products/hooks/use-products'
import { formatNumber } from '@/lib/format'
import { typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data, isLoading, isError, error, refetch } = useProduct(id)
  const { colors, fonts } = useAppTheme()

  if (isLoading) {
    return (
      <Screen>
        <LoadingState variant="detail" />
      </Screen>
    )
  }
  if (isError || !data) return <Screen><ErrorState error={error} onRetry={() => refetch()} /></Screen>

  return (
    <Screen scroll edges={['left', 'right', 'bottom']}>
      <View style={styles.titleBlock}>
        <Text style={[styles.kicker, { color: colors.teal, fontFamily: fonts.bodySemibold }]}>{data.sku}</Text>
        <Text style={[styles.name, { color: colors.text, fontFamily: fonts.displayBold }]}>{data.name}</Text>
        <StatusBadge status={data.status} />
      </View>
      <View style={[styles.stockPanel, { backgroundColor: colors.deepNavy }]}>
        <Text style={[styles.stockValue, { color: colors.heroText, fontFamily: fonts.displayBold }]}>
          {formatNumber(data.stockAvailable)}
        </Text>
        <Text style={[styles.stockLabel, { color: colors.heroMuted, fontFamily: fonts.body }]}>
          Available now · {data.variantCount} variants tracked
        </Text>
      </View>
      <AnimatedSection title="Identity">
        <Card>
          <CardTitle>Catalog</CardTitle>
          <CardMeta>{data.categoryName}</CardMeta>
          <CardMeta>{data.manufacturerName}</CardMeta>
          {data.brand ? <CardMeta>{data.brand}</CardMeta> : null}
          {data.barcode ? <CardMeta>Barcode {data.barcode}</CardMeta> : null}
          <CardMeta>Packaging {data.packagingUnit}</CardMeta>
        </Card>
      </AnimatedSection>
      {data.description ? (
        <AnimatedSection title="Description" delay={60}>
          <Card>
            <Text style={[styles.body, { color: colors.text, fontFamily: fonts.body }]}>{data.description}</Text>
          </Card>
        </AnimatedSection>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  titleBlock: { gap: 6 },
  kicker: { ...typography.label, letterSpacing: 0.6 },
  name: { ...typography.screenTitle },
  stockPanel: { borderRadius: 20, padding: 20, gap: 4 },
  stockValue: { fontSize: 36, lineHeight: 42, fontVariant: ['tabular-nums'] },
  stockLabel: { ...typography.body },
  body: { ...typography.body },
})
