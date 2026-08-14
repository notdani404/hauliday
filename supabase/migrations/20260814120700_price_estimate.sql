-- M7 · price_estimate: the pricing logic (D-011).
--
-- A function computes the estimate on demand for (variant, country, channel);
-- a materialised view caches it catalogue-wide, refreshed by the worker.
--
-- Method, over observations for the variant+channel whose retailer is in the
-- target country, excluding superseded rows and rows with >= 2 flags:
--   1. weight each by source precedence x recency (half-life) x observer trust
--   2. reject outliers by modified z-score on the median absolute deviation
--   3. weighted median of survivors -> estimate
--   4. confidence from freshness, corroboration, precedence, variance
-- Channels never blend (D-005): channel is a parameter, not aggregated over.

create type public.price_estimate_result as (
  amount_minor        bigint,
  currency            char(3),
  confidence          numeric,
  observation_count   integer,
  freshest_observed_on date,
  dominant_source     public.obs_source
);

create or replace function public.price_estimate(
  p_variant_id uuid,
  p_country    char(2),
  p_channel    public.channel
) returns public.price_estimate_result
language sql
stable
security definer
set search_path = public, extensions
as $$
  with hl as (
    select case when p_channel = 'in_store' then 30.0 else 45.0 end as half_life
  ),
  cand as (
    select o.id, o.amount_minor, o.currency, o.observed_on, o.source,
           o.observer_id, o.evidence_verified,
           (current_date - o.observed_on)::numeric as age_days
    from public.observation o
    join public.retailer r on r.id = o.retailer_id
    where o.variant_id = p_variant_id
      and o.channel = p_channel
      and r.country = p_country
      and not exists (
        select 1 from public.observation s where s.superseded_by = o.id
      )
      and (
        select count(*) from public.observation_flag f where f.observation_id = o.id
      ) < 2
  ),
  weighted as (
    select c.*,
      (case c.source
         when 'human' then 1.0 when 'feed' then 0.7
         when 'scrape' then 0.5 when 'llm_grounded' then 0.25 end)
      * power(0.5, c.age_days / (select half_life from hl))
      * (case when c.source = 'human'
              then coalesce(
                     (select ot.score from public.observer_trust ot
                      where ot.user_id = c.observer_id), 1.0)
              else 1.0 end) as weight
    from cand c
  ),
  stats as (
    select percentile_cont(0.5) within group (order by amount_minor) as med
    from weighted
  ),
  mad as (
    select percentile_cont(0.5) within group
             (order by abs(amount_minor - (select med from stats))) as mad_val
    from weighted
  ),
  kept as (
    select w.* from weighted w
    where (select mad_val from mad) is null
       or (select mad_val from mad) = 0
       or abs(0.6745 * (w.amount_minor - (select med from stats))
              / (select mad_val from mad)) <= 3.5
  ),
  tot as (
    select sum(weight) as tw,
           count(*) as n,
           max(observed_on) as freshest,
           min(amount_minor) as mn,
           max(amount_minor) as mx,
           percentile_cont(0.5) within group (order by amount_minor) as med2,
           count(distinct coalesce(observer_id::text, 'src:' || source::text)) as corrob,
           bool_and(source = 'llm_grounded' and not evidence_verified) as all_unverified_llm
    from kept
  ),
  wmedian as (
    select k.amount_minor,
           sum(k.weight) over (
             order by k.amount_minor
             rows between unbounded preceding and current row
           ) as cum
    from kept k
  ),
  est as (
    select case
      when (select tw from tot) is null or (select tw from tot) = 0 then
        (select percentile_cont(0.5) within group (order by amount_minor) from kept)
      else
        (select amount_minor from wmedian
         where cum >= (select tw from tot) / 2
         order by amount_minor limit 1)
    end::bigint as amount_minor
  ),
  curr as (
    select currency from kept
    group by currency order by sum(weight) desc, count(*) desc limit 1
  ),
  dom as (
    select source from kept group by source order by sum(weight) desc limit 1
  )
  select
    (select amount_minor from est),
    (select currency from curr),
    case when (select n from tot) = 0 then 0::numeric else
      round((
        least(1.0, greatest(0.0,
          0.35 * power(0.5, (current_date - (select freshest from tot))::numeric
                             / (select half_life from hl))
        + 0.25 * least((select corrob from tot)::numeric / 5.0, 1.0)
        + 0.20 * (case (select source from dom)
                    when 'human' then 1.0 when 'feed' then 0.8
                    when 'scrape' then 0.6 when 'llm_grounded' then 0.3 end)
        + 0.20 * greatest(0.0, 1.0 - ((select mx from tot) - (select mn from tot))::numeric
                                      / nullif((select med2 from tot), 0))
        ))
        -- LLM-grounded is provisional: cap confidence, harder if unverified.
        * (case when (select source from dom) = 'llm_grounded' then 0.66 else 1.0 end)
        * (case when (select all_unverified_llm from tot) then 0.5 else 1.0 end)
      )::numeric, 3)
    end,
    (select n from tot)::integer,
    (select freshest from tot),
    (select source from dom)
$$;

comment on function public.price_estimate is
  'Confidence-scored price estimate for (variant, country, channel) over the '
  'append-only observation ledger. Recency-weighted median with MAD outlier '
  'rejection, source precedence and observer-trust weighting. See docs/data-model.md.';

grant execute on function public.price_estimate(uuid, char, public.channel)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Catalogue-wide cache. Refreshed by the worker on a debounce (D-011), never by
-- a per-insert trigger. One row per (variant, observed country, channel).
-- ---------------------------------------------------------------------------
create materialized view public.price_estimate_mv as
select pv.id as variant_id,
       c.country,
       ch.channel,
       e.amount_minor,
       e.currency,
       e.confidence,
       e.observation_count,
       e.freshest_observed_on,
       e.dominant_source
from public.product_variant pv
cross join (values ('online'::public.channel), ('in_store'::public.channel)) ch(channel)
join lateral (
  select distinct r.country
  from public.observation o
  join public.retailer r on r.id = o.retailer_id
  where o.variant_id = pv.id
) c on true
cross join lateral public.price_estimate(pv.id, c.country, ch.channel) e
where e.observation_count > 0;

-- Unique index required for REFRESH ... CONCURRENTLY.
create unique index price_estimate_mv_pk
  on public.price_estimate_mv (variant_id, country, channel);

grant select on public.price_estimate_mv to anon, authenticated;

-- Worker entry point: refresh without blocking reads.
create or replace function public.refresh_price_estimates()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  refresh materialized view concurrently public.price_estimate_mv;
end;
$$;
