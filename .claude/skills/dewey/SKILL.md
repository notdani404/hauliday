---
name: dewey
description: The Danthelion house design language — written dui-1, said "dewey". Use this whenever building, restyling, or reviewing any UI, component, page, screen, or frontend for a Danthelion personal project (Sessionist, Hauliday, or any new one), and whenever the user mentions dewey, dui-1, Danthelion, dialects, signal colours, part numbers, or asks for something to "match my other projects" or "look like the rest of my stuff". Also use when choosing colours, spacing, type, motion, or component structure for those projects even if the design system is never named, and when auditing an existing screen for drift. Do not use for Mission Systems, Ebb & Flow, or client work — Danthelion is personal projects only.
---

# Dewey (dui-1)

The design language for Danthelion personal projects. Descended from Teenage Engineering's industrial idiom: every screen is a piece of equipment with labelled controls, a readout, and visible state — not a document to browse.

Nothing here is a suggestion. The locked rules below apply to every Danthelion surface. Everything else is chosen per project from a fixed menu.

## Workflow

1. **Identify the dialect.** Which project is this? If it's an existing one, use its tuned tokens (table below). If it's new, read `references/dialects.md` and define one before writing any code — six decisions, then stop.
2. **Load the tokens.** Copy `assets/dewey.css` into the project and use the custom properties. Never hardcode a colour or a spacing value.
3. **Build**, obeying the locked rules.
4. **Run the drift check** in `references/review.md` before calling it done.

## Locked — applies to every project, no exceptions

These are the family resemblance. A surface that breaks one has left the universe.

- **4 px module.** Every dimension divides by four. Heights come off a fixed ladder (24/28/32/52/76/132) so mixed controls align on their baseline without adjustment.
- **Hard-offset elevation.** Raised surfaces get `box-shadow: 6px 6px 0 var(--d-shadow)` — an offset block, no blur, ever. Pressed states translate into the shadow and remove it. Recessed surfaces are simply darker with a hairline. There is no soft shadow anywhere in this system.
- **Two type roles.** Grotesk (Helvetica Neue / Arial stack) speaks for people. Mono speaks for the machine. If the system generated it — a value, a timestamp, an ID, a status, a label — it is mono, tracked +6–10%, and numerals are always tabular. This split is the single strongest cross-project tell.
- **Lowercase chrome.** All interface furniture is lowercase. User content, proper nouns, and legal text keep their own case. Never apply `text-transform` to something a person wrote.
- **The five signals and their meanings.** Persimmon = primary action. Ultramarine = selection, focus, link. Verdigris = running, passed, armed. Amber = caution, unsaved, degraded. Oxide = fault, destructive, clip. A signal never means two things in one product.
- **Colour never carries status alone.** Every lamp and tag pairs its colour with a word or a shape. This matters more than usual here because the palette is deliberately faded and the values sit close together.
- **Stepped motion.** `steps(3)` to `steps(6)`, nothing over 200 ms, no easing curves, no bounce, no overshoot, no fade-in-from-nowhere. Movement reads as mechanism, not animation. Anything the user typed appears at 0 ms.
- **Part numbers.** Every component carries a code. Shared parts are `dui-`; project parts take the project's two letters.
- **Saturation budget.** No screen exceeds roughly 5% saturated area. Grey is the material; the signals are the meaning.

## Tuned — the six decisions that define a dialect

| token | what it sets |
|---|---|
| finish | the material the product is made of (light/dark, warmth, display colour) |
| lead signal | which of the five is promoted to primary action |
| density class | which rung of the height ladder rows and targets sit on |
| type step | a single multiplier on the whole scale |
| patina | how far along the fade curve this product sits |
| feedback channel | sound, haptic, or silent |

### Existing dialects

| | dewey core | sessionist | hauliday |
|---|---|---|---|
| finish | shell · aged abs | stage · near-black, warm | paper · high-key, unfaded |
| lead signal | persimmon | persimmon | **ultramarine** |
| density | bench · 32 px rows | glance · 52 px rows, 56 px targets | field-use · 48 px |
| type step | ×1.00 | ×1.28 | ×1.10 |
| patina | moderate | heavy | light |
| feedback | sound layer | haptic only | silent |
| signature part | `dui-cn-12` console | `ss-1` setlist strip | `hd-1` price ladder |

