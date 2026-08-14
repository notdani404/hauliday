# Hauliday

Crowd-sourced travel price comparison. A traveller photographs a product abroad;
we tell them what it costs at home, whether it's even sold there, and whether it's
worth the luggage space.

**Know before you haul.**

## Where to start

- [`CLAUDE.md`](./CLAUDE.md) — non-negotiables, stack, and working agreement. Read first.
- [`docs/vision.md`](./docs/vision.md) — the problem, the user, what "worth it" means.
- [`docs/data-model.md`](./docs/data-model.md) — the observation ledger. Read before touching the schema.
- [`docs/decisions.md`](./docs/decisions.md) — decision register.
- [`docs/roadmap.md`](./docs/roadmap.md) — phases. We build in order.
- [`reference/prototype.html`](./reference/prototype.html) — clickable spec of the flow (not code to port).
- [`KICKOFF-PROMPT.md`](./KICKOFF-PROMPT.md) — session-by-session prompts to drive the build.

## Stack

- **App:** React Native + Expo (EAS Build), TypeScript, expo-router
- **Backend:** Supabase — Postgres, Auth, Storage, RLS, pgvector
- **Workers:** separate service (Fly.io) for scrapes, embeddings, FX pulls, LLM catalogue fills
- **LLM:** Gemini Flash — parsing/normalisation/variant resolution; grounded search for catalogue fill only

## Status

**Phase 0 — schema and seed.** No app yet; the ledger comes first. See `docs/roadmap.md`.

## Design system

UI work uses **Dewey (dui-1)**, installed at project scope under
[`.claude/skills/dewey`](./.claude/skills/dewey). Hauliday's dialect: paper finish,
ultramarine lead signal, 48 px field-use density, `hd-1` price ladder.
