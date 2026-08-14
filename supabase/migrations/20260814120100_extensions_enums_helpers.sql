-- M1 · Extensions, enums, and shared helpers.
--
-- Everything downstream depends on these. Enums are created here so the
-- catalogue and ledger migrations can reference them. pgvector is enabled now
-- (Phase 2 needs it) but no vector columns exist yet.

create extension if not exists pgcrypto with schema extensions;   -- gen_random_uuid()
create extension if not exists vector with schema extensions;     -- pgvector, Phase 2
create extension if not exists moddatetime with schema extensions;-- updated_at trigger

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- Online and in-store prices NEVER blend (D-005). channel is first-class.
create type public.channel as enum ('online', 'in_store');

-- Source precedence, strongest first: human > feed > scrape > llm_grounded.
-- (Precedence is enforced in the estimate function, not by enum order.)
create type public.obs_source as enum ('human', 'feed', 'scrape', 'llm_grounded');

-- variant_equivalence graph edge relation (data-model.md).
create type public.equivalence_relation as enum
  ('identical', 'equivalent', 'similar', 'different');

-- How an equivalence edge was determined.
create type public.determined_by as enum ('human', 'llm', 'gtin');

-- Identifier namespaces resolved to a variant. Barcode lookup is a join.
create type public.identifier_type as enum ('gtin', 'jan', 'ean', 'upc', 'asin', 'sku');

-- Observer trust tiers (coarse; score is the fine-grained signal).
create type public.trust_tier as enum ('new', 'trusted', 'verified', 'flagged');

-- ---------------------------------------------------------------------------
-- Shared helper: updated_at maintenance via moddatetime
-- ---------------------------------------------------------------------------
-- Applied per-table in later migrations with:
--   create trigger set_updated_at before update on <t>
--   for each row execute function extensions.moddatetime(updated_at);
