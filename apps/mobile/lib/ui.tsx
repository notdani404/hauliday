import type { ReactNode } from 'react';
import { Text, View, Image, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { format, type Money } from '@hauliday/money';
import { useTrip } from './trip';
import { theme } from './theme';

const HORIZONTAL_RATIO = 633 / 260;

/** Compact Hauliday brand mark (icon + wordmark), for screen headers. */
export function BrandMark({ height = 26 }: { height?: number }) {
  return (
    <Image
      source={require('../assets/logo-horizontal.png')}
      style={{ height, width: height * HORIZONTAL_RATIO }}
      resizeMode="contain"
      accessibilityLabel="Hauliday"
    />
  );
}

/** Home ⇄ destination strip shown atop the Scan/Search tabs. Tap to change dest. */
export function TripHeader() {
  const { home, dest } = useTrip();
  return (
    <Pressable style={styles.trip} onPress={() => router.push('/dest-country')}>
      <Text style={styles.tripText}>
        {home.flag} {home.name} <Text style={{ color: theme.coral }}>⇄</Text>{' '}
        {dest?.flag ?? '📍'} {dest?.name ?? 'Pick a destination'}
      </Text>
      <Text style={styles.tripEdit}>Change</Text>
    </Pressable>
  );
}

export function Button({
  title,
  onPress,
  disabled,
  variant = 'primary',
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}) {
  const isGhost = variant === 'ghost';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      style={[
        styles.btn,
        isGhost && styles.btnGhost,
        disabled && styles.btnDisabled,
      ]}
    >
      <Text style={[styles.btnText, isGhost && styles.btnGhostText]}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Watchlist toggle heart (controlled). */
export function WatchHeart({ active, onPress }: { active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={active ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      <Text style={{ fontSize: 22, color: active ? theme.coral : theme.slate }}>
        {active ? '♥' : '♡'}
      </Text>
    </Pressable>
  );
}

/** Confidence level label from the 0..1 score. Never show a bare number (#4). */
export function confidenceLabel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.75) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

export function moneyText(m: Money): string {
  return format(m);
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: theme.coral,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.line },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: theme.white, fontWeight: '700', fontSize: 15 },
  btnGhostText: { color: theme.ink },
  trip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 12,
    padding: 12,
  },
  tripText: { fontSize: 14, fontWeight: '600', color: theme.ink, flexShrink: 1 },
  tripEdit: { fontSize: 12, color: theme.slate, marginLeft: 8 },
  card: {
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 14,
    padding: 14,
  },
});
