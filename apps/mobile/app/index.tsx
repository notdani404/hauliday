import { Text, View, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTrip } from '../lib/trip';
import { Button } from '../lib/ui';
import { theme } from '../lib/theme';

export default function Welcome() {
  const { dest, hydrated } = useTrip();

  const start = () => router.push(dest ? '/scan' : '/home-country');

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.body}>
        <Image
          source={require('../assets/logo-vertical.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Hauliday"
        />
        <Text style={styles.tagline}>Know before you haul.</Text>
        <Text style={styles.sub}>
          Compare prices.{'\n'}Shop smarter.{'\n'}Make every haul worth it.
        </Text>
      </View>
      <View style={styles.footer}>
        <Button title="Get started" onPress={start} disabled={!hydrated} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 24 },
  body: { flex: 1, justifyContent: 'center', gap: 10 },
  logo: { width: 200, height: 254, marginLeft: -6, marginBottom: 4 },
  tagline: { fontSize: 18, fontWeight: '700', color: theme.coral },
  sub: { fontSize: 15, lineHeight: 26, color: theme.slate, marginTop: 8 },
  footer: { paddingBottom: 24 },
});
