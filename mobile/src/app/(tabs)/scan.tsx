import { router } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { ScanLine } from 'lucide-react-native'
import { AppButton } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { Screen } from '@/components/ui/screen'
import { TextField } from '@/components/ui/text-field'
import { radii, spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export default function ScanHomeScreen() {
  const [sku, setSku] = useState('')
  const { colors, fonts } = useAppTheme()

  const lookup = () => {
    const code = sku.trim()
    if (!code) return
    router.push({ pathname: '/scan/result', params: { code } })
  }

  return (
    <Screen scroll>
      <PageHeader
        kicker="Lookup"
        title="Scan"
        subtitle="Barcode lookup is read-only. Scanning never changes stock."
      />
      <View style={[styles.panel, { backgroundColor: colors.deepNavy }]}>
        <View style={[styles.frame, { borderColor: colors.teal }]}>
          <ScanLine color={colors.tealHighlight} size={36} />
        </View>
        <Text style={[styles.panelTitle, { color: colors.heroText, fontFamily: fonts.display }]}>Camera scanner</Text>
        <Text style={[styles.panelBody, { color: colors.heroMuted, fontFamily: fonts.body }]}>
          Open the camera, align a barcode, and review the product before you act.
        </Text>
        <AppButton title="Open camera" onPress={() => router.push('/scan/camera')} />
      </View>
      <TextField
        label="SKU or barcode"
        placeholder="e.g. SARU-MED-001"
        autoCapitalize="characters"
        value={sku}
        onChangeText={setSku}
        onSubmitEditing={lookup}
        returnKeyType="search"
      />
      <AppButton title="Look up product" onPress={lookup} disabled={!sku.trim()} variant="outline" />
    </Screen>
  )
}

const styles = StyleSheet.create({
  panel: { borderRadius: radii.xl, padding: spacing.lg, gap: spacing.sm, alignItems: 'flex-start' },
  frame: {
    width: 72,
    height: 72,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  panelTitle: { ...typography.sectionTitle },
  panelBody: { ...typography.body },
})
