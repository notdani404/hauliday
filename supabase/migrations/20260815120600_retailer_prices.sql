-- M16 · Per-retailer price breakdown (D-031). Local price checks are about
-- comparing stores — is it cheaper at Guardian than Watsons or FairPrice? Returns
-- each retailer's recency-median price for a variant in a country + channel,
-- cheapest first. Excludes superseded + heavily-flagged rows, like price_estimate.

create or replace function public.retailer_prices(
  p_variant_id uuid,
  p_country    char(2),
  p_channel    public.channel
)
returns table (
  retailer_id          uuid,
  retailer_name        text,
  amount_minor         bigint,
  currency             char(3),
  observation_count    integer,
  freshest_observed_on date
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with obs as (
    select o.retailer_id, r.name as rname, o.amount_minor, o.currency, o.observed_on
    from public.observation o
    join public.retailer r on r.id = o.retailer_id
    where o.variant_id = p_variant_id
      and o.channel = p_channel
      and r.country = p_country
      and not exists (select 1 from public.observation s where s.superseded_by = o.id)
      and (select count(*) from public.observation_flag f where f.observation_id = o.id) < 2
  )
  select
    retailer_id,
    max(rname) as retailer_name,
    percentile_cont(0.5) within group (order by amount_minor)::bigint as amount_minor,
    (array_agg(currency order by observed_on desc))[1] as currency,
    count(*)::int as observation_count,
    max(observed_on) as freshest_observed_on
  from obs
  group by retailer_id
  order by amount_minor asc;
$$;

grant execute on function public.retailer_prices(uuid, char, public.channel) to anon, authenticated;
