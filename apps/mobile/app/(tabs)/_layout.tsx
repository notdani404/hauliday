import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { theme } from '../../lib/theme';

const icon = (emoji: string) =>
  function TabIcon() {
    return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.coral,
        tabBarInactiveTintColor: theme.slate,
        tabBarStyle: { backgroundColor: theme.white, borderTopColor: theme.line },
      }}
    >
      <Tabs.Screen name="scan" options={{ title: 'Scan', tabBarIcon: icon('📷') }} />
      <Tabs.Screen name="search" options={{ title: 'Catalogue', tabBarIcon: icon('📚') }} />
      <Tabs.Screen name="watchlist" options={{ title: 'Watchlist', tabBarIcon: icon('🔖') }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: icon('🧾') }} />
      <Tabs.Screen name="profile" options={{ title: 'Account', tabBarIcon: icon('👤') }} />
    </Tabs>
  );
}
