import {
  type Money,
  type CurrencyCode,
  scale,
  subtract,
  convert,
  format,
  fromDecimal,
  minorUnits,
} from '@hauliday/money';

/**
 * The graded verdict. Never binary — "worth it if it fits" is the honest answer
 * for a modest saving on a bulky item, and saying so builds more trust than a
 * green tick (vision.md). States and cutoffs are lifted from reference/
 * prototype.html (D-019). Savings-per-litre and customs are deferred.
 */
export type VerdictState =
  | 'only_here' // not sold at home — availability outranks price
  | 'great' // >= 25% cheaper
  | 'worth_it' // >= 10% cheaper
  | 'about_same' // within -8%..10%
  | 'cheaper_home'; // more than 8% more expensive here

export interface VerdictInput {
  /** Shelf price at the destination, in the destination currency. */
  destShelf: Money;
  /** Tourist tax-refund rate for the destination market, 0..1. */
  taxFreeRate: number;
  /** Home-market estimate to compare against (one channel), or null if not sold at home. */
  homeReference: Money | null;
  /** FX from destination to home currency (home units per 1 destination unit). */
  fx: { base: CurrencyCode; quote: CurrencyCode; rate: string | number };
  /** Formatter for money in copy; defaults to @hauliday/money format(). Injectable for tests. */
  formatMoney?: (m: Money) => string;
}

export interface Verdict {
  state: VerdictState;
  emoji: string;
  headline: string;
  detail: string;
  /** Dest shelf price after the tax refund, still in destination currency. */
  effectiveDest: Money;
  /** effectiveDest converted to home currency — the number the verdict is built on. */
  effectiveHome: Money;
  /** homeReference − effectiveHome, in home currency. Positive = you save. Null if only_here. */
  savings: Money | null;
  /** Percentage cheaper than home (rounded). Null if only_here. */
  savingsPct: number | null;
}

const COPY: Record<VerdictState, { emoji: string; headline: string }> = {
  only_here: { emoji: '🎁', headline: 'Only available here' },
  great: { emoji: '🛍️', headline: 'Great deal. Haul away!' },
  worth_it: { emoji: '🤔', headline: 'Worth it if it fits' },
  about_same: { emoji: '⚖️', headline: 'About the same' },
  cheaper_home: { emoji: '🏠', headline: 'Cheaper at home' },
};

function classify(pct: number): Exclude<VerdictState, 'only_here'> {
  if (pct >= 25) return 'great';
  if (pct >= 10) return 'worth_it';
  if (pct >= -8) return 'about_same';
  return 'cheaper_home';
}

/**
 * Compute the graded verdict. Applies the tax refund, converts to home currency,
 * then grades the delta against the home reference. Channels never blend — the
 * caller passes the single home-channel estimate it wants to compare against and
 * surfaces the others separately (D-005).
 */
export function computeVerdict(input: VerdictInput): Verdict {
  const fmt = input.formatMoney ?? ((m: Money) => format(m));

  // Effective destination price after the tourist tax refund.
  const taxRefund = scale(input.destShelf, input.taxFreeRate);
  const effectiveDest = subtract(input.destShelf, taxRefund);

  const effectiveHome = convert(effectiveDest, input.fx);

  if (input.homeReference === null) {
    return {
      state: 'only_here',
      ...COPY.only_here,
      detail: "We can't find this at home. If you want it, this is the trip to buy it.",
      effectiveDest,
      effectiveHome,
      savings: null,
      savingsPct: null,
    };
  }

  const ref = input.homeReference;
  const savings = subtract(ref, effectiveHome); // + = cheaper abroad
  // pct cheaper than home = savings / home reference * 100
  const pct = Math.round(
    (Number(savings.amountMinor) / Number(ref.amountMinor)) * 100,
  );
  const state = classify(pct);

  const savingsAbs = { ...savings, amountMinor: savings.amountMinor < 0n ? -savings.amountMinor : savings.amountMinor };
  const detail = ((): string => {
    switch (state) {
      case 'great':
        return `You save ${fmt(savings)} (${pct}%) versus buying it at home.`;
      case 'worth_it':
        return `You save ${fmt(savings)} (${pct}%). Nice, but only if you have the luggage space.`;
      case 'about_same':
        return `Only ${fmt(savingsAbs)} apart. Save the space and buy it at home.`;
      case 'cheaper_home':
        return `It costs ${fmt(savingsAbs)} more here. Skip it.`;
    }
  })();

  return {
    state,
    ...COPY[state],
    detail,
    effectiveDest,
    effectiveHome,
    savings,
    savingsPct: pct,
  };
}

/** True if the destination is worth the luggage (great, worth_it, or only-here). */
export function isWorthHauling(v: Verdict): boolean {
  return v.state === 'great' || v.state === 'worth_it' || v.state === 'only_here';
}

/**
 * "What a good price looks like when you get there" — the destination shelf price
 * (before tax refund) that would clear the worth-it (≥10%) and great (≥25%)
 * thresholds versus the home estimate. Inverse of computeVerdict. Guidance
 * figures, so plain float math + currency rounding is fine.
 */
export function suggestedShelfTargets(
  homeReference: Money,
  opts: { taxFreeRate: number; rate: string | number; destCurrency: CurrencyCode },
): { worthIt: Money; great: Money } {
  const homeDecimal = Number(homeReference.amountMinor) / 10 ** minorUnits(homeReference.currency);
  const rate = typeof opts.rate === 'number' ? opts.rate : parseFloat(opts.rate);
  const shelfFor = (savingsFraction: number): Money => {
    // effectiveHome = home*(1-savings); effectiveDest = effectiveHome/rate; shelf = effectiveDest/(1-taxFree)
    const shelf = (homeDecimal * (1 - savingsFraction)) / rate / (1 - opts.taxFreeRate);
    return fromDecimal(shelf.toFixed(6), opts.destCurrency);
  };
  return { worthIt: shelfFor(0.1), great: shelfFor(0.25) };
}
