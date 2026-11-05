import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter'
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { StatusBar } from 'expo-status-bar'
import { useState, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ToastProvider } from '@/components/motion/surfaces'
import { RealtimeProvider } from '@/services/realtime/RealtimeProvider'
import { ThemeProvider, useAppTheme } from '@/theme/theme-context'
import { colors } from '@/theme/tokens'

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  )
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  })

  if (!fontsLoaded && !fontError) {
    return <View style={styles.boot} />
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider fontsReady={Boolean(fontsLoaded) && !fontError}>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <ThemedStatusBar />
              <RealtimeGate>{children}</RealtimeGate>
            </ToastProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

function ThemedStatusBar() {
  const { mode } = useAppTheme()
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
}

function RealtimeGate({ children }: { children: ReactNode }) {
  return <RealtimeProvider>{children}</RealtimeProvider>
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  boot: { flex: 1, backgroundColor: colors.deepNavy },
})
