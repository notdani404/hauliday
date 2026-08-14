-- M8 · search_catalogue: text search over the catalogue for the Search tab.
--
-- Joins product + variant, case-insensitive matches on brand / name / canonical
-- name, and returns each hit with its home in-store estimate inline (so results
-- can show a price + confidence without an extra round trip). Reads our own
-- ledger only — no LLM on the read path (non-negotiable #5). ilike is fine for
-- the current catalogue; upgrade to pg_trgm/FTS when it grows (D-021).

create or replace function public.search_catalogue(
  p_query   text,
  p_country char(2) default 'SG'
)
returns table (
  variant_id        uuid,
  brand             text,
  product_name      text,
  canonical_name    text,
  market            char(2),
  size_value        numeric,
  size_unit         text,
  gtin              text,
  est_amount_minor  bigint,
  est_currency      char(3),
  est_confidence    numeric,
  est_count         integer
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    pv.id,
    p.brand,
    p.name,
    pv.canonical_name,
    pv.market,
    pv.size_value,
    pv.size_unit,
    (select i.id_value from public.identifier i
      where i.variant_id = pv.id order by i.created_at limit 1) as gtin,
    e.amount_minor,
    e.currency,
    e.confidence,
    e.observation_count
  from public.product_variant pv
  join public.product p on p.id = pv.product_id
  cross join lateral public.price_estimate(pv.id, p_country, 'in_store') e
  where p.brand ilike '%' || p_query || '%'
     or p.name ilike '%' || p_query || '%'
     or pv.canonical_name ilike '%' || p_query || '%'
  order by (p.brand ilike p_query || '%') desc, p.brand, p.name
  limit 25;
$$;

comment on function public.search_catalogue is
  'Case-insensitive catalogue search (brand/name/canonical_name) returning each '
  'variant with its home in-store estimate inline. See docs/decisions.md D-021.';

grant execute on function public.search_catalogue(text, char) to anon, authenticated;
