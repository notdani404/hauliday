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
 * Start a Google OAuth flow and return its redirect URL. If the current user is
 * anonymous we LINK Google to that same user (so their scans/contributions and
 * observer_trust carry over). If linking fails — e.g. the Google account is
 * already a separate permanent user — we fall back to a normal sign-in as that
 * account. Uses skipBrowserRedirect so the caller controls the redirect.
 */
async function startGoogleFlow(redirectTo: string): Promise<string> {
  const { data: sess } = await supabase.auth.getSession();
  const isAnonymous = sess.session?.user?.is_anonymous ?? false;
  const opts = { provider: 'google' as const, options: { redirectTo, skipBrowserRedirect: true } };

  if (isAnonymous) {
    const linked = await supabase.auth.linkIdentity(opts);
    if (!linked.error && linked.data?.url) return linked.data.url;
    // fall through: identity already linked to another user, or linking disabled
  }
  const signedIn = await supabase.auth.signInWithOAuth(opts);
  if (signedIn.error || !signedIn.data?.url) {
    throw signedIn.error ?? new Error('No OAuth URL returned');
  }
  return signedIn.data.url;
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
