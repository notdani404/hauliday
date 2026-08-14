import { useEffect, useState } from 'react';
import { Text, View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCapture } from '../lib/capture';
import { useTrip } from '../lib/trip';
import { listRetailers, type RetailerOption, type Channel } from '../lib/catalog';
import { captureObservation } from '../lib/observations';
import { Button } from '../lib/ui';
import { theme } from '../lib/theme';

export default function Submit() {
  const { session, clear } = useCapture();
  const { dest } = useTrip();
  const [retailers, setRetailers] = useState<RetailerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [retailerId, setRetailerId] = useState<string | null>(null);
  const [channel, setChannel] = useState<Channel>('in_store');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session?.variant || !dest || session.destShelfMinor == null) {
      router.replace('/scan');
      return;
    }
    listRetailers(dest.code)
      .then(setRetailers)
      .finally(() => setLoading(false));
  }, []);

  if (!session?.variant || !dest || session.destShelfMinor == null) return null;

  async function submit() {
    if (!retailerId || !session?.variant || session.destShelfMinor == null || !dest) return;
    setBusy(true);
    const res = await captureObservation({
      variantId: session.variant.variantId,
      retailerId,
      channel,
      amountMinor: Number(session.destShelfMinor),
      currency: dest.currency,
      taxInclusive: true,
    });
    clear();
    router.replace({
      pathname: '/scan',
      params: { toast: res.synced ? 'Thanks — price shared!' : 'Saved. Will sync when online.' },
    });
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Where did you see it?</Text>
      <Text style={styles.sub}>Your price helps the next traveller. Online and in-store stay separate.</Text>

      <View style={styles.channelRow}>
        {(['in_store', 'online'] as Channel[]).map((c) => (
          <Pressable
            key={c}
            style={[styles.chip, channel === c && styles.chipSel]}
            onPress={() => setChannel(c)}
          >
            <Text style={[styles.chipText, channel === c && styles.chipTextSel]}>
              {c === 'in_store' ? 'In-store' : 'Online'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.list} contentContainerStyle={{ gap: 10 }}>
        {loading ? (
          <Text style={styles.note}>Loading stores…</Text>
        ) : retailers.length === 0 ? (
          <Text style={styles.note}>
            No {dest.name} stores in the catalogue yet. Once seed data is loaded, you'll pick one here.
          </Text>
        ) : (
          retailers.map((r) => (
            <Pressable
              key={r.id}
              style={[styles.row, retailerId === r.id && styles.rowSel]}
              onPress={() => setRetailerId(r.id)}
            >
              <Text style={styles.rowName}>{r.name}</Text>
              {retailerId === r.id && <Text style={styles.tick}>✓</Text>}
            </Pressable>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={busy ? 'Saving…' : 'Share this price'}
          onPress={() => void submit()}
          disabled={!retailerId || busy}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 24, paddingTop: 12 },
  title: { fontSize: 24, fontWeight: '800', color: theme.ink, marginTop: 8 },
  sub: { fontSize: 14, color: theme.slate, marginTop: 6, marginBottom: 14 },
  channelRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  chip: { borderWidth: 1, borderColor: theme.line, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.white },
  chipSel: { borderColor: theme.coral, backgroundColor: '#FDECEE' },
  chipText: { fontSize: 13, fontWeight: '600', color: theme.slate },
  chipTextSel: { color: theme.coral },
  list: { flex: 1 },
  note: { fontSize: 14, color: theme.slate, lineHeight: 21, paddingVertical: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 12,
    padding: 14,
  },
  rowSel: { borderColor: theme.coral },
  rowName: { fontSize: 15, fontWeight: '600', color: theme.ink },
  tick: { marginLeft: 'auto', color: theme.green, fontWeight: '800' },
  footer: { paddingBottom: 24, paddingTop: 8 },
});
