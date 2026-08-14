// Public runtime config. Expo inlines EXPO_PUBLIC_* at build time. The anon key
// is publishable (safe in the client bundle); the service_role key must NEVER
// appear here. Copy apps/mobile/.env.example to apps/mobile/.env to set these.

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy apps/mobile/.env.example to apps/mobile/.env and fill them in.',
  );
}

export const config = {
  supabaseUrl,
  supabaseAnonKey,
  /** Home market for the JP->SG wedge. */
  homeMarket: 'SG' as const,
} as const;
