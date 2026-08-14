import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import type { User } from '@supabase/supabase-js';
import { supabase, ensureAnonymousSession } from './supabase';

export interface AuthState {
  user: User | null;
  isAnonymous: boolean;
  email: string | null;
  loading: boolean;
}

/** Current auth user, reactive to sign-in/out. */
export function useAuthUser(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return {
    user,
    isAnonymous: user?.is_anonymous ?? false,
    email: user?.email ?? null,
    loading,
  };
}

/**
 * Sign in with Google. On web this redirects the browser and returns via the
 * OAuth callback (parsed by detectSessionInUrl). On native it opens an auth
 * session and exchanges the PKCE code. Anonymous → Google identity linking (to
 * carry over contributions) is a planned enhancement; this signs in directly.
 */
export async function signInWithGoogle(): Promise<void> {
  if (Platform.OS === 'web') {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return; // browser redirects away
  }

  const redirectTo = makeRedirectUri({ scheme: 'hauliday' });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url) throw error ?? new Error('No OAuth URL');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type === 'success' && result.url) {
    const code = new URL(result.url).searchParams.get('code');
    if (code) await supabase.auth.exchangeCodeForSession(code);
  }
}

/** Sign out, then re-establish an anonymous session so the app keeps working. */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  await ensureAnonymousSession();
}
