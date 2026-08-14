# Seed data

The hand-verified accuracy baseline (D-014). JP → Singapore. First scope: **beauty/
cosmetics/skincare** and **baby (non-formula)**. Correctness beats volume — this is
what every recognition and pricing result is measured against.

## Current batch: 30 candidates, ALL `verified=false`

15 beauty + 15 baby, assembled from web research with cited sources. **Every JAN
passes checksum**, but a valid checksum only proves the number is well-formed — not
that it's the right code for the product, nor that the SG price matches the *same
variant*. Nothing here is truth until a human confirms it. The loader refuses
`verified=false` rows unless you pass `--allow-unverified` (local demo only).

## Files

- `data/variants.csv` — the JP variant + its JAN. One row per variant.
- `data/observations.csv` — SG home-price observations, keyed by JAN. Only emitted
  for `clean` / `variant-check` items (see flags).

Both carry extra `segment` and `flag` columns for review; the loader ignores them.

## The `flag` column — what still needs a human

| flag | meaning | action before `verified=true` |
|---|---|---|
| `clean` | same JP variant sold in SG, price cited | confirm the JAN on the package + the SG price/date |
| `variant-check` | SG listing may be a regional SKU with a *different* barcode | confirm the SG product is the **same variant** as the JP JAN, else split it |
| `price-needed` | JP variant identified, no machine-readable SG price found | add a real SG price (or mark not-sold) |
| `variant-mismatch` | the SG price found is a **different variant** — no SG observation emitted | do NOT attach that price to this JAN; find the same-GTIN SG price or leave as a gap |
| `availability-gap` | genuinely not in mainstream SG retail — a "not sold at home" signal | confirm the gap; no SG price needed |
| `formula-customs` | infant/follow-up formula — SG caps hand-carry at 5 kg/5 L **and** ≤ S$100/person | **recommend excluding** until the verdict engine shows customs limits as a constraint |

## Verifying a row

1. Confirm the **JAN** on the actual package (or a trusted listing). The loader checks
   the checksum but cannot know it's the *right* code.
2. For an SG observation, confirm the price + retailer + channel, and that it's the
   **same variant** (D-004). In-store and online never blend (D-005).
3. Money is integer minor units: S$34.90 → `3490` (SGD 2dp); ¥1500 → `1500` (JPY 0dp).
4. Set `verified=true` on the variant **and** any observation rows that reference it —
   an observation can't load without its variant.

## Loading

```sh
pnpm seed:load --dry-run --allow-unverified          # validate only, no writes
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… pnpm seed:load   # loads verified=true rows
```

⚠️ `observation` is append-only — a wrong row can't be deleted. Verify before loading.
