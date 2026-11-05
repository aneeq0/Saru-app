import { StyleSheet, Text, View } from 'react-native'
import { useNetworkState } from 'expo-network'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { spacing, typography } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

export function OfflineBanner() {
  const network = useNetworkState()
  const insets = useSafeAreaInsets()
  const { colors, fonts } = useAppTheme()
  if (network.isConnected !== false) return null

  return (
    <View style={[styles.banner, { backgroundColor: colors.navy, paddingTop: insets.top + 6 }]}>
      <Text style={[styles.text, { color: colors.heroText, fontFamily: fonts.bodyMedium }]}>
        You are offline. Changes stay on this device until the connection returns.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  text: { ...typography.meta, textAlign: 'center' },
})
