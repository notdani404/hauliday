# Data model

The single most important design decision in Hauliday: **we do not store prices, we
store price observations.** Never overwrite. Append.

A price shown to a user is always a *computed estimate* over a set of timestamped,
attributed observations — with its confidence exposed.

## Entities

```
product           Canonical item concept. Brand, name, category, form.
                  Deliberately loose — a hub, not the comparison unit.

product_variant   Market-specific SKU. THE unit of comparison.
                  product_id, market (ISO country), size_value, size_unit,
                  formulation_note, pack_count, canonical_name
                  Two variants may be "equivalent" without being identical —
                  see variant_equivalence below.

variant_equivalence  variant_a, variant_b, relation
                  (identical | equivalent | similar | different),
                  determined_by (human | llm | gtin), confidence, notes
                  This is where "is JP Anessa the same as SG Anessa?" lives.
                  It is a graph edge, not a column, because the answer is
                  frequently "sort of."

identifier        GTIN / JAN / EAN / ASIN / retailer SKU → variant. Many-to-one.
                  Barcode lookup is a join, not ML. This table is the fast path.

retailer          Chain. name, country, default_channel
store             Physical location. retailer_id, geo, name. Nullable for online.

observation       THE LEDGER. Append-only.
                  variant_id, retailer_id, store_id (nullable),
                  channel (online | in_store),
                  amount_minor (bigint), currency (char(3)),
                  tax_inclusive (bool), tax_rate_applied,
                  source (human | feed | llm_grounded | scrape),
                  observer_id (nullable), photo_id (nullable),
                  source_url (nullable), evidence_verified (bool),
                  observed_on (date, local), created_at (timestamptz),
                  superseded_by (nullable), flagged_count

fx_rate           base, quote, rate, as_of, source. Daily close.
                  Also store a card_realistic rate (interbank + spread).

price_estimate    Materialised view, refreshed on write.
                  variant_id × country × channel →
                  amount_minor, currency, confidence, observation_count,
                  freshest_observed_on, dominant_source

observer_trust    user_id, score, confirmed_count, flagged_count, tier
```

## Rules that must hold

**Never overwrite an observation.** Corrections are new rows with `superseded_by`
pointing backwards. The ledger is the audit trail and the training set.

**Money is `bigint` minor units + ISO 4217.** Never float, never a bare number.
JPY and KRW have zero decimals; getting this wrong produces 100× errors that look
plausible in a comparison view.

**Source precedence:** `human > feed > scrape > llm_grounded`.

An `llm_grounded` observation is provisional. It is displaced the moment any higher
source reports on the same variant, and it must never outrank a human observation.

**LLM observations require a resolvable `source_url`.** No citation, no row. Run a
verifier that fetches the URL and confirms the number appears on the page; store the
result in `evidence_verified`. Unverified LLM rows are capped at low confidence and
are never the sole basis for a verdict shown as confident.

**Channel never blends.** An in-store observation and an online observation are two
separate estimates. Presenting a blended average is the fastest way to lose trust.

**Estimate computation:** recency-weighted median (not mean — resistant to a single
bad entry), with outlier rejection, weighted by observer trust and source precedence.
Half-life for in-store observations is short (~30 days); online feed data is fresh by
definition but excludes shipping.

## Confidence

Surface it, always. Confidence is a function of:

- age of the freshest observation
- number of independent corroborating observers
- source precedence
- variance across observations
- observer trust scores

Copy pattern: *"S$34.90 · Watsons SG in-store · confirmed 2 days ago by 14 shoppers"*
versus *"~S$19.00 · Muji SG · last seen 3 weeks ago by 2 shoppers"*. Users forgive an
uncertain number that admits it. They do not forgive a confident wrong one.

## Abuse

Retailers have an incentive to seed favourable prices. Mitigations: observer trust
scoring, photo evidence attached to submissions, cross-observation agreement
thresholds before an observation influences an estimate, rate limits per user per
store per day, and a flag path.

## Open questions

- Does `variant_equivalence` need a transitive closure, or is pairwise enough in
  practice? Start pairwise.
- How do we represent multi-buy pricing ("2 for ¥3,000")? Probably a separate
  `offer_condition` on the observation rather than a distinct price.
- Bundle and gift-set SKUs — variant, or a composition table? Defer.
