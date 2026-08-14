import { useEffect } from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useCapture } from '../lib/capture';
import type { Estimate } from '../lib/catalog';
import { Button, Card, confidenceLabel, moneyText } from '../lib/ui';
import { theme } from '../lib/theme';

function daysAgo(dateISO: string | null): string {
  if (!dateISO) return '';
  const then = new Date(dateISO + 'T00:00:00Z').getTime();
  const days = Math.max(0, Math.round((Date.now() - then) / 86400000));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return `${Math.round(days / 30)} mo ago`;
}

function EstimateCard({ label, est }: { label: string; est: Estimate | null }) {
  if (!est || est.observationCount === 0 || !est.price) {
    return (
      <Card style={styles.estCard}>
        <Text style={styles.estLabel}>{label}</Text>
        <Text style={styles.estEmpty}>No price yet</Text>
      </Card>
    );
  }
  const conf = confidenceLabel(est.confidence);
  return (
    <Card style={styles.estCard}>
      <Text style={styles.estLabel}>{label}</Text>
      <Text style={styles.estPrice}>{moneyText(est.price)}</Text>
      <Text style={styles.estMeta}>
        {est.observationCount} shopper{est.observationCount === 1 ? '' : 's'} ·{' '}
        {daysAgo(est.freshestObservedOn)}
      </Text>
      <View style={[styles.confPill, styles[`conf_${conf}`]]}>
        <Text style={styles.confText}>{conf} confidence</Text>
      </View>
    </Card>
  );
}

export default function Product() {
  const { session } = useCapture();

  // Guard: no active scan -> back to main.
  useEffect(() => {
    if (!session) router.replace('/scan');
  }, [session]);
  if (!session) return null;

  // Unknown barcode (D-016): graceful miss, no user catalogue writes yet.
  if (!session.variant) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.unknownBox}>
          <Text style={styles.unknownEmoji}>🔍</Text>
          <Text style={styles.unknownTitle}>We don't have this one yet</Text>
          <Text style={styles.unknownSub}>
            Barcode {session.gtin} isn't in our catalogue. We've noted it — we add the
            most-scanned items first.
          </Text>
        </View>
        <View style={styles.footer}>
          <Button title="Scan another" onPress={() => router.replace('/scan')} />
        </View>
      </SafeAreaView>
    );
  }

  const v = session.variant;
  const soldAtHome = session.home?.soldAtHome ?? false;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 16 }}>
        <View>
          <Text style={styles.brand}>{v.brand}</Text>
          <Text style={styles.name}>{v.productName}</Text>
          <Text style={styles.size}>
            {v.sizeValue ? `${v.sizeValue}${v.sizeUnit ?? ''} · ` : ''}
            {v.market} market
          </Text>
        </View>

        {!soldAtHome ? (
          <Card style={styles.onlyHere}>
            <Text style={styles.onlyHereTitle}>🎁 Not sold at home</Text>
            <Text style={styles.onlyHereSub}>
              We can't find this in your home market. If you want it, this is the trip to buy it.
            </Text>
          </Card>
        ) : (
          <>
            <Text style={styles.sectionTitle}>At home</Text>
            <EstimateCard label="In-store" est={session.home?.inStore ?? null} />
            <EstimateCard label="Online" est={session.home?.online ?? null} />
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Enter the price you see" onPress={() => router.push('/price')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 24, paddingTop: 12 },
  brand: { fontSize: 13, color: theme.coral, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  name: { fontSize: 22, fontWeight: '800', color: theme.ink, marginTop: 2 },
  size: { fontSize: 13, color: theme.slate, marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.slate, textTransform: 'uppercase', letterSpacing: 0.5 },
  estCard: { gap: 4 },
  estLabel: { fontSize: 12, color: theme.slate, fontWeight: '600' },
  estPrice: { fontSize: 22, fontWeight: '800', color: theme.ink },
  estMeta: { fontSize: 12, color: theme.slate },
  estEmpty: { fontSize: 15, color: theme.slate, fontStyle: 'italic' },
  confPill: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4 },
  conf_high: { backgroundColor: '#E4F3EA' },
  conf_medium: { backgroundColor: '#FBF0DC' },
  conf_low: { backgroundColor: '#F0ECEA' },
  confText: { fontSize: 11, fontWeight: '700', color: theme.ink },
  onlyHere: { backgroundColor: '#EEF0FA', borderColor: '#D6DBF2' },
  onlyHereTitle: { fontSize: 16, fontWeight: '800', color: '#3D4C83' },
  onlyHereSub: { fontSize: 13, color: '#5B6BB5', marginTop: 4, lineHeight: 19 },
  unknownBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  unknownEmoji: { fontSize: 40 },
  unknownTitle: { fontSize: 20, fontWeight: '800', color: theme.ink },
  unknownSub: { fontSize: 14, color: theme.slate, textAlign: 'center', lineHeight: 21 },
  footer: { paddingBottom: 24, paddingTop: 8 },
});
