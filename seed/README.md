# Seed data

The hand-verified accuracy baseline (D-014). Target: ~200 JP cosmetics/skincare
variants with **real** JAN barcodes and **real** SG prices. This is what every
recognition and pricing result is measured against, so correctness beats volume.

## ⚠️ The rows in `data/` are EXAMPLES, not truth

Every row currently has `verified=false`. The barcodes are checksum-valid but
**placeholder** — they are not confirmed against real packaging, and the prices
are illustrative. The loader **refuses `verified=false` rows** unless you pass
`--allow-unverified` (for local demos only). Nothing enters the real baseline
until a human has checked the barcode and the price and set `verified=true`.

## Files

- `data/variants.csv` — JP variant catalogue + its barcode. One row per variant.
- `data/observations.csv` — price observations keyed by barcode. Many per variant.

## Verifying a row

1. Confirm the JAN on the actual package (or a trusted listing) — the loader
   checks the checksum but cannot know if it's the *right* code.
2. Confirm the price + date + retailer + channel from a receipt, shelf photo, or
   an affiliate-legit listing (D-010). In-store and online never blend (D-005).
3. Money is integer minor units: ¥2530 → `2530` (JPY is zero-decimal), S$34.90 →
   `3490` (SGD has 2). Never a decimal in `amount_minor`.
4. Set `verified=true`.

## Loading

```sh
# validate only, write nothing
pnpm seed:load --dry-run --allow-unverified

# real load (requires verified=true rows unless --allow-unverified)
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm seed:load
```
