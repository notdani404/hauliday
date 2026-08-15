-- M12 · Catalogue browse + watchlist (D-025).
--
-- catalogue_categories: category tiles with counts for the browse landing.
-- search_catalogue: gains a category filter and returns category + form so the
--   category page can group by brand or product type. (Return shape changes, so
--   drop + recreate.)
-- watchlist: per-user saved variants, owner-only. Anonymous users have a uid too,
--   so they can save; it carries over when they link a Google identity.

create or replace function public.catalogue_categories()
returns table (category text, item_count integer)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select coalesce(p.category, 'other') as category, count(distinct pv.id)::int
  from public.product p
  join public.product_variant pv on pv.product_id = p.id
  group by coalesce(p.category, 'other')
  order by count(distinct pv.id) desc, category;
$$;
grant execute on function public.catalogue_categories() to anon, authenticated;

drop function if exists public.search_catalogue(text, char);

create function public.search_catalogue(
  p_query    text,
  p_country  char(2) default 'SG',
  p_category text default null
)
returns table (
  variant_id        uuid,
  brand             text,
  product_name      text,
  canonical_name    text,
  category          text,
  form              text,
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
    pv.id, p.brand, p.name, pv.canonical_name, p.category, p.form,
    pv.market, pv.size_value, pv.size_unit,
    (select i.id_value from public.identifier i
      where i.variant_id = pv.id order by i.created_at limit 1) as gtin,
    e.amount_minor, e.currency, e.confidence, e.observation_count
  from public.product_variant pv
  join public.product p on p.id = pv.product_id
  cross join lateral public.price_estimate(pv.id, p_country, 'in_store') e
  where (p_category is null or p.category = p_category)
    and (
      p.brand ilike '%' || p_query || '%'
      or p.name ilike '%' || p_query || '%'
      or pv.canonical_name ilike '%' || p_query || '%'
    )
  order by (p.brand ilike p_query || '%') desc, p.brand, p.name
  limit 50;
$$;
grant execute on function public.search_catalogue(text, char, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- watchlist — per-user saved variants (owner-only).
-- ---------------------------------------------------------------------------
create table public.watchlist (
  user_id    uuid not null references auth.users (id) on delete cascade,
  variant_id uuid not null references public.product_variant (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, variant_id)
);

alter table public.watchlist enable row level security;
create policy "watchlist select own"
  on public.watchlist for select to authenticated using (user_id = (select auth.uid()));
create policy "watchlist insert own"
  on public.watchlist for insert to authenticated with check (user_id = (select auth.uid()));
create policy "watchlist delete own"
  on public.watchlist for delete to authenticated using (user_id = (select auth.uid()));
