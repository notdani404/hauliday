import {
  type CurrencyCode,
  CURRENCIES,
  isCurrencyCode,
  minorUnits,
} from './currencies.js';

/**
 * A monetary amount as integer minor units + ISO 4217 code. Never a float,
 * never a bare number. `amountMinor` is a bigint so arithmetic can never lose
 * precision. See CLAUDE.md "Money" convention and docs/data-model.md.
 */
export interface Money {
  readonly amountMinor: bigint;
  readonly currency: CurrencyCode;
}

export class CurrencyMismatchError extends Error {
  constructor(a: CurrencyCode, b: CurrencyCode) {
    super(`Currency mismatch: cannot combine ${a} and ${b}`);
    this.name = 'CurrencyMismatchError';
  }
}

export class MoneyParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyParseError';
  }
}

/** Construct Money from integer minor units. */
export function money(amountMinor: bigint | number, currency: CurrencyCode): Money {
  if (typeof amountMinor === 'number') {
    if (!Number.isInteger(amountMinor)) {
      throw new MoneyParseError(
        `amountMinor must be an integer, got ${amountMinor}. Use fromDecimal for major-unit values.`,
      );
    }
    amountMinor = BigInt(amountMinor);
  }
  if (!isCurrencyCode(currency)) {
    throw new MoneyParseError(`Unknown currency: ${currency}`);
  }
  return { amountMinor, currency };
}

/** Integer division rounding half-up, away from zero on the .5 boundary. `d` must be > 0. */
function divRoundHalfUp(n: bigint, d: bigint): bigint {
  const negative = n < 0n;
  const a = negative ? -n : n;
  const q = a / d;
  const r = a % d;
  const rounded = r * 2n >= d ? q + 1n : q;
  return negative ? -rounded : rounded;
}

/** Parse a decimal string/number into a scaled integer fraction { num, den }. */
function parseDecimalToFraction(value: string): { num: bigint; den: bigint } {
  const trimmed = value.trim();
  if (!/^[+-]?\d+(\.\d+)?$/.test(trimmed)) {
    throw new MoneyParseError(`Not a plain decimal number: "${value}"`);
  }
  const negative = trimmed.startsWith('-');
  const body = trimmed.replace(/^[+-]/, '');
  const [intPart, fracPart = ''] = body.split('.');
  const num = BigInt(intPart + fracPart);
  const den = 10n ** BigInt(fracPart.length);
  return { num: negative ? -num : num, den };
}

/**
 * Construct Money from a major-unit decimal value ("34.90" SGD -> 3490).
 * Rounds half-up to the currency's minor units. Passing more fraction digits
 * than the currency supports rounds rather than throws (e.g. "34.905" SGD -> 3491).
 */
export function fromDecimal(value: string | number, currency: CurrencyCode): Money {
  if (!isCurrencyCode(currency)) {
    throw new MoneyParseError(`Unknown currency: ${currency}`);
  }
  const asString =
    typeof value === 'number'
      ? Number.isFinite(value)
        ? value.toString()
        : (() => {
            throw new MoneyParseError(`Non-finite amount: ${value}`);
          })()
      : value;
  const { num, den } = parseDecimalToFraction(asString);
  const scale = 10n ** BigInt(minorUnits(currency));
  // amountMinor = round(num/den * scale)
  return money(divRoundHalfUp(num * scale, den), currency);
}

/** Major-unit decimal string, always with the currency's exact number of places. */
export function toDecimalString(m: Money): string {
  const places = minorUnits(m.currency);
  const negative = m.amountMinor < 0n;
  const abs = negative ? -m.amountMinor : m.amountMinor;
  const sign = negative ? '-' : '';
  if (places === 0) return sign + abs.toString();
  const scale = 10n ** BigInt(places);
  const whole = abs / scale;
  const frac = (abs % scale).toString().padStart(places, '0');
  return `${sign}${whole}.${frac}`;
}

/** Human display via Intl, respecting the currency's decimal places. */
export function format(m: Money, locale = 'en-SG'): string {
  const places = minorUnits(m.currency);
  const value = Number(m.amountMinor) / 10 ** places;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: m.currency,
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  }).format(value);
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) throw new CurrencyMismatchError(a.currency, b.currency);
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amountMinor: a.amountMinor + b.amountMinor, currency: a.currency };
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amountMinor: a.amountMinor - b.amountMinor, currency: a.currency };
}

/** -1 if a < b, 0 if equal, 1 if a > b. Throws on currency mismatch. */
export function compare(a: Money, b: Money): -1 | 0 | 1 {
  assertSameCurrency(a, b);
  if (a.amountMinor < b.amountMinor) return -1;
  if (a.amountMinor > b.amountMinor) return 1;
  return 0;
}

export function equals(a: Money, b: Money): boolean {
  return a.currency === b.currency && a.amountMinor === b.amountMinor;
}

/**
 * Convert across currencies at an explicit rate (quote units per 1 base unit),
 * rounding half-up to the target currency's minor units. The rate is parsed
 * exactly from its decimal form — no float drift. Refuses to convert unless
 * `from.currency === base`, so a caller can never apply a rate backwards.
 */
export function convert(
  from: Money,
  opts: { base: CurrencyCode; quote: CurrencyCode; rate: string | number },
): Money {
  if (from.currency !== opts.base) {
    throw new MoneyParseError(
      `Rate is ${opts.base}->${opts.quote} but amount is ${from.currency}`,
    );
  }
  const { num, den } = parseDecimalToFraction(
    typeof opts.rate === 'number' ? opts.rate.toString() : opts.rate,
  );
  const mb = minorUnits(opts.base);
  const mq = minorUnits(opts.quote);
  // targetMinor = amountMinor * (num/den) * 10^(mq - mb)
  const diff = mq - mb;
  let numerator = from.amountMinor * num;
  let denominator = den;
  if (diff >= 0) numerator *= 10n ** BigInt(diff);
  else denominator *= 10n ** BigInt(-diff);
  return money(divRoundHalfUp(numerator, denominator), opts.quote);
}

export { CURRENCIES, isCurrencyCode, minorUnits };
export type { CurrencyCode };
