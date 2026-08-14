import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ensureAnonymousSession } from '../lib/supabase';
import { flush } from '../lib/queue';
import { TripProvider } from '../lib/trip';
import { CaptureProvider } from '../lib/capture';
import { theme } from '../lib/theme';

export default function RootLayout() {
  // Anonymous identity up front (first scan is never gated), then try to sync
  // anything queued while offline.
  useEffect(() => {
    void ensureAnonymousSession().then(() => flush().catch(() => {}));
  }, []);

  return (
    <SafeAreaProvider>
      <TripProvider>
        <CaptureProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.bg },
            }}
          />
        </CaptureProvider>
      </TripProvider>
    </SafeAreaProvider>
  );
}
