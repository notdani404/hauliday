# Kickoff prompts

Paste these into Claude Code in order. Not all at once.

---

## Session 1 — Orient and challenge

> Read `CLAUDE.md` and everything in `docs/`. Also open
> `reference/prototype.html` and look at the flow it demonstrates — treat it as a
> clickable spec, not as code to port.
>
> Don't write any code yet.
>
> Tell me:
> 1. What you understand the product to be, in your own words. If your summary
>    differs from mine, the docs are wrong and I want to know where.
> 2. Three things in `docs/data-model.md` you think are wrong, risky, or
>    under-specified. Be specific and be blunt — I'd rather find the schema
>    problems now than in Phase 3.
> 3. Anything in `docs/decisions.md` you'd push back on.
>
> Then wait.

---

## Session 2 — Schema

> We're on Phase 0. Read `docs/data-model.md` and `docs/roadmap.md`.
>
> Write the migration plan first — table by table, with the columns, constraints,
> indexes and RLS policies you intend, and the reasoning for each. No SQL files yet.
>
> Pay particular attention to:
> - The append-only constraint on `observation` — how is it actually enforced at the
>   database level, not by convention?
> - Zero-decimal currencies. JPY and KRW must be impossible to get wrong.
> - `variant_equivalence` as a graph edge rather than a column.
>
> Wait for sign-off before writing migrations.

---

## Session 3 — Estimate logic

> Implement the `price_estimate` computation: recency-weighted median with outlier
> rejection, weighted by source precedence and observer trust, split by channel.
>
> Write the tests first, and include these cases explicitly:
> - A single malicious low observation must not move the estimate
> - JPY (zero decimal) and SGD (two decimal) in the same comparison
> - An `llm_grounded` observation must not outrank a `human` one for the same variant
> - A variant with no home-market observations returns "not sold at home", not zero
> - All observations older than the half-life → low confidence, not a confident number

---

## Session 4 — Seed

> Seed ~200 JP cosmetics and skincare variants with their SG counterparts.
>
> Important: do not invent barcodes or prices. Where you can't verify a real GTIN or
> a real retailer price, leave the field null and flag the row for manual entry.
> A null is fine. A plausible-looking fabricated barcode will poison the accuracy
> baseline and we won't notice for months.
>
> Give me a CSV to fill the gaps in by hand.

---

## Ongoing hygiene

Add to any session where a decision gets made:

> Append what we just decided to `docs/decisions.md` in the existing format before
> we move on.

And periodically:

> Is anything in `CLAUDE.md` or `docs/` now stale relative to the code? List the
> discrepancies and propose edits.
