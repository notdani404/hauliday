import { useCallback, useState } from 'react';
import { Text, View, Pressable, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { format } from '@hauliday/money';
import { suggestedShelfTargets } from '@hauliday/verdict';
import { useTrip } from '../../lib/trip';
import { taxFreeRate } from '../../lib/markets';
import { FX_SNAPSHOT } from '../../lib/fxSnapshot';
import { getWatchlist, removeWatch, type WatchItem } from '../../lib/catalog';
import { BrandMark, WatchHeart, moneyText } from '../../lib/ui';
import { theme } from '../../lib/theme';

export default function WatchlistTab() {
  const { home, dest } = useTrip();
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

  function lookFor(item: WatchItem): string | null {
    if (!item.homePrice || !dest) return null;
    const rate = FX_SNAPSHOT.perUnitSGD[dest.currency];
    if (!rate) return null;
    const t = suggestedShelfTargets(item.homePrice, {
      taxFreeRate: taxFreeRate(dest.code),
      rate,
      destCurrency: dest.currency,
    });
    return `In ${dest.name}: worth it under ${format(t.worthIt)}`;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.brandRow}>
        <BrandMark />
      </View>
      <Text style={styles.title}>Watchlist</Text>
      <Text style={styles.sub}>
        {dest
          ? `What to look for in ${dest.name}. Tap an item to set a target or log a price.`
          : 'Pick a destination to see what a good price looks like there.'}
      </Text>

      <FlatList
        data={items}
        keyExtractor={(i) => i.variant.variantId}
        contentContainerStyle={{ gap: 10, paddingBottom: 12 }}
        ListEmptyComponent={
          loaded ? (
            <Text style={styles.empty}>
              Nothing saved yet. Tap the ♡ on any product in the Catalogue to add it here.
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const look = lookFor(item);
          return (
            <View style={styles.row}>
              <Pressable
                style={styles.rowMain}
                onPress={() =>
                  router.push({ pathname: '/watch/[variantId]', params: { variantId: item.variant.variantId } })
                }
              >
                <Text style={styles.brand}>{item.variant.brand}</Text>
                <Text style={styles.name} numberOfLines={2}>
                  {item.variant.productName}
                </Text>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 12,
    padding: 12,
  },
  rowMain: { flex: 1 },
  brand: { fontSize: 11, color: theme.coral, fontWeight: '700', textTransform: 'uppercase' },
  name: { fontSize: 14, fontWeight: '600', color: theme.ink, marginTop: 1 },
  meta: { fontSize: 11, color: theme.slate, marginTop: 2 },
  look: { fontSize: 12, color: theme.green, fontWeight: '600', marginTop: 4 },
});
