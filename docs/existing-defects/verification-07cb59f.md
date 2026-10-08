## The deferred defects, re-verified on main at 07cb59f

Run 2026-10-07 in a cloud session by a read-only verifier, after PR #130 (sorbet's legibility contract) merged.
Its probes (`defects-verify/` in the session scratchpad) are not committed. Chromium 141, headless, the built
library stylesheet with each theme, `data-theme` light and dark, all ten preset-mode pairs. Focus by real Tab,
`:active` by a held mouse button, `:hover` by a real hover. Contrast is the WCAG 2.x ratio. All five theme files
were byte-identical to `tools/golden/*.css`.

The list is proposal §9's deferred items (`docs/pastel-legibility-contract.md`), the dark-mode edge fault (its §4),
`legibility-spec.md` §17 item 20 and §13 L110.

Fix kinds: **a** changes a frozen theme file (a golden); **b** changes the frozen presets' pixels through the
library stylesheet only; **c** changes sorbet only; **d** markup or behaviour only; **–** no output change.

| Item | Still present? | Affected | Kind | Owner's choice? | Smallest fix |
|---|---|---|---|---|---|
| 1 unitless `outline-offset` | yes | all 10; no visible effect | – (b at `:250` if 1px is honoured) | no | units; `:250` decided with 6 |
| 2 `--strong` on a labelled divider | yes | all 10 | b | no | recolour the `::before`/`::after` lines at (0,2,1) |
| 3 spinner fixed to `on-primary` | yes, `_button.scss:294` | soft/outline/ghost/link in 9 of 10 pairs | b + c | no | the spinner takes the variant's label colour |
| 4 toned progress bars | only **warning, frozen light** (1.87) | 4 frozen, light | b or a | **yes** | a darker warning bar |
| 5 weak tick and radio dot | **no** | none | – | – | none |
| 6 focus ring defined three times; selected looks focused | yes, and **a selected swatch shows no focus at all** | all 10 | – (dedupe) + b | **yes** (selected look) | root rule through the mixin; a selected look of its own |
| 9 stale "primary is exempt" comment | yes, `semantics.ts:55-60` | none | – | no | rewrite |
| 12 React Menu ARIA | yes (the vanilla menu has the role gap too) | all | d | no | `menu`, `menuitem`, `aria-expanded` |
| 13 menu-item focus is the hover fill | yes, `_menu.scss:43-47, 66-69` | all 10 | b | no | keep the fill, add `focus-ring(-2px)` |
| 14 hover invisible on striped rows | yes: **rule order**, and equal colours in light | all 10 | b | **yes** (a third fill) | hover after stripes, a distinct fill |
| 15 date range has no disabled style | yes | all 10 | b + d | no | `data-disabled`, as the combobox |
| 16 `danger-active` produced by no frozen preset | fixed for sorbet; frozen pressed danger button is **transparent** | 4 frozen × 2 | a or b | **yes** (route, colour) | emit it, or paint `danger-hover` |
| §4 dark-mode edge fault | yes, frozen; fixed for sorbet | 4 frozen, dark | a (or b) | **yes** | re-step the dark branch |
| §17 #20 command palette input focus | yes | all 10 | b | **yes** | a ring on the search row |
| L110 scrim gradient | yes | all 10 | b | **yes** | a full-strength band under the content |

New, found in passing:
- **NEW-1.** In frozen dark, table hover is invisible on every row: `bg-subtle` equals `surface` (ocean and midnight
  `#30353d`, forest `#38342f`, noir `#333537`; 1.00). Same root as §4.
- **NEW-2.** `.sb-layer--scrim.sb-layer--start` puts its content in the top 35%, where the gradient is transparent:
  1.03 (sorbet) to 1.07 over white.

### The measurements, item by item

