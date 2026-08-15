import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface ProfileForm {
  displayName: string;
  firstName: string;
  lastName: string;
  birthYear: string; // kept as string for the text field
  gender: string;
  country: string;
  avatarUrl: string | null;
}

export const emptyProfile: ProfileForm = {
  displayName: '',
  firstName: '',
  lastName: '',
  birthYear: '',
  gender: '',
  country: '',
  avatarUrl: null,
};

/** Prefill from the Google identity (name + avatar) for a first-time profile. */
export function googleDefaults(user: User | null): Partial<ProfileForm> {
  const identity = user?.identities?.find((i) => i.provider === 'google');
  const d = (identity?.identity_data ?? {}) as {
    full_name?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    avatar_url?: string;
    picture?: string;
  };
  return {
    displayName: d.full_name ?? d.name ?? '',
    firstName: d.given_name ?? '',
    lastName: d.family_name ?? '',
    avatarUrl: d.avatar_url ?? d.picture ?? null,
  };
}

/** Load the saved profile, or null if none exists yet. */
export async function getProfile(userId: string): Promise<ProfileForm | null> {
  const { data, error } = await supabase
    .from('profile')
    .select('display_name, first_name, last_name, birth_year, gender, country, avatar_url')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    displayName: data.display_name ?? '',
    firstName: data.first_name ?? '',
    lastName: data.last_name ?? '',
    birthYear: data.birth_year != null ? String(data.birth_year) : '',
    gender: data.gender ?? '',
    country: data.country ?? '',
    avatarUrl: data.avatar_url ?? null,
  };
}

/** Upsert the owner's profile. Blank fields are stored as null. */
export async function saveProfile(userId: string, p: ProfileForm): Promise<void> {
  const birthYear = /^\d{4}$/.test(p.birthYear.trim()) ? Number(p.birthYear.trim()) : null;
  const { error } = await supabase.from('profile').upsert({
    user_id: userId,
    display_name: p.displayName.trim() || null,
    first_name: p.firstName.trim() || null,
    last_name: p.lastName.trim() || null,
    birth_year: birthYear,
    gender: p.gender.trim() || null,
    country: p.country.trim() || null,
    avatar_url: p.avatarUrl || null,
  });
  if (error) throw error;
}

export const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];
