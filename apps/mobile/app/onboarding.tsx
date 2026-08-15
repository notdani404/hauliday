import { useEffect, useState } from 'react';
import { Text, View, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthUser } from '../lib/auth';
import { useTrip } from '../lib/trip';
import { HOME_MARKETS, marketByCode } from '../lib/markets';
import {
  saveProfile,
  googleDefaults,
  emptyProfile,
  GENDER_OPTIONS,
  type ProfileForm,
} from '../lib/profile';
import { Button } from '../lib/ui';
import { theme } from '../lib/theme';

const STEPS = ['name', 'birthYear', 'gender', 'home'] as const;
type Step = (typeof STEPS)[number];
const OPTIONAL: Step[] = ['birthYear', 'gender'];

export default function Onboarding() {
  const { user, isAnonymous, loading } = useAuthUser();
  const { home, setHome, dest } = useTrip();
  const [form, setForm] = useState<ProfileForm>(emptyProfile);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || isAnonymous) {
      router.replace('/');
      return;
    }
    setForm({ ...emptyProfile, ...googleDefaults(user), country: home.code });
  }, [loading, user, isAnonymous]);

  if (loading || !user) {
    return <SafeAreaView style={styles.screen} />;
  }

  const current: Step = STEPS[step]!;
  const isLast = step === STEPS.length - 1;
  const set = (k: keyof ProfileForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function finish() {
    setBusy(true);
    try {
      await saveProfile(user!.id, form);
      const m = marketByCode(form.country);
      if (m) setHome(m);
      router.replace(dest ? '/(tabs)/search' : '/dest-country');
    } catch {
      setBusy(false);
    }
  }

  const next = () => (isLast ? void finish() : setStep((s) => s + 1));
  const skip = () => (isLast ? void finish() : setStep((s) => s + 1));

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.progress}>
          {STEPS.map((s, i) => (
            <View key={s} style={[styles.dot, i <= step && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.body}>
          {current === 'name' && (
            <StepScaffold title="What should we call you?" hint="This is how you'll show up in Hauliday.">
              <TextInput
                style={styles.input}
                value={form.displayName}
                onChangeText={set('displayName')}
                placeholder="Your name"
                placeholderTextColor={theme.slate}
                autoFocus
              />
            </StepScaffold>
          )}

          {current === 'birthYear' && (
            <StepScaffold title="What year were you born?" hint="Helps us understand who Hauliday is for. Optional.">
              <TextInput
                style={styles.input}
                value={form.birthYear}
                onChangeText={set('birthYear')}
                placeholder="e.g. 1990"
                placeholderTextColor={theme.slate}
                keyboardType="number-pad"
                maxLength={4}
                autoFocus
              />
            </StepScaffold>
          )}

          {current === 'gender' && (
            <StepScaffold title="How do you identify?" hint="Optional — and always private to you.">
              <View style={styles.chips}>
                {GENDER_OPTIONS.map((o) => (
                  <Pressable
                    key={o.value}
                    style={[styles.chip, form.gender === o.value && styles.chipSel]}
                    onPress={() => set('gender')(o.value)}
                  >
                    <Text style={[styles.chipText, form.gender === o.value && styles.chipTextSel]}>{o.label}</Text>
                  </Pressable>
                ))}
              </View>
            </StepScaffold>
          )}

          {current === 'home' && (
            <StepScaffold title="Where do you shop at home?" hint="We compare foreign prices against this market.">
              <View style={styles.chips}>
                {HOME_MARKETS.map((m) => (
                  <Pressable
                    key={m.code}
                    style={[styles.chip, form.country === m.code && styles.chipSel]}
                    onPress={() => set('country')(m.code)}
                  >
                    <Text style={[styles.chipText, form.country === m.code && styles.chipTextSel]}>
                      {m.flag} {m.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </StepScaffold>
          )}
        </View>

        <View style={styles.footer}>
          <Button title={busy ? 'Saving…' : isLast ? 'Done' : 'Next'} onPress={next} disabled={busy} />
          <View style={styles.subRow}>
            {step > 0 && (
              <Pressable onPress={() => setStep((s) => s - 1)} hitSlop={8}>
                <Text style={styles.link}>Back</Text>
              </Pressable>
            )}
            <View style={{ flex: 1 }} />
            {OPTIONAL.includes(current) && (
              <Pressable onPress={skip} hitSlop={8}>
                <Text style={styles.link}>Skip</Text>
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepScaffold({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>{hint}</Text>
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 24, paddingTop: 8 },
  flex: { flex: 1 },
  progress: { flexDirection: 'row', gap: 6, paddingTop: 8 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: theme.line },
  dotActive: { backgroundColor: theme.coral },
  body: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: theme.ink },
  hint: { fontSize: 14, color: theme.slate, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 18,
    backgroundColor: theme.white,
    color: theme.ink,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: theme.line, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: theme.white },
  chipSel: { borderColor: theme.coral, backgroundColor: '#FDECEE' },
  chipText: { fontSize: 14, fontWeight: '600', color: theme.slate },
  chipTextSel: { color: theme.coral },
  footer: { paddingBottom: 24 },
  subRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  link: { fontSize: 14, color: theme.coral, fontWeight: '700' },
});
