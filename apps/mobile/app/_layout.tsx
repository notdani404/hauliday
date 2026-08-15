import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ensureAnonymousSession } from '../lib/supabase';
import { flush } from '../lib/queue';
import { TripProvider } from '../lib/trip';
import { CaptureProvider } from '../lib/capture';
import { theme } from '../lib/theme';

// Shared options for the capture-flow screens: a native header with a back
// button so users are never stuck going only forward.
const flowHeader = (title: string) =>
  ({
    headerShown: true,
    title,
    headerBackButtonDisplayMode: 'minimal' as const,
    headerTintColor: theme.coral,
    headerStyle: { backgroundColor: theme.bg },
    headerShadowVisible: false,
    headerTitleStyle: { color: theme.ink, fontSize: 16 },
  });

export default function RootLayout() {
  useEffect(() => {
    void ensureAnonymousSession().then(() => flush().catch(() => {}));
  }, []);

  return (
    <SafeAreaProvider>
      <TripProvider>
        <CaptureProvider>
          <StatusBar style="dark" />
          {/* Page backdrop + phone-width app shell (centres the app on wide/web screens). */}
          <View style={styles.page}>
            <View style={styles.shell}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: theme.bg },
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="home-country" options={flowHeader('Home market')} />
                <Stack.Screen name="dest-country" options={flowHeader('Destination')} />
                <Stack.Screen name="category/[category]" options={flowHeader('Category')} />
                <Stack.Screen name="product" options={flowHeader('Product')} />
                <Stack.Screen name="price" options={flowHeader('Enter price')} />
                <Stack.Screen name="result" options={flowHeader('Verdict')} />
                <Stack.Screen name="submit" options={flowHeader('Contribute')} />
              </Stack>
            </View>
          </View>
        </CaptureProvider>
      </TripProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: theme.bg, alignItems: 'center' },
  shell: { flex: 1, width: '100%', maxWidth: 480 },
});
