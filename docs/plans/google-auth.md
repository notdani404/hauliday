# Plan — Google auth (fast-follow)

Status: planned (D-021). Anonymous stays the default; Google is an **upgrade/link**,
not a gate — the first scan is never blocked (roadmap).

## Model

Anonymous users can scan, search, and get verdicts. Signing in with Google **links**
the anonymous identity to a permanent one (Supabase `linkIdentity` / OAuth), so the
observations they've contributed keep accruing to the same `observer_id` and their
`observer_trust` builds over time. A profile lives under a 5th tab or a header entry.

## Your setup (prerequisites — I can't do these)

1. **Google Cloud** → create an OAuth 2.0 Client ID (Web + iOS + Android as needed).
   - Authorised redirect URI for web: `https://gfmonmctebklltywhhzn.supabase.co/auth/v1/callback`
   - Note the client ID/secret.
2. **Supabase → Authentication → Providers → Google** → enable, paste client ID/secret.
3. **Supabase → URL Configuration** → add the app's redirect URLs:
   - Web (prod): `https://hauliday-danidavidchan-3724s-projects.vercel.app`
   - Native scheme: `hauliday://` (already set as the app scheme).

## Build (once the above is done)

- `lib/auth.ts`: `signInWithGoogle()` using `supabase.auth.signInWithOAuth({ provider:
  'google', options: { redirectTo, skipBrowserRedirect: native } })` with
  `expo-web-browser` + `expo-auth-session` for the native redirect; plain redirect on web.
- Link vs new: if an anonymous session exists, use `linkIdentity` so contribution
  history/trust carries over; otherwise a normal sign-in.
- A **Profile** surface (tab or header): shows signed-in state, trust tier, and a
  sign-in/sign-out button. Anonymous shows "Sign in to save your contributions".
- Session already persists via AsyncStorage (`lib/supabase.ts`); OAuth tokens flow
  through the same client.

## Risks / notes

- Deep-link redirect handling differs web vs native — test both.
- `linkIdentity` requires the anonymous user to still be signed in at link time.
- Keep RLS as-is: observations are still `insert own` (`observer_id = auth.uid()`),
  which now resolves to the linked permanent id.
