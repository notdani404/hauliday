import { useCallback, useState } from 'react';
import { Text, View, Pressable, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { getWatchlist, removeWatch, type WatchItem } from '../../lib/catalog';
import { useOpenVariant } from '../../lib/useOpenVariant';
import { BrandMark, WatchHeart } from '../../lib/ui';
import { theme } from '../../lib/theme';

export default function WatchlistTab() {
  const openVariant = useOpenVariant();
  const [items, setItems] = useState<WatchItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    void getWatchlist().then((r) => {
      setItems(r);
      setLoaded(true);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  async function remove(variantId: string) {
    setItems((prev) => prev.filter((i) => i.variant.variantId !== variantId));
    await removeWatch(variantId);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.brandRow}>
        <BrandMark />
      </View>
      <Text style={styles.title}>Watchlist</Text>
      <Text style={styles.sub}>
        Things you want to buy abroad. Pre-trip price alerts are coming — for now, tap one to check
        the current home price and log what you see.
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
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable style={styles.rowMain} onPress={() => void openVariant(item.variant, null)}>
              <Text style={styles.brand}>{item.variant.brand}</Text>
              <Text style={styles.name} numberOfLines={2}>
                {item.variant.productName}
              </Text>
              <Text style={styles.meta}>
                {item.variant.sizeValue
                  ? `${item.variant.sizeValue}${item.variant.sizeUnit ?? ''} · `
                  : ''}
                {item.variant.market} market
              </Text>
            </Pressable>
            <WatchHeart active onPress={() => void remove(item.variant.variantId)} />
          </View>
        )}
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
});
