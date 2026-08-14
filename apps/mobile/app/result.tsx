import { useEffect } from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { money, format } from '@hauliday/money';
import { computeVerdict, type VerdictState } from '@hauliday/verdict';
import { useCapture } from '../lib/capture';
import { useTrip } from '../lib/trip';
import { taxFreeRate } from '../lib/markets';
import { FX_SNAPSHOT } from '../lib/fxSnapshot';
import { Button } from '../lib/ui';
import { theme } from '../lib/theme';

const VERDICT_BG: Record<VerdictState, string> = {
  great: theme.green,
  worth_it: '#C99A4A',
  about_same: '#8B8B93',
  cheaper_home: '#8B8B93',
  only_here: '#5B6BB5',
};

export default function Result() {
  const { session } = useCapture();
  const { dest } = useTrip();

  useEffect(() => {
    if (!session || !dest || session.destShelfMinor == null) router.replace('/main');
  }, [session, dest]);
  if (!session || !dest || session.destShelfMinor == null) return null;

  const destShelf = money(session.destShelfMinor, dest.currency);
  const homeRef =
    session.home?.inStore?.price ?? session.home?.online?.price ?? null;
  const rate = FX_SNAPSHOT.perUnitSGD[dest.currency];

  const verdict = computeVerdict({
    destShelf,
    taxFreeRate: taxFreeRate(dest.code),
    homeReference: homeRef,
    fx: { base: dest.currency, quote: 'SGD', rate: rate ?? '0' },
  });

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 16 }}>
        <View style={[styles.verdict, { backgroundColor: VERDICT_BG[verdict.state] }]}>
          <Text style={styles.vEmoji}>{verdict.emoji}</Text>
          <View style={styles.vTextWrap}>
            <Text style={styles.vHeadline}>{verdict.headline}</Text>
            <Text style={styles.vDetail}>{verdict.detail}</Text>
          </View>
        </View>

        {verdict.savings && verdict.savingsPct != null && verdict.savingsPct > 0 && (
          <View style={styles.savingsBox}>
            <Text style={styles.savingsLabel}>You save</Text>
            <Text style={styles.savingsBig}>{format(verdict.savings)}</Text>
            <Text style={styles.savingsPct}>{verdict.savingsPct}% cheaper than at home</Text>
          </View>
        )}

        <View style={styles.recap}>
          <Row k="Sticker price" v={format(destShelf)} />
          {taxFreeRate(dest.code) > 0 && (
            <Row
              k={`After ${Math.round(taxFreeRate(dest.code) * 100)}% tax refund`}
              v={`${format(verdict.effectiveDest)}  ≈ ${format(verdict.effectiveHome)}`}
              accent
            />
          )}
          {taxFreeRate(dest.code) === 0 && (
            <Row k="In home currency" v={`≈ ${format(verdict.effectiveHome)}`} />
          )}
          {homeRef && <Row k="Typical at home" v={format(homeRef)} />}
        </View>

        <Text style={styles.fxNote}>Card FX as of {FX_SNAPSHOT.asOf} · verdict excludes shipping.</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Contribute this price" onPress={() => router.push('/submit')} />
        <View style={{ height: 10 }} />
        <Button title="Scan another" variant="ghost" onPress={() => router.replace('/scan')} />
      </View>
    </SafeAreaView>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowK}>{k}</Text>
      <Text style={[styles.rowV, accent && { color: theme.green }]}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 24, paddingTop: 12 },
  verdict: { flexDirection: 'row', gap: 12, alignItems: 'center', borderRadius: 16, padding: 16 },
  vEmoji: { fontSize: 30 },
  vTextWrap: { flex: 1 },
  vHeadline: { fontSize: 16, fontWeight: '800', color: theme.white, marginBottom: 3 },
  vDetail: { fontSize: 12.5, lineHeight: 18, color: 'rgba(255,255,255,0.92)' },
  savingsBox: { alignItems: 'center', paddingVertical: 8 },
  savingsLabel: { fontSize: 12, color: theme.slate },
  savingsBig: { fontSize: 30, fontWeight: '800', color: theme.green, letterSpacing: -0.5 },
  savingsPct: { fontSize: 12, color: theme.slate },
  recap: {
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  rowK: { fontSize: 13, color: theme.slate, flexShrink: 1 },
  rowV: { fontSize: 14, fontWeight: '700', color: theme.ink, textAlign: 'right' },
  fxNote: { fontSize: 11, color: theme.slate, textAlign: 'center' },
  footer: { paddingBottom: 24, paddingTop: 8 },
});
