-- M15 · Per-destination watchlist (D-029). You save things for different trips,
-- so a saved item can be tagged with the destination it's for; the Watchlist tab
-- groups by country. dest_country is nullable ("any trip"). Rebuild watchlist_items
-- to return it (return shape changes → drop + recreate).

alter table public.watchlist add column if not exists dest_country char(2)
  check (dest_country is null or (char_length(dest_country) = 2 and dest_country = upper(dest_country)));

drop function if exists public.watchlist_items(char);

create function public.watchlist_items(p_country char(2) default 'SG')
returns table (
  variant_id           uuid,
  brand                text,
  product_name         text,
  canonical_name       text,
  market               char(2),
  size_value           numeric,
  size_unit            text,
  gtin                 text,
  est_amount_minor     bigint,
  est_currency         char(3),
  est_confidence       numeric,
  est_count            integer,
  target_amount_minor  bigint,
  target_currency      char(3),
  note                 text,
  dest_country         char(2),
  saved_at             timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    pv.id, p.brand, p.name, pv.canonical_name, pv.market, pv.size_value, pv.size_unit,
    (select i.id_value from public.identifier i where i.variant_id = pv.id order by i.created_at limit 1),
    e.amount_minor, e.currency, e.confidence, e.observation_count,
    w.target_amount_minor, w.target_currency, w.note, w.dest_country, w.created_at
  from public.watchlist w
  join public.product_variant pv on pv.id = w.variant_id
  join public.product p on p.id = pv.product_id
  cross join lateral public.price_estimate(pv.id, p_country, 'in_store') e
  where w.user_id = (select auth.uid())
  order by w.dest_country nulls last, w.created_at desc;
$$;
grant execute on function public.watchlist_items(char) to authenticated;
