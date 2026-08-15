import { useEffect, useMemo, useState } from 'react';
import { Text, View, Pressable, StyleSheet, SectionList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTrip } from '../../lib/trip';
import { searchVariants, type SearchResult } from '../../lib/catalog';
import { useOpenVariant } from '../../lib/useOpenVariant';
import { useWatch } from '../../lib/useWatch';
import { WatchHeart, moneyText } from '../../lib/ui';
import { theme } from '../../lib/theme';

type GroupBy = 'brand' | 'form';

export default function CategoryPage() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const { home } = useTrip();
  const openVariant = useOpenVariant();
  const { ids, toggle } = useWatch();
  const [items, setItems] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<GroupBy>('brand');

  useEffect(() => {
    setLoading(true);
    searchVariants('', home.code, category)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [category, home.code]);

  const sections = useMemo(() => {
    const groups = new Map<string, SearchResult[]>();
    for (const it of items) {
      const key =
        groupBy === 'brand'
          ? it.variant.brand
          : (it.form ?? 'Other').replace(/^\w/, (c) => c.toUpperCase());
      const arr = groups.get(key) ?? [];
      arr.push(it);
      groups.set(key, arr);
    }
    return [...groups.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([title, data]) => ({ title, data }));
  }, [items, groupBy]);

  const display = (category ?? '').replace(/^\w/, (c) => c.toUpperCase());

  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'left', 'right']}>
      <Stack.Screen options={{ title: display }} />

      <View style={styles.toggle}>
        {(['brand', 'form'] as GroupBy[]).map((g) => (
          <Pressable
            key={g}
            style={[styles.seg, groupBy === g && styles.segSel]}
            onPress={() => setGroupBy(g)}
          >
            <Text style={[styles.segText, groupBy === g && styles.segTextSel]}>
              {g === 'brand' ? 'By brand' : 'By type'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={theme.coral} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(r) => r.variant.variantId}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: 16, paddingHorizontal: 20 }}
          renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
          ListEmptyComponent={<Text style={styles.empty}>Nothing here yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Pressable style={styles.rowMain} onPress={() => void openVariant(item.variant, item.gtin)}>
                <Text style={styles.name} numberOfLines={2}>
                  {groupBy === 'brand' ? item.variant.productName : `${item.variant.brand} · ${item.variant.productName}`}
                </Text>
                <Text style={styles.meta}>
                  {item.variant.sizeValue ? `${item.variant.sizeValue}${item.variant.sizeUnit ?? ''} · ` : ''}
                  {item.homePrice ? `${moneyText(item.homePrice)} home` : 'no home price'}
                </Text>
              </Pressable>
              <WatchHeart active={ids.has(item.variant.variantId)} onPress={() => void toggle(item.variant.variantId)} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  toggle: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  seg: { borderWidth: 1, borderColor: theme.line, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.white },
  segSel: { borderColor: theme.coral, backgroundColor: '#FDECEE' },
  segText: { fontSize: 13, fontWeight: '600', color: theme.slate },
  segTextSel: { color: theme.coral },
  sectionHeader: { fontSize: 12, fontWeight: '800', color: theme.slate, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 },
  empty: { textAlign: 'center', color: theme.slate, marginTop: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  rowMain: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: theme.ink },
  meta: { fontSize: 11, color: theme.slate, marginTop: 2 },
});
