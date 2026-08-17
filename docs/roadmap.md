# Roadmap

Build in order. Do not scaffold ahead of the current phase.

Each phase ends with something demonstrable on a real device.

---

## Where we are (2026-08-17)

- **Phase 0 — ✅ done.** Schema, RLS, Money, FX snapshot, `price_estimate`, seed loader.
  (Deviation from the original plan: the hand-seeded 200-variant baseline is **not** done —
  ~10 hand-verified SKUs exist; the catalogue was instead bulked to **141 variants** via
  grounded research agents. Barcodes are checksum-validated; **most prices are seed-tagged
  estimates, not grounded** — see the grounding blocker below.)
- **Phase 1 — ✅ done** and shipped to web (hauliday.app). Capture loop end-to-end, offline
  queue, Google auth + anon→Google merge (D-033).
- **Beyond the plan (post-Phase-1, D-021…D-039):** catalogue browse + categories, watchlist
  (per-country, targets), profile + onboarding, **home mode** (local per-store comparison),
  **city-in-cluster geography** (D-036), and **multi–home-market** (SG + **Malaysia**, verdict
  computes in the chosen home currency — D-037/D-038). Destinations: Bangkok/Chiang Mai/Phuket,
  Tokyo/Osaka, Seoul, Taipei. Thai-market catalogue loaded (D-039). *This deliberately overran
  the "one market" scope — see the reconciled note under Deliberately later.*
- **Open blocker:** the research web-search budget (200/session) got exhausted across runs, so
  catalogue **prices are ungrounded estimates (source `seed`)** and the **Thai products have no
  barcodes** (not scannable yet). Both need a grounded pass with fresh search budget. This is
  really unfinished **Phase 3** work pulled forward as manual seed loads.

Next natural steps: grounded barcode/price fill (Phase 3), Phase 2 recognition, or Phase 4
retention polish. See `memory/open-threads` for the concrete pick-up list.

---

## Phase 0 — Schema and seed

No app. Get the ledger right first; everything else hangs off it and it's the
expensive thing to get wrong.

- Supabase project, migration tooling, committed generated types
- Full schema per `docs/data-model.md`, RLS on from the first table
- `Money` type + currency helpers, with tests for JPY/KRW zero-decimal handling
- FX ingest worker, daily, with card-realistic rate alongside interbank
- `price_estimate` materialised view: recency-weighted median, outlier rejection,
  source precedence
- Seed ~200 JP cosmetics/skincare + baby (non-formula) variants by hand with real
  barcodes and real SG prices (D-020). Hand-seeded. Not generated — this is the
  accuracy baseline everything is measured against.

**Done when:** a SQL query returns a correct, confidence-scored SG estimate for a
seeded JP variant, and the tests prove the zero-decimal and outlier cases.

---

## Phase 1 — Capture loop

The core interaction, thinnest possible path.

- Expo app, expo-router, auth (anonymous first — do not gate the first scan)
- Country pickers, trip state
- Camera screen with on-device barcode scanning
- Barcode → identifier → variant → estimate
- Manual price entry with live conversion (per prototype)
- Result screen: graded verdict, both channels, visible confidence, tax-free line
- Submit observation, offline queue with later sync

**Done when:** Danielle can scan a real barcode in a real shop, on 4G or offline,
and get a correct answer.

---

## Phase 2 — Recognition cascade

Everything the barcode path misses.

- On-device OCR → fuzzy catalogue match
- CLIP/SigLIP embeddings in pgvector, ANN lookup
- VLM fallback with structured output
- "No, try again" correction loop feeding labelled data back
- Match telemetry: which tier resolved it, at what cost, how often the user corrected

**Done when:** we can report cost-per-successful-match by tier.

---

## Phase 3 — Catalogue fill

- Gemini grounded worker, write-path only, per D-007
- Structured output schema with a mandatory `"unknown"` branch
- Fetch-and-verify on every `source_url`
- Backfill the wedge, refresh top decile on decay schedule
- First affiliate feed integration (Shopee or Lazada)

**Done when:** cache-miss rate on real user scans is measurably falling.

---

## Phase 4 — Retention

- Watchlists, pre-trip alerts
- History, favourites (stubbed in the prototype)
- Offline catalogue download per destination
- Paid tier per D-009

---

## Deliberately later

- Savings-per-litre logic (v1 shows the raw delta plus a graded verdict; the
  density model needs real usage data to calibrate)
- Customs-threshold logic — being pulled forward per D-020 (formula/regulated
  segments need it as a first-class verdict constraint sooner than "later")
- Price history charts
- ~~Any market beyond JP→SG~~ **— reconsidered (D-036/D-037/D-039).** The wedge is still
  JP→SG, but we deliberately built the multi-market machinery early: home markets are SG + MY,
  destinations span TH/JP/KR/TW as cities in country clusters, and the verdict computes in any
  home currency. Rationale: the first real user is a Singaporean in Bangkok, so SG→TH had to
  work. Adding markets is now cheap; the gating cost is grounded price/barcode data per market.
