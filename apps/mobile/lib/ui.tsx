import type { ReactNode } from 'react';
import { Text, View, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { format, type Money } from '@hauliday/money';
import { theme } from './theme';

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
  card: {
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 14,
    padding: 14,
  },
});
