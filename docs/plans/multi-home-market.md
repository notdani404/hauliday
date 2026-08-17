# Plan · Multi–home-market support

**Status:** Phase A ✅ shipped (D-037). Malaysia Phase B ✅ seeded (D-038). Remaining: anon home
picker, grounded MY prices (currently seed-tagged estimates), further markets. Touches pricing
logic (verdict FX) → this was plan-first per the working agreement.

**Goal:** let a user pick a home market other than Singapore; the verdict, home-price estimates,
and savings all compute in *their* home currency — not a hardcoded SGD.

## Why it's SG-only today (the coupling)

1. **Verdict FX is hardcoded to SGD.** `result.tsx` calls `computeVerdict({ fx: { base: dest.currency,
   quote: 'SGD', rate } })`, rate from `FX_SNAPSHOT.perUnitSGD[dest.currency]`. `watch/[variantId]`
   targets do the same. `fxSnapshot.toHomeSGD` throws for any currency not in the table.
2. **Home-price estimates** read observations where `retailer.country = home.code` — so a home market
   is only *useful* where we have priced observations in that market's currency.
3. **Savings / formatting** are rendered in the home currency (today, always SGD).
4. `profile.country` — already a generic ISO char(2) (constraint allows any uppercase 2-letter code;
   **no migration needed**).
5. **Tax-free** is destination-side (`taxFreeRate(dest.code)`) — home-independent, no change.

## What does NOT need changing
- **Schema:** none. `profile.country` constraint is generic; observations are already keyed by
  `retailer.country`; `observation.locality` (D-036) is orthogonal.
- **Money:** `@hauliday/money` already registers MYR, IDR, HKD, USD, EUR, VND, etc. with correct
  minor units. No change.

## The two pieces

### A. FX generalization — cheap, safe, correct-by-construction (do first)
The snapshot already pivots on SGD ("SGD per 1 unit of X"). A home-currency conversion is just a
cross-rate through that pivot:

    rate(foreign → home) = perUnitSGD[foreign] / perUnitSGD[home]

- Extend `perUnitSGD` with every home currency we support (SGD already = '1'; add MYR, etc.).
- Replace `toHomeSGD(amount)` with `toHome(amount, homeCurrency)` computing the cross-rate;
  return `null` (not throw) when a rate is missing, and render a graceful "FX unavailable" state.
  (This also kills the audit's latent render-throw in `price.tsx`/`result.tsx`.)
- `result.tsx` + `watch/[variantId]`: `quote = home.currency`, `rate = cross-rate`.
- **FX worker** (`workers/fx`): make sure the pull includes all home + destination currencies, and
  regenerate the bundled snapshot. Precision: keep card-realistic (~2% spread) per D-017.

### B. Home-price data — the real unlock (per market, as we commit)
For a new home market, the verdict needs priced observations in that market. Until seeded/crowded,
those users see "no home price yet." This is a seeding/crowd effort per market — the gating cost,
not a code problem.

## App plumbing
- `markets.ts`: add the chosen home market(s) to `HOME_MARKETS` (country-level, single-city for now;
  each carries its own `currency`).
- **Home picker for anonymous users.** Today only the signed-in profile editor changes home; `trip.home`
  exists in state with `setHome`, but anon users have no entry point. Add one reachable without
  sign-in (options: a "Home: 🇸🇬 ▾" control in the trip header, or a first-run step). *Scope decision.*
- Profile editor already renders a multi-option home picker when `HOME_MARKETS.length > 1` — no work.

## Phasing
- **Phase A (now, if signed off):** FX generalization + add the market to `HOME_MARKETS` + anon home
  picker. Low risk; also fixes the FX-throw bug. Ships even before data — new-market users just see
  "no home price yet," which is honest.
- **Phase B:** seed/crowd home-price data for the new market. The actual value; do per market.

## Open decisions (for sign-off)
1. **Which home market first?** Malaysia (MYR) is the natural second — adjacent, heavy SG/TH
   cross-shopping. Determines the Phase-B data effort.
2. **Anon home switching in scope now,** or signed-in-only until Phase B has data?
