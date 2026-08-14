-- M2 · Catalogue: product, product_variant, variant_equivalence, identifier.
--
-- product is a loose hub. product_variant is THE unit of comparison (D-004):
-- market-specific SKUs are genuinely different products. identifier is the fast
-- path — barcode lookup is a join, not ML.

-- ---------------------------------------------------------------------------
-- product — canonical item concept. Deliberately loose.
-- ---------------------------------------------------------------------------
create table public.product (
  id         uuid primary key default gen_random_uuid(),
  brand      text not null,
  name       text not null,
  category   text,              -- e.g. 'skincare', 'cosmetics', 'supplement'
  form       text,              -- e.g. 'serum', 'cream', 'stick'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- product_variant — market-specific SKU. THE comparison unit.
-- ---------------------------------------------------------------------------
create table public.product_variant (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references public.product (id) on delete restrict,
  market           char(2) not null,  -- ISO 3166-1 alpha-2, e.g. 'JP', 'SG'
  size_value       numeric,           -- e.g. 60 (ml), 40 (g)
  size_unit        text,              -- e.g. 'ml', 'g', 'count'
  formulation_note text,              -- why the JP formula differs from the SG one
  pack_count       integer not null default 1 check (pack_count > 0),
  canonical_name   text not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint product_variant_market_upper check (market = upper(market))
);
create index product_variant_product_id_idx on public.product_variant (product_id);
create index product_variant_market_idx on public.product_variant (market);

-- ---------------------------------------------------------------------------
-- variant_equivalence — "is JP Anessa the same as SG Anessa?" is a graph edge,
-- not a column, because the answer is frequently "sort of". All relations are
-- symmetric, so we canonicalise the pair (a < b) and store it once.
-- ---------------------------------------------------------------------------
create table public.variant_equivalence (
  id            uuid primary key default gen_random_uuid(),
  variant_a     uuid not null references public.product_variant (id) on delete cascade,
  variant_b     uuid not null references public.product_variant (id) on delete cascade,
  relation      public.equivalence_relation not null,
  determined_by public.determined_by not null,
  confidence    numeric check (confidence >= 0 and confidence <= 1),
  notes         text,
  created_at    timestamptz not null default now(),
  constraint variant_equivalence_canonical_pair check (variant_a < variant_b),
  constraint variant_equivalence_unique_pair unique (variant_a, variant_b)
);

-- ---------------------------------------------------------------------------
-- identifier — GTIN/JAN/EAN/UPC/ASIN/SKU -> variant. Many-to-one. Fast path.
-- ---------------------------------------------------------------------------
create table public.identifier (
  id         uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variant (id) on delete cascade,
  id_type    public.identifier_type not null,
  id_value   text not null,
  created_at timestamptz not null default now(),
  constraint identifier_unique_value unique (id_type, id_value)
);
create index identifier_variant_id_idx on public.identifier (variant_id);

-- updated_at maintenance
create trigger set_updated_at before update on public.product
  for each row execute function extensions.moddatetime (updated_at);
create trigger set_updated_at before update on public.product_variant
  for each row execute function extensions.moddatetime (updated_at);

-- ---------------------------------------------------------------------------
-- RLS — on from the first table. Catalogue is world-readable; writes are
-- service-role only (workers/seed bypass RLS). No public write policies exist,
-- so anon/authenticated cannot insert/update/delete.
-- ---------------------------------------------------------------------------
alter table public.product enable row level security;
alter table public.product_variant enable row level security;
alter table public.variant_equivalence enable row level security;
alter table public.identifier enable row level security;

create policy "product readable by all"
  on public.product for select to anon, authenticated using (true);
create policy "product_variant readable by all"
  on public.product_variant for select to anon, authenticated using (true);
create policy "variant_equivalence readable by all"
  on public.variant_equivalence for select to anon, authenticated using (true);
create policy "identifier readable by all"
  on public.identifier for select to anon, authenticated using (true);
