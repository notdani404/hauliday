import { describe, it, expect } from 'vitest';
import { crossRate, cardRealistic, asOfDate, buildFxRows, type OxrLatest } from './rates.js';

// 1 USD = 1.35 SGD = 150 JPY (illustrative).
const oxr: OxrLatest = {
  base: 'USD',
  timestamp: 1_755_100_800, // 2025-08-13T16:00:00Z
  rates: { USD: 1, SGD: 1.35, JPY: 150, KRW: 1350, THB: 35, TWD: 32 },
};

describe('crossRate', () => {
  it('derives quote-per-base from USD-quoted rates', () => {
    // JPY per SGD = 150 / 1.35 = 111.11...
    expect(crossRate(oxr.rates, 'SGD', 'JPY')).toBeCloseTo(111.111, 3);
    // SGD per JPY = 1.35 / 150 = 0.009
    expect(crossRate(oxr.rates, 'JPY', 'SGD')).toBeCloseTo(0.009, 6);
  });
  it('throws on a missing or zero rate', () => {
    expect(() => crossRate(oxr.rates, 'SGD', 'EUR')).toThrow();
    expect(() => crossRate({ USD: 0, SGD: 1.35 }, 'USD', 'SGD')).toThrow();
  });
});

describe('cardRealistic', () => {
  it('adds the spread', () => {
    expect(cardRealistic(0.009, 0.02)).toBeCloseTo(0.00918, 8);
    expect(cardRealistic(100, 0)).toBe(100);
  });
});

describe('asOfDate', () => {
  it('is the UTC calendar date of the timestamp', () => {
    expect(asOfDate(1_755_100_800)).toBe('2025-08-13');
  });
});

describe('buildFxRows', () => {
  it('produces every directed non-self pair', () => {
    const rows = buildFxRows(oxr, { spread: 0.02 });
    // 6 currencies -> 6*5 = 30 directed pairs
    expect(rows).toHaveLength(30);
    expect(rows.every((r) => r.base !== r.quote)).toBe(true);
  });
  it('card_realistic is interbank plus spread, and as_of/source set', () => {
    const rows = buildFxRows(oxr, { spread: 0.02, source: 'test' });
    const jpySgd = rows.find((r) => r.base === 'JPY' && r.quote === 'SGD')!;
    expect(jpySgd.rate).toBeCloseTo(0.009, 6);
    expect(jpySgd.card_realistic).toBeCloseTo(0.009 * 1.02, 8);
    expect(jpySgd.as_of).toBe('2025-08-13');
    expect(jpySgd.source).toBe('test');
  });
});
