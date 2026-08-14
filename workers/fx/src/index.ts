/**
 * FX ingest worker (Phase 0 slice, D-012). Pulls the daily USD-quoted rates from
 * Open Exchange Rates, derives every pair we care about with an interbank and a
 * card-realistic rate, and upserts them into public.fx_rate via service_role.
 *
 * Run: OXR_APP_ID=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm fx:pull
 * A Fly.io cron deployment comes later; here it is a plain one-shot script.
 */
import { createClient } from '@supabase/supabase-js';
import { buildFxRows, FX_CURRENCIES, type OxrLatest } from './rates.js';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

async function fetchLatest(appId: string): Promise<OxrLatest> {
  const symbols = FX_CURRENCIES.join(',');
  const url = `https://openexchangerates.org/api/latest.json?app_id=${appId}&symbols=${symbols}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OXR ${res.status}: ${await res.text()}`);
  return (await res.json()) as OxrLatest;
}

async function main(): Promise<void> {
  const appId = requireEnv('OXR_APP_ID');
  const spread = Number(process.env.FX_CARD_SPREAD ?? '0.02');
  if (!Number.isFinite(spread) || spread < 0) {
    throw new Error(`FX_CARD_SPREAD must be a non-negative number, got ${process.env.FX_CARD_SPREAD}`);
  }
  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  );

  const oxr = await fetchLatest(appId);
  const rows = buildFxRows(oxr, { spread });

  // fx_rate is unique on (base, quote, as_of, source): re-runs on the same day
  // are idempotent, not new observations.
  const { error } = await supabase
    .from('fx_rate')
    .upsert(rows, { onConflict: 'base,quote,as_of,source' });
  if (error) throw new Error(`fx_rate upsert failed: ${error.message}`);

  console.log(`[fx] upserted ${rows.length} rates for ${rows[0]?.as_of} (spread ${spread})`);
}

main().catch((err) => {
  console.error('[fx] failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
