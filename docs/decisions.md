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

**D-015 · Flags live in an append-only `observation_flag` table, not a `flagged_count` column**
`data-model.md` listed a `flagged_count` on `observation`, but a mutable counter is an
overwrite — it breaks non-negotiable #1 (no row is ever overwritten). Flags are therefore
their own append-only table (`observation_flag`, unique per user per observation); any count
is derived. The estimate function excludes observations with ≥2 flags. `data-model.md` updated.
*Rejected:* denormalised counter column (overwrites), allowing UPDATE only to that column
(erodes the immutability guarantee the ledger depends on).
2026-08

**D-016 · Phase 1 unknown barcode = graceful miss + queue, no user catalogue writes yet**
A scanned GTIN not in `identifier` shows "we don't have this yet" and queues the barcode for
Phase 3 catalogue fill. Keeps Phase 1 the thinnest capture loop; user-created provisional
variants (with dedupe + moderation) are deferred.
*Rejected:* let users create variants now — real crowd-sourcing value, but pulls variant
dedupe, equivalence, and abuse handling forward into the thin slice.
2026-08

**D-017 · Phase 1 conversion uses a bundled, dated FX snapshot (offline-first), not the live table**
The FX worker is deferred, and capture must work with no signal (non-negotiable #6). The app
ships a small committed rate snapshot (interbank + card-realistic, with an `as_of` date shown
as a caveat). The worker later refreshes it; the on-device snapshot is required regardless for
offline capture.
*Rejected:* reading `fx_rate` live (empty until the worker runs; breaks offline).
2026-08

**D-018 · Mobile app at `/apps/mobile`; `/apps` joins the workspace**
Extends D-013 with an `/apps` dir. Expo app at `/apps/mobile`, leaving room for `/apps/web`.
*Rejected:* a flat `/app` at repo root — collides with expo-router's own `app/` routes
convention and boxes out a future web app.
2026-08

**D-019 · Verdict is a pure `@hauliday/verdict` package; thresholds lifted from the prototype**
Graded verdict states and cutoffs (Only-here / ≥25% Great / ≥10% Worth-it-if-it-fits /
≥−8% About-the-same / else Cheaper-at-home) come from `reference/prototype.html` and live in a
unit-tested pure package, not a screen. Effective dest price = shelf × (1 − tax-free) converted
to home. Savings-per-litre and customs remain deferred (roadmap).
2026-08

**D-020 · Second wedge is JP baby (non-formula); formula is fenced off; customs becomes first-class sooner**
Alongside JP cosmetics/skincare into SG, add **baby products (non-formula)** — same
research-heavy, replenishment audience (diapers, baby skincare, wipes, bottles). **Infant/
follow-up formula is included in the catalogue but flagged `customs-limited` and never surfaced
as "worth it":** SG caps hand-carried formula at 5 kg/5 L *and* ≤ S$100/person, so a naive
verdict would advise an illegal/over-limit haul. Consequence: **customs allowance is pulled
forward from "deliberately later" toward a first-class verdict constraint** once beyond the
clean beauty/diaper cases. Expansion order after these two: fragrance, then character/hobby
goods (both maximise the availability-gap story with low regulatory drag). Supplements, food,
and OTC medicine stay deferred until customs limits are modelled (HSA/SFA friction).
*Rejected:* headlining formula (legal/quality risk); dropping baby entirely (strong fit).
2026-08

**D-021 · Searchable catalogue + bottom tab nav; Google auth as an account upgrade**
Beyond barcode scan, add a **Search** entry path backed by a `search_catalogue(q)` SQL
function (ilike on brand/name/canonical_name, returns each variant with its home in-store
estimate inline; upgrade to pg_trgm/FTS when the catalogue grows). App navigation becomes a
**bottom tab bar: Scan · Search · Watchlist · History** (Watchlist is a stub anticipating the
Phase 4 retention loop). The capture flow (product→price→result→submit) stacks above the tabs.
**Google auth is a fast-follow** layered over anonymous: anonymous stays the default (first
scan never gated), Google links/upgrades the identity so contributions carry trust. See
`docs/plans/google-auth.md`.
*Rejected:* search via LLM (violates #5 — read path stays on our ledger); client-side
two-query search (weaker matching); replacing anonymous with mandatory Google (gates the loop).
2026-08

**D-022 · Store-level capture; free-text now, Google Places fast-follow, proximity end-state**
An in-store observation should tie to a specific **branch**, not just a chain. `store` gains
`google_place_id`/`area`/`address`; a `find_or_create_store(retailer, name, area)` SECURITY
DEFINER RPC lets contributors create/resolve stores without a broad insert grant (dedups by
name+area). **Store is resolved at SYNC time, not capture time** — the name is queued locally
so offline capture (non-negotiable #6) still works; the store row is created when back online.
Phased: (a) free-text branch + area now; (b) Google Places autocomplete fills place_id +
coords + address; (c) **eventual "prices near you"** — `price_estimate` weights/filters by
distance (a future pricing-logic change, needs the coords from b). Places needs Daniel's Google
Maps Platform key. See `docs/plans/store-capture.md`.
*Rejected:* mandatory store (adds friction to the core loop); resolving store at capture time
(breaks offline).
2026-08

**D-023 · Minimal, optional user profile; demographics via birth-year + gender, not identity PII**
A `profile` table (M10) keyed to auth.users, owner-only RLS, every field nullable — profile is
never required to use the app. Demographic signal is **birth YEAR + gender + country**, not a
full DOB (birth year buckets age with far less sensitivity next to name+email). Names/display
prefill from the Google identity. **No phone** (email suffices — collecting it is PII + friction
for no demographic value). **Avatar is the Google picture URL, not an uploaded file** (upload =
Storage bucket + moderation, deferred). Gender is optional + inclusive (female/male/non-binary/
prefer-not-to-say/self-describe). Never shared.
*Rejected:* full birthdate (identity-grade PII); phone capture; custom photo upload now.
2026-08

**D-024 · profile.country is an ISO home-market enum and is the default comparison home**
Profile country is no longer free text — it's a constrained selection from the app's
`HOME_MARKETS` enum, stored as an ISO alpha-2 code (`char(2)`, M11), matching how country/
market codes work elsewhere. It **sets the user's home market for comparison**: choosing it
updates the trip home, so `price_estimate` reads run against that country. Currently
HOME_MARKETS = [SG] (the wedge); the picker + column expand as home markets gain data.
Branding: brand SVGs (in ~/Codebases/Personal/Logos/Hauliday) applied as app icon/favicon/
splash + welcome lockup + a compact BrandMark on Scan/Search; web OG via a post-build head
inject (Expo output:"single" ignores +html.tsx).
2026-08

**D-025 · Catalogue browse + watchlist**
The Catalogue tab (was Search) lands on **category tiles** (`catalogue_categories` RPC) with
the search bar still present; a **category page** lists items with a **brand ⇄ product-type**
grouping toggle (`search_catalogue` gained a category filter + returns category/form). Each row
has a **watchlist heart**. `watchlist` table (M12) is owner-only; anonymous users can save
(they have a uid) and it carries over when they link Google. The Watchlist tab shows a basic
saved-items list now; **pre-trip price alerts + targets are the fast-follow**.
*Rejected:* a separate 6th Catalogue tab (crowded — folded into Search); inline estimate on
every watchlist row (deferred with the alerts build).
2026-08

**D-026 · Landing = Google-first with onboarding wizard; "Start comparing" anonymous path**
The landing offers two routes: **primary "Continue with Google"** and **secondary "Start
comparing"** (into the app anonymously — the core loop is never gated). After Google sign-in,
**new users** (no `profile` row) go through an **onboarding wizard — one field per page**
(name → birth year → gender → home market; optional steps skippable), then into the app;
**returning users** (profile exists) skip the landing and go straight in. Home market chosen in
onboarding sets the comparison home (D-024). Entry lands on the destination picker if no trip
destination is set yet, else the Scan tab.
*Rejected:* mandatory sign-in (gates the loop); one big profile form (wizard is gentler);
gating onboarding behind email/phone verification.
2026-08

**D-027 · Watchlist build-out: targets + "what a good price looks like"**
Watchlist rows now carry the home estimate inline (`watchlist_items` RPC, M13) and show a
computed **"worth it under X" / "great under Y"** shelf price for the current destination —
`suggestedShelfTargets` in `@hauliday/verdict` is the inverse of the verdict (home est × FX
snapshot × tax-free). A **watchlist detail** screen shows both home channels, the good-price
targets, a user-set **target price + note** (M13 columns + update RLS), a log-a-price shortcut,
and remove. **Push alerts are still pending** — they need expo-notifications + a worker that
checks new observations against targets; the data/targets are in place for that.
*Rejected:* storing the target as a per-trip dest-shelf price (home-currency target is
dest-agnostic); building push now without the worker/token infra.
2026-08

**D-028 · Google Places (New) store autocomplete, client-side, referrer-restricted key**
Submit's store picker uses **Places API (New)** (`places.googleapis.com`) called directly from
the client — it's CORS-enabled (the classic web service isn't) and works with an HTTP-referrer-
restricted web key (`EXPO_PUBLIC_GOOGLE_MAPS_KEY`, restricted to hauliday.app). Picking a place
resolves to a store via `find_or_create_store_by_place` (M14, dedups on `google_place_id`,
stores address + lat/lng) — the coords foundation for "prices near you". Free-text branch/area
stays as the fallback (and when no key); store still resolves at SYNC time (offline-safe).
**Caveat:** a referrer key only works on hauliday.app — native (EAS) and preview URLs need a
separate key (Android/iOS restriction) or a proxy. Also add the key to Vercel env for the live build.
*Rejected:* classic Places web service (no browser CORS); Maps JS SDK (web-only, no native);
proxying through a worker now (unneeded for web).
2026-08

**D-029 · Watchlist is per-destination (you save for different trips)**
A saved item is tagged with the destination it's for (`watchlist.dest_country`, M15, nullable =
"any trip"), defaulting to the current trip when you add it. The Watchlist tab **groups by
country**; the detail lets you change an item's trip; the "worth it under X" good-price target
is computed for *that item's* destination, not just the active trip.
*Rejected:* one flat global list (can't tell which trip a save is for); multiple countries per
item (a join table — overkill for now; re-tag if plans change).
2026-08

**D-031 · Home mode: local price checks + per-store comparison**
An Abroad/Home toggle in the trip header. **Home** = you're shopping in your home market: the
product screen shows a **per-retailer in-store breakdown** (Guardian vs Watsons vs FairPrice,
cheapest first) via `retailer_prices` (M16); price entry skips FX/tax; logging feeds the same
ledger. This builds the in-store dataset locals check *and* inbound travellers rely on (SG as
their destination). **Abroad** = unchanged haul verdict.
*Rejected:* home-check as contribution-only (the value is the store-to-store comparison); a
separate "local" ledger (it's the same observations, filtered by country/channel).
2026-08

**D-032 · Bottom nav = Catalogue · Scan · Watchlist · Account; History under Account**
Catalogue is the landing tab (where people intuitively start), Scan sits second (thumb
hotspot). History stopped being a top-level tab — it's now a subsection reached from Account
(and a link on the signed-out Account view, since anonymous users have a local sync queue too).
*Rejected:* Scan-first (browsing is the more common entry); History as its own tab (low-
frequency; belongs with the account).
2026-08

**D-030 · Google sign-in is plain OAuth (anon→merge deferred)**
`linkIdentity` (to merge an anonymous user's contributions into their Google account) fails at
the OAuth callback when that Google account is already a permanent user, bouncing back with an
error and no session — which stranded users on the landing. Reverted to plain `signInWithOAuth`
(reliable for new + returning), and the landing waits through the callback. Merging anon→Google
needs callback-error handling and is a follow-up.
2026-08

**D-033 · anon→Google merge wired with a callback-error fallback (supersedes D-030)**
`startGoogleFlow` now attempts `linkIdentity` when the current user is anonymous, so a first-time
Google sign-in keeps that user's scans/watchlist/trust. Arms a `hauliday.oauth.link-retry`
localStorage flag before redirecting. On return, `handleOAuthReturn` (called from the landing):
if a session exists and is non-anonymous → clear the flag, proceed; if the callback URL has an
`error` and the flag is armed (link failed because the Google account is already permanent) →
consume the flag (so it can't loop) and complete a plain `signInWithOAuth` instead. Returning
users thus sign in on the second hop; brand-new Google users link in place on the first. This is
the follow-up D-030 called for; plain-OAuth-only is no longer the behaviour.
2026-08

**D-034 · Seeded multi-store SG prices so local comparison feels real**
Each of the 10 loaded SKUs had a single SG retailer, so the per-store comparison (D-031) showed
one row. Added SG in-store observations across Watsons / Guardian / NTUC FairPrice / Don Don Donki
(and Sephora for Anessa) — 32 new rows — via a one-off, idempotent insert (skip if a row for that
variant+retailer+in_store already exists; never re-runs the non-idempotent CSV loader; ledger
stays append-only). Don Don Donki (the JP-goods discount chain) lands cheapest, which is both
realistic and on-narrative. Script lives in scratchpad, not the repo.
2026-08

**D-035 · Contributors can add a retailer free-text; captured prices never strand (M17)**
Audit found Contribute was a dead end when a market has no seeded retailers — the "Share
this price" button stayed disabled with no fallback, losing the price. Added
`find_or_create_retailer(name, country, channel)` (SECURITY DEFINER, dedups on lower(name)+
country, mirrors `find_or_create_store`; granted to authenticated, which anon users inherit)
and a free-text retailer field on the submit screen (shown when the list is empty, or via
"Don't see it? Add a retailer"). The chain is resolved/created at SYNC time in the queue, so it
stays offline-safe. Also from the same audit pass: the verdict screen now shows the home
reference with its channel + shopper count + age + confidence (no bare number, #4/#3), and the
Abroad/Home toggle is relabelled "I'm travelling / I'm home" with a one-line hint so the verdict
never silently disappears; product's CTA routes to the destination picker instead of bouncing.
2026-08

**D-036 · Destinations are cities in country clusters, not countries (M18)**
Countries are too coarse — a Bangkok price isn't a Chiang Mai price. A **country cluster** holds
what's national (currency, tax-free/VAT via taxFreeRate, FX); **cities** are the price locality.
`markets.ts`: `DESTINATION_COUNTRIES` (clusters) + `DESTINATION_CITIES` (Bangkok/Chiang Mai/Phuket,
Tokyo/Osaka, Seoul, Taipei), each city inheriting its cluster's currency/code/flag flat so screens
that read `dest.currency`/`dest.code` are unchanged; `dest.name` renders the city. Trip `dest` is a
`DestinationCity` persisted by `cityId` (storage bumped v1→v2). Picker groups cities under country
headers. **Scope: model cities now, aggregate later** — observations gain a nullable `locality`
column (city slug), stamped at capture from the shopping market's `cityId`; existing rows stay null
(SG home = 'singapore'). `price_estimate`/`retailer_prices` still aggregate nationally until
destination crowd volume justifies per-city — no read-path change yet. Watchlist "which trip?" stays
country-level (D-029 groups by country). First live corridor: SG→Bangkok.
2026-08

**D-037 · Broad SG catalogue load + multi–home-market Phase A**
*Catalogue:* loaded a grounded broad-SG set — 78 products (→88 total variants), 32 scannable via
checksum-validated EANs (30 shared/international GTINs, best chance of also scanning abroad). Only the
16 real "found" prices became observations (source 'scrape' + source_url, locality 'singapore'); the
~227 LLM price *estimates* were NOT loaded — observations-not-guesses (#1). One-off idempotent loader in
scratchpad; candidates file `sg-catalogue-candidates.json`. Most items show "no price yet" until real
prices arrive — honest by design.
*Multi-home Phase A (plan `docs/plans/multi-home-market.md`):* the verdict now computes in the chosen
home currency, not a hardcoded SGD. `fxSnapshot` keeps SGD as the pivot and adds `crossRate(base,quote)
= perUnitSGD[base]/perUnitSGD[quote]` (exact BigInt decimal division) + `toHome(amount, homeCurrency)`
returning **null instead of throwing** on a missing rate (also kills the audit's render-throw). `result`/
`price`/`watchlist`/`watch` pass `quote = home.currency`; a missing corridor rate shows a graceful "can't
convert yet" instead of a fake verdict. Malaysia (MYR) added to `HOME_MARKETS`; the profile picker now
has a real choice. **SGD conversions are byte-identical to before** (SG verdicts unchanged). No schema
change (`profile.country` already generic; Money already registers MYR). Phase B = seed MY home-price
data before the MY verdict is actually useful; anon home-switching deferred to then.
2026-08
