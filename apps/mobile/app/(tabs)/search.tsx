import { useEffect, useState } from 'react';
import { Text, View, TextInput, Pressable, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTrip } from '../../lib/trip';
import { useCapture } from '../../lib/capture';
import { searchVariants, getHomeEstimates, type SearchResult } from '../../lib/catalog';
import { TripHeader, moneyText } from '../../lib/ui';
import { theme } from '../../lib/theme';

export default function SearchTab() {
  const { home } = useTrip();
  const { begin } = useCapture();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Debounced search; empty query browses the catalogue.
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      searchVariants(query, home.code)
        .then(setResults)
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [query, home.code]);

  async function open(r: SearchResult) {
    let estimates = null;
    try {
      estimates = await getHomeEstimates(r.variant.variantId, home.code);
    } catch {
      // fall through with no estimates rather than trapping the user
    }
    begin({ gtin: r.gtin ?? '', variant: r.variant, home: estimates });
    router.push('/product');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <TripHeader />
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Search brand or product…"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      <FlatList
        data={results}
        keyExtractor={(r) => r.variant.variantId}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 10, paddingBottom: 12 }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 24 }} color={theme.coral} />
          ) : (
            <Text style={styles.empty}>No matches. Try a brand like “Anessa” or “Merries”.</Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => void open(item)}>
            <View style={styles.rowMain}>
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
            </View>
            <View style={styles.rowPrice}>
              {item.homePrice ? (
                <>
                  <Text style={styles.price}>{moneyText(item.homePrice)}</Text>
                  <Text style={styles.priceMeta}>home · {item.observationCount}★</Text>
                </>
              ) : (
                <Text style={styles.priceMeta}>no home price</Text>
              )}
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: theme.white,
    color: theme.ink,
  },
  empty: { textAlign: 'center', color: theme.slate, marginTop: 24, fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  rowPrice: { alignItems: 'flex-end' },
  price: { fontSize: 15, fontWeight: '800', color: theme.ink },
  priceMeta: { fontSize: 10, color: theme.slate, marginTop: 2 },
});
