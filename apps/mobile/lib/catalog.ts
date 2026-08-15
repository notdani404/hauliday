import { supabase } from './supabase';
import { isCurrencyCode, money, type Money } from '@hauliday/money';

export interface ResolvedVariant {
  variantId: string;
  brand: string;
  productName: string;
  canonicalName: string;
  market: string;
  sizeValue: number | null;
  sizeUnit: string | null;
}

/** Barcode -> variant via the identifier fast path (a join, not ML — D-006). */
export async function resolveBarcode(gtin: string): Promise<ResolvedVariant | null> {
  const { data, error } = await supabase
    .from('identifier')
    .select(
      'variant_id, product_variant!inner(id, market, size_value, size_unit, canonical_name, product!inner(brand, name))',
    )
    .eq('id_value', gtin)
    .maybeSingle();

  if (error) {
    console.warn('[catalog] resolveBarcode:', error.message);
    return null;
  }
  if (!data) return null;

  const row = data as unknown as {
    product_variant: {
      id: string;
      market: string;
      size_value: number | null;
      size_unit: string | null;
      canonical_name: string;
      product: { brand: string; name: string };
    };
  };
  const v = row.product_variant;
  return {
    variantId: v.id,
    brand: v.product.brand,
    productName: v.product.name,
    canonicalName: v.canonical_name,
    market: v.market,
    sizeValue: v.size_value,
    sizeUnit: v.size_unit,
  };
}

export interface SearchResult {
  variant: ResolvedVariant;
  gtin: string | null;
  category: string | null;
  form: string | null;
  /** Home in-store estimate shown inline in results (null if none). */
  homePrice: Money | null;
  confidence: number;
  observationCount: number;
}

/**
 * Catalogue search via the search_catalogue RPC. Empty query browses; an optional
 * category filters to that category (for the category page).
 */
export async function searchVariants(
  query: string,
  country = 'SG',
  category?: string,
): Promise<SearchResult[]> {
  const { data, error } = await supabase.rpc('search_catalogue', {
    p_query: query,
    p_country: country,
    p_category: category ?? undefined,
  });
  if (error) {
    console.warn('[catalog] searchVariants:', error.message);
    return [];
  }
  const rows = (data ?? []) as unknown as Array<{
    variant_id: string;
    brand: string;
    product_name: string;
    canonical_name: string;
    category: string | null;
    form: string | null;
    market: string;
    size_value: number | null;
    size_unit: string | null;
    gtin: string | null;
    est_amount_minor: number | null;
    est_currency: string | null;
    est_count: number | null;
    est_confidence: number | null;
  }>;
  return rows.map((r) => ({
    variant: {
      variantId: r.variant_id,
      brand: r.brand,
      productName: r.product_name,
      canonicalName: r.canonical_name,
      market: r.market,
      sizeValue: r.size_value,
      sizeUnit: r.size_unit,
    },
    gtin: r.gtin,
    category: r.category,
    form: r.form,
    homePrice:
      r.est_amount_minor != null && r.est_currency != null && isCurrencyCode(r.est_currency)
        ? money(BigInt(r.est_amount_minor), r.est_currency)
        : null,
    confidence: Number(r.est_confidence ?? 0),
    observationCount: r.est_count ?? 0,
  }));
}

export interface CategoryTile {
  category: string;
  itemCount: number;
}

/** Categories with counts, for the catalogue landing. */
export async function listCategories(): Promise<CategoryTile[]> {
  const { data, error } = await supabase.rpc('catalogue_categories');
  if (error) {
    console.warn('[catalog] listCategories:', error.message);
    return [];
  }
  return ((data ?? []) as Array<{ category: string; item_count: number }>).map((r) => ({
    category: r.category,
    itemCount: r.item_count,
  }));
}

export type Channel = 'in_store' | 'online';

export interface Estimate {
  price: Money | null;
  confidence: number;
  observationCount: number;
  freshestObservedOn: string | null;
  dominantSource: string | null;
}

/**
 * Confidence-scored home estimate for one channel. Reads our own ledger via the
 * price_estimate function — no LLM on the read path (non-negotiable #5).
 */
export async function getEstimate(
  variantId: string,
  country: string,
  channel: Channel,
): Promise<Estimate | null> {
  const { data, error } = await supabase.rpc('price_estimate', {
    p_variant_id: variantId,
    p_country: country,
    p_channel: channel,
  });
  if (error) {
    console.warn('[catalog] getEstimate:', error.message);
    return null;
  }

  const r = data as unknown as {
    amount_minor: number | null;
    currency: string | null;
    confidence: number | null;
    observation_count: number | null;
    freshest_observed_on: string | null;
    dominant_source: string | null;
  } | null;
  if (!r) return null;

  const price =
    r.amount_minor != null && r.currency != null && isCurrencyCode(r.currency)
      ? money(BigInt(r.amount_minor), r.currency)
      : null;

  return {
    price,
    confidence: Number(r.confidence ?? 0),
    observationCount: r.observation_count ?? 0,
    freshestObservedOn: r.freshest_observed_on,
    dominantSource: r.dominant_source,
  };
}

