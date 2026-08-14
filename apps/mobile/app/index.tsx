import { useEffect, useState } from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { theme } from '../lib/theme';

export default function Welcome() {
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUid(data.session?.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) =>
      setUid(session?.user?.id ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <Text style={styles.wordmark}>Hauliday</Text>
        <Text style={styles.tagline}>Know before you haul.</Text>
        <Text style={styles.sub}>Compare prices.{'\n'}Shop smarter.{'\n'}Make every haul worth it.</Text>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.cta} disabled>
          <Text style={styles.ctaText}>Get started</Text>
        </Pressable>
        <Text style={styles.status}>
          {uid ? `● anonymous session ready` : '○ connecting…'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 24 },
  body: { flex: 1, justifyContent: 'center', gap: 10 },
  wordmark: { fontSize: 40, fontWeight: '800', color: theme.ink, letterSpacing: -0.5 },
  tagline: { fontSize: 18, fontWeight: '700', color: theme.coral },
  sub: { fontSize: 15, lineHeight: 26, color: theme.slate, marginTop: 8 },
  footer: { paddingBottom: 24, gap: 12 },
  cta: { backgroundColor: theme.coral, paddingVertical: 15, borderRadius: 12, alignItems: 'center', opacity: 0.6 },
  ctaText: { color: theme.white, fontWeight: '700', fontSize: 15 },
  status: { textAlign: 'center', fontSize: 12, color: theme.slate },
});
