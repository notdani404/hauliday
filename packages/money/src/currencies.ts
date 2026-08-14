/**
 * ISO 4217 currency registry, restricted to the markets Hauliday touches.
 *
 * `minorUnits` is the number of decimal places the currency subdivides into —
 * the exponent in "minor units per major unit". JPY and KRW are zero-decimal:
 * ¥1500 is stored as `1500`, not `150000`. Getting this wrong produces 100x
 * errors that look plausible in a comparison view, which is the single most
 * dangerous class of bug in this app.
 */
export const CURRENCIES = {
  JPY: { minorUnits: 0, name: 'Japanese yen' },
  KRW: { minorUnits: 0, name: 'South Korean won' },
  VND: { minorUnits: 0, name: 'Vietnamese dong' },
  SGD: { minorUnits: 2, name: 'Singapore dollar' },
  THB: { minorUnits: 2, name: 'Thai baht' },
  TWD: { minorUnits: 2, name: 'New Taiwan dollar' },
  MYR: { minorUnits: 2, name: 'Malaysian ringgit' },
  IDR: { minorUnits: 2, name: 'Indonesian rupiah' },
  HKD: { minorUnits: 2, name: 'Hong Kong dollar' },
  USD: { minorUnits: 2, name: 'United States dollar' },
  EUR: { minorUnits: 2, name: 'Euro' },
} as const satisfies Record<string, { minorUnits: number; name: string }>;

export type CurrencyCode = keyof typeof CURRENCIES;

export function isCurrencyCode(value: string): value is CurrencyCode {
  return Object.prototype.hasOwnProperty.call(CURRENCIES, value);
}

/** Decimal places for a currency (0 for JPY/KRW, 2 for SGD, ...). */
export function minorUnits(currency: CurrencyCode): number {
  return CURRENCIES[currency].minorUnits;
}
