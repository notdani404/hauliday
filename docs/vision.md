# Vision

## The problem

A traveller is standing in a shop in Tokyo holding something she might want. Three
questions, none of which she can answer:

1. Is this cheaper than at home?
2. Can I even get this at home?
3. Is the saving worth the luggage space and the hassle?

Today she solves this by juggling a currency converter, a home retailer's website in
another tab, and guesswork about whether the SKU in her hand is the same SKU that
website is selling. It takes minutes per item and she often gets it wrong.

## The insight

The scarce data is not online prices. Anyone can scrape a listing.

The scarce data is **what a physical shop charged, recently.** That only ever comes
from a human standing in front of the shelf. Every check a user makes is a datapoint
for the next traveller — the act of using the app is the act of building it.

That is the moat and the reason this is a crowd-sourced product rather than a scraper
with a nice UI.

## What "worth it" means

Raw price delta is the weak version. The strong version accounts for:

- **Savings density** — dollars saved per litre of luggage. A 15% saving on a 2kg item
  is often a bad trade; 15% on a 60ml bottle is not.
- **Availability** — "not sold at home" outranks any percentage. If she can't get it
  in Singapore, price is close to irrelevant.
- **Tourist tax refunds** — Japan 10%, Korea 10%, Thailand 7%, Taiwan 5%. A comparison
  that ignores this is systematically wrong by that margin on every item.
- **Real FX** — interbank rates lie by 1–3% versus what her card actually charges.
- **Customs allowance** — Singapore GST relief thresholds. A great deal that triggers
  a declaration is a different decision.

The verdict is graded, never binary. "Worth it if it fits" is the honest answer for a
15% saving on something bulky, and saying so builds more trust than a green tick.

## Who it's for

**Primary:** the deliberate haul shopper. Travels a few times a year, researches before
going, has a mental list. Skincare, cosmetics, supplements, specialty food, stationery.
Predominantly SEA travelling to Japan and Korea.

**Not** the impulse duty-free shopper. They don't research and won't contribute.

## The wedge

**Japanese cosmetics and skincare into Singapore.**

High value density, obsessively researched by its audience, well-barcoded, strong
repeat purchase, and a real availability gap (many JP-market SKUs genuinely aren't
sold in SG). Narrow catalogue, deep coverage. Being excellent for one vertical beats
being thin across twenty.

**Second wedge: JP baby products (non-formula) into Singapore** (D-020). Same
research-obsessed, replenishment-driven audience and adjacent shops — diapers
(Merries/Moony), baby skincare, wipes, bottles. **Formula is deliberately fenced
off:** Singapore caps hand-carried infant formula at 5 kg / 5 L *and* ≤ S$100 per
person, which defeats the haul thesis and would have us advise a purchase the law
limits. It stays in the catalogue flagged as customs-limited, never headlined as
"worth it" — until customs allowance is a first-class input to the verdict.

## Retention

The trip is not the loop — most people travel two or three times a year. The loop is
the **watchlist between trips**: add things you want, and we tell you what to look for
when you land, and what a good price looks like when you get there.

## Explicitly out of scope for v1

- Buying anything in-app. We are a decision tool, not a marketplace.
- Global catalogue coverage.
- Price history charts.
- Social features beyond aggregate contribution.
