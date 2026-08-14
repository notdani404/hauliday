import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ensureAnonymousSession } from '../lib/supabase';

export default function RootLayout() {
  // Establish an anonymous identity up front — the first scan is never gated.
  useEffect(() => {
    void ensureAnonymousSession();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
