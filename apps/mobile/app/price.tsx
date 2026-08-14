import { useEffect, useState } from 'react';
import { Text, View, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { fromDecimal, scale, format, type Money } from '@hauliday/money';
import { useCapture } from '../lib/capture';
import { useTrip } from '../lib/trip';
import { taxFreeRate } from '../lib/markets';
import { toHomeSGD, FX_SNAPSHOT } from '../lib/fxSnapshot';
import { Button } from '../lib/ui';
import { theme } from '../lib/theme';

function tryParse(text: string, currency: Money['currency']): Money | null {
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  try {
    const m = fromDecimal(text, currency);
    return m.amountMinor > 0n ? m : null;
  } catch {
    return null;
  }
}

export default function Price() {
  const { session, setDestShelfMinor } = useCapture();
  const { dest } = useTrip();
  const [text, setText] = useState('');

  useEffect(() => {
    if (!session || !dest) router.replace('/scan');
  }, [session, dest]);
  if (!session || !dest) return null;

  const cur = dest.currency;
  const tf = taxFreeRate(dest.code);
  const parsed = tryParse(text, cur);

  let convLine = '';
  if (parsed) {
    const home = toHomeSGD(parsed);
    convLine = `≈ ${format(home)}`;
    if (tf > 0) {
      const effective = toHomeSGD(scale(parsed, 1 - tf));
      convLine += `   ·   tax-free ≈ ${format(effective)}`;
    }
  }

  const confirm = () => {
    if (!parsed) return;
    setDestShelfMinor(parsed.amountMinor);
    router.push('/result');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>What's on the shelf?</Text>
      <Text style={styles.sub}>Enter the price in {cur} — exactly as shown.</Text>

      <View style={styles.amountRow}>
        <Text style={styles.cur}>{cur}</Text>
        <TextInput
          style={styles.amount}
          value={text}
          onChangeText={setText}
          placeholder="0"
          keyboardType="decimal-pad"
          autoFocus
        />
      </View>
      <Text style={styles.conv}>{convLine}</Text>

      {tf > 0 && (
        <View style={styles.taxnote}>
          <Text style={styles.taxEmoji}>🏷️</Text>
          <Text style={styles.taxText}>
            Tax-free available here. Enter the shelf price — we'll show both the sticker and the
            after-refund price.
          </Text>
        </View>
      )}
      <Text style={styles.fxNote}>Card FX as of {FX_SNAPSHOT.asOf}.</Text>

      <View style={styles.footer}>
        <Button title="See the verdict" onPress={confirm} disabled={!parsed} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 24, paddingTop: 12 },
  title: { fontSize: 24, fontWeight: '800', color: theme.ink, marginTop: 8 },
  sub: { fontSize: 14, color: theme.slate, marginTop: 6 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 28 },
  cur: { fontSize: 22, fontWeight: '700', color: theme.slate },
  amount: {
    flex: 1,
    fontSize: 44,
    fontWeight: '800',
    color: theme.ink,
    padding: 0,
  },
  conv: { fontSize: 15, color: theme.green, fontWeight: '600', minHeight: 22, marginTop: 6 },
  taxnote: {
    flexDirection: 'row',
    gap: 9,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.line,
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
  },
  taxEmoji: { fontSize: 16 },
  taxText: { flex: 1, fontSize: 12, lineHeight: 18, color: theme.slate },
  fxNote: { fontSize: 11, color: theme.slate, marginTop: 10 },
  footer: { flex: 1, justifyContent: 'flex-end', paddingBottom: 24 },
});
