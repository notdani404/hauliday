import { Text, View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTrip, HOME_MARKETS } from '../lib/trip';
import { Button } from '../lib/ui';
import { theme } from '../lib/theme';

export default function HomeCountry() {
  const { home, setHome } = useTrip();

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Where do you shop at home?</Text>
      <Text style={styles.hint}>We compare foreign prices against your home market.</Text>
      <ScrollView style={styles.list} contentContainerStyle={{ gap: 10 }}>
        {HOME_MARKETS.map((m) => {
          const selected = m.code === home.code;
          return (
            <Pressable
              key={m.code}
              style={[styles.row, selected && styles.rowSel]}
              onPress={() => setHome(m)}
            >
              <Text style={styles.flag}>{m.flag}</Text>
              <Text style={styles.name}>{m.name}</Text>
              {selected && <Text style={styles.tick}>✓</Text>}
            </Pressable>
          );
        })}
        <Text style={styles.soon}>More home markets coming soon.</Text>
      </ScrollView>
      <View style={styles.footer}>
        <Button title="Continue" onPress={() => router.push('/dest-country')} />
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
  tick: { marginLeft: 'auto', color: theme.green, fontWeight: '800' },
  soon: { fontSize: 12, color: theme.slate, paddingHorizontal: 4, paddingTop: 4 },
  footer: { paddingBottom: 24, paddingTop: 8 },
});