**1.** `atoms/_color-input.scss:82, 129` `focus-ring(2)`, `:250` `focus-ring(1)`; built `outline-offset: 2;` twice
and `1;` once, all dropped as invalid. Area, hue and alpha render at 2px through `base/_root.scss:60`; a focused
unselected chip at 2px, not the intended 1px. `focus-ring(2px)` at all three keeps today's pixels.

**2.** `atoms/_divider.scss:9-22` draws a labelled divider's lines as pseudo-elements with their own colour; `:25-27`
`--strong` sets `border-color` on the element. `.sb-divider--strong::before` (0,1,1) loses to
`div.sb-divider::before` (0,1,2). Line against page, labelled `--strong` (same as plain) / an `<hr>` with `--strong`:

| Preset | Labelled line, light / dark | vs page | `<hr>` strong | vs page |
|---|---|---|---|---|
| sorbet | `#e3d2b0` / `#403327` | 1.36 / 1.48 | `#b096d7` | 2.34 / 7.01 |
| ocean | `#dae0e9` / `#404751` | 1.33 / 1.66 | `#8b95a3` | 3.03 / 5.14 |
| forest | `#e3dfd9` / `#4b463f` | 1.24 / 1.67 | `#777168` / `#999389` | 4.51 / 5.13 |
| noir | `#dee0e3` / `#45474a` | 1.32 / 1.67 | `#919499` | 3.04 / 5.12 |
| midnight | `#dae0e9` / `#404751` | 1.25 / 1.66 | `#697380` / `#8b95a3` | 4.52 / 5.14 |

**3.** `atoms/_button.scss:280-297`: loading sets `color: transparent` and the spinner
`border-block-start-color: clr(on-primary)`. Spinner against what is behind it:

| | primary | secondary | accent | danger | soft | outline | ghost | link |
|---|---|---|---|---|---|---|---|---|
| sorbet light | 8.80 | 8.98 | 10.78 | 8.98 | 10.92 | 13.37 | 12.62 | 12.62 |
| sorbet dark | 8.80 | 8.98 | 10.78 | 8.98 | **1.51** | **1.17** | **1.30** | **1.30** |
| ocean light | 4.89 | 4.64 | 5.07 | 5.32 | **1.15** | **1.00** | **1.00** | **1.00** |
| ocean dark | 7.43 | 7.73 | 7.26 | 7.03 | **1.25** | **1.00** | **1.00** | **1.00** |

Forest, noir and midnight: filled 4.50 or more; soft, outline, ghost and link 1.00 to 1.30. `on-secondary`,
`on-accent` and `on-danger` equal `on-primary` in every record, so the filled variants keep their pixels.

**4.** `atoms/_progress.scss:31-37` paints `seam(<tone>-mark)`. Sorbet defines every mark and has rules
(`rules.ts:264-266`). The frozen presets fall back to the tone; the proposal's 1.17 and 1.14 were the old pastel
sorbet's. What fails is warning in frozen light: `#efa024` on the track, 1.87 (ocean, forest, midnight) and 1.88
(noir). Success light 3.90 to 3.92; every dark pair 5.35 or more. No `wcag-aa` rule covers a bar. `warning-text`
`#7f4e00` would measure 6.07 to 6.10.

**5.** Gone. Sorbet: `#472400` on `#dac5fc`, 8.80, ruled at `rules.ts:251`. Frozen: `control-checked` falls back to
`primary-solid`, which equals `primary` in all eight records, so the pair is `on-primary` on `primary` (`rules.ts:96`,
4.5): 4.50 (forest light) to 13.54 (noir dark).

**6.** Three definitions: `abstracts/_mixins.scss:29-32`, `base/_root.scss:57-61`, `atoms/_color-input.scss:264-267`
(`[aria-pressed="true"]`, a 3px ring at 1px). A selected chip at rest and a selected chip focused by Tab compute
the same outline: the `[aria-pressed]` rule (0,2,0, later) beats `:focus-visible`. Keyboard focus on the selected
swatch is invisible (WCAG 2.4.7).

