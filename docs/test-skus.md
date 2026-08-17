# Test SKUs (loaded to the live DB)

The 10 verified seed items currently in the catalogue. Enter a barcode via the app's
"No camera? Type the barcode" field (home = SG, destination = JP), then type a JP
shelf price to get a verdict. Full candidate set (incl. unverified) is in
`seed/data/variants.csv` (`verified=true` rows are the loaded ones).

| Barcode (JAN) | Product | SG home est. | Segment |
|---|---|---|---|
| `4909978120757` | Anessa Perfect UV Sunscreen Skincare Milk N SPF50 | S$47.00 (FairPrice) | beauty |
| `4901301447647` | Bioré UV Aqua Rich Watery Essence | S$16.25 (FairPrice) | beauty |
| `4987241169658` | Melano CC Intensive Anti-Spot Essence | S$16.90 (Guardian) | beauty |
| `4973167823859` | Suisai Beauty Clear Powder Wash N | S$27.00 (Venus Beauty) | beauty |
| `4901872444915` | Senka Perfect Whip Cleansing Foam | S$6.70 (FairPrice) | beauty |
| `4511413302163` | DHC Medicated Lip Cream | S$10.90 (Venus Beauty) | beauty |
| `4901872837144` | Fino Premium Touch Hair Mask | S$10.70 (Pupsik) | beauty |
| `4901301230843` | Merries Air Through Tape M (6–11kg) | S$27.10 (FairPrice) | baby |
| `4901301425881` | Merries Air Through Pants Big/XL | S$24.75 (FairPrice) | baby |
| `4903111241439` | Natural Moony Organic Cotton Tape M | S$16.40 (Amazon SG) | baby |

Example JP shelf prices to try (¥): Anessa ~2530, Bioré ~968, Melano CC ~1188,
Senka ~430, DHC ~770, Merries ~1180.

## Catalogue expansion (2026-08, D-034/D-037/D-038/D-039)

The catalogue is now **141 variants**, not just these 10. Beyond the 10 hand-verified SKUs:

- **Broad SG set** (D-037): 78 products, 32 scannable via checksum-validated EANs (mostly
  shared/international GTINs). Only 16 grounded SG prices loaded; the rest show "no price yet."
- **Malaysia home prices** (D-038): 284 MYR rows across MY retailers for all 88 SG-era variants,
  so the MY-home verdict works. **All estimates**, `source='seed'`.
- **Thai-market catalogue** (D-039): 53 Thai products (Snail White, Mistine, Cathy Doll…),
  **barcode-less** (browsable/searchable, not scannable). 42 dual-market get SG+MY seed home
  prices → verdicts; 11 Thai-only → "not sold at home".

**Caveat:** almost all of the added prices are seed-tagged **estimates**, and the Thai items have
**no barcodes** — grounding was blocked by the research web-search budget. Purge seed data with
`delete from observation where source = 'seed';`. Grounded barcode/price fill is the follow-up.
The one-off loader scripts + candidate JSONs live in the session scratchpad (ephemeral) — the
loaded data itself is durable in Supabase.