Full definitions and the process for adding a dialect are in `references/dialects.md`.

## Free — one signature part per project

Each project gets **exactly one** component that exists nowhere else in the family. This is the release valve: it absorbs the pressure to differentiate so the shared chrome doesn't have to.

The constraint that makes it work: a signature part must be justified by the product's hardest problem, not by wanting a different look. Sessionist's `ss-1` surfaces tuning and retune warnings on the *next* row because the real problem is the six seconds between songs. Hauliday's `hd-1` makes confidence a first-class column because the problem isn't the price, it's whether to believe it.

A second bespoke component is a request to change Dewey itself, and gets reviewed as one. Say so out loud rather than quietly adding it.

## Anti-patterns

These are the defaults a model reaches for by habit. Every one of them is wrong here, and catching them is most of this skill's value.

| don't | do |
|---|---|
| `rounded-lg`, `rounded-xl`, `rounded-2xl` | `border-radius: 2px`. Mechanical, not friendly. |
| `shadow-md`, blurred shadows, glows | hard offset block, no blur |
| gradient backgrounds or gradient text | flat fills only |
| Inter, Geist, or a Google-font display serif | Helvetica Neue / Arial grotesk + system mono |
| Tailwind default palette (`blue-500`, `slate-800`) | the five signals + the material ramp |
| `ease-in-out`, `transition-all`, spring physics | `steps(5, end)`, ≤200 ms |
| emoji as icons or status | 24 px stroke pictograms, or a word |
| `text-transform: uppercase` on headings | lowercase chrome, mixed-case content |
| centred hero + big number + accent colour | a fixed panel with labelled controls |
| skeleton loaders and indeterminate spinners | show the actual state, or a determinate meter |
| soft pastel or "cream + terracotta" palettes | the aged signals — see the trap note below |
| proportional figures in data | `font-variant-numeric: tabular-nums` |
| generic `<div>` soup with no naming | part codes in comments or class names |

**The trap:** Dewey's palette is faded 1980s industrial, which is one bad decision away from terracotta-and-sage — the most over-served palette of the last five years. Three things keep it out of that ditch, and all three must survive: ultramarine stays near full chroma, the reds are held apart rather than allowed to converge, and the *greys* carry the warmth so the signals don't have to. If a screen starts feeling like a lifestyle brand, check those three first.

## Writing copy in Dewey

- Name things by what the person controls, never by how the system is built.
- Active voice, and the name stays constant through the flow: a button that says "publish" produces "published".
- Errors state what happened and what to do. They do not apologise and are never vague.
- Empty states are an invitation to act, not a mood.
- Labels are terse and abbreviated like equipment: `vol`, `tempo`, `pre-fader`, `ch 04`.

## Reference files

Read these as needed — don't load them all up front.

- `references/tokens.md` — the full palette with hex and OKLCH, the material ramps for each finish, the type scale, the height ladder, motion tokens. Read when you need an exact value.
- `references/dialects.md` — full dialect definitions and the process for defining a new one. Read when starting a new project or changing a tuned token.
- `references/parts.md` — the part catalogue with implementation notes and markup patterns. Read when building a specific component.
- `references/review.md` — the six-question drift check. Read before finishing any screen, and when auditing existing work.
- `assets/dewey.css` — drop-in custom properties for all dialects plus base part styles. Copy into the project rather than reimplementing.

## Notes on stack

The CSS asset is framework-agnostic custom properties, so it works in plain CSS, CSS modules, or styled-components as-is. If the project uses Tailwind, map the custom properties into `theme.extend` rather than using Tailwind's default scales — `references/tokens.md` has the config block. Never mix Dewey tokens with Tailwind's default palette, radius, or shadow scales; they encode the opposite aesthetic and the result reads as neither.
