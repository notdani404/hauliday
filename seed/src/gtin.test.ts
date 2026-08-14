import { describe, it, expect } from 'vitest';
import { isValidGtin, gtinCheckDigit } from './gtin.js';
import { parseCsv } from './csv.js';

describe('isValidGtin', () => {
  it('accepts known-good barcodes', () => {
    expect(isValidGtin('4901872046591')).toBe(true); // valid EAN-13 check digit
    expect(isValidGtin('0012345678905')).toBe(true);
    expect(isValidGtin('96385074')).toBe(true); // EAN-8
  });
  it('rejects a wrong check digit', () => {
    expect(isValidGtin('4901872046590')).toBe(false);
  });
  it('rejects wrong lengths and non-digits', () => {
    expect(isValidGtin('12345')).toBe(false);
    expect(isValidGtin('49018720465AB')).toBe(false);
    expect(isValidGtin('')).toBe(false);
  });
  it('check digit round-trips through isValidGtin', () => {
    const body = '490187204659';
    const full = body + gtinCheckDigit(body);
    expect(isValidGtin(full)).toBe(true);
  });
});

describe('parseCsv', () => {
  it('parses headers and rows', () => {
    const rows = parseCsv('a,b,c\n1,2,3\n4,5,6\n');
    expect(rows).toEqual([
      { a: '1', b: '2', c: '3' },
      { a: '4', b: '5', c: '6' },
    ]);
  });
  it('handles quoted fields with commas and escaped quotes', () => {
    const rows = parseCsv('name,note\n"Anessa, JP","she said ""buy it"""\n');
    expect(rows[0]).toEqual({ name: 'Anessa, JP', note: 'she said "buy it"' });
  });
  it('skips blank lines', () => {
    expect(parseCsv('a\n\n1\n\n')).toEqual([{ a: '1' }]);
  });
});
