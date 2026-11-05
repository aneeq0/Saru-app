import { router, Tabs } from 'expo-router'
import { FloatingTabBar } from '@/components/navigation/floating-tab-bar'
import { hapticSelection } from '@/lib/haptics'
import { useAppTheme } from '@/theme/theme-context'

export default function TabsLayout() {
  const { colors } = useAppTheme()
  return (
    <Tabs
      tabBar={(props) => (
        <FloatingTabBar
          state={props.state}
          descriptors={props.descriptors}
          onPress={(route, index) => {
            const focused = props.state.index === index
            const event = props.emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })
            if (focused && route.name === 'scan') {
              void hapticSelection()
              router.push('/scan/camera')
              return
            }
            if (!focused && !event.defaultPrevented) {
              void hapticSelection()
              props.navigateToTab(route.key)
            }
          }}
          onLongPress={(route) => {
            props.emitter.emit({ type: 'tabLongPress', target: route.key })
          }}
        />
      )}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tasks' }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  )
}
