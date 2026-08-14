import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@hauliday/db';
import { config } from './config';

/**
 * Typed Supabase client for the app (anon key). Sessions persist in
 * AsyncStorage so an anonymous identity survives restarts — the first scan is
 * never gated (roadmap). Reads go against our own ledger; no LLM on the read
 * path (non-negotiable #5).
 */
export const supabase = createClient<Database>(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // On web, parse the OAuth redirect hash to complete Google sign-in.
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});

/**
 * Ensure we have a session, creating an anonymous one if needed. Requires
 * "Anonymous sign-ins" enabled in Supabase Auth settings.
 */
export async function ensureAnonymousSession(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: signIn, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn('[auth] anonymous sign-in failed:', error.message);
    return null;
  }
  return signIn.user?.id ?? null;
}
