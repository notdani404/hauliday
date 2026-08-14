# Phase 1 plan — Capture loop

Status: **approved 2026-08-14**, in progress. Decisions D-016…D-019.

Goal (roadmap): Danielle scans a real barcode in a real shop, on 4G or offline,
and gets a correct, confidence-scored answer. FX worker deferred (D-017).

## Pipeline

```
camera → on-device barcode → GTIN
  → identifier lookup (id_type,id_value) → variant   [miss: "not yet", queue GTIN — D-016]
  → price_estimate(variant,'SG',{in_store,online})   [both channels, never blended; + availability]
  → manual dest shelf price + tax-free + live FX (bundled dated snapshot — D-017)
  → graded verdict (D-019)
  → insert observation (human, in_store, observed_on local); offline queue → sync
```

## Screens (from reference/prototype.html)

welcome → home country → dest country → main (trip + scan) → [camera/scan] →
found (match %) → price entry (keypad + tax-free note + live conversion) →
results (verdict, both channels, visible confidence, tax line) → history. Tab bar.
Anonymous auth; the first scan is never gated.

## Verdict (D-019)

Effective dest = shelf × (1 − tax_free) → convert to home. % vs home estimate:
no home price → 🎁 Only available here · ≥25% 🛍️ Great deal · ≥10% 🤔 Worth it if
it fits · ≥−8% ⚖️ About the same · else 🏠 Cheaper at home. Tax-free: JP/KR 10%,
TH 7%, TW 5%. Savings-per-litre + customs deferred.

## Architecture

- `/apps/mobile` — Expo + expo-router + TS; Supabase client (anon key); reuses
  `@hauliday/money`, `@hauliday/db`, `@hauliday/verdict`.
- `@hauliday/verdict` — new pure, unit-tested package (thresholds + tax-free + delta).
- Offline-first: capture queues on-device (SQLite) and syncs; app reads a committed
  dated FX snapshot. Dewey tokens translated to RN.

## Build order

1. `@hauliday/verdict` + tests. 2. Expo scaffold + anon auth + Supabase client.
3. Country/trip state. 4. Barcode scan → identifier→variant. 5. `price_estimate`
read (both channels + availability). 6. Manual entry + tax-free + FX snapshot.
7. Results/verdict screen. 8. Submit observation + offline queue. 9. History.

## Prerequisites (owner: Daniel)

- Verified seed data in the live DB (else scans resolve but estimates are empty).
- iOS/Android device or simulator for the "real barcode" acceptance test.
