import type { ReactNode } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native'
import { SafeAreaView, type Edges } from 'react-native-safe-area-context'
import { spacing, TAB_BAR_CLEARANCE } from '@/theme/tokens'
import { useAppTheme } from '@/theme/theme-context'

interface ScreenProps {
  children: ReactNode
  scroll?: boolean
  style?: ViewStyle
  edges?: Edges
  tabBarInset?: boolean
  refreshing?: boolean
  onRefresh?: () => void
}

export function Screen({
  children,
  scroll,
  style,
  edges = ['top', 'left', 'right'],
  tabBarInset,
  refreshing,
  onRefresh,
}: ScreenProps) {
  const { colors } = useAppTheme()
  const contentStyle = [
    styles.content,
    tabBarInset ? { paddingBottom: TAB_BAR_CLEARANCE } : null,
    style,
  ]

  if (scroll) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={edges}>
        <ScrollView
          contentContainerStyle={contentStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.teal} colors={[colors.teal]} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={edges}>
      <View style={[styles.fill, contentStyle]}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.md, gap: spacing.md },
  fill: { flex: 1 },
})
