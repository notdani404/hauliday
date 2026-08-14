# Dialects

A dialect is what happens when Dewey meets a real product with real constraints. It may change the accent. It may not change the language.

## Defining a new one

Six decisions, made once, written down. This should take twenty minutes, not a design sprint. If it's taking longer, the pressure is probably going into the wrong place — see "the release valve" below.

Answer these in order. Each has a fixed menu.

**1. Finish** — what is this product made of, and where is it used?
Pick `shell` (aged plastic, indoor, light), `stage` (near-black, dark or low-light use), `paper` (high-key, bright/outdoor, trust-sensitive), or define a new one by giving a full ramp. The question that decides it: *where is the person's body when they use this?*

**2. Lead signal** — which of the five is promoted to primary action?
Default is persimmon. Promote a different one only when the product's core job argues for it. Hauliday leads with ultramarine because its job is showing numbers people must trust, not driving performance. When you promote a different signal, the demoted persimmon becomes scarce and therefore louder — decide deliberately what single action earns it.

**3. Density class** — which rung do rows and targets sit on?
`bench` (32 px, desk, mouse, information-dense), `console` (40 px), `field-use` (48 px, mobile, outdoors, thumb), `glance` (52+ px, read at distance, one-handed, under pressure).

**Density is not a proxy for professionalism.** Dewey says density is respect, but that rule assumes a desk and a mouse. Sessionist is the most professional product in the family and the least dense, because on stage you read at two metres, one-handed, mid-song, with adrenaline. The principle behind the rule — show the operator what they need without asking — is what survives. The pixel value is not.

**4. Type step** — one multiplier on the whole scale. ×1.00 to ×1.30. Follows from density class; don't set it independently.

**5. Patina** — how far along the fade curve does this product sit?
`light` (new product, says so), `moderate`, `heavy` (lives in a gig bag). Patina adjusts the ramp's warmth and the amount of chroma the signals hold — it does not change which signals exist.

**6. Feedback channel** — `sound`, `haptic`, or `silent`.
The sound layer is mandatory in core Dewey and actively wrong in some contexts. Never add clicks to something used on stage or in public. Silent is a legitimate answer.

Then stop. Record the six values, pick one signature part, and start building.

---

## The release valve

Every dialect gets **exactly one** component that exists nowhere else in the family, and it must be justified by the product's hardest problem.

This is deliberate pressure management. Products want to feel distinct; if there's no sanctioned outlet, that pressure leaks into the shared chrome and the family dissolves over a couple of years. One bespoke part per product absorbs it.

Test for whether a proposed signature part is legitimate: **can you name the hard problem it solves in one sentence, and is that problem specific to this product?** If the answer is "it looks better", it's not a signature part, it's drift.

### Promotion

When a product part gets used in a second product, it has proven itself and graduates to the shared layer: `hd-1` becomes `dui-cf-13`, a confidence meter available to everything. Promotion by evidence, not by prediction. This is how the system grows without designing a component library up front for products that don't exist yet.

---

## Existing dialects in full

### dewey core — the reference

```
finish        shell · aged abs
lead signal   persimmon
density       bench · 32 px rows, 28 px targets
type step     ×1.00
patina        moderate
feedback      sound layer on
signature     dui-cn-12 console
```

Use this for anything without a defined dialect — tools, internal utilities, one-offs, the design system's own documentation.

### sessionist — musician companion

```
finish        stage · near-black, warm
lead signal   persimmon (transport, record)
density       glance · 52 px rows, 56 px targets
type step     ×1.28
patina        heavy
feedback      haptic only — never add clicks on stage
signature     ss-1 setlist strip
```

Context: dark stage, two metres viewing distance, one hand, mid-song, adrenaline. Everything follows from that. The only large target on any screen should be the one thing you need between songs.

`ss-1` surfaces tuning, tempo, and retune warnings on the **next** row rather than the current one, because the hard problem isn't the setlist — it's the six seconds between songs.

### hauliday — crowd-sourced travel price comparison

```
finish        paper · high-key, unfaded
lead signal   ultramarine (the product is data, not performance)
density       field-use · 48 px rows and targets
type step     ×1.10
patina        light
feedback      silent — consumer, public, outdoors
signature     hd-1 price ladder
```

Context: bright daylight, outdoors, phone, occasional use, and every number on screen is a claim the user has to decide whether to believe. Contrast floor is raised accordingly.

Persimmon is reserved for exactly one action: submitting a price. That scarcity makes contributing feel like an event rather than a form — which matters for a product whose whole viability depends on people bothering to contribute.

`hd-1` makes confidence a first-class column rather than a detail view, and states the staleness of the **worst** row in the footer where it can't be missed. The hard problem isn't the price, it's whether to trust it.

---

## When a dialect wants to break a locked rule

This happens, and it isn't always drift. The test:

**Is it breaking the rule, or honouring the reason for the rule?**

Sessionist inverting the density rule is legitimate — it serves "show the operator what they need without asking" better than the literal 32 px would. A project wanting rounded corners because they look friendlier is not; there's no underlying principle being served, just a preference.

If a rule genuinely needs to relax for a good reason, that's a change to Dewey itself, at which point every product inherits it and the rev number goes up. Say that out loud rather than quietly making an exception. Silent exceptions are how design languages die.
