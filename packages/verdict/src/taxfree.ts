/**
 * Tourist tax-refund rates by market (vision.md). A comparison that ignores the
 * refund is systematically wrong by this margin on every item. These are the
 * headline consumption-tax rates a tourist can reclaim; refund schemes have
 * thresholds and handling fees we do not yet model (deferred).
 */
export const TAX_FREE_RATE: Record<string, number> = {
  JP: 0.1,
  KR: 0.1,
  TH: 0.07,
  TW: 0.05,
};

/** Refund rate for a market (0 if none / unknown). */
export function taxFreeRate(market: string): number {
  return TAX_FREE_RATE[market] ?? 0;
}
