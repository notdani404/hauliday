import { Text, View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTrip } from '../lib/trip';
import { Button } from '../lib/ui';
import { theme } from '../lib/theme';

export default function Main() {
  const { home, dest } = useTrip();
  const { toast } = useLocalSearchParams<{ toast?: string }>();

  return (
    <SafeAreaView style={styles.screen}>
      {toast ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
      <View style={styles.header}>
        <Text style={styles.wordmark}>Hauliday</Text>
        <Pressable onPress={() => router.push('/history')} hitSlop={8}>
          <Text style={styles.link}>History</Text>
        </Pressable>
      </View>

      <Pressable style={styles.trip} onPress={() => router.push('/dest-country')}>
        <Text style={styles.tripText}>
          {home.flag} {home.name} <Text style={styles.arrow}>⇄</Text> {dest?.flag ?? '📍'}{' '}
          {dest?.name ?? 'Pick a destination'}
        </Text>
        <Text style={styles.tripEdit}>Change</Text>
      </Pressable>

      <View style={styles.body}>
        <Text style={styles.prompt}>Standing in a shop?</Text>
        <Text style={styles.sub}>Scan a barcode and we'll tell you if it's worth the haul.</Text>
      </View>

      <View style={styles.footer}>
        <Button title="Scan a barcode" onPress={() => router.push('/scan')} disabled={!dest} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 24, paddingTop: 8 },
  toast: { backgroundColor: '#E4F3EA', borderRadius: 10, padding: 10, marginBottom: 8 },
  toastText: { color: theme.green, fontWeight: '700', fontSize: 13, textAlign: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordmark: { fontSize: 22, fontWeight: '800', color: theme.ink },
  link: { fontSize: 14, color: theme.coral, fontWeight: '700' },
  trip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  tripText: { fontSize: 14, fontWeight: '600', color: theme.ink, flexShrink: 1 },
  arrow: { color: theme.coral },
  tripEdit: { fontSize: 12, color: theme.slate, marginLeft: 8 },
  body: { flex: 1, justifyContent: 'center', gap: 8 },
  prompt: { fontSize: 26, fontWeight: '800', color: theme.ink },
  sub: { fontSize: 15, lineHeight: 24, color: theme.slate },
  footer: { paddingBottom: 24 },
});
