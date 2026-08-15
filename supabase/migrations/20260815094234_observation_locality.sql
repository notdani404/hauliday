-- M18 · Per-city price locality (D-036). Countries are too coarse — a price in
-- Bangkok isn't a price in Chiang Mai. Stamp each observation with the city it was
-- seen in (a stable slug, e.g. 'bangkok', 'singapore') so crowd prices can later be
-- aggregated per city, not per country. Nullable + append-only-safe: existing rows
-- stay null (they're SG home prices, effectively 'singapore'); no backfill, no
-- read-path change yet — price_estimate/retailer_prices still aggregate nationally
-- until destination crowd volume justifies going per-city.

alter table public.observation add column if not exists locality text;

comment on column public.observation.locality is
  'City slug where the price was seen (D-036). Null on pre-M18 rows. Aggregate per-city later.';
