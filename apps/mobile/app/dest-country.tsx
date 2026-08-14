import { Text, View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTrip, DESTINATIONS } from '../lib/trip';
import { taxFreeRate } from '../lib/markets';
import { Button } from '../lib/ui';
import { theme } from '../lib/theme';

export default function DestCountry() {
  const { dest, setDest } = useTrip();

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Where are you travelling?</Text>
      <Text style={styles.hint}>We handle the tax refund and real card FX for you.</Text>
      <ScrollView style={styles.list} contentContainerStyle={{ gap: 10 }}>
        {DESTINATIONS.map((m) => {
          const selected = m.code === dest?.code;
          const tf = Math.round(taxFreeRate(m.code) * 100);
          return (
            <Pressable
              key={m.code}
              style={[styles.row, selected && styles.rowSel]}
              onPress={() => setDest(m)}
            >
              <Text style={styles.flag}>{m.flag}</Text>
              <View>
                <Text style={styles.name}>{m.name}</Text>
                {tf > 0 && <Text style={styles.meta}>{tf}% tourist tax refund</Text>}
              </View>
              {selected && <Text style={styles.tick}>✓</Text>}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <Button title="Start scanning" onPress={() => router.replace('/main')} disabled={!dest} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 24, paddingTop: 12 },
  title: { fontSize: 24, fontWeight: '800', color: theme.ink, marginTop: 8 },
  hint: { fontSize: 14, color: theme.slate, marginTop: 6, marginBottom: 16 },
  list: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 12,
    padding: 14,
  },
  rowSel: { borderColor: theme.coral },
  flag: { fontSize: 22 },
  name: { fontSize: 15, fontWeight: '600', color: theme.ink },
  meta: { fontSize: 12, color: theme.slate, marginTop: 2 },
  tick: { marginLeft: 'auto', color: theme.green, fontWeight: '800' },
  footer: { paddingBottom: 24, paddingTop: 8 },
});
