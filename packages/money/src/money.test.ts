import { describe, it, expect } from 'vitest';
import {
  money,
  fromDecimal,
  toDecimalString,
  format,
  add,
  subtract,
  compare,
  equals,
  convert,
  scale,
  CurrencyMismatchError,
  MoneyParseError,
  minorUnits,
} from './index.js';

describe('zero-decimal currencies (JPY, KRW)', () => {
  it('stores yen as-is, not scaled by 100', () => {
    expect(minorUnits('JPY')).toBe(0);
    expect(fromDecimal('1500', 'JPY').amountMinor).toBe(1500n);
    expect(fromDecimal(1500, 'JPY').amountMinor).toBe(1500n);
  });

  it('round-trips JPY decimal string', () => {
    expect(toDecimalString(money(1500n, 'JPY'))).toBe('1500');
  });

  it('round-trips KRW decimal string', () => {
    expect(minorUnits('KRW')).toBe(0);
    expect(toDecimalString(fromDecimal('39000', 'KRW'))).toBe('39000');
  });

  it('rejects fractional yen input by rounding to whole yen', () => {
    // ¥1500.4 -> 1500, ¥1500.5 -> 1501 (half-up)
    expect(fromDecimal('1500.4', 'JPY').amountMinor).toBe(1500n);
    expect(fromDecimal('1500.5', 'JPY').amountMinor).toBe(1501n);
  });
});

describe('two-decimal currencies (SGD)', () => {
  it('parses S$34.90 as 3490 minor units', () => {
    expect(minorUnits('SGD')).toBe(2);
    expect(fromDecimal('34.90', 'SGD').amountMinor).toBe(3490n);
  });

  it('pads decimals on output', () => {
    expect(toDecimalString(money(3490n, 'SGD'))).toBe('34.90');
    expect(toDecimalString(money(3400n, 'SGD'))).toBe('34.00');
    expect(toDecimalString(money(5n, 'SGD'))).toBe('0.05');
  });

  it('rounds a third decimal half-up', () => {
    expect(fromDecimal('34.905', 'SGD').amountMinor).toBe(3491n);
    expect(fromDecimal('34.904', 'SGD').amountMinor).toBe(3490n);
  });
});

describe('construction guards', () => {
  it('rejects non-integer minor units', () => {
    expect(() => money(12.5, 'SGD')).toThrow(MoneyParseError);
  });
  it('rejects unknown currency', () => {
    // @ts-expect-error testing runtime guard on a bad code
    expect(() => money(100n, 'XYZ')).toThrow(MoneyParseError);
  });
  it('rejects non-numeric decimal strings', () => {
    expect(() => fromDecimal('1,500', 'JPY')).toThrow(MoneyParseError);
    expect(() => fromDecimal('abc', 'SGD')).toThrow(MoneyParseError);
  });
});

describe('same-currency arithmetic', () => {
  it('adds and subtracts', () => {
    expect(add(money(3490n, 'SGD'), money(510n, 'SGD')).amountMinor).toBe(4000n);
    expect(subtract(money(3490n, 'SGD'), money(490n, 'SGD')).amountMinor).toBe(3000n);
  });
  it('compares and equates', () => {
    expect(compare(money(100n, 'JPY'), money(200n, 'JPY'))).toBe(-1);
    expect(compare(money(200n, 'JPY'), money(100n, 'JPY'))).toBe(1);
    expect(compare(money(100n, 'JPY'), money(100n, 'JPY'))).toBe(0);
    expect(equals(money(100n, 'JPY'), money(100n, 'JPY'))).toBe(true);
    expect(equals(money(100n, 'JPY'), money(100n, 'SGD'))).toBe(false);
  });
  it('throws on currency mismatch', () => {
    expect(() => add(money(100n, 'JPY'), money(100n, 'SGD'))).toThrow(CurrencyMismatchError);
    expect(() => compare(money(100n, 'JPY'), money(100n, 'SGD'))).toThrow(CurrencyMismatchError);
  });
});

describe('convert across currencies', () => {
  it('JPY -> SGD scales into 2 decimals with half-up rounding', () => {
    // ¥1500 at 0.0091 SGD/JPY = 13.65 SGD exactly -> 1365
    const out = convert(money(1500n, 'JPY'), { base: 'JPY', quote: 'SGD', rate: '0.0091' });
    expect(out.currency).toBe('SGD');
    expect(out.amountMinor).toBe(1365n);
  });

  it('rounds half-up at the minor-unit boundary', () => {
    // ¥1 at 0.005 SGD/JPY = 0.005 SGD -> rounds to 0.01 (1 minor unit)
    expect(convert(money(1n, 'JPY'), { base: 'JPY', quote: 'SGD', rate: '0.005' }).amountMinor).toBe(1n);
    // ¥1 at 0.0049 -> 0.0049 -> rounds to 0.00
    expect(convert(money(1n, 'JPY'), { base: 'JPY', quote: 'SGD', rate: '0.0049' }).amountMinor).toBe(0n);
  });

  it('SGD -> JPY collapses to zero decimals', () => {
    // S$13.65 at 109.89 JPY/SGD = 1500.0 JPY -> 1500 (13.65 * 109.89 = 1500.0)
    const out = convert(money(1365n, 'SGD'), { base: 'SGD', quote: 'JPY', rate: '109.89' });
    expect(out.currency).toBe('JPY');
    expect(out.amountMinor).toBe(1500n);
  });

  it('refuses a rate applied to the wrong base currency', () => {
    expect(() =>
      convert(money(1500n, 'SGD'), { base: 'JPY', quote: 'SGD', rate: '0.0091' }),
    ).toThrow(MoneyParseError);
  });

  it('accepts a numeric rate identically to its string form', () => {
    const a = convert(money(1500n, 'JPY'), { base: 'JPY', quote: 'SGD', rate: 0.0091 });
    const b = convert(money(1500n, 'JPY'), { base: 'JPY', quote: 'SGD', rate: '0.0091' });
    expect(a.amountMinor).toBe(b.amountMinor);
  });
});

describe('scale', () => {
  it('applies a fractional multiplier with half-up rounding, same currency', () => {
    expect(scale(money(3490n, 'SGD'), '0.9').amountMinor).toBe(3141n); // 10% off S$34.90
    expect(scale(money(2530n, 'JPY'), 0.1).amountMinor).toBe(253n); // 10% tax portion
    expect(scale(money(2530n, 'JPY'), '0.1').currency).toBe('JPY');
  });
  it('rounds half-up at the boundary', () => {
    // 5 * 0.5 = 2.5 -> 3
    expect(scale(money(5n, 'JPY'), '0.5').amountMinor).toBe(3n);
  });
});

describe('format', () => {
  it('formats JPY with no decimals', () => {
    // Non-breaking spaces vary by ICU; assert the important parts.
    const s = format(money(1500n, 'JPY'), 'en-SG');
    expect(s).toContain('1,500');
    expect(s).not.toContain('.00');
  });
  it('formats SGD with two decimals', () => {
    const s = format(money(3490n, 'SGD'), 'en-SG');
    expect(s).toContain('34.90');
  });
});
