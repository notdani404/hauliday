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
import type { User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { useAuthUser, signInWithGoogle, signOut } from '../../lib/auth';
import {
  getProfile,
  getProfileStats,
  saveProfile,
  googleDefaults,
  emptyProfile,
  GENDER_OPTIONS,
  type ProfileForm,
  type ProfileStats,
  type TrustTier,
} from '../../lib/profile';
import { useTrip } from '../../lib/trip';
import { HOME_MARKETS, marketByCode } from '../../lib/markets';
import { Button } from '../../lib/ui';
import { theme } from '../../lib/theme';

const TIER: Record<TrustTier, { label: string; emoji: string }> = {
  new: { label: 'New', emoji: '🌱' },
  trusted: { label: 'Trusted', emoji: '✅' },
  verified: { label: 'Verified', emoji: '⭐️' },
  flagged: { label: 'Flagged', emoji: '⚠️' },
};

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

  return <SignedIn user={user!} email={email!} onSignOut={out} busy={busy} />;
}

function SignedIn({
  user,
  email,
  onSignOut,
  busy,
}: {
  user: User;
  email: string;
  onSignOut: () => void;
  busy: boolean;
}) {
  const [editing, setEditing] = useState(false);
  return editing ? (
    <ProfileEditor userId={user.id} user={user} onDone={() => setEditing(false)} />
  ) : (
    <ProfileView
      userId={user.id}
      user={user}
      email={email}
      onEdit={() => setEditing(true)}
      onSignOut={onSignOut}
      busy={busy}
    />
  );
}

function ProfileView({
  userId,
  user,
  email,
  onEdit,
  onSignOut,
  busy,
}: {
  userId: string;
  user: User;
  email: string;
  onEdit: () => void;
  onSignOut: () => void;
  busy: boolean;
}) {
  const [profile, setProfile] = useState<ProfileForm | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProfile(userId), getProfileStats(userId)])
      .then(([p, s]) => {
        setProfile(p ?? { ...emptyProfile, ...googleDefaults(user) });
        setStats(s);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <ActivityIndicator style={{ marginTop: 40 }} color={theme.coral} />
      </SafeAreaView>
    );
  }

  const name = profile.displayName || [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  const homeMarket = marketByCode(profile.country) ?? HOME_MARKETS[0]!;
  const genderLabel = GENDER_OPTIONS.find((o) => o.value === profile.gender)?.label ?? profile.gender;
  const tier = TIER[stats?.tier ?? 'new'];
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null;
  const hasDetails = !!(profile.firstName || profile.lastName || profile.birthYear || profile.gender);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Social-style header */}
        <View style={styles.hero}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.heroAvatar} />
          ) : (
            <View style={[styles.heroAvatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{(name || email)[0]?.toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.heroName}>{name || 'Your profile'}</Text>
          <Text style={styles.heroEmail}>{email}</Text>
          <View style={styles.heroChips}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>
                {homeMarket.flag} {homeMarket.name}
              </Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>
                {tier.emoji} {tier.label} contributor
              </Text>
            </View>
          </View>
          {memberSince && <Text style={styles.memberSince}>Member since {memberSince}</Text>}
          <View style={styles.editWrap}>
            <Button title="Edit profile" variant="ghost" onPress={onEdit} />
          </View>
        </View>

        {/* Stat tiles */}
        <View style={styles.stats}>
          <Stat n={stats?.contributions ?? 0} label="Contributions" />
          <View style={styles.statDivider} />
          <Stat n={stats?.watchlist ?? 0} label="Watchlist" />
          <View style={styles.statDivider} />
          <Stat n={tier.label} label="Trust" small />
        </View>

        {/* About */}
        <Text style={styles.sectionLabel}>About</Text>
        {hasDetails ? (
          <View style={styles.card}>
            {(profile.firstName || profile.lastName) && (
              <DetailRow k="Name" v={[profile.firstName, profile.lastName].filter(Boolean).join(' ')} />
            )}
            {profile.birthYear ? <DetailRow k="Birth year" v={profile.birthYear} /> : null}
            {genderLabel ? <DetailRow k="Gender" v={genderLabel} last /> : null}
          </View>
        ) : (
          <Pressable style={styles.emptyCard} onPress={onEdit}>
            <Text style={styles.emptyText}>Add your details so we know who Hauliday is for.</Text>
            <Text style={styles.emptyCta}>Complete profile ›</Text>
          </Pressable>
        )}

        <Text style={styles.privacyNote}>Private to you; never shared.</Text>

        {/* Nav + sign out */}
        <Pressable style={styles.navRow} onPress={() => router.push('/history')}>
          <Text style={styles.navRowText}>🧾 Your contributions</Text>
          <Text style={styles.navChev}>›</Text>
        </Pressable>

        <View style={styles.signOut}>
          <Button title={busy ? '…' : 'Sign out'} variant="ghost" onPress={onSignOut} disabled={busy} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ n, label, small }: { n: number | string; label: string; small?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statN, small && styles.statNsmall]}>{n}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DetailRow({ k, v, last }: { k: string; v: string; last?: boolean }) {
  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <Text style={styles.detailK}>{k}</Text>
      <Text style={styles.detailV}>{v}</Text>
    </View>
  );
}

