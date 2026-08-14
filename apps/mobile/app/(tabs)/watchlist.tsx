import { Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../lib/theme';

export default function WatchlistTab() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.body}>
        <Text style={styles.emoji}>🔖</Text>
        <Text style={styles.title}>Watchlist</Text>
        <Text style={styles.sub}>
          Coming soon: add things you want before a trip, and we'll tell you what to look for
          when you land — and what a good price looks like when you get there.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 24 },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 40 },
  title: { fontSize: 22, fontWeight: '800', color: theme.ink },
  sub: { fontSize: 14, color: theme.slate, textAlign: 'center', lineHeight: 21 },
});
