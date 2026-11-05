import { CameraView, useCameraPermissions } from 'expo-camera'
import { router } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppButton } from '@/components/ui/button'
import { AnimatedBottomSheet } from '@/components/motion/surfaces'
import { StatusBadge } from '@/components/ui/status-badge'
import { TextField } from '@/components/ui/text-field'
import { LoadingState } from '@/components/feedback/loading-state'
import { hapticMedium } from '@/lib/haptics'
import { formatNumber } from '@/lib/format'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useProductByBarcode } from '@/features/products/hooks/use-products'
import { radii, spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'
import { useReducedMotion } from '@/theme/use-reduced-motion'
import { getUserFacingErrorMessage } from '@/services/api/errors'

const FRAME = 260

export default function ScanCameraScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [locked, setLocked] = useState(false)
  const [torch, setTorch] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const [manual, setManual] = useState('')
  const [manualOpen, setManualOpen] = useState(false)
  const handledRef = useRef<string | null>(null)
  const { colors, fonts } = useAppTheme()
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()
  const { width } = useWindowDimensions()
  const frame = Math.min(FRAME, width - 80)
  const { canViewModule } = useAuth()
  const lookup = useProductByBarcode(code ?? undefined)
  const line = useSharedValue(12)

  useEffect(() => {
    if (reduced || locked) {
      cancelAnimation(line)
      return
    }
    line.value = 12
    line.value = withRepeat(withTiming(frame - 18, { duration: 1700, easing: Easing.inOut(Easing.quad) }), -1, true)
    return () => cancelAnimation(line)
  }, [frame, line, locked, reduced])

  const lineStyle = useAnimatedStyle(() => ({ transform: [{ translateY: line.value }] }))

  const acceptCode = useCallback((value: string) => {
    const next = value.trim()
    if (!next || handledRef.current === next) return
    handledRef.current = next
    setLocked(true)
    setCode(next)
    setManualOpen(false)
    void hapticMedium()
  }, [])

  const onBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (locked) return
      acceptCode(data)
    },
    [acceptCode, locked],
  )

  const closeResult = () => {
    setCode(null)
    setTimeout(() => {
      handledRef.current = null
      setLocked(false)
    }, 900)
  }

  if (!permission) {
    return (
      <View style={[styles.permission, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.textSecondary, fontFamily: fonts.body }]}>Checking camera permission…</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permission, { backgroundColor: colors.background, paddingTop: insets.top + spacing.xl }]}>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.displayBold }]}>Camera access required</Text>
        <Text style={[styles.message, { color: colors.textSecondary, fontFamily: fonts.body }]}>
          Allow camera access to scan product barcodes. Scanning only looks up catalog data and never adjusts stock.
        </Text>
        <AppButton title="Grant camera access" onPress={() => requestPermission()} />
        <AppButton title="Enter a code instead" variant="outline" onPress={() => router.back()} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'code128', 'code39', 'qr'] }}
        onBarcodeScanned={locked ? undefined : onBarcodeScanned}
      />
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable accessibilityLabel="Close scanner" onPress={() => router.back()} hitSlop={8}>
            <Text style={[styles.topAction, { color: colors.white, fontFamily: fonts.bodySemibold }]}>Close</Text>
          </Pressable>
          <Pressable accessibilityLabel={torch ? 'Turn flashlight off' : 'Turn flashlight on'} onPress={() => setTorch((value) => !value)} hitSlop={8}>
            <Text style={[styles.topAction, { color: torch ? colors.gold : colors.white, fontFamily: fonts.bodySemibold }]}>
              {torch ? 'Light on' : 'Light'}
            </Text>
          </Pressable>
        </View>
        <View style={styles.middle} pointerEvents="none">
          <View style={styles.dim} />
          <View style={styles.band}>
            <View style={styles.dim} />
            <View style={[styles.frame, { width: frame, height: frame, borderColor: locked ? colors.tealHighlight : 'transparent' }]}>
              <Corner color={colors.teal} position="tl" />
              <Corner color={colors.teal} position="tr" />
              <Corner color={colors.teal} position="bl" />
              <Corner color={colors.teal} position="br" />
              {!reduced ? <Animated.View style={[styles.scanLine, { backgroundColor: colors.teal }, lineStyle]} /> : null}
            </View>
            <View style={styles.dim} />
          </View>
          <View style={styles.dim} />
        </View>
        <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.md }]}>
          <Text style={[styles.hint, { color: colors.white, fontFamily: fonts.body }]}>
            {locked ? 'Code captured. Review the product before continuing.' : 'Align the barcode inside the frame'}
          </Text>
          <AppButton title="Enter code manually" variant="secondary" onPress={() => setManualOpen(true)} />
        </View>
      </View>

      <AnimatedBottomSheet visible={manualOpen} onClose={() => setManualOpen(false)} title="Enter a code">
        <TextField
          label="SKU or barcode"
          autoCapitalize="characters"
          value={manual}
          onChangeText={setManual}
          placeholder="SARU-MED-001"
        />
        <AppButton title="Look up" onPress={() => acceptCode(manual)} disabled={!manual.trim()} />
      </AnimatedBottomSheet>

      <AnimatedBottomSheet visible={Boolean(code)} onClose={closeResult} title="Scan result">
        <Text style={[styles.code, { color: colors.textSecondary, fontFamily: fonts.body }]}>{code}</Text>
        {lookup.isLoading ? <LoadingState variant="detail" /> : null}
        {lookup.isError ? (
          <Text style={[styles.message, { color: colors.danger, fontFamily: fonts.body }]}>
            {getUserFacingErrorMessage(lookup.error)}
          </Text>
        ) : null}
        {lookup.data ? (
          <View style={styles.result}>
            <Text style={[styles.product, { color: colors.text, fontFamily: fonts.display }]}>{lookup.data.name}</Text>
            <StatusBadge status={lookup.data.status} />
            <Text style={[styles.message, { color: colors.textSecondary, fontFamily: fonts.body }]}>
              SKU {lookup.data.sku} · Available {formatNumber(lookup.data.stockAvailable)}
            </Text>
            <Text style={[styles.message, { color: colors.mutedText, fontFamily: fonts.body }]}>
              This is a read-only snapshot. Stock is unchanged.
            </Text>
            {canViewModule('products') ? (
              <AppButton title="Open product record" onPress={() => router.push(`/products/${lookup.data.id}`)} />
            ) : null}
            {canViewModule('inventory') ? (
              <AppButton title="View inventory" variant="outline" onPress={() => router.push('/inventory')} />
            ) : null}
          </View>
        ) : null}
        <AppButton title="Scan another" variant="ghost" onPress={closeResult} />
      </AnimatedBottomSheet>
    </View>
  )
}

