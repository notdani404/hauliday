import { useEffect, useState } from 'react';
import { Text, View, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { fromDecimal, format, type Money } from '@hauliday/money';
import { suggestedShelfTargets } from '@hauliday/verdict';
import { useTrip } from '../../lib/trip';
import { taxFreeRate, marketByCode, DESTINATION_COUNTRIES } from '../../lib/markets';
import { FX_SNAPSHOT } from '../../lib/fxSnapshot';
import {
  getWatchlist,
  getHomeEstimates,
  setWatchlistTarget,
  setWatchlistCountry,
  removeWatch,
  type WatchItem,
  type HomeEstimates,
} from '../../lib/catalog';
import { useOpenVariant } from '../../lib/useOpenVariant';
import { Button, Card, confidenceLabel } from '../../lib/ui';
import { theme } from '../../lib/theme';

export default function WatchDetail() {
  const { variantId } = useLocalSearchParams<{ variantId: string }>();
  const { home, dest } = useTrip();
  const openVariant = useOpenVariant();
  const [item, setItem] = useState<WatchItem | null>(null);
  const [estimates, setEstimates] = useState<HomeEstimates | null>(null);
  const [targetText, setTargetText] = useState('');
  const [note, setNote] = useState('');
  const [itemDest, setItemDest] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await getWatchlist(home.code);
      const found = list.find((i) => i.variant.variantId === variantId) ?? null;
      setItem(found);
      if (found) {
        setTargetText(found.target ? targetToText(found.target) : '');
        setNote(found.note ?? '');
        setItemDest(found.destCountry);
        setEstimates(await getHomeEstimates(variantId, home.code));
      }
      setLoading(false);
    })();
  }, [variantId, home.code]);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.coral} />
      </SafeAreaView>
    );
  }
  if (!item) {
    return (
      <SafeAreaView style={styles.screen}>
        <Stack.Screen options={{ title: 'Watchlist' }} />
        <Text style={styles.gone}>This item isn't on your watchlist.</Text>
      </SafeAreaView>
    );
  }

  const tripMarket = itemDest ? marketByCode(itemDest) ?? null : dest;
  const targets =
    item.homePrice && tripMarket && FX_SNAPSHOT.perUnitSGD[tripMarket.currency]
      ? suggestedShelfTargets(item.homePrice, {
          taxFreeRate: taxFreeRate(tripMarket.code),
          rate: FX_SNAPSHOT.perUnitSGD[tripMarket.currency]!,
          destCurrency: tripMarket.currency,
        })
      : null;

  function chooseTrip(code: string | null) {
    setItemDest(code);
    void setWatchlistCountry(variantId, code);
  }

  async function saveTarget() {
    setSaving(true);
    try {
      const t = parseTarget(targetText, home.currency);
      await setWatchlistTarget(variantId, t, note);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    await removeWatch(variantId);
    router.back();
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      <Stack.Screen options={{ title: item.variant.brand }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
          <View>
            <Text style={styles.brand}>{item.variant.brand}</Text>
            <Text style={styles.name}>{item.variant.productName}</Text>
            <Text style={styles.size}>
              {item.variant.sizeValue ? `${item.variant.sizeValue}${item.variant.sizeUnit ?? ''} · ` : ''}
              {item.variant.market} market
            </Text>
          </View>

          <Text style={styles.section}>At home</Text>
          <EstimateLine label="In-store" est={estimates?.inStore ?? null} />
          <EstimateLine label="Online" est={estimates?.online ?? null} />

          <Text style={styles.section}>For which trip?</Text>
          <View style={styles.chips}>
            {DESTINATION_COUNTRIES.map((m) => (
              <Pressable
                key={m.code}
                style={[styles.chip, itemDest === m.code && styles.chipSel]}
                onPress={() => chooseTrip(m.code)}
              >
                <Text style={[styles.chipText, itemDest === m.code && styles.chipTextSel]}>{m.flag} {m.name}</Text>
              </Pressable>
            ))}
            <Pressable style={[styles.chip, !itemDest && styles.chipSel]} onPress={() => chooseTrip(null)}>
              <Text style={[styles.chipText, !itemDest && styles.chipTextSel]}>Any trip</Text>
            </Pressable>
          </View>

          {targets && tripMarket ? (
            <Card style={styles.goodCard}>
              <Text style={styles.goodTitle}>A good price in {tripMarket.name}</Text>
              <Text style={styles.goodLine}>🤔 Worth it under <Text style={styles.goodAmt}>{format(targets.worthIt)}</Text></Text>
              <Text style={styles.goodLine}>🛍️ Great under <Text style={styles.goodAmt}>{format(targets.great)}</Text></Text>
              <Text style={styles.goodNote}>Shelf price before the {Math.round(taxFreeRate(tripMarket.code) * 100)}% tax refund · FX as of {FX_SNAPSHOT.asOf}.</Text>
            </Card>
          ) : (
            <Text style={styles.dim}>Choose a trip to see what a good price looks like there.</Text>
          )}

          <Text style={styles.section}>Your target</Text>
          <View style={styles.targetRow}>
            <Text style={styles.cur}>{home.currency}</Text>
            <TextInput
              style={styles.input}
              value={targetText}
              onChangeText={(v) => { setTargetText(v); setSaved(false); }}
              placeholder="e.g. 30.00 — alert-worthy home price"
              placeholderTextColor={theme.slate}
              keyboardType="decimal-pad"
            />
          </View>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={(v) => { setNote(v); setSaved(false); }}
            placeholder="Note (optional) — colour, size, who it's for…"
            placeholderTextColor={theme.slate}
          />
          <Button title={saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save target'} onPress={() => void saveTarget()} disabled={saving} />

          <View style={{ height: 6 }} />
          <Button title="Log the price you see" variant="ghost" onPress={() => void openVariant(item!.variant, item!.gtin)} />
          <Text onPress={() => void remove()} style={styles.remove}>Remove from watchlist</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function EstimateLine({ label, est }: { label: string; est: { price: Money | null; observationCount: number; confidence: number } | null }) {
  if (!est || !est.price || est.observationCount === 0) {
    return (
      <View style={styles.estRow}>
        <Text style={styles.estLabel}>{label}</Text>
        <Text style={styles.estEmpty}>No price yet</Text>
      </View>
    );
  }
  return (
    <View style={styles.estRow}>
      <Text style={styles.estLabel}>{label}</Text>
      <Text style={styles.estPrice}>
        {format(est.price)} <Text style={styles.estConf}>· {confidenceLabel(est.confidence)}</Text>
      </Text>
    </View>
  );
}

function targetToText(m: Money): string {
  return format(m).replace(/[^\d.]/g, '');
}
function parseTarget(text: string, currency: Money['currency']): Money | null {
  const t = text.trim();
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  try {
    const m = fromDecimal(t, currency);
    return m.amountMinor > 0n ? m : null;
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  gone: { textAlign: 'center', color: theme.slate, marginTop: 40 },
  brand: { fontSize: 13, color: theme.coral, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  name: { fontSize: 22, fontWeight: '800', color: theme.ink, marginTop: 2 },
  size: { fontSize: 13, color: theme.slate, marginTop: 4 },
  section: { fontSize: 12, fontWeight: '700', color: theme.slate, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: theme.line, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: theme.white },
  chipSel: { borderColor: theme.coral, backgroundColor: '#FDECEE' },
  chipText: { fontSize: 13, fontWeight: '600', color: theme.slate },
  chipTextSel: { color: theme.coral },
  estRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.white, borderWidth: 1, borderColor: theme.line, borderRadius: 12, padding: 14 },
  estLabel: { fontSize: 13, color: theme.slate, fontWeight: '600' },
  estPrice: { fontSize: 16, fontWeight: '800', color: theme.ink },
  estConf: { fontSize: 12, fontWeight: '600', color: theme.slate },
  estEmpty: { fontSize: 14, color: theme.slate, fontStyle: 'italic' },
  goodCard: { backgroundColor: '#EEF6F0', borderColor: '#CFE7D8', gap: 4 },
  goodTitle: { fontSize: 14, fontWeight: '800', color: '#2F7D54' },
  goodLine: { fontSize: 14, color: theme.ink, marginTop: 2 },
  goodAmt: { fontWeight: '800', color: '#2F7D54' },
  goodNote: { fontSize: 11, color: theme.slate, marginTop: 6 },
  dim: { fontSize: 13, color: theme.slate },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.white, borderWidth: 1, borderColor: theme.line, borderRadius: 12, paddingHorizontal: 14 },
  cur: { fontSize: 16, fontWeight: '700', color: theme.slate },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: theme.ink },
  noteInput: { borderWidth: 1, borderColor: theme.line, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, backgroundColor: theme.white, color: theme.ink },
  remove: { textAlign: 'center', color: theme.slate, fontSize: 13, paddingVertical: 16, textDecorationLine: 'underline' },
});
