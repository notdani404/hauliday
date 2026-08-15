---
name: get-started
description: Kick-start a Hauliday work session by pulling fresh context — recent commits, working-tree state, the roadmap phase we're on, the decision register, and the CLAUDE.md non-negotiables — then summarize where things stand and what's next. Use at the start of a session, when the user says "/get-started", "catch me up", "where were we", or "what's next".
---

# Get Started — Session Kickstart

Pull the current state of the Hauliday project into context and give the user a
tight, accurate briefing so work can resume immediately. Do **not** start making
code changes — this skill is read-only orientation. End by proposing next steps and
waiting for direction.

## Steps

Run the context pull in as few round-trips as possible (batch the shell commands).

### 1. Git context
Run these together and read the output:
```bash
git -C "$PWD" log --oneline -15
git -C "$PWD" status --short --branch
git -C "$PWD" diff --stat HEAD
```
- Recent commits tell you what landed last. Hauliday commit messages reference
  decision IDs (e.g. `D-026`) — cross them against `docs/decisions.md` to see the
  rationale behind the latest work.
- `status` + `diff --stat` reveal uncommitted work-in-progress (often the real
  "where we left off"). Note any untracked feature dirs under `apps/`, `packages/`,
  `workers/`, or `supabase/migrations/`.

### 2. Project docs
Read the load-bearing docs and skim the rest:
- `CLAUDE.md` — **the non-negotiables** (observations-not-prices, `product_variant`
  as the unit, online/in-store never blend, confidence always visible, no LLM on the
  read path, offline-first capture). These are load-bearing; re-anchor on them every
  session so you don't propose something already ruled out.
- `docs/roadmap.md` — **phases, built in order.** Figure out which phase is current
  from the git log + working tree (the roadmap doesn't mark progress in-place; each
  phase has a "Done when:" gate — judge against it). Don't scaffold ahead of the
  current phase.
- `docs/decisions.md` — append-only decision register, **newest at the bottom**. Read
  the tail for the most recent decisions. Read before proposing an alternative to
  something already settled.
- `docs/plans/` — per-phase plans (`phase-0.md`, `phase-1.md`, `google-auth.md`,
  `store-capture.md`, …). Open the one matching the current/next phase; skip the rest.
- `docs/vision.md` + `docs/data-model.md` — stable context. Read `data-model.md`
  **before touching the schema** (the observation ledger). Skim `vision.md` for any
  product decision. Don't re-summarize these every session — orient, don't recap.

### 3. Reconcile docs vs. reality
Cross-check the roadmap phase and the decision register against the working tree and
commits. If commits reference a decision ID that isn't in `docs/decisions.md`, if a
phase looks done in code but its "Done when:" gate isn't met (or vice-versa), or if a
migration exists that the data-model doc doesn't reflect, **flag the drift**. Trust
the code over the doc, and say so. (Per CLAUDE.md: if a doc is now wrong, propose the
edit — don't silently work around it.)

### 4. Environment sanity (only if relevant)
If the user intends to run or build, confirm quickly rather than assuming:
```bash
node -v && pnpm -v        # pnpm workspace; Node 20 + pnpm 11 known-good
```
Skip this for pure planning/discussion sessions.

## Output format

Give the user a compact briefing, not a wall of text:

1. **Where we are** — current branch, the last 2-3 commits in plain language (with the
   `D-0XX` decision they map to), and the current roadmap phase.
2. **In flight** — uncommitted / untracked work, if any, and what it looks like it is
   (e.g. "Phase 1 capture screen, offline queue not yet wired").
3. **Drift / flags** — anything where docs and code disagree, or anything that looks
   half-finished. Omit this section if everything is clean.
4. **Suggested next** — 2-3 concrete options pulled from the current phase in
   `docs/roadmap.md` and its plan, phrased as a question. Then stop and wait.

## Guardrails
- Read-only. Never commit, push, install, or edit during a kickstart.
- Keep secrets out of output — never echo `.env` values, Supabase keys, or tokens.
- One phase at a time (CLAUDE.md working agreement). Don't propose Phase N+1 work
  while Phase N's "Done when:" gate is unmet.
- Be honest about uncertainty; if the docs look stale, say "the roadmap implies X but
  the tree shows Y" rather than picking one silently.
