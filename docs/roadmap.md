# Roadmap

Build in order. Do not scaffold ahead of the current phase.

Each phase ends with something demonstrable on a real device.

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
- Any market beyond JP→SG
