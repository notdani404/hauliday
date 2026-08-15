-- M13 · Watchlist build-out (D-027): per-item target price + note, and an
-- owner-scoped RPC that returns each watched variant with its home estimate
-- inline (for a price-aware watchlist without N round trips).

alter table public.watchlist add column if not exists target_amount_minor bigint
  check (target_amount_minor is null or target_amount_minor >= 0);
alter table public.watchlist add column if not exists target_currency char(3)
  check (target_currency is null or (char_length(target_currency) = 3 and target_currency = upper(target_currency)));
alter table public.watchlist add column if not exists note text;

-- Owner may edit their own rows (target/note).
create policy "watchlist update own"
  on public.watchlist for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Watched variants for the caller, with home in-store estimate + target inline.
create or replace function public.watchlist_items(p_country char(2) default 'SG')
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
    w.target_amount_minor, w.target_currency, w.note, w.created_at
  from public.watchlist w
  join public.product_variant pv on pv.id = w.variant_id
  join public.product p on p.id = pv.product_id
  cross join lateral public.price_estimate(pv.id, p_country, 'in_store') e
  where w.user_id = (select auth.uid())
  order by w.created_at desc;
$$;
grant execute on function public.watchlist_items(char) to authenticated;
