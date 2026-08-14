/**
 * Seed loader (D-014). Reads two CSVs — the JP variant catalogue (with JAN
 * barcodes) and SG price observations — validates them, and loads them via
 * service_role. This is the accuracy baseline, so:
 *
 *   - every barcode's checksum is verified (isValidGtin)
 *   - rows are refused unless `verified=true`, so a candidate list can never
 *     silently become truth. Pass --allow-unverified only for local demos.
 *
 * Run: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm seed:load [--dry-run] [--allow-unverified]
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { parseCsv } from './csv.js';
import { isValidGtin } from './gtin.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, '..', 'data');

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const ALLOW_UNVERIFIED = args.has('--allow-unverified');

const truthy = (v: string): boolean => /^(true|1|yes)$/i.test(v.trim());

function gate(kind: string, gtin: string, verified: string): void {
  if (!isValidGtin(gtin)) throw new Error(`${kind}: invalid barcode checksum "${gtin}"`);
  if (!ALLOW_UNVERIFIED && !truthy(verified)) {
    throw new Error(
      `${kind} for ${gtin} is not verified. Verify the barcode + price, set verified=true, ` +
        `or pass --allow-unverified for a local demo.`,
    );
  }
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

async function loadVariants(db: SupabaseClient): Promise<void> {
  const rows = parseCsv(readFileSync(join(DATA, 'variants.csv'), 'utf8'));
  const productIds = new Map<string, string>(); // brand|name|category|form -> product_id

  for (const r of rows) {
    gate('variant', r.gtin ?? '', r.verified ?? '');
    const pkey = [r.brand, r.name, r.category, r.form].join('|');
    let productId = productIds.get(pkey);
    if (!productId) {
      if (DRY_RUN) { productId = `dry-${productIds.size}`; }
      else {
        const { data, error } = await db
          .from('product')
          .insert({ brand: r.brand, name: r.name, category: r.category || null, form: r.form || null })
          .select('id')
          .single();
        if (error) throw new Error(`product insert: ${error.message}`);
        productId = data.id as string;
      }
      productIds.set(pkey, productId);
    }
    if (DRY_RUN) continue;

    const { data: variant, error: vErr } = await db
      .from('product_variant')
      .insert({
        product_id: productId,
        market: r.market,
        size_value: r.size_value ? Number(r.size_value) : null,
        size_unit: r.size_unit || null,
        pack_count: r.pack_count ? Number(r.pack_count) : 1,
        canonical_name: r.canonical_name,
      })
      .select('id')
      .single();
    if (vErr) throw new Error(`variant insert: ${vErr.message}`);

    const { error: idErr } = await db.from('identifier').insert({
      variant_id: variant.id,
      id_type: (r.gtin_type || 'jan').toLowerCase(),
      id_value: r.gtin,
    });
    if (idErr) throw new Error(`identifier insert: ${idErr.message}`);
  }
  console.log(`[seed] variants: ${rows.length} row(s)${DRY_RUN ? ' (dry-run)' : ' loaded'}`);
}

async function loadObservations(db: SupabaseClient): Promise<void> {
  const rows = parseCsv(readFileSync(join(DATA, 'observations.csv'), 'utf8'));
  const retailerIds = new Map<string, string>(); // name|country -> id

  for (const r of rows) {
    gate('observation', r.gtin ?? '', r.verified ?? '');
    if (DRY_RUN) continue;

    const { data: ident, error: idErr } = await db
      .from('identifier').select('variant_id').eq('id_value', r.gtin).single();
    if (idErr || !ident) throw new Error(`observation: no variant for barcode ${r.gtin}`);

    const rkey = `${r.retailer}|${r.retailer_country}`;
    let retailerId = retailerIds.get(rkey);
    if (!retailerId) {
      const { data: ret, error: rErr } = await db
        .from('retailer')
        .insert({ name: r.retailer, country: r.retailer_country, default_channel: r.channel })
        .select('id')
        .single();
      if (rErr) throw new Error(`retailer insert: ${rErr.message}`);
      retailerId = ret.id as string;
      retailerIds.set(rkey, retailerId);
    }

    const { error: oErr } = await db.from('observation').insert({
      variant_id: ident.variant_id,
      retailer_id: retailerId,
      channel: r.channel,
      amount_minor: Number(r.amount_minor),
      currency: r.currency,
      tax_inclusive: truthy(r.tax_inclusive ?? 'false'),
      tax_rate_applied: r.tax_rate_applied ? Number(r.tax_rate_applied) : null,
      source: r.source || 'human',
      source_url: r.source_url || null,
      observed_on: r.observed_on,
    });
    if (oErr) throw new Error(`observation insert: ${oErr.message}`);
  }
  console.log(`[seed] observations: ${rows.length} row(s)${DRY_RUN ? ' (dry-run)' : ' loaded'}`);
}

async function main(): Promise<void> {
  const db = DRY_RUN
    ? (null as unknown as SupabaseClient)
    : createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
        auth: { persistSession: false },
      });
  await loadVariants(db);
  await loadObservations(db);
  console.log(`[seed] done${DRY_RUN ? ' (dry-run: validation only, nothing written)' : ''}`);
}

main().catch((err) => {
  console.error('[seed] failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
