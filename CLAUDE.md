# Hauliday

Crowd-sourced travel price comparison. A traveller photographs a product abroad; we
tell them what it costs at home, whether it's even sold there, and whether it's worth
the luggage space.

**Tagline:** Know before you haul.

## Read this first

- `docs/vision.md` — the problem, the user, what "worth it" means. Read before any product decision.
- `docs/data-model.md` — the observation ledger. **Read before touching the schema.**
- `docs/decisions.md` — decision register. Read before proposing an alternative to something already settled.
- `docs/roadmap.md` — phases. We build in order.
- `reference/prototype.html` — see "The prototype" below.

## Non-negotiables

These are load-bearing. If a task seems to require breaking one, stop and raise it
rather than working around it.

1. **We store observations, never prices.** No row is ever overwritten. A price shown
   to a user is always a computed estimate over a set of timestamped observations.
   See `docs/data-model.md`.
2. **`product_variant` is the unit of comparison, not `product`.** Japanese-market
   Anessa is a different variant from Singapore-market Anessa — different formulation,
   different price, and often the entire reason someone wants to buy it abroad.
   Collapsing them produces confidently wrong answers on our most important items.
3. **Online and in-store prices never blend.** Different numbers, different questions.
   `channel` is a first-class column and both surface separately in the UI.
4. **Confidence is always visible.** Every price carries its source, age, and
   corroboration count. We never show a bare number.
5. **No LLM price lookup on the read path.** Grounded lookups populate the catalogue
   asynchronously; the app reads from our own ledger. See `docs/decisions.md` D-007.
6. **Offline-first for capture.** Shop basements have no signal. Submission queues
   locally and syncs later. If capture requires connectivity, the core loop is broken.

## Stack

- **App:** React Native + Expo (EAS Build), TypeScript, expo-router
- **Backend:** Supabase — Postgres, Auth, Storage, RLS, pgvector
- **Workers:** separate service (Fly.io) for scrapes, embeddings, FX pulls, LLM
  catalogue fills. Never in an Edge Function.
- **Recognition:** on-device barcode → on-device OCR → pgvector embedding → VLM fallback
- **LLM:** Gemini Flash for parsing/normalisation/variant resolution. Grounded search
  for catalogue fill only, write-path only.

## Conventions

- TypeScript strict. No `any` — use `unknown` and narrow.
- Money: **integer minor units + ISO 4217 code**, never floats. JPY has 0 decimals,
  KRW 0, SGD 2 — a shared `Money` type handles this. Never `number` for a price.
- Timestamps: `timestamptz`, UTC, always. Also store the observation's local date
  separately — "what day was it on the shelf" is a different question from "when was
  it uploaded."
- DB: snake_case, plural tables. Migrations only, never manual schema edits.
- Generated Supabase types are committed and regenerated after every migration.
- RLS on from the first table, not retrofitted.

## Commits

Dan the Lion's repo, Dan the Lion's voice. Write commits the way he'd say it out loud.

- **Short subject, does the work on its own.** Sentence case, no full stop, ideally
  ≤65 chars. `+`, `;`, `:` to pack related bits: `Catalogue browse + watchlist (D-025)`.
- **Casual, dry, idiosyncratic.** Contractions and lowercase where natural, a bit of wry
  shorthand is welcome (`baby scope`, `fast-follow`, `tidy Supabase site_url`). Plain
  English over ceremony — never corporate release-note voice.
- **Tag the decision/migration.** End the subject with `(D-0XX)` when a commit realises a
  decision, and name migrations inline (`M12`) when relevant.
- **Body only when it earns it.** Skip it for small stuff. When a change is meaty, a tight
  wrapped paragraph on the *what + why* is fine — keep it lean, no bullet dumps.
- **No trailers. Ever.** No `Co-Authored-By`, no `Generated with`, no `Claude-Session`,
  no `🤖` line. The message ends at the last real sentence. See [[no-coauthored-commit-line]].

## Working agreement

- Plan before you build. For anything touching schema, recognition, or pricing logic,
  write the plan first and wait for sign-off.
- One phase at a time. Don't scaffold ahead of the current phase in `docs/roadmap.md`.
- When a decision gets made in conversation, append it to `docs/decisions.md` in the
  same session. An undocumented decision gets relitigated.
- If something in these docs is now wrong, say so and propose the edit. Don't silently
  work around a stale instruction.

## The prototype

`reference/prototype.html` is a **clickable spec, not a codebase.**

It is vanilla HTML/CSS/JS built to demo the flow. The real app is React Native.

- **Do** use it for: screen sequence, copy, verdict thresholds, the tax-free handling,
  the "not sold at home" state, the visual language.
- **Do not** port its code, structure, or CSS. Do not treat its `CATALOG` array or
  hardcoded FX rates as a data model — they are stubs.
- Where prototype and `docs/` disagree, `docs/` wins.
