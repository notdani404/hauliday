-- M3 · Retail: retailer (chain) and store (physical location).
--
-- Online observations carry no store (store_id is null on the observation);
-- store rows are physical locations only. Geo is stored as plain lat/lng to
-- avoid a PostGIS dependency at this stage — proximity search comes later.

create table public.retailer (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  country         char(2) not null,
  default_channel public.channel not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint retailer_country_upper check (country = upper(country))
);

create table public.store (
  id          uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references public.retailer (id) on delete cascade,
  name        text,
  lat         double precision check (lat between -90 and 90),
  lng         double precision check (lng between -180 and 180),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index store_retailer_id_idx on public.store (retailer_id);

create trigger set_updated_at before update on public.retailer
  for each row execute function extensions.moddatetime (updated_at);
create trigger set_updated_at before update on public.store
  for each row execute function extensions.moddatetime (updated_at);

alter table public.retailer enable row level security;
alter table public.store enable row level security;

create policy "retailer readable by all"
  on public.retailer for select to anon, authenticated using (true);
create policy "store readable by all"
  on public.store for select to anon, authenticated using (true);
