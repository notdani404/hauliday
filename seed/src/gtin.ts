/**
 * GTIN / JAN / EAN / UPC validation. Barcode lookup is the fast path (D-006) and
 * the seed baseline is the accuracy yardstick (D-014), so a mistyped barcode must
 * never enter the catalogue. JAN is a GTIN-13, so the same checksum covers it.
 */

/** Standard mod-10 check digit over GTIN-8/12/13/14 (digits weighted 3,1 from right). */
export function isValidGtin(raw: string): boolean {
  const s = raw.trim();
  if (!/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(s)) return false;
  const digits = s.split('').map(Number);
  const check = digits.pop()!;
  let sum = 0;
  // Weight alternates 3,1 moving left from the position just before the check digit.
  for (let i = digits.length - 1, w = 3; i >= 0; i--, w = w === 3 ? 1 : 3) {
    sum += digits[i]! * w;
  }
  const expected = (10 - (sum % 10)) % 10;
  return expected === check;
}

/** Compute the check digit for a barcode body (all digits except the check). */
export function gtinCheckDigit(body: string): number {
  const digits = body.trim().split('').map(Number);
  let sum = 0;
  for (let i = digits.length - 1, w = 3; i >= 0; i--, w = w === 3 ? 1 : 3) {
    sum += digits[i]! * w;
  }
  return (10 - (sum % 10)) % 10;
}
