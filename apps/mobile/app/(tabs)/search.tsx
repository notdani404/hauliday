import { useCallback, useEffect, useState } from 'react';
import { Text, View, TextInput, Pressable, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useTrip } from '../../lib/trip';
import { searchVariants, listCategories, type SearchResult, type CategoryTile } from '../../lib/catalog';
import { useOpenVariant } from '../../lib/useOpenVariant';
import { useWatch } from '../../lib/useWatch';
import { TripHeader, BrandMark, WatchHeart, moneyText } from '../../lib/ui';
import { theme } from '../../lib/theme';

const CATEGORY_EMOJI: Record<string, string> = {
  skincare: '🧴',
  cosmetics: '💄',
  baby: '🍼',
  other: '🛍️',
};

export default function CatalogueTab() {
  const { home } = useTrip();
  const openVariant = useOpenVariant();
  const { ids, toggle } = useWatch();
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<CategoryTile[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      void listCategories().then(setCategories);
    }, []),
  );

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      searchVariants(q, home.code)
        .then(setResults)
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [query, home.code]);

  const searching = query.trim().length > 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.brandRow}>
        <BrandMark />
      </View>
      <TripHeader />
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Search brand or product…"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />

      {searching ? (
        <FlatList
          data={results}
          keyExtractor={(r) => r.variant.variantId}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 10, paddingBottom: 12 }}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={{ marginTop: 24 }} color={theme.coral} />
            ) : (
              <Text style={styles.empty}>No matches. Try “Anessa” or “Merries”.</Text>
            )
          }
          renderItem={({ item }) => (
            <ResultRow
              item={item}
              watched={ids.has(item.variant.variantId)}
              onToggle={() => void toggle(item.variant.variantId)}
              onOpen={() => void openVariant(item.variant, item.gtin)}
            />
          )}
        />
      ) : (
        <FlatList
          data={categories}
          numColumns={2}
          keyExtractor={(c) => c.category}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 12 }}
          ListHeaderComponent={<Text style={styles.browseTitle}>Browse categories</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.tile}
              onPress={() => router.push({ pathname: '/category/[category]', params: { category: item.category } })}
            >
              <Text style={styles.tileEmoji}>{CATEGORY_EMOJI[item.category] ?? '🛍️'}</Text>
              <Text style={styles.tileName}>{item.category}</Text>
              <Text style={styles.tileCount}>{item.itemCount} item{item.itemCount === 1 ? '' : 's'}</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function ResultRow({
  item,
  watched,
  onToggle,
  onOpen,
}: {
  item: SearchResult;
  watched: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable style={styles.rowMain} onPress={onOpen}>
        <Text style={styles.brand}>{item.variant.brand}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {item.variant.productName}
        </Text>
        <Text style={styles.meta}>
          {item.variant.sizeValue ? `${item.variant.sizeValue}${item.variant.sizeUnit ?? ''} · ` : ''}
          {item.homePrice ? `${moneyText(item.homePrice)} home` : 'no home price'}
        </Text>
      </Pressable>
      <WatchHeart active={watched} onPress={onToggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  brandRow: { paddingTop: 4 },
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
  browseTitle: { fontSize: 13, fontWeight: '700', color: theme.slate, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  tile: {
    flex: 1,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  tileEmoji: { fontSize: 28 },
  tileName: { fontSize: 15, fontWeight: '700', color: theme.ink, textTransform: 'capitalize' },
  tileCount: { fontSize: 12, color: theme.slate },
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
