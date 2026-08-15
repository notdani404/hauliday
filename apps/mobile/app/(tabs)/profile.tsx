import { useEffect, useState } from 'react';
import {
  Text,
  View,
  Image,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthUser, signInWithGoogle, signOut } from '../../lib/auth';
import {
  getProfile,
  saveProfile,
  googleDefaults,
  emptyProfile,
  GENDER_OPTIONS,
  type ProfileForm,
} from '../../lib/profile';
import { useTrip } from '../../lib/trip';
import { HOME_MARKETS, marketByCode } from '../../lib/markets';
import { Button } from '../../lib/ui';
import { theme } from '../../lib/theme';

export default function ProfileTab() {
  const { user, email, isAnonymous, loading } = useAuthUser();
  const [busy, setBusy] = useState(false);

  async function google() {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch {
      setBusy(false);
    }
  }
  async function out() {
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
    }
  }

  const signedIn = !!email && !isAnonymous;

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.coral} />
      </SafeAreaView>
    );
  }

  if (!signedIn) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <View style={styles.landingBody}>
          <Image
            source={require('../../assets/logo-vertical.png')}
            style={styles.landingLogo}
            resizeMode="contain"
            accessibilityLabel="Hauliday"
          />
          <Text style={styles.landingTagline}>Know before you haul.</Text>
          <Text style={styles.landingSub}>
            You're browsing anonymously. Sign in to save your watchlist and contributions across
            devices, and build your contributor trust.
          </Text>
        </View>
        <View style={styles.footer}>
          <Button
            title={busy ? 'Opening Google…' : 'Continue with Google'}
            onPress={() => void google()}
            disabled={busy}
          />
          <Pressable onPress={() => router.push('/history')} hitSlop={8} style={styles.historyLink}>
            <Text style={styles.historyLinkText}>View your contributions</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return <ProfileEditor userId={user!.id} email={email!} onSignOut={out} busy={busy} />;
}

function ProfileEditor({
  userId,
  email,
  onSignOut,
  busy,
}: {
  userId: string;
  email: string;
  onSignOut: () => void;
  busy: boolean;
}) {
  const { user } = useAuthUser();
  const { home, setHome } = useTrip();
  const [form, setForm] = useState<ProfileForm>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getProfile(userId).then((existing) => {
      const base = existing ?? { ...emptyProfile, ...googleDefaults(user) };
      if (!base.country) base.country = home.code; // default home market
      setForm(base);
      const m = marketByCode(base.country);
      if (m) setHome(m); // saved home market drives comparisons
      setLoading(false);
    });
  }, [userId]);

  const set = (k: keyof ProfileForm) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  };

  async function save() {
    setSaving(true);
    try {
      await saveProfile(userId, form);
      const m = marketByCode(form.country);
      if (m) setHome(m); // apply chosen home market to comparisons
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const isPreset = GENDER_OPTIONS.some((o) => o.value === form.gender);

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.coral} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            {form.avatarUrl ? (
              <Image source={{ uri: form.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{(form.displayName || email)[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{form.displayName || 'Your profile'}</Text>
              <Text style={styles.email}>{email}</Text>
            </View>
          </View>

          <Text style={styles.why}>
            Optional — helps us understand who Hauliday is for. Private to you; never shared.
          </Text>

          <Field label="Display name" value={form.displayName} onChangeText={set('displayName')} />
          <View style={styles.rowTwo}>
            <Field label="First name" value={form.firstName} onChangeText={set('firstName')} style={{ flex: 1 }} />
            <Field label="Last name" value={form.lastName} onChangeText={set('lastName')} style={{ flex: 1 }} />
          </View>
          <Field
            label="Birth year"
            value={form.birthYear}
            onChangeText={set('birthYear')}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="e.g. 1990"
          />

          <Text style={styles.label}>Gender</Text>
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
          <TextInput
            style={styles.input}
            value={isPreset ? '' : form.gender}
            onChangeText={set('gender')}
            placeholder="Or self-describe"
            placeholderTextColor={theme.slate}
          />

          <Text style={styles.label}>Home market</Text>
          <Text style={styles.homeHint}>Where you shop at home — we compare foreign prices against this.</Text>
          <View style={styles.chips}>
            {HOME_MARKETS.map((m) => (
              <Pressable
                key={m.code}
                style={[styles.chip, form.country === m.code && styles.chipSel]}
                onPress={() => {
                  set('country')(m.code);
                  setHome(m);
                }}
              >
                <Text style={[styles.chipText, form.country === m.code && styles.chipTextSel]}>
                  {m.flag} {m.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.navRow} onPress={() => router.push('/history')}>
            <Text style={styles.navRowText}>🧾 Your contributions</Text>
            <Text style={styles.navChev}>›</Text>
          </Pressable>

          <View style={styles.actions}>
            <Button title={saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save profile'} onPress={() => void save()} disabled={saving} />
            <View style={{ height: 10 }} />
            <Button title={busy ? '…' : 'Sign out'} variant="ghost" onPress={onSignOut} disabled={busy} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  style,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'number-pad';
  maxLength?: number;
  placeholder?: string;
  style?: object;
}) {
  return (
    <View style={[styles.fieldWrap, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={theme.slate} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 24, paddingTop: 12 },
  title: { fontSize: 24, fontWeight: '800', color: theme.ink, marginTop: 8, marginBottom: 16 },
  card: {
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emoji: { fontSize: 36 },
  state: { fontSize: 16, fontWeight: '800', color: theme.ink },
  sub: { fontSize: 13, color: theme.slate, textAlign: 'center', lineHeight: 20 },
  footer: { flex: 1, justifyContent: 'flex-end', paddingBottom: 24 },
  landingBody: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  landingLogo: { width: 200, height: 254, marginBottom: 4 },
  landingTagline: { fontSize: 18, fontWeight: '700', color: theme.coral, textAlign: 'center' },
  landingSub: { fontSize: 14, lineHeight: 21, color: theme.slate, textAlign: 'center', marginTop: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.line },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 22, fontWeight: '800', color: theme.white },
  name: { fontSize: 18, fontWeight: '800', color: theme.ink },
  email: { fontSize: 13, color: theme.slate },
  why: { fontSize: 12, color: theme.slate, lineHeight: 18, marginTop: 16, marginBottom: 8 },
  homeHint: { fontSize: 11, color: theme.slate, marginBottom: 8 },
  fieldWrap: { marginTop: 12 },
  rowTwo: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 12, fontWeight: '700', color: theme.slate, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    backgroundColor: theme.white,
    color: theme.ink,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: theme.line, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: theme.white },
  chipSel: { borderColor: theme.coral, backgroundColor: '#FDECEE' },
  chipText: { fontSize: 13, fontWeight: '600', color: theme.slate },
  chipTextSel: { color: theme.coral },
  actions: { marginTop: 24 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
  },
  navRowText: { fontSize: 15, fontWeight: '600', color: theme.ink },
  navChev: { fontSize: 20, color: theme.slate },
  historyLink: { alignItems: 'center', paddingVertical: 14 },
  historyLinkText: { fontSize: 13, color: theme.coral, fontWeight: '700' },
});

