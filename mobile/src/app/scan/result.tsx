import { router, useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'
import { StyleSheet, Text } from 'react-native'
import { AppButton } from '@/components/ui/button'
import { ErrorState } from '@/components/feedback/error-state'
import { LoadingState } from '@/components/feedback/loading-state'
import { Card, CardMeta, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Screen } from '@/components/ui/screen'
import { StatusBadge } from '@/components/ui/status-badge'
import { hapticSuccess } from '@/lib/haptics'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useProductByBarcode } from '@/features/products/hooks/use-products'
import { formatNumber } from '@/lib/format'
import { typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export default function ScanResultScreen() {
  const { code } = useLocalSearchParams<{ code: string }>()
  const { data, isLoading, isError, error, refetch } = useProductByBarcode(code)
  const { canViewModule } = useAuth()
  const { colors, fonts } = useAppTheme()

  useEffect(() => {
    if (data) void hapticSuccess()
  }, [data])

  if (isLoading) {
    return (
      <Screen>
        <LoadingState variant="detail" />
      </Screen>
    )
  }

  if (isError || !data) {
    return (
      <Screen scroll>
        <PageHeader kicker="Lookup" title="No match" subtitle={code ? `Nothing matched ${code}.` : 'Enter a code and try again.'} />
        <ErrorState error={error} onRetry={() => refetch()} />
        <AppButton title="Scan again" onPress={() => router.replace('/scan/camera')} />
      </Screen>
    )
  }

  return (
    <Screen scroll>
      <PageHeader kicker="Read-only snapshot" title={data.name} subtitle={`Scanned ${code}`} />
      <StatusBadge status={data.status} />
      <Text style={[styles.stock, { color: colors.text, fontFamily: fonts.displayBold }]}>{formatNumber(data.stockAvailable)}</Text>
      <Text style={[styles.stockLabel, { color: colors.textSecondary, fontFamily: fonts.body }]}>Available units. Stock was not changed.</Text>
      <Card>
        <CardTitle>Product</CardTitle>
        <CardMeta>SKU {data.sku}</CardMeta>
        <CardMeta>{data.categoryName}</CardMeta>
        {data.barcode ? <CardMeta>Barcode {data.barcode}</CardMeta> : null}
      </Card>
      {canViewModule('products') ? (
        <AppButton title="Open product record" onPress={() => router.push(`/products/${data.id}`)} />
      ) : null}
      {canViewModule('inventory') ? (
        <AppButton title="View inventory" variant="outline" onPress={() => router.push('/inventory')} />
      ) : null}
      <AppButton title="Scan another" variant="ghost" onPress={() => router.replace('/scan/camera')} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  stock: { ...typography.hero, fontVariant: ['tabular-nums'] },
  stockLabel: { ...typography.body },
})
