import { useEffect, useState } from 'react';
import { Text, View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTrip } from '../lib/trip';
import { useAuthUser, signInWithGoogle, handleOAuthReturn } from '../lib/auth';
import { getProfile } from '../lib/profile';
import { Button } from '../lib/ui';
import { theme } from '../lib/theme';

export default function Welcome() {
  const { dest, hydrated } = useTrip();
  const { user, isAnonymous, loading } = useAuthUser();
  const [deciding, setDeciding] = useState(true);
  const [busy, setBusy] = useState(false);

  const enterApp = () => router.replace(dest ? '/(tabs)/search' : '/dest-country');

  // Safety: never hang on the splash (e.g. an OAuth callback that errored).
  useEffect(() => {
    const t = setTimeout(() => setDeciding(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // Returning signed-in users skip the landing: straight in if they have a
  // profile, into onboarding if they're new. While an OAuth callback is being
  // processed (code/token in the URL), keep the splash so we don't flash the
  // landing before the session resolves.
  useEffect(() => {
    if (loading || !hydrated) return;
    if (user && !isAnonymous) {
      getProfile(user.id).then((profile) => {
        router.replace(profile ? (dest ? '/(tabs)/search' : '/dest-country') : '/onboarding');
      });
      return;
    }
    const url = typeof window !== 'undefined' ? window.location.search + window.location.hash : '';
    if (/[?#&]error=/.test(url)) {
      // The callback errored. If it was a failed anon→Google link attempt we armed
      // a retry — complete a plain sign-in instead; otherwise fall back to landing.
      handleOAuthReturn().then((res) => {
        if (res !== 'redirecting') setDeciding(false);
      });
      return;
    }
    if (/[?#&](code|access_token)=/.test(url)) return; // successful callback still resolving → hold splash
    setDeciding(false); // anonymous / no session → show the landing
  }, [loading, hydrated, user, isAnonymous]);

  if (deciding) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <Image source={require('../assets/logo-vertical.png')} style={styles.logo} resizeMode="contain" />
        <ActivityIndicator color={theme.coral} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <Image
          source={require('../assets/logo-vertical.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Hauliday"
        />
        <Text style={styles.tagline}>Know before you haul.</Text>
        <Text style={styles.sub}>
          Compare prices.{'\n'}Shop smarter.{'\n'}Make every haul worth it.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          title={busy ? 'Opening Google…' : 'Continue with Google'}
          onPress={async () => {
            setBusy(true);
            try {
              await signInWithGoogle();
            } catch {
              setBusy(false);
            }
          }}
          disabled={busy}
        />
        <View style={{ height: 10 }} />
        <Button title="Start comparing" variant="ghost" onPress={enterApp} disabled={busy} />
        <Text style={styles.note}>Start comparing right away — no account needed. Sign in anytime to save your list.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 24 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 20 },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  logo: { width: 210, height: 266, marginBottom: 4 },
  tagline: { fontSize: 18, fontWeight: '700', color: theme.coral, textAlign: 'center' },
  sub: { fontSize: 15, lineHeight: 26, color: theme.slate, textAlign: 'center' },
  footer: { paddingBottom: 24 },
  note: { fontSize: 12, color: theme.slate, textAlign: 'center', marginTop: 12, lineHeight: 17 },
});
