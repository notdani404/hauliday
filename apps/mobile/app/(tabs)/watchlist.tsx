import { useCallback, useMemo, useState } from 'react';
import { Text, View, Pressable, StyleSheet, SectionList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { format } from '@hauliday/money';
import { suggestedShelfTargets } from '@hauliday/verdict';
import { useTrip } from '../../lib/trip';
import { marketByCode, taxFreeRate } from '../../lib/markets';
import { FX_SNAPSHOT } from '../../lib/fxSnapshot';
import { getWatchlist, removeWatch, type WatchItem } from '../../lib/catalog';
import { BrandMark, WatchHeart, moneyText } from '../../lib/ui';
import { theme } from '../../lib/theme';

export default function WatchlistTab() {
  const { home } = useTrip();
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    void getWatchlist(home.code).then((r) => {
      setItems(r);
      setLoaded(true);
    });
  }, [home.code]);

  useFocusEffect(useCallback(() => reload(), [reload]));

  async function remove(variantId: string) {
    setItems((prev) => prev.filter((i) => i.variant.variantId !== variantId));
    await removeWatch(variantId);
  }

  const sections = useMemo(() => {
    const groups = new Map<string, WatchItem[]>();
    for (const it of items) {
      const key = it.destCountry ?? 'any';
      const arr = groups.get(key) ?? [];
      arr.push(it);
      groups.set(key, arr);
    }
    return [...groups.entries()]
      .sort((a, b) => (a[0] === 'any' ? 1 : b[0] === 'any' ? -1 : a[0].localeCompare(b[0])))
      .map(([code, data]) => {
        const m = code === 'any' ? null : marketByCode(code);
        return { code, title: m ? `${m.flag} ${m.name}` : 'Any trip', data };
      });
  }, [items]);

  function lookFor(item: WatchItem): string | null {
    const code = item.destCountry;
    const m = code ? marketByCode(code) : null;
    if (!item.homePrice || !m) return null;
    const rate = FX_SNAPSHOT.perUnitSGD[m.currency];
    if (!rate) return null;
    const t = suggestedShelfTargets(item.homePrice, {
      taxFreeRate: taxFreeRate(m.code),
      rate,
      destCurrency: m.currency,
    });
    return `Worth it under ${format(t.worthIt)}`;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.brandRow}>
        <BrandMark />
      </View>
      <Text style={styles.title}>Watchlist</Text>
      <Text style={styles.sub}>Saved by trip. Tap an item to set a target, change its trip, or log a price.</Text>

      <SectionList
        sections={sections}
        keyExtractor={(i) => i.variant.variantId}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListEmptyComponent={
          loaded ? (
            <Text style={styles.empty}>Nothing saved yet. Tap the ♡ on any product in the Catalogue to add it here.</Text>
          ) : null
        }
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }) => {
          const look = lookFor(item);
          return (
            <View style={styles.row}>
              <Pressable
                style={styles.rowMain}
                onPress={() => router.push({ pathname: '/watch/[variantId]', params: { variantId: item.variant.variantId } })}
              >
                <Text style={styles.brand}>{item.variant.brand}</Text>
                <Text style={styles.name} numberOfLines={2}>{item.variant.productName}</Text>
                <Text style={styles.meta}>
                  {item.homePrice ? `${moneyText(item.homePrice)} home` : 'no home price'}
                  {item.target ? `  ·  target ${format(item.target)}` : ''}
                </Text>
                {look && <Text style={styles.look}>{look}</Text>}
              </Pressable>
              <WatchHeart active onPress={() => void remove(item.variant.variantId)} />
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  brandRow: { paddingTop: 4 },
  title: { fontSize: 24, fontWeight: '800', color: theme.ink },
  sub: { fontSize: 13, color: theme.slate, lineHeight: 19 },
  empty: { textAlign: 'center', color: theme.slate, marginTop: 32, fontSize: 14, lineHeight: 21, paddingHorizontal: 12 },
  sectionHeader: { fontSize: 12, fontWeight: '800', color: theme.slate, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.white, borderWidth: 1, borderColor: theme.line, borderRadius: 12, padding: 12, marginBottom: 8 },
  rowMain: { flex: 1 },
  brand: { fontSize: 11, color: theme.coral, fontWeight: '700', textTransform: 'uppercase' },
  name: { fontSize: 14, fontWeight: '600', color: theme.ink, marginTop: 1 },
  meta: { fontSize: 11, color: theme.slate, marginTop: 2 },
  look: { fontSize: 12, color: theme.green, fontWeight: '600', marginTop: 4 },
});
