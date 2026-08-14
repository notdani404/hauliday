import { convert, type CurrencyCode, type Money } from '@hauliday/money';

/**
 * Bundled, dated FX snapshot (D-017). Capture must work with no signal
 * (non-negotiable #6), so the app ships a small rate table rather than reading
 * the (currently empty) fx_rate table. These are **card-realistic** rates —
 * interbank plus a ~2% spread, what a card actually charges — expressed as home
 * SGD per 1 unit of the destination currency. The FX worker will refresh this
 * later; until then the UI shows the `asOf` date as a caveat.
 *
 * ⚠️ Illustrative values for a dev build — replace with a real dated pull.
 */
export const FX_SNAPSHOT = {
  asOf: '2026-08-14',
  home: 'SGD' as const,
  /** home SGD per 1 unit of the key currency (card-realistic). */
  perUnitSGD: {
    JPY: '0.00915',
    KRW: '0.000980',
    THB: '0.0375',
    TWD: '0.0415',
    SGD: '1',
  } as Record<string, string>,
} as const;

export type SupportedDestCurrency = keyof typeof FX_SNAPSHOT.perUnitSGD;

/** Convert a destination-currency amount to home SGD using the bundled snapshot. */
export function toHomeSGD(amount: Money): Money {
  const rate = FX_SNAPSHOT.perUnitSGD[amount.currency];
  if (!rate) {
    throw new Error(`No bundled FX rate for ${amount.currency} (snapshot ${FX_SNAPSHOT.asOf})`);
  }
  return convert(amount, { base: amount.currency, quote: 'SGD' as CurrencyCode, rate });
}
