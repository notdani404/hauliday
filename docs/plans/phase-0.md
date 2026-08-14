# Phase 0 plan — Schema and seed

Status: **approved 2026-08-14**, in progress. Decisions logged as D-011…D-014.

Goal (roadmap): a SQL query returns a correct, confidence-scored SG estimate for a
seeded JP variant, with tests proving the zero-decimal and outlier cases. No app.

## Approved decisions

1. Local DB runtime via a container runtime — **OrbStack** (D-014).
2. FX source — **Open Exchange Rates**, card-realistic = interbank × (1 + spread) (D-012).
3. `price_estimate` — **SQL function first, worker-refreshed materialised view second** (D-011).
4. Repo layout — **pnpm monorepo** (D-013).
5. Seed data — **hand-verified**, candidate lists are pending-verification, never truth (D-014).

## Repo layout

```
/supabase/          migrations, seed SQL, generated types, config.toml
/packages/money/    pure-TS Money type + currency helpers (zero deps, Vitest)
/packages/db/       committed generated Supabase types + shared query helpers
/workers/fx/        FX ingest worker (Fly.io deploy later)
/seed/              curated variant/price CSVs + loader
pnpm-workspace.yaml, package.json, tsconfig.base.json, .nvmrc, .npmrc
```

## Migration sequence (RLS on every table from creation)

- **M1** extensions (`pgcrypto`, `vector`, `moddatetime`), enums, `updated_at` helper.
- **M2** catalogue: `product`, `product_variant`, `variant_equivalence`, `identifier`.
- **M3** retail: `retailer`, `store`.
- **M4** ledger: `observation` (append-only — trigger blocks UPDATE/DELETE + RLS grants none).
- **M5** fx: `fx_rate`.
- **M6** trust: `observer_trust`.
- **M7** pricing: `price_estimate(...)` function + `price_estimate_mv` + RLS policies.

Money everywhere = `amount_minor bigint` + `currency char(3)` (CHECK len 3). No composite
type; decimal-places logic lives in the TS `Money` type.

## price_estimate computation

Given `(variant_id, country, channel)`, over non-superseded observations:
MAD outlier rejection → recency-weighted median (in-store half-life ~30d) → weight by
source precedence (`human > feed > scrape > llm_grounded`) and observer trust. Never
blends channels. Outputs amount + currency + confidence + count + freshest date + dominant
source. Confidence = f(age, corroboration, precedence, variance, trust).

## Build order

1. Repo scaffold + `supabase init`.
2. `packages/money` + Vitest (earliest win, no DB).
3. Migrations M1–M7 + RLS.
4. `supabase gen types` → commit to `/packages/db`.
5. `price_estimate` function + pgTAP tests (outlier, zero-decimal storage, append-only).
6. Seed loader + verified starter set.
7. FX worker.
8. Validate the "done when" query end-to-end.

## Manual / external prerequisites (owner: Daniel)

- **Personal Supabase org + project** for Hauliday (CLI is currently on the work account;
  do NOT create under the work org). Then `supabase link` + a dashboard PAT for `db push`.
- **OrbStack** installed (`brew install orbstack`) for local `db reset` / pgTAP.
- **Open Exchange Rates** app id (env `OXR_APP_ID`).
- **Seed data verification** — confirm each candidate barcode + SG price before it becomes
  the baseline.
