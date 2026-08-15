import { useEffect, useState } from 'react';
import { Text, View, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { fromDecimal, scale, format, minorUnits, type Money } from '@hauliday/money';
import { useCapture } from '../lib/capture';
import { useTrip } from '../lib/trip';
import { taxFreeRate } from '../lib/markets';
import { toHomeSGD, FX_SNAPSHOT } from '../lib/fxSnapshot';
import { Button } from '../lib/ui';
import { theme } from '../lib/theme';

function tryParse(text: string, currency: Money['currency']): Money | null {
  // Zero-decimal currencies (JPY/KRW) take whole numbers only.
  const pattern = minorUnits(currency) === 0 ? /^\d+$/ : /^\d+(\.\d+)?$/;
  if (!pattern.test(text)) return null;
  try {
    const m = fromDecimal(text, currency);
    return m.amountMinor > 0n ? m : null;
  } catch {
    return null;
  }
}

export default function Price() {
  const { mode, shopping } = useTrip();
  const { session, setDestShelfMinor } = useCapture();
  const [text, setText] = useState('');

  useEffect(() => {
    if (!session || !shopping) router.replace('/scan');
  }, [session, shopping]);
  if (!session || !shopping) return null;

  const atHome = mode === 'home';
  const cur = shopping.currency;
  const tf = atHome ? 0 : taxFreeRate(shopping.code);
  const parsed = tryParse(text, cur);

  let convLine = '';
  if (parsed && !atHome) {
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
    router.push(atHome ? '/submit' : '/result');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.body}>
          <Text style={styles.title}>{atHome ? "What's the price here?" : "What's on the shelf?"}</Text>
          <Text style={styles.sub}>Enter the price in {cur} — exactly as shown.</Text>

          <View style={styles.amountCard}>
            <Text style={styles.cur}>{cur}</Text>
            <TextInput
              style={styles.amount}
              value={text}
              onChangeText={setText}
              placeholder="0"
              placeholderTextColor={theme.line}
              keyboardType={minorUnits(cur) === 0 ? 'number-pad' : 'decimal-pad'}
              autoFocus
              maxLength={12}
            />
          </View>
          <Text style={styles.conv}>{convLine}</Text>

          {tf > 0 && (
            <View style={styles.taxnote}>
              <Text style={styles.taxEmoji}>🏷️</Text>
              <Text style={styles.taxText}>
                Tax-free available here. Enter the shelf price — we'll show both the sticker and
                the after-refund price.
              </Text>
            </View>
          )}
          {!atHome && <Text style={styles.fxNote}>Card FX as of {FX_SNAPSHOT.asOf}.</Text>}
        </View>

        <View style={styles.footer}>
          <Button title={atHome ? 'Log this price' : 'See the verdict'} onPress={confirm} disabled={!parsed} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 24 },
  flex: { flex: 1 },
  body: { flex: 1, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: '800', color: theme.ink },
  sub: { fontSize: 14, color: theme.slate, marginTop: 6 },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 24,
  },
  cur: { fontSize: 20, fontWeight: '700', color: theme.slate },
  amount: { flex: 1, fontSize: 36, fontWeight: '800', color: theme.ink, padding: 0 },
  conv: { fontSize: 15, color: theme.green, fontWeight: '600', minHeight: 22, marginTop: 10 },
  taxnote: {
    flexDirection: 'row',
    gap: 9,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.line,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  taxEmoji: { fontSize: 16 },
  taxText: { flex: 1, fontSize: 12, lineHeight: 18, color: theme.slate },
  fxNote: { fontSize: 11, color: theme.slate, marginTop: 10 },
  footer: { paddingBottom: 16, paddingTop: 8 },
});
