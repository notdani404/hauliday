import { useCallback, useState } from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { format, money, isCurrencyCode } from '@hauliday/money';
import { pending, flush, type PendingObservation } from '../../lib/queue';
import { Button } from '../../lib/ui';
import { theme } from '../../lib/theme';

function fmtAmount(it: PendingObservation): string {
  return isCurrencyCode(it.currency)
    ? format(money(BigInt(it.amountMinor), it.currency))
    : `${it.currency} ${it.amountMinor}`;
}
function seenAgo(dateISO: string): string {
  const days = Math.max(0, Math.round((Date.now() - new Date(dateISO + 'T00:00:00Z').getTime()) / 86400000));
  return days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
}

export default function HistoryTab() {
  const [items, setItems] = useState<PendingObservation[]>([]);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    void pending().then(setItems);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  async function sync() {
    setBusy(true);
    try {
      await flush();
      reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <Text style={styles.title}>Your contributions</Text>
      <Text style={styles.sub}>
        {items.length === 0
          ? 'Everything is synced. Prices you share sync automatically when you have signal.'
          : `${items.length} price${items.length === 1 ? '' : 's'} waiting to sync.`}
      </Text>

      <ScrollView style={styles.list} contentContainerStyle={{ gap: 10 }}>
        {items.map((it) => (
          <View key={it.localId} style={styles.row}>
            <View>
              <Text style={styles.rowMain}>
                {fmtAmount(it)} · {it.channel === 'in_store' ? 'in-store' : 'online'}
              </Text>
              <Text style={styles.rowSub}>seen {seenAgo(it.observedOn)}</Text>
            </View>
            <Text style={styles.pendingTag}>pending</Text>
          </View>
        ))}
      </ScrollView>

      {items.length > 0 && (
        <View style={styles.footer}>
          <Button title={busy ? 'Syncing…' : 'Sync now'} onPress={() => void sync()} disabled={busy} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 24, paddingTop: 12 },
  title: { fontSize: 24, fontWeight: '800', color: theme.ink, marginTop: 8 },
  sub: { fontSize: 14, color: theme.slate, marginTop: 6, marginBottom: 14 },
  list: { flex: 1 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 12,
    padding: 14,
  },
  rowMain: { fontSize: 15, fontWeight: '600', color: theme.ink },
  rowSub: { fontSize: 12, color: theme.slate, marginTop: 2 },
  pendingTag: { fontSize: 11, fontWeight: '700', color: '#C99A4A' },
  footer: { paddingBottom: 24, paddingTop: 8 },
});