function Corner({ color, position }: { color: string; position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const horizontal = position.includes('l') ? { left: 0 } : { right: 0 }
  const vertical = position.startsWith('t') ? { top: 0 } : { bottom: 0 }
  return (
    <>
      <View style={[styles.cornerH, { backgroundColor: color }, horizontal, vertical]} />
      <View style={[styles.cornerV, { backgroundColor: color }, horizontal, vertical]} />
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFill, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  topAction: { ...typography.label, minHeight: 44, textAlignVertical: 'center' },
  middle: { flex: 1 },
  band: { flexDirection: 'row', alignItems: 'center' },
  dim: { flex: 1, backgroundColor: 'rgba(11, 31, 51, 0.55)' },
  frame: { overflow: 'hidden', borderWidth: 2, borderRadius: radii.lg },
  scanLine: { position: 'absolute', left: 12, right: 12, height: 2, borderRadius: 1 },
  cornerH: { position: 'absolute', width: 28, height: 3, borderRadius: 2 },
  cornerV: { position: 'absolute', width: 3, height: 28, borderRadius: 2 },
  bottom: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  hint: { ...typography.body, textAlign: 'center' },
  permission: { flex: 1, padding: spacing.lg, gap: spacing.md, justifyContent: 'center' },
  title: { ...typography.screenTitle },
  message: { ...typography.body },
  code: { ...typography.meta },
  result: { gap: spacing.sm },
  product: { ...typography.sectionTitle },
})
