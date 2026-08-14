import type { CurrencyCode } from '@hauliday/money';
import { taxFreeRate } from '@hauliday/verdict';

/** A market Hauliday supports, with the currency and tax-refund it implies. */
export interface Market {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  flag: string;
  currency: CurrencyCode;
}

/** Home markets. The wedge is Singapore; more SEA markets come later. */
export const HOME_MARKETS: Market[] = [
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD' },
];

/** Destinations we have tax-free + FX handling for. */
export const DESTINATIONS: Market[] = [
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', currency: 'KRW' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', currency: 'THB' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', currency: 'TWD' },
];

export function marketByCode(code: string): Market | undefined {
  return [...HOME_MARKETS, ...DESTINATIONS].find((m) => m.code === code);
}

/** Tourist tax-refund rate for a market (0 if none). Re-exported from @hauliday/verdict. */
export { taxFreeRate };
