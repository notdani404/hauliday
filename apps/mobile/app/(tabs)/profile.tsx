import { useState } from 'react';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthUser, signInWithGoogle, signOut } from '../../lib/auth';
import { Button } from '../../lib/ui';
import { theme } from '../../lib/theme';

export default function ProfileTab() {
  const { email, isAnonymous, loading } = useAuthUser();
  const [busy, setBusy] = useState(false);

  async function google() {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch {
      setBusy(false);
    }
  }
  async function out() {
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
    }
  }

  const signedIn = !!email && !isAnonymous;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Text style={styles.title}>Account</Text>

      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator color={theme.coral} />
        ) : signedIn ? (
          <>
            <Text style={styles.emoji}>✅</Text>
            <Text style={styles.state}>Signed in</Text>
            <Text style={styles.email}>{email}</Text>
          </>
        ) : (
          <>
            <Text style={styles.emoji}>👤</Text>
            <Text style={styles.state}>Signed in anonymously</Text>
            <Text style={styles.sub}>
              Your scans and contributions work right away. Sign in to keep them across devices and
              build your contributor trust.
            </Text>
          </>
        )}
      </View>

      <View style={styles.footer}>
        {signedIn ? (
          <Button title={busy ? '…' : 'Sign out'} variant="ghost" onPress={() => void out()} disabled={busy} />
        ) : (
          <Button
            title={busy ? 'Opening Google…' : 'Continue with Google'}
            onPress={() => void google()}
            disabled={busy || loading}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 24, paddingTop: 12 },
  title: { fontSize: 24, fontWeight: '800', color: theme.ink, marginTop: 8, marginBottom: 16 },
  card: {
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emoji: { fontSize: 36 },
  state: { fontSize: 16, fontWeight: '800', color: theme.ink },
  email: { fontSize: 14, color: theme.slate },
  sub: { fontSize: 13, color: theme.slate, textAlign: 'center', lineHeight: 20, marginTop: 2 },
  footer: { flex: 1, justifyContent: 'flex-end', paddingBottom: 24 },
});
