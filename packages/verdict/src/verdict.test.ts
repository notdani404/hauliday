import { describe, it, expect } from 'vitest';
import { money, type Money } from '@hauliday/money';
import { computeVerdict, isWorthHauling, taxFreeRate, suggestedShelfTargets } from './index.js';

// Deterministic formatter so copy assertions don't depend on ICU/locale.
const fmt = (m: Money) => `${m.currency}${m.amountMinor}`;

// Same-currency helper to isolate the threshold logic (SGD->SGD, no tax, rate 1).
function verdictSGD(shelfMinor: bigint, refMinor: bigint | null) {
  return computeVerdict({
    destShelf: money(shelfMinor, 'SGD'),
    taxFreeRate: 0,
    homeReference: refMinor === null ? null : money(refMinor, 'SGD'),
    fx: { base: 'SGD', quote: 'SGD', rate: '1' },
    formatMoney: fmt,
  });
}

describe('verdict thresholds (from prototype)', () => {
  it('>= 25% cheaper is a great deal', () => {
    const v = verdictSGD(7500n, 10000n); // save 2500 = 25%
    expect(v.state).toBe('great');
    expect(v.savingsPct).toBe(25);
    expect(v.headline).toBe('Great deal. Haul away!');
  });
  it('10%..24% is worth it if it fits', () => {
    expect(verdictSGD(7600n, 10000n).state).toBe('worth_it'); // 24%
    expect(verdictSGD(9000n, 10000n).state).toBe('worth_it'); // 10%
  });
  it('-8%..9% is about the same', () => {
    expect(verdictSGD(9100n, 10000n).state).toBe('about_same'); // 9%
    expect(verdictSGD(10800n, 10000n).state).toBe('about_same'); // -8%
  });
  it('more than 8% dearer is cheaper at home', () => {
    const v = verdictSGD(10900n, 10000n); // -9%
    expect(v.state).toBe('cheaper_home');
    expect(v.savingsPct).toBe(-9);
    expect(v.detail).toContain('more here');
  });
});

describe('only available here', () => {
  it('null home reference outranks price', () => {
    const v = verdictSGD(9999n, null);
    expect(v.state).toBe('only_here');
    expect(v.savings).toBeNull();
    expect(v.savingsPct).toBeNull();
    expect(isWorthHauling(v)).toBe(true);
    expect(v.detail).toContain("can't find this at home");
  });
});

describe('tax-free + cross-currency (JP shelf -> SG home)', () => {
  it('applies the refund, converts, and grades', () => {
    // ¥2530 shelf, 10% JP refund -> ¥2277; at 0.009 SGD/JPY -> S$20.49.
    // Home ref S$34.90 -> save S$14.41 = 41% -> great.
    const v = computeVerdict({
      destShelf: money(2530n, 'JPY'),
      taxFreeRate: taxFreeRate('JP'),
      homeReference: money(3490n, 'SGD'),
      fx: { base: 'JPY', quote: 'SGD', rate: '0.009' },
      formatMoney: fmt,
    });
    expect(v.effectiveDest).toEqual(money(2277n, 'JPY'));
    expect(v.effectiveHome).toEqual(money(2049n, 'SGD')); // 2277*0.009 = 20.493 -> 20.49
    expect(v.savings).toEqual(money(1441n, 'SGD'));
    expect(v.savingsPct).toBe(41);
    expect(v.state).toBe('great');
    expect(v.detail).toBe('You save SGD1441 (41%) versus buying it at home.');
  });

  it('the refund changes the verdict it would otherwise be', () => {
    const base = {
      destShelf: money(2530n, 'JPY'),
      homeReference: money(2100n, 'SGD'),
      fx: { base: 'JPY' as const, quote: 'SGD' as const, rate: '0.009' },
      formatMoney: fmt,
    };
    const withRefund = computeVerdict({ ...base, taxFreeRate: 0.1 });
    const without = computeVerdict({ ...base, taxFreeRate: 0 });
    // Refund lowers the effective price, so savings % is higher with the refund.
    expect(withRefund.savingsPct!).toBeGreaterThan(without.savingsPct!);
  });
});

describe('suggestedShelfTargets', () => {
  it('gives the JP shelf prices that clear worth-it/great vs a home estimate', () => {
    // Home S$34.90; JP tax-free 10%; 0.009 SGD/JPY.
    // worth-it (10%): 34.90*0.9 / 0.009 / 0.9 = ¥3878 ; great (25%): ¥3231
    const t = suggestedShelfTargets(money(3490n, 'SGD'), {
      taxFreeRate: 0.1,
      rate: '0.009',
      destCurrency: 'JPY',
    });
    expect(t.worthIt).toEqual(money(3878n, 'JPY'));
    expect(t.great).toEqual(money(3231n, 'JPY'));
    // a great price is lower than a merely worth-it price
    expect(t.great.amountMinor < t.worthIt.amountMinor).toBe(true);
  });
});

describe('taxFreeRate table', () => {
  it('knows the destinations from vision.md', () => {
    expect(taxFreeRate('JP')).toBe(0.1);
    expect(taxFreeRate('KR')).toBe(0.1);
    expect(taxFreeRate('TH')).toBe(0.07);
    expect(taxFreeRate('TW')).toBe(0.05);
    expect(taxFreeRate('SG')).toBe(0); // no scheme modelled
  });
});
