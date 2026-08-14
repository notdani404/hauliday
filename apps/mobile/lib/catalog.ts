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
