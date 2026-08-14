# Decision register

Append-only. Newest at the bottom. If a decision is reversed, add a new entry that
supersedes it — don't edit history.

Format: **ID · Decision · Why · Alternatives rejected · Date**

---

**D-001 · React Native + Expo for the client**
One codebase for iOS and Android, OTA updates matter for an app whose pricing logic
will change constantly, and the camera story is solved (`expo-camera`,
`react-native-vision-camera` frame processors for on-device barcode/OCR).
*Rejected:* Flutter (better camera perf, wrong language for this team). Native
Swift/Kotlin (VisionKit's DataScannerViewController is excellent, but two codebases
for a side project is fatal). Revisit native only if on-device recognition becomes
the product.
2026-08

**D-002 · Supabase + Postgres, with a separate worker tier**
The domain is deeply relational — product ↔ variant ↔ retailer ↔ store ↔ observation.
Auth, Storage, RLS and pgvector in one box. Long-running work (scrapes, embeddings,
FX, LLM fills) runs on a separate worker with a queue, never in an Edge Function.
*Rejected:* Firebase — better ML Kit wiring, but Firestore models this graph badly.
We'd be denormalising within a month.
2026-08

**D-003 · Observations, not prices**
Append-only ledger. Every displayed price is a computed estimate with visible
confidence. This is the core architectural commitment; see `data-model.md`.
2026-08

**D-004 · `product_variant` is the comparison unit**
Market-specific SKUs are genuinely different products and often the entire reason to
buy abroad. Collapsing them produces confidently wrong answers on our best items.
2026-08

**D-005 · Online and in-store prices never blend**
Different numbers answering different questions. `channel` is first-class; both
surface separately. Blending destroys trust on day one.
2026-08

**D-006 · Recognition is a cheap-first cascade**
Barcode (on-device, free, near-perfect) → OCR (on-device, free) → pgvector embedding
→ VLM fallback (costs real money, last resort). Cost per successful match is the
metric that decides whether the unit economics work.
Barcode is the *primary* path even though the original concept was photo-first —
it's a hundred times more reliable and it's right there on the package.
*Fifth tier:* the user. "No, that's not it" → correction → labelled training data.
*Note:* Google Cloud Vision Product Search is in maintenance mode. Do not build a
new dependency on it.
2026-08

**D-007 · Gemini grounded search populates the catalogue; it does not serve reads**
There is no official Google API for market shopping prices. Merchant API is
seller-facing. Grounding retrieves web results, not structured merchant offers — so
it collapses variants, carries no reliable timestamp, is non-deterministic, and is
3–10s slow.

Therefore: grounded lookups run **write-path only**, filling the catalogue
asynchronously as `source='llm_grounded'`, low confidence, with a required
`source_url` and a fetch-and-verify step. The app reads from our own ledger.

Cost is the deciding factor. Read-path scales per user query and grows forever with
success (~200k lookups ≈ $10–14k/mo at $14/1k grounded searches, and one request can
fire several). Write-path scales per unique product, once (~30–50k SKU wedge ≈
$2–3.5k one pass, then decaying refresh). The second is a line item; the first is a
business model problem.

*Separately:* Gemini Flash is unambiguously right for variant resolution, unit/pack
normalisation, brand aliasing across scripts, and parsing OCR'd shelf tags —
including Japanese dual tax-inclusive/exclusive tags. Interpreter, not source. No
grounding needed, so it's cheap tokens.
2026-08

**D-008 · No bring-your-own-key**
Considered as a way to shift grounded-lookup cost to users. Rejected: most users
don't have a key, results become non-deterministic per user, and — critically —
lookups on a user's key don't land in our ledger, so we lose the compounding asset
that is the company. Possible future power-user toggle, never the default path.
2026-08

**D-009 · Paid tier gates cold lookups, not the core loop**
Free: unlimited reads from the ledger, unlimited contributions (we want those badly).
Paid: web search on cache miss, watchlists, pre-trip price alerts, offline catalogue
download per destination. Cache misses get rarer as coverage grows, so marginal cost
falls while perceived value holds.
2026-08

**D-010 · Affiliate feeds over scraping for online prices**
Legitimate, structured, continuous, and they pay us. Shopee and Lazada affiliate
programmes are non-negotiable for APAC. Also Amazon PA-API (JP/SG), Rakuten Ichiba
API. Open Food Facts and GS1 for identity resolution, not price.
SERP APIs (SerpApi, DataForSEO, Oxylabs) are a fallback with real ToS and continuity
risk — not a foundation.
2026-08

**D-011 · `price_estimate` is a SQL function first, a materialised view second**
`data-model.md` described `price_estimate` as "a materialised view, refreshed on write."
A true MV refreshed on every observation insert is expensive and couples the write path
to a full recompute. Refinement: the estimate logic lives in a **SQL function**
`price_estimate(variant_id, country, channel)` — this is what the Phase 0 "done when"
query calls and what the tests prove — and a **materialised view** `price_estimate_mv`
over the whole catalogue is refreshed by the worker tier on a debounce (`REFRESH
MATERIALIZED VIEW CONCURRENTLY`), **not** by a per-insert trigger. Same result, sane
write path. `data-model.md` updated to match.
*Rejected:* per-insert trigger refresh (write amplification), plain view only (too slow
for catalogue-wide reads once seeded).
2026-08

**D-012 · Open Exchange Rates as the FX source; card-realistic = interbank × (1 + spread)**
Reliable JPY/SGD/KRW/THB/TWD coverage, daily close, generous free tier. We store the
interbank `rate` and a `card_realistic` rate = `rate × (1 + spread)`, spread configurable
(~2%, env `FX_CARD_SPREAD`) to model what a card actually charges (vision.md: interbank
lies by 1–3%). Worker is a plain Node script in Phase 0; Fly.io deploy comes later.
*Rejected:* ECB reference rates (EUR-based, needs cross-rates, no card-realistic notion);
exchangerate.host (thinner reliability guarantees for a number we build verdicts on).
2026-08

**D-013 · pnpm monorepo workspace layout**
`/supabase` (migrations, seed, generated types), `/packages/money` (pure-TS Money type +
currency helpers, zero deps), `/packages/db` (committed generated types + shared query
helpers), `/workers/fx` (FX ingest; Fly.io later), `/seed` (curated CSVs + loader). Lets
the Phase 1 Expo app and Phase 2+ workers slot in without restructuring.
*Rejected:* flat single-package repo (would force a restructure at Phase 1); Nx/Turbo
(overkill for a solo side project at this stage).
2026-08

**D-014 · Local DB runtime via a container runtime (OrbStack); seed data is verified, not generated**
Migrations are developed and tested locally against a disposable `supabase db reset`
Postgres (needs a container runtime — OrbStack recommended), then pushed to the personal
cloud project. Seed data (~200 JP cosmetics/skincare variants) is **hand-verified**: the
loader validates barcode checksums and currency/decimal sanity, and any candidate list is
treated as pending human verification, never as truth — it is the accuracy baseline.
2026-08
