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
 * Start a Google OAuth flow and return its redirect URL. Plain sign-in — reliable
 * for both new and returning accounts. (We tried linkIdentity to merge an
 * anonymous user's contributions, but when the Google account is already a
 * permanent user the link fails at the callback and bounces the user back with an
 * error instead of a session. Merging anon→Google needs return-error handling and
 * is a follow-up.) skipBrowserRedirect lets the caller control the redirect.
 */
async function startGoogleFlow(redirectTo: string): Promise<string> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data?.url) throw error ?? new Error('No OAuth URL returned');
  return data.url;
}

/**
 * Sign in with Google. Web redirects the browser (session parsed by
 * detectSessionInUrl on return); native opens an auth session and exchanges the
 * PKCE code. Anonymous users are upgraded in place via identity linking.
 */
export async function signInWithGoogle(): Promise<void> {
  if (Platform.OS === 'web') {
    const url = await startGoogleFlow(window.location.origin);
    window.location.href = url; // redirect to Google
    return;
  }

  const redirectTo = makeRedirectUri({ scheme: 'hauliday' });
  const url = await startGoogleFlow(redirectTo);
  const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);
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
