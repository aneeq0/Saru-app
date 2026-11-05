import { Stack } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { OfflineBanner } from '@/components/feedback/offline-banner'
import { useStackScreenOptions } from '@/components/navigation/stack-screen-options'
import { AppProviders } from '@/providers/app-providers'
import { AuthBootstrap } from '@/providers/auth-bootstrap'

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  )
}

function RootNavigator() {
  const screenOptions = useStackScreenOptions()
  return (
    <View style={styles.root}>
      <AuthBootstrap />
      <Stack screenOptions={{ ...screenOptions, headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="products" />
        <Stack.Screen name="inventory" />
        <Stack.Screen name="imports" />
        <Stack.Screen name="tenders" />
        <Stack.Screen name="deliveries" />
        <Stack.Screen name="approvals" />
        <Stack.Screen name="invoices" />
        <Stack.Screen name="payments" />
        <Stack.Screen name="documents" />
        <Stack.Screen name="contracts" />
        <Stack.Screen name="securities" />
        <Stack.Screen name="scan" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
      </Stack>
      <OfflineBanner />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})
