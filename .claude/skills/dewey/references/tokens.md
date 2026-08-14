# Dewey tokens — dui-1 rev 0.5

Exact values. When in doubt, copy from here rather than approximating.

- [Signals](#signals)
- [Material ramps by finish](#material-ramps-by-finish)
- [Module and height ladder](#module-and-height-ladder)
- [Type](#type)
- [Motion](#motion)
- [Elevation](#elevation)
- [Tailwind mapping](#tailwind-mapping)

---

## Signals

Five colours, fixed across every project. They do not change per dialect — only which one is *promoted* to primary changes.

They are aged on purpose: this is a 1980s industrial palette left in the sun. The key property is that **pigments don't fade at the same rate**, so these don't either. That unevenness is what makes it a system rather than a filter — a uniform saturation drop reads as a Photoshop adjustment layer.

| token | hex | oklch | name | means | chroma held |
|---|---|---|---|---|---|
| `--sg-or` | `#e2571f` | `oklch(58% 0.176 39)` | persimmon | primary action, record | 72% |
| `--sg-bl` | `#2b36ce` | `oklch(44% 0.210 274)` | ultramarine | selection, focus, link | 86% |
| `--sg-gn` | `#3f8a66` | `oklch(56% 0.088 158)` | verdigris | running, passed, armed | 41% |
| `--sg-yl` | `#dfa22b` | `oklch(73% 0.132 74)` | amber | caution, unsaved, degraded | 63% |
| `--sg-rd` | `#b03a33` | `oklch(51% 0.130 27)` | oxide | fault, destructive, clip | 44% |

Ultramarine is the survivor — phthalo blue is lightfast and has barely moved. Keeping one colour near full chroma is what stops the set turning to mud. Never desaturate it "for consistency".

Oxide was pushed darker and cooler than natural fading would give, because faded orange and faded red converge, and two signals that look alike is a system failure. Don't correct this back.

### Deep tier

Fading costs contrast. Every signal has a darkened partner used **wherever the colour carries text** — primary buttons, destructive actions, filled tags. The bright value is for lamps, meters, step fills, and rules, where nothing sits on top.

| token | hex |
|---|---|
| `--sg-or-d` | `#a8390f` |
| `--sg-bl-d` | `#1f2795` |
| `--sg-gn-d` | `#2c6349` |
| `--sg-yl-d` | `#8a5f0f` |
| `--sg-rd-d` | `#7e2723` |

Using a bright signal behind white text is the most common contrast failure in this system. `--sg-or` with white is 3.9:1 and fails. `--sg-yl` needs ink text, never white, in every context.

---

## Material ramps by finish

The ramp is what the product is made of. It carries no meaning at all.

### shell — aged ABS plastic (dewey core, default light)

```
--pc-00:#fdfcf7  --pc-05:#f3f0e6  --pc-10:#e9e5d8  --pc-20:#dbd6c6
--pc-30:#c4beab  --pc-50:#8b8574  --pc-70:#4b4740  --pc-90:#211f1a
ink #1a1814 · field #f3f0e6 · panel #fdfcf7 · recess #dbd6c6
line #211f1a · line-soft #c4beab
display bg #211f1a · on #e9e5d8 · off #3a362e
```

### stage — near-black, warm (sessionist)

```
--pc-00:#0c0b0a  --pc-05:#141311  --pc-10:#1b1917  --pc-20:#252320
--pc-30:#3a3630  --pc-50:#6e6a62  --pc-70:#a6a197  --pc-90:#e3dfd5
ink #e3dfd5 · field #0b0a09 · panel #141312 · recess #050504
line #3a352d · line-soft #26231f
display bg #050504 · on #e2571f · off #2a1710
```

### paper — high-key, unfaded (hauliday)

```
field #faf8f2 · panel #ffffff · ink #171512 · recess #efebe0
line #171512 · line-soft #d8d3c6 · dim #7a746a
display bg #171512 · on #f5f2e9 · off #38342c
```

The greys carry the warmth in every finish. This is load-bearing: it's what lets ultramarine stay cold and electric without looking like it wandered in from a different system. Never neutralise the ramp to pure grey.

---

## Module and height ladder

Base unit `--u: 4px`. Every dimension is a multiple.

| token | px | use |
|---|---|---|
| u 1 | 4 | hairline gaps, icon nudge |
| u 2 | 8 | inside a control |
| u 4 | 16 | between controls |
| u 6 | 24 | between groups |
| u 8 | 32 | panel padding, grid field |
| u 24 | 96 | between sections |

Height ladder — controls come off these rungs so mixed rows align without adjustment:

| rung | px | part |
|---|---|---|
| xs | 24 | tag, lamp row |
| sm | 28 | button, stepper, input |
| md | 32 | toolbar, table row |
| lg | 52 | pad, primary action |
| xl | 76 | encoder, display |
| 2xl | 132 | fader travel |

Density class multiplies which rung a dialect uses; it never introduces a rung off the ladder.

**Touch:** under `@media (pointer: coarse)` nothing interactive drops below 44 px, regardless of density class. Raise the rung; don't shrink the target.

---

## Type

```
--grotesk: "Helvetica Neue", Helvetica, Inter, Arial, sans-serif;
--mono: ui-monospace, "SF Mono", "Roboto Mono", Menlo, Consolas, monospace;
```

| role | size | tracking | weight | use |
|---|---|---|---|---|
| display | 34 | −4% | 600 | one per screen, maximum |
| title | 19 | −2.5% | 600 | section and panel headings |
| body | 14 / 20 lh | −0.6% | 400 | prose |
| small | 12 / 18 lh | −0.6% | 400 | secondary, help |
| label | mono 10 | +10% | 400 | all machine labels |
| data | mono 22 | +0% | 400 | readouts, tabular |

Multiply the whole scale by the dialect's type step. Don't adjust roles individually.

All numeric data gets `font-variant-numeric: tabular-nums`. No exceptions — a column of prices that shifts as it updates is the single most obvious break in this system.

---

## Motion

| token | duration | timing | use |
|---|---|---|---|
| m-tick | 90 ms | `steps(3, end)` | press, toggle, lamp |
| m-travel | 140 ms | `steps(5, end)` | fader cap, switch, tab |
| m-panel | 200 ms | `steps(6, end)` | drawer, sheet, page |
| m-none | 0 ms | — | anything the user typed |

Always honour `prefers-reduced-motion` by collapsing durations to 1 ms.

---

## Elevation

Four materials only. A fifth is a bug report.

| material | treatment |
|---|---|
| panel | the body — `background: panel`, 1–2 px `line` border, hard offset shadow if raised |
| well | anything a control sits in — `background: recess`, hairline, no shadow |
| display | anything the system writes to — `display-bg`, always a different value from the surface around it |
| rubber | anything you press — pad styling, 3 px bottom shadow, translates down on press |

```css
/* raised */ box-shadow: 6px 6px 0 var(--d-shadow);
/* button */ box-shadow: 2px 2px 0 var(--d-shadow);
/* pressed */ transform: translate(2px, 2px); box-shadow: 0 0 0;
```

---

## Tailwind mapping

If the project uses Tailwind, extend rather than replace, and never mix with Tailwind defaults.

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      or:{DEFAULT:'#e2571f', d:'#a8390f'},
      bl:{DEFAULT:'#2b36ce', d:'#1f2795'},
      gn:{DEFAULT:'#3f8a66', d:'#2c6349'},
      yl:{DEFAULT:'#dfa22b', d:'#8a5f0f'},
      rd:{DEFAULT:'#b03a33', d:'#7e2723'},
      pc:{0:'#fdfcf7',5:'#f3f0e6',10:'#e9e5d8',20:'#dbd6c6',
          30:'#c4beab',50:'#8b8574',70:'#4b4740',90:'#211f1a'},
    },
    borderRadius:{ DEFAULT:'2px', none:'0', sm:'1px', md:'2px', lg:'2px' },
    boxShadow:{
      panel:'6px 6px 0 var(--d-shadow)',
      btn:'2px 2px 0 var(--d-shadow)',
      none:'0 0 0',
    },
    fontFamily:{
      sans:['"Helvetica Neue"','Helvetica','Inter','Arial','sans-serif'],
      mono:['ui-monospace','"SF Mono"','Menlo','monospace'],
    },
    transitionTimingFunction:{ step:'steps(5, end)', tick:'steps(3, end)' },
    transitionDuration:{ tick:'90ms', travel:'140ms', panel:'200ms' },
  }
}
```

Note that `borderRadius.lg` is deliberately overridden to 2px — this catches the habit of reaching for `rounded-lg` and quietly does the right thing.
