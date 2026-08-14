-- M6 · observer_trust. One row per contributor. Weights their observations in
-- the estimate. This table IS mutable (trust evolves as contributions are
-- confirmed or flagged) — it is not the ledger, so no append-only constraint.
-- Maintained by the worker tier via service_role.

create table public.observer_trust (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  score           numeric not null default 1.0 check (score >= 0),
  confirmed_count integer not null default 0 check (confirmed_count >= 0),
  flagged_count   integer not null default 0 check (flagged_count >= 0),
  tier            public.trust_tier not null default 'new',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger set_updated_at before update on public.observer_trust
  for each row execute function extensions.moddatetime (updated_at);

alter table public.observer_trust enable row level security;

-- A contributor may read their own trust row. Scores are otherwise private;
-- the estimate function reads them via service_role / SECURITY DEFINER.
create policy "observer_trust read own"
  on public.observer_trust for select to authenticated
  using (user_id = (select auth.uid()));
