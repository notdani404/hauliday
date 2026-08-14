-- M4 · THE LEDGER. Append-only. No row is ever overwritten (non-negotiable #1).
--
-- A price shown to a user is always a computed estimate over these timestamped,
-- attributed observations. This table is both the audit trail and the training
-- set, so immutability is enforced in the database, not just by convention.
--
-- CORRECTIONS: never update a row. Insert a NEW row and set its `superseded_by`
-- to the id of the older row it replaces ("pointing backwards", per
-- data-model.md). A row is stale iff its id appears in some other row's
-- `superseded_by`. The estimate function filters those out.
--
-- FLAGS: a mutable flagged_count would be an overwrite, so flags are their own
-- append-only table (observation_flag); any count is derived. (Refines the
-- flagged_count column described in data-model.md — see decision D-015.)

create table public.observation (
  id                uuid primary key default gen_random_uuid(),
  variant_id        uuid not null references public.product_variant (id) on delete restrict,
  retailer_id       uuid not null references public.retailer (id) on delete restrict,
  store_id          uuid references public.store (id) on delete restrict,
  channel           public.channel not null,

  -- Money: integer minor units + ISO 4217. Never a float. JPY/KRW are 0-decimal.
  amount_minor      bigint not null check (amount_minor >= 0),
  currency          char(3) not null,

  tax_inclusive     boolean not null,
  tax_rate_applied  numeric check (tax_rate_applied >= 0 and tax_rate_applied <= 1),

  source            public.obs_source not null,
  observer_id       uuid references auth.users (id) on delete set null,
  photo_id          uuid,          -- storage.objects id; no FK (separate schema)
  source_url        text,
  evidence_verified boolean not null default false,

  observed_on       date not null, -- local shelf date (NOT upload time)
  created_at        timestamptz not null default now(),

  superseded_by     uuid references public.observation (id) on delete restrict,

  constraint observation_currency_len check (char_length(currency) = 3),
  constraint observation_currency_upper check (currency = upper(currency)),
  -- Online observations carry no physical store.
  constraint observation_online_has_no_store
    check (channel <> 'online' or store_id is null),
  -- LLM-grounded observations require a resolvable citation (data-model.md).
  constraint observation_llm_requires_url
    check (source <> 'llm_grounded' or source_url is not null),
  -- A row cannot supersede itself.
  constraint observation_no_self_supersede check (superseded_by <> id)
);

create index observation_variant_channel_idx
  on public.observation (variant_id, channel);
create index observation_observed_on_idx on public.observation (observed_on);
create index observation_superseded_by_idx
  on public.observation (superseded_by) where superseded_by is not null;

-- ---------------------------------------------------------------------------
-- Append-only enforcement. Belt and braces: a trigger raises on any UPDATE or
-- DELETE, and RLS grants no update/delete policy to any role. service_role
-- bypasses RLS but NOT the trigger — the ledger is immutable for everyone.
-- ---------------------------------------------------------------------------
create or replace function public.reject_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'observation is append-only: % is not permitted', tg_op
    using errcode = 'restrict_violation';
end;
$$;

create trigger observation_no_update
  before update on public.observation
  for each row execute function public.reject_mutation();
create trigger observation_no_delete
  before delete on public.observation
  for each row execute function public.reject_mutation();

-- ---------------------------------------------------------------------------
-- observation_flag — append-only moderation signal. Abuse mitigation
-- (data-model.md): retailers have an incentive to seed favourable prices.
-- ---------------------------------------------------------------------------
create table public.observation_flag (
  id             uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.observation (id) on delete restrict,
  flagged_by     uuid references auth.users (id) on delete set null,
  reason         text,
  created_at     timestamptz not null default now(),
  constraint observation_flag_unique_per_user unique (observation_id, flagged_by)
);
create index observation_flag_observation_id_idx
  on public.observation_flag (observation_id);

create trigger observation_flag_no_update
  before update on public.observation_flag
  for each row execute function public.reject_mutation();
create trigger observation_flag_no_delete
  before delete on public.observation_flag
  for each row execute function public.reject_mutation();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.observation enable row level security;
alter table public.observation_flag enable row level security;

-- Raw observations are world-readable (corroboration counts feed the confidence
-- display). Estimates are the primary read surface, but transparency matters.
create policy "observation readable by all"
  on public.observation for select to anon, authenticated using (true);

-- Authenticated users may contribute their own human observations. feed/scrape/
-- llm_grounded rows are inserted by the worker tier via service_role.
create policy "observation insert own human rows"
  on public.observation for insert to authenticated
  with check (observer_id = (select auth.uid()) and source = 'human');

create policy "observation_flag readable by authenticated"
  on public.observation_flag for select to authenticated using (true);
create policy "observation_flag insert own"
  on public.observation_flag for insert to authenticated
  with check (flagged_by = (select auth.uid()));
