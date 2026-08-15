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

const LINK_RETRY_KEY = 'hauliday.oauth.link-retry';

async function plainOAuthUrl(redirectTo: string): Promise<string> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data?.url) throw error ?? new Error('No OAuth URL returned');
  return data.url;
}

/**
 * Start a Google flow and return its redirect URL. If the user is anonymous we
 * LINK Google to that same user so their scans/watchlist/trust carry over. If the
 * Google account is already a permanent user the link fails *at the callback*
 * (not here) — handleOAuthReturn() catches that and retries as a plain sign-in.
 */
async function startGoogleFlow(redirectTo: string): Promise<string> {
  const { data: sess } = await supabase.auth.getSession();
  const isAnonymous = sess.session?.user?.is_anonymous ?? false;
  if (isAnonymous) {
    const linked = await supabase.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (!linked.error && linked.data?.url) {
      if (typeof window !== 'undefined') window.localStorage.setItem(LINK_RETRY_KEY, '1'); // arm fallback
      return linked.data.url;
    }
  }
  return plainOAuthUrl(redirectTo);
}

/**
 * Call on web app load. If a link attempt failed at the callback (error in the
 * URL, no session) but we armed a retry, complete a plain sign-in instead (once).
 * Returns 'redirecting' if it kicked off a fallback redirect.
 */
export async function handleOAuthReturn(): Promise<'redirecting' | 'ok' | 'none'> {
  if (Platform.OS !== 'web') return 'none';
  const { data } = await supabase.auth.getSession();
  if (data.session && !data.session.user.is_anonymous) {
    window.localStorage.removeItem(LINK_RETRY_KEY);
    return 'ok';
  }
  const url = window.location.search + window.location.hash;
  if (/[?#&]error=/.test(url) && window.localStorage.getItem(LINK_RETRY_KEY)) {
    window.localStorage.removeItem(LINK_RETRY_KEY); // consume — don't loop
    window.location.href = await plainOAuthUrl(window.location.origin);
    return 'redirecting';
  }
  return 'none';
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
