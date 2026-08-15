import { convert, type CurrencyCode, type Money } from '@hauliday/money';

/**
 * Bundled, dated FX snapshot (D-017). Capture must work with no signal
 * (non-negotiable #6), so the app ships a small rate table rather than reading
 * the (currently empty) fx_rate table. These are **card-realistic** rates —
 * interbank plus a ~2% spread, what a card actually charges — expressed as
 * SGD per 1 unit of the key currency. SGD is the pivot; any home currency in the
 * table converts via a cross-rate (D-037). The FX worker refreshes this later;
 * until then the UI shows the `asOf` date as a caveat.
 *
 * ⚠️ Illustrative values for a dev build — replace with a real dated pull.
 */
export const FX_SNAPSHOT = {
  asOf: '2026-08-14',
  pivot: 'SGD' as const,
  /** SGD per 1 unit of the key currency (card-realistic). SGD = 1 (the pivot). */
  perUnitSGD: {
    JPY: '0.00915',
    KRW: '0.000980',
    THB: '0.0375',
    TWD: '0.0415',
    MYR: '0.304',
    SGD: '1',
  } as Record<string, string>,
} as const;

/** Exact decimal division a/b to `places` places, half-up. Non-negative inputs. */
function decDivide(a: string, b: string, places = 10): string {
  const frac = (s: string) => {
    const [i, f = ''] = s.split('.');
    return { n: BigInt(i + f), d: 10n ** BigInt(f.length) };
  };
  const A = frac(a);
  const B = frac(b);
  const num = A.n * B.d; // (A.n/A.d)/(B.n/B.d) = (A.n*B.d)/(A.d*B.n)
  const den = A.d * B.n;
  const scale = 10n ** BigInt(places);
  const scaled = (num * scale * 2n + den) / (den * 2n); // half-up
  const s = scaled.toString().padStart(places + 1, '0');
  const intPart = s.slice(0, -places) || '0';
  const fracPart = s.slice(-places).replace(/0+$/, '');
  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

/**
 * Cross-rate: how many `quote` units per 1 `base` unit, via the SGD pivot.
 * Returns null if either currency isn't in the snapshot (caller shows a caveat
 * rather than crashing — never throw on the render path).
 */
export function crossRate(base: CurrencyCode, quote: CurrencyCode): string | null {
  if (base === quote) return '1';
  const b = FX_SNAPSHOT.perUnitSGD[base];
  const q = FX_SNAPSHOT.perUnitSGD[quote];
  if (!b || !q) return null;
  return decDivide(b, q); // (SGD/base) / (SGD/quote) = quote per base
}

/** Convert an amount to the given home currency using the snapshot. Null if no rate. */
export function toHome(amount: Money, homeCurrency: CurrencyCode): Money | null {
  const rate = crossRate(amount.currency, homeCurrency);
  if (!rate) return null;
  return convert(amount, { base: amount.currency, quote: homeCurrency, rate });
}