function ProfileEditor({ userId, user, onDone }: { userId: string; user: User; onDone: () => void }) {
  const { home, setHome } = useTrip();
  const [form, setForm] = useState<ProfileForm>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile(userId).then((existing) => {
      const base = existing ?? { ...emptyProfile, ...googleDefaults(user) };
      if (!base.country) base.country = home.code; // default home market
      setForm(base);
      setLoading(false);
    });
  }, [userId]);

  const set = (k: keyof ProfileForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      await saveProfile(userId, form);
      const m = marketByCode(form.country); // apply chosen home market to comparisons
      if (m) setHome(m);
      onDone();
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
        <View style={styles.editHeader}>
          <Pressable onPress={onDone} hitSlop={8}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.editTitle}>Edit profile</Text>
          <View style={{ width: 52 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
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
          {HOME_MARKETS.length > 1 ? (
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
          ) : (
            <View style={styles.singleHome}>
              <Text style={styles.singleHomeText}>
                {HOME_MARKETS[0]!.flag} {HOME_MARKETS[0]!.name}
              </Text>
              <Text style={styles.singleHomeNote}>Only market we support today — more coming.</Text>
            </View>
          )}

          <View style={styles.actions}>
            <Button title={saving ? 'Saving…' : 'Save profile'} onPress={() => void save()} disabled={saving} />
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
  footer: { flex: 1, justifyContent: 'flex-end', paddingBottom: 24 },
  landingBody: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  landingLogo: { width: 200, height: 254, marginBottom: 4 },
  landingTagline: { fontSize: 18, fontWeight: '700', color: theme.coral, textAlign: 'center' },
  landingSub: { fontSize: 14, lineHeight: 21, color: theme.slate, textAlign: 'center', marginTop: 4 },

  // Social header
  hero: { alignItems: 'center', paddingTop: 8, gap: 6 },
  heroAvatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: theme.line },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 34, fontWeight: '800', color: theme.white },
  heroName: { fontSize: 22, fontWeight: '800', color: theme.ink, marginTop: 6 },
  heroEmail: { fontSize: 13, color: theme.slate },
  heroChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 },
  metaChip: { backgroundColor: theme.white, borderWidth: 1, borderColor: theme.line, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  metaChipText: { fontSize: 13, fontWeight: '600', color: theme.ink },
  memberSince: { fontSize: 12, color: theme.slate, marginTop: 6 },
  editWrap: { alignSelf: 'stretch', marginTop: 14 },

  // Stats
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 20,
  },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { width: 1, alignSelf: 'stretch', backgroundColor: theme.line, marginVertical: 6 },
  statN: { fontSize: 22, fontWeight: '800', color: theme.ink },
  statNsmall: { fontSize: 15 },
  statLabel: { fontSize: 11, color: theme.slate, textTransform: 'uppercase', letterSpacing: 0.5 },

  // About
  sectionLabel: { fontSize: 12, fontWeight: '700', color: theme.slate, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 24, marginBottom: 8 },
  card: { backgroundColor: theme.white, borderWidth: 1, borderColor: theme.line, borderRadius: 14, paddingHorizontal: 14 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.line },
  detailK: { fontSize: 14, color: theme.slate },
  detailV: { fontSize: 14, fontWeight: '600', color: theme.ink },
  emptyCard: { backgroundColor: theme.white, borderWidth: 1, borderColor: theme.line, borderStyle: 'dashed', borderRadius: 14, padding: 16, gap: 6 },
  emptyText: { fontSize: 14, color: theme.slate, lineHeight: 20 },
  emptyCta: { fontSize: 13, color: theme.coral, fontWeight: '700' },
  privacyNote: { fontSize: 11, color: theme.slate, marginTop: 10 },

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
  signOut: { marginTop: 16 },
  historyLink: { alignItems: 'center', paddingVertical: 14 },
  historyLinkText: { fontSize: 13, color: theme.coral, fontWeight: '700' },

  // Editor
  editHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 },
  editTitle: { fontSize: 16, fontWeight: '800', color: theme.ink },
  cancel: { fontSize: 15, color: theme.slate, width: 52 },
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
  homeHint: { fontSize: 11, color: theme.slate, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: theme.line, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: theme.white },
  chipSel: { borderColor: theme.coral, backgroundColor: '#FDECEE' },
  chipText: { fontSize: 13, fontWeight: '600', color: theme.slate },
  chipTextSel: { color: theme.coral },
  singleHome: { backgroundColor: theme.white, borderWidth: 1, borderColor: theme.line, borderRadius: 12, padding: 14, gap: 3 },
  singleHomeText: { fontSize: 15, fontWeight: '700', color: theme.ink },
  singleHomeNote: { fontSize: 12, color: theme.slate },
  actions: { marginTop: 24 },
});
