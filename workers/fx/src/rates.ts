/**
 * Pure FX maths. No I/O here so it can be unit-tested without keys or network.
 *
 * Open Exchange Rates free plan quotes everything against USD: `rates[X]` is the
 * number of X per 1 USD. A cross rate base->quote (units of quote per 1 base) is
 * therefore rates[quote] / rates[base]. See decision D-012.
 */

/** The currencies we maintain pairwise rates for. Mirrors packages/money. */
export const FX_CURRENCIES = ['USD', 'SGD', 'JPY', 'KRW', 'THB', 'TWD'] as const;
export type FxCurrency = (typeof FX_CURRENCIES)[number];

export interface OxrLatest {
  base: string;
  timestamp: number; // unix seconds
  rates: Record<string, number>;
}

export interface FxRow {
  base: string;
  quote: string;
  rate: number; // interbank, units of quote per 1 base
  card_realistic: number; // rate x (1 + spread)
  as_of: string; // YYYY-MM-DD (UTC)
  source: string;
}

/** Units of `quote` per 1 unit of `base`, derived from USD-quoted OXR rates. */
export function crossRate(
  rates: Record<string, number>,
  base: string,
  quote: string,
): number {
  const rb = rates[base];
  const rq = rates[quote];
  if (rb === undefined || rq === undefined || rb <= 0) {
    throw new Error(`Missing or invalid OXR rate for ${base} or ${quote}`);
  }
  return rq / rb;
}

/** What a card actually charges: interbank plus a spread (D-012). */
export function cardRealistic(rate: number, spread: number): number {
  return rate * (1 + spread);
}

/** UTC calendar date for an OXR unix timestamp. */
export function asOfDate(timestampSeconds: number): string {
  const iso = new Date(timestampSeconds * 1000).toISOString();
  return iso.slice(0, 10);
}

/**
 * Every directed pair among the given currencies (excluding self-pairs), with
 * interbank and card-realistic rates. These map 1:1 onto public.fx_rate rows.
 */
export function buildFxRows(
  oxr: OxrLatest,
  opts: { currencies?: readonly string[]; spread: number; source?: string },
): FxRow[] {
  const currencies = opts.currencies ?? FX_CURRENCIES;
  const source = opts.source ?? 'openexchangerates';
  const as_of = asOfDate(oxr.timestamp);
  const rows: FxRow[] = [];
  for (const base of currencies) {
    for (const quote of currencies) {
      if (base === quote) continue;
      const rate = crossRate(oxr.rates, base, quote);
      rows.push({
        base,
        quote,
        rate,
        card_realistic: cardRealistic(rate, opts.spread),
        as_of,
        source,
      });
    }
  }
  return rows;
}
