# Part catalogue

Shared parts carry the `dui-` prefix and are owned by the system. Changing one changes every product and needs a rev bump.

| code | part | role |
|---|---|---|
| `bt-1` | momentary pad | fires an action, returns to rest |
| `kn-2` | rotary encoder | continuous value, 24 detents |
| `fd-3` | linear fader | bounded value with visible travel |
| `sw-4` | toggle switch | two states, one step of travel |
| `dp-5` | segment readout | exact numeric state |
| `mt-6` | bar meter | live magnitude, peak hold |
| `tb-7` | data table | many rows, one selection |
| `sq-8` | step grid | 16 discrete slots, on or off |
| `ld-9` | indicator lamp | binary or tri-state status |
| `pn-10` | panel | bordered surface, holds parts |
| `st-11` | stepper | integer value, coarse and fine |
| `cn-12` | console | scrolling log with timestamps |

## Choosing between value controls

This is the decision people get wrong most often:

- **Encoder (`kn-2`)** — values with no natural end, or where the current position matters more than the range. Gain, blend, zoom, tempo trim.
- **Fader (`fd-3`)** — values with a visible floor and ceiling that get compared across siblings. Channel levels, mix weights.
- **Stepper (`st-11`)** — if you can't confidently say which of the above it is, it's a stepper. Integers, counts, discrete settings.

## Markup patterns

### Panel (`pn-10`)

```html
<div class="p-panel">
  <div class="p-head">job · target · duration</div>
  <div class="p-row">…</div>
</div>
```

Panels are bordered surfaces with a mono header. Raised panels get the 6 px offset shadow; nested panels don't stack shadows — the inner one becomes a well instead.

### Row (`tb-7`)

```html
<div class="p-row">
  <i class="p-led on"></i>
  <span>sync · inventory ledger</span>
  <span class="grow num">2m 14s</span>
  <span class="p-tag" style="color:var(--sg-gn)">passed</span>
</div>
```

Rows sit on the density class rung. Hairline rule between, none after the last. Status appears twice — lamp and word — because colour never carries status alone.

### Button (`bt-1`)

```html
<button class="p-btn pri">run selected</button>
```

Primary uses the **deep** tier of the lead signal (`--d-pri-d`), never the bright one, because it carries text. The primary action sits top-right of the panel bar and does not move between screens.

### Readout (`dp-5`)

A readout is a dark window cut into the panel — always a different material from the surface around it, never the same background with different text colour. Shows the exact value with no rounding and no unit ambiguity. `84` and `84%` are different things and the panel must not make you guess.

### Lamp (`ld-9`)

9 px circle, 6 px glow at 60% of the signal. States: `on` (verdigris), `warn` (amber), `err` (oxide), and unlit (recess). Always accompanied by a word.

## Responsive behaviour

When a surface narrows, **shed columns before shedding legibility**. Dropping two secondary table columns is correct; shrinking the type to fit six is not. This is the density class moving down a rung at a smaller viewport, which is exactly what the token is for.

Under `@media (pointer: coarse)`:
- nothing interactive below 44 px
- kill hover states — on touch they stick after a tap
- `touch-action: none` on anything draggable (encoders, faders) so the page doesn't scroll out from under the gesture

Respect `env(safe-area-inset-*)` on any sticky or full-bleed chrome.

## Accessibility floor

Non-negotiable, and easy to get wrong given the faded palette:

- Every control reachable by keyboard, with a visible focus ring — 2 px ultramarine, offset 2 px.
- Value controls use `role="slider"` with `aria-valuemin` / `max` / `now`, and respond to arrow keys, Home, and End. Shift = fine adjustment.
- Toggles use `role="switch"` with `aria-checked`.
- Status is legible with colour removed. Test by greyscaling the screen.
- `prefers-reduced-motion` collapses all durations to 1 ms.
- Bright signals never carry text. Deep tier or ink.
