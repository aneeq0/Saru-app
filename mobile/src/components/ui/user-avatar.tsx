import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { initials } from '@/lib/presentation'
import { useAppTheme } from '@/theme/theme-context'

export function UserAvatar({
  name,
  uri,
  size = 64,
  style,
}: {
  name?: string | null
  uri?: string | null
  size?: number
  style?: StyleProp<ViewStyle>
}) {
  const { colors, fonts } = useAppTheme()
  const radius = size / 2
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.navy,
          borderColor: colors.gold,
        },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: radius }} accessibilityLabel="Profile photo" />
      ) : (
        <Text style={[styles.initials, { color: colors.heroText, fontFamily: fonts.displayBold, fontSize: size * 0.34 }]}>
          {initials(name)}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: { letterSpacing: -0.3 },
})
