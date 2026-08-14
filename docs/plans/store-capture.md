# Plan — store-level capture (D-022)

Tie an in-store observation to a specific branch, building toward "prices near you".

## (a) Free-text — DONE

- M9: `store.google_place_id` / `area` / `address`; `find_or_create_store(retailer,
  name, area)` RPC (SECURITY DEFINER, dedups by name+area).
- Submit screen: optional branch name + area (in-store only). Queued locally and
  resolved to a `store_id` at **sync time** (offline-first), then attached to the
  observation.

## (b) Google Places autocomplete — fast-follow (needs your setup)

**Your setup:** Google Maps Platform project → enable **Places API** (+ billing),
create an API key restricted to the app's referrers/bundle IDs.

**Build:**
- A place search field (Places Autocomplete). On select, capture `place_id`, name,
  formatted address, and lat/lng.
- Extend `find_or_create_store` (or a new `upsert_store_by_place`) to dedup on
  `google_place_id` and store address + coords.
- Store the key as `EXPO_PUBLIC_GOOGLE_MAPS_KEY` (Places Autocomplete is called from
  the client; restrict the key). Server-side Places calls would go through a worker.
- Show a "Open in Maps" link on a store (`https://www.google.com/maps/place/?q=place_id:…`).

## (c) "Prices near you" — end-state (bigger, later)

Once stores carry coords, make `price_estimate` (and the search/estimate reads)
distance-aware: filter or weight observations by proximity to the user, and expose a
"near me" sort. This is a **pricing-logic change** (new params + index on store geo,
possibly PostGIS or earthdistance) — plan separately when we get there. Ties back to
the roadmap's deferred location work.

## Notes

- `observation.store_id` stays nullable (online has no store; unknown branch is fine).
- Constraint already enforces online ⇒ no store.
- Abuse: user-created stores are dedup'd but unmoderated for now; revisit with
  observer-trust gating.
