import { Text, View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTrip, destinationsByCountry } from '../lib/trip';
import { taxFreeRate } from '../lib/markets';
import { Button } from '../lib/ui';
import { theme } from '../lib/theme';

export default function DestCountry() {
  const { dest, setDest } = useTrip();
  const groups = destinationsByCountry();

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Where are you travelling?</Text>
      <Text style={styles.hint}>
        Pick the city — prices differ by city. We handle the tax refund and real card FX for you.
      </Text>
      <ScrollView style={styles.list} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
        {groups.map(({ country, cities }) => {
          const tf = Math.round(taxFreeRate(country.code) * 100);
          return (
            <View key={country.code} style={styles.group}>
              <View style={styles.groupHead}>
                <Text style={styles.groupName}>
                  {country.flag} {country.name}
                </Text>
                {tf > 0 && <Text style={styles.groupMeta}>{tf}% tourist tax refund</Text>}
              </View>
              {cities.map((c) => {
                const selected = c.cityId === dest?.cityId;
                return (
                  <Pressable
                    key={c.cityId}
                    style={[styles.row, selected && styles.rowSel]}
                    onPress={() => setDest(c)}
                  >
                    <Text style={styles.name}>{c.city}</Text>
                    {selected && <Text style={styles.tick}>✓</Text>}
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <Button title="Start scanning" onPress={() => router.replace('/scan')} disabled={!dest} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 24, paddingTop: 12 },
  title: { fontSize: 24, fontWeight: '800', color: theme.ink, marginTop: 8 },
  hint: { fontSize: 14, color: theme.slate, marginTop: 6, marginBottom: 16, lineHeight: 20 },
  list: { flex: 1 },
  group: { marginBottom: 10 },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  groupName: { fontSize: 15, fontWeight: '800', color: theme.ink },
  groupMeta: { fontSize: 12, color: theme.slate },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
  },
  rowSel: { borderColor: theme.coral },
  name: { fontSize: 15, fontWeight: '600', color: theme.ink },
  tick: { marginLeft: 'auto', color: theme.green, fontWeight: '800' },
  footer: { paddingBottom: 24, paddingTop: 8 },
});