**9.** `src/tokens/semantics.ts:55-60` says primary is exempt from the pastel walk; `brand()` (`:127-151`) applies it
to every role it is given. No preset sets `brandStyle` any more.

**12.** `molecules/menu.tsx:80` `aria-haspopup="menu"`; the panel (`:82-95`) and `MenuItem` (`:116-125`) have no role;
no `aria-expanded`. Chromium derives `expanded` from `popovertarget`, which hides that gap there. The vanilla
`behaviors/menu.ts` sets `aria-haspopup` (`:28`) and `aria-expanded` (`:42`) but no roles.

**13.** `molecules/_menu.scss:43-47` `&:hover, &:focus-visible { outline: none; background-color: clr(bg-subtle) }`,
and the danger item at `:66-69`. Fill against the menu: sorbet 1.14 / 1.66; ocean 1.15 / 1.31; forest 1.16 / 1.32;
noir 1.15 / 1.32; midnight 1.15 / 1.31. `focus-ring(-2px)` is the pattern of `_accordion.scss:24`,
`_segmented-control.scss:16` and `_sidebar.scss:29`.

**14.** `molecules/_table.scss:43-45` hover and `:47-49` stripes have equal specificity (0,2,2), and the stripes come
later, so a hovered even row never changes in any pair (1.00), even in frozen dark where the colours differ.
`bg-subtle` equals `surface-sunken` in light for all five (`semantics.ts:185, 188`). Odd rows in light: 1.14 to 1.16.

**15.** `molecules/_date-range.scss:10-35`: no disabled state on `__control`; only the trigger fades (`:87-90`). The
disabled control's fill and text equal the enabled ones in every pair. `_combobox.scss:84-88`
is the pattern: `bg-subtle`, `text-subtle`, `not-allowed`. (CORRECTION, spec revision 2: that block is
`.sb-combobox__field[data-disabled]`, the multi-combobox's field, not `__control`; adversary M-1.)

**16.** Named at `semantics.ts:28`, read at `atoms/_button.scss:157-160`. Missing from all eight frozen records;
`status()` (`:163-180`) computes `s.active` and drops it. Pressed, the background computes `rgba(0,0,0,0)`; the label
against the page: ocean 1.00 / 1.00, forest 1.07 / 1.00, noir 1.00 / 1.00, midnight 1.06 / 1.00. At rest the fills
are `#cb2c31` (light) and `#ff8e86` (dark).

**§4.** `semantics.ts:207-211, 219-220`. Frozen dark, a rendered `.sb-card`:

| | ocean | forest | noir | midnight |
|---|---|---|---|---|
| Card on page | `#30353d` on `#20242a`, 1.26 | `#38342f` on `#26231f`, 1.27 | `#333537` on `#222426`, 1.26 | 1.26 |
| Card border vs card | 1.00 | 1.00 | 1.00 | 1.00 |
| Popover border vs popover (darker) | 1.31 | 1.32 | 1.32 | 1.31 |
| `border` vs `surface-raised` | 1.00 | 1.00 | 1.00 | 1.00 |
| Sunken vs page | 1.00 | 1.00 | 1.00 | 1.00 |

**§17 #20.** `organisms/_command-palette.scss:29-42` `&__input { … outline: none }`; no focus rule for `.sb-command`.
With the dialog open and the input focused (`:focus-visible` matches), the input computes no outline and no shadow,
in all ten pairs. The highlighted option's fill is the only cue: 1.13 to 1.40.

**L110.** `layout/_layer.scss:26-32` `linear-gradient(to top, scrim, transparent 65%)`. Over white, pixels at 0, 5,
10, 15, 30, 45 and 65% of the height: `#666666 #727272 #7e7e7e #898989 #adadad #d0d0d0 #ffffff`. `on-scrim` reaches
4.5 only in the bottom 5.1 to 6.1%; an h2 title (14.0 to 27.2% up) reads 3.48 to 2.27. The same in both modes.