export interface RetailerOption {
  id: string;
  name: string;
  defaultChannel: Channel;
}

/** Retailers in a country, for tagging where a price was seen. Public read. */
export async function listRetailers(country: string): Promise<RetailerOption[]> {
  const { data, error } = await supabase
    .from('retailer')
    .select('id, name, default_channel')
    .eq('country', country)
    .order('name');
  if (error) {
    console.warn('[catalog] listRetailers:', error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    defaultChannel: r.default_channel as Channel,
  }));
}

// --- Watchlist ---------------------------------------------------------------

async function currentUid(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

/** Variant ids the current user has saved. */
export async function getWatchlistIds(): Promise<Set<string>> {
  const { data, error } = await supabase.from('watchlist').select('variant_id');
  if (error) return new Set();
  return new Set((data ?? []).map((r) => r.variant_id as string));
}

export async function addWatch(variantId: string): Promise<void> {
  const uid = await currentUid();
  if (!uid) return;
  await supabase.from('watchlist').insert({ user_id: uid, variant_id: variantId });
}

export async function removeWatch(variantId: string): Promise<void> {
  const uid = await currentUid();
  if (!uid) return;
  await supabase.from('watchlist').delete().eq('user_id', uid).eq('variant_id', variantId);
}

export interface WatchItem {
  variant: ResolvedVariant;
  gtin: string | null;
  homePrice: Money | null;
  confidence: number;
  observationCount: number;
  target: Money | null;
  note: string | null;
}

/** The user's saved variants with home estimate + target inline, newest first. */
export async function getWatchlist(country = 'SG'): Promise<WatchItem[]> {
  const { data, error } = await supabase.rpc('watchlist_items', { p_country: country });
  if (error || !data) return [];
  const rows = data as unknown as Array<{
    variant_id: string;
    brand: string;
    product_name: string;
    canonical_name: string;
    market: string;
    size_value: number | null;
    size_unit: string | null;
    gtin: string | null;
    est_amount_minor: number | null;
    est_currency: string | null;
    est_confidence: number | null;
    est_count: number | null;
    target_amount_minor: number | null;
    target_currency: string | null;
    note: string | null;
  }>;
  return rows.map((r) => ({
    variant: {
      variantId: r.variant_id,
      brand: r.brand,
      productName: r.product_name,
      canonicalName: r.canonical_name,
      market: r.market,
      sizeValue: r.size_value,
      sizeUnit: r.size_unit,
    },
    gtin: r.gtin,
    homePrice:
      r.est_amount_minor != null && r.est_currency != null && isCurrencyCode(r.est_currency)
        ? money(BigInt(r.est_amount_minor), r.est_currency)
        : null,
    confidence: Number(r.est_confidence ?? 0),
    observationCount: r.est_count ?? 0,
    target:
      r.target_amount_minor != null && r.target_currency != null && isCurrencyCode(r.target_currency)
        ? money(BigInt(r.target_amount_minor), r.target_currency)
        : null,
    note: r.note,
  }));
}

/** Set (or clear, with null) the user's target price + note for a watched variant. */
export async function setWatchlistTarget(
  variantId: string,
  target: Money | null,
  note: string | null,
): Promise<void> {
  const uid = await currentUid();
  if (!uid) return;
  await supabase
    .from('watchlist')
    .update({
      target_amount_minor: target ? Number(target.amountMinor) : null,
      target_currency: target ? target.currency : null,
      note: note && note.trim() ? note.trim() : null,
    })
    .eq('user_id', uid)
    .eq('variant_id', variantId);
}

export interface HomeEstimates {
  inStore: Estimate | null;
  online: Estimate | null;
  /** True if we have at least one home observation on either channel. */
  soldAtHome: boolean;
}

/** Both channels for the home market. Channels surface separately (D-005). */
export async function getHomeEstimates(
  variantId: string,
  country: string,
): Promise<HomeEstimates> {
  const [inStore, online] = await Promise.all([
    getEstimate(variantId, country, 'in_store'),
    getEstimate(variantId, country, 'online'),
  ]);
  const soldAtHome =
    (inStore?.observationCount ?? 0) > 0 || (online?.observationCount ?? 0) > 0;
  return { inStore, online, soldAtHome };
}
