-- M5 · fx_rate. Daily close, per (base, quote). We store the interbank `rate`
-- AND a `card_realistic` rate (interbank x (1 + spread)) because interbank lies
-- by 1-3% versus what a card actually charges (vision.md), and a comparison that
-- ignores that is systematically wrong. Populated by the FX worker (D-012).

create table public.fx_rate (
  id             uuid primary key default gen_random_uuid(),
  base           char(3) not null,
  quote          char(3) not null,
  rate           numeric not null check (rate > 0),           -- interbank
  card_realistic numeric not null check (card_realistic > 0), -- interbank x (1+spread)
  as_of          date not null,
  source         text not null,
  created_at     timestamptz not null default now(),
  constraint fx_rate_base_len check (char_length(base) = 3 and base = upper(base)),
  constraint fx_rate_quote_len check (char_length(quote) = 3 and quote = upper(quote)),
  constraint fx_rate_distinct check (base <> quote),
  constraint fx_rate_unique unique (base, quote, as_of, source)
);
create index fx_rate_pair_asof_idx on public.fx_rate (base, quote, as_of desc);

alter table public.fx_rate enable row level security;
create policy "fx_rate readable by all"
  on public.fx_rate for select to anon, authenticated using (true);
