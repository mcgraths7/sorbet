# Owner options: class-3 findings that change how sorbet looks

Sorbet light unless a line says dark. Measured 2026-10-05 on the 7a683fd playground build
(`audit-frozen-scratch/site-new`); HEAD 21fdd26 has the same stylesheet for every element here
(`git diff 7a683fd 21fdd26 -- packages/design-system/src apps/playground` is empty).

## How to read the numbers

- **Method: L159.** Each element is staged on the page (cream `#fef4dc`) and inside a card (milk `#fffbf1`) and shot at
  2x. Along all four sides, less the corner radius, each boundary point gets the strongest pixel within 8px
  outside to 3px inside. That pixel is scored against the backdrop and against the element's own fill, whichever is
  further, and then against all three colour-blind views (protan, deutan, tritan); the worst view counts. The
  element's figure is its weakest boundary point. Separation is OKLab distance × 100: bigger is more visible, and
  about 2 is barely there.
- **"vsPage"** is the same weakest point scored against the backdrop alone, with no credit for the element's own
  fill. It matters for items 1 and 3: there the edge pixels are the same at rest and in the state, and the
  measured drop comes only from the fill changing.
- **The bars.**
  - L152: a state never draws less edge than rest.
  - Step 2.4 acceptance #2: sheet 2's figure less 1.0, rendered:
    - card 11.7
    - sunken panel 11.1
    - floating menu 11.8
    - quiet button 11.8 on a card, 13.4 on the page
    - checkbox and switch, off, 26.0 (sheet 2 measured those on a card)
  - The `presence` floors in `contracts.ts` (quiet 16.0, container 15.8, sunken 8.1) are the gate's heuristic, a
    different metric. Do not compare them with these numbers.
- **Every option leaves the four frozen presets unchanged.** Each one is built either at a selector that already
  declared the property at e24df74, with that old value as its fallback, or through a token the frozen presets
  do not define. The "Frozen" line under each option says how.
- **Probes** sit beside this file: `opt.mts` (the lens's `t/edges.mts`, plus an injected option stylesheet placed in
  the cascade layer its Sass would land in), `runs.mjs` and `runs2.mjs` (the options), `out-light.txt`,
  `out-light-2.txt` and `out-dark.txt` (raw output).

---

## 1. Quiet (outline) button: hover and press measure weaker than rest on the page

**The finding:**
- Hover and press swap the milk slab `#fffbf1` for `bg-subtle` `#f7ecd1`.
- On the page: rest **13.79**, hover and press **11.47**. The bar is 13.4.
- Inside a card nothing drops: **12.25** in every state. The bar is 11.8.

**What actually changes.** The edge pixel is `#e2cba8` in all three states, and against the page it reads
**11.47 at rest and 11.47 on hover**. The rest figure is higher only because the milk fill is further from the
edge pixel than the hover fill is. Today, the fill change (`#fffbf1` → `#f7ecd1`, 4.47 at its worst view) is the
only hover signal: the quiet button has no lift and a resting edge only.

| Option | Page: rest / hover / press | Card: rest / hover / press | Hover signal (worst view) | Decisions touched |
|---|---|---|---|---|
| **Q5 (recommended): amend L152's reading** | 13.79 / 11.47 / 11.47 as measured; 11.47 / 11.47 / 11.47 like for like | 12.25 all | fill 4.47 (unchanged) | none (spec text only) |
| Q3h: grown quiet edge on hover and press, fill stays `bg-subtle` | 13.79 / **14.70** / **14.70** | 12.25 / **15.50** / **15.50** | fill 4.47 + halo 3.20 | none (new edge data) |
| Q4: milk kept on hover, plus the grown edge | 13.79 / **17.00** / **17.00** | 12.25 / 15.50 / 15.50 | halo 3.20 only | row 26 (quiet button only) |
| Q1: milk kept on hover, nothing else | 13.79 / 13.79 / 13.79 | 12.25 all | **none** | row 26 (quiet button only) |
| Q2: half-way fill `#fbf4e1` | 13.79 / 11.62 / 11.62 (still below) | 12.25 all | fill 2.12 | row 26 |
| (Q3: grown hover, tighter press) | 13.79 / 14.70 / **12.97** (press below) | 12.25 / 15.50 / 13.95 | | rejected: press is weaker |

**Q5 (recommended): amend L152's reading. No change to the look.** Proposed text: when a state recolours the
element's own fill, the state and rest are both scored against what the element sits on.
- Then the quiet button reads 11.47 against 11.47 (not weaker), and the checkbox in item 3 does the same.
- Why I recommend it: the pixels that draw the edge do not change at all. The finding is the measurement giving
  the milk fill credit at rest.
- Caveat: this reading applies only to the comparison between states. Step 2.4's bar keeps L159's fill-credited
  reading for rest, under which rest passes at 13.79. Under the like-for-like reading, rest on the page would be
  11.47, below 13.4. That is why the reading must not replace the bar.
- Frozen: nothing (spec text only).

**Q3h: a hover and press edge for the quiet button.**
- The recipe: `0 0 6px 2px #a16e327a, 0 2px 4px 0 #a16e324d, 0 9px 18px -3px #a16e3242`, used for both hover and
  press.
  - It is built by analogy with the filled buttons: the halo grows from 4px 1px to 6px 2px, and its alpha from
    0.42 to 0.48.
  - It is a new look, and the owner's call.
- Mechanism:
  - The outline's `--shadow-hover` and `--shadow-press` become `edge(quiet, $ring, hover|press)`.
  - That needs L143 to allow states on `quiet`; today it allows them only on `filled-*`.
  - Sorbet's edge data gains `quiet.hover` and `quiet.press`, emitted as `--sb-edge-quiet-hover` and
    `--sb-edge-quiet-press`. Sorbet's golden gains 2 lines, plus 2 dark resets until step 2.6.
  - L151's halo room stays 8px: the halo reaches 6 + 2 = 8.
- Frozen: the fallback is today's ring (`inset 0 0 0 1px border-strong`), so nothing changes.
- The tighter press variant (Q3, `0 0 3px 1px #a16e3285, inset 0 1px 3px 0 #a16e3240`) fails on the page at 12.97.

**Q4 and Q1: keep milk on hover.**
- Mechanism: `where-defined(background-color, quiet-hover-fill, seam-only(quiet-fill), clr(bg-subtle))` on the
  outline's `:hover` and `:active` rule. No new token is needed.
- Frozen: `bg-subtle` exactly, at the same selector.
- Q1 alone leaves the quiet button with **no hover feedback at all** in sorbet light. Not advised.

**Q2: a half-way fill.** It does not fix the finding (11.62 against 13.79). Listed so it is not tried again.

---

## 2. Sunken interactive card (`.sb-card--sunken.sb-card--interactive`): hover inside a card is weaker than rest

**The finding:**
- The allowlisted hover rule writes `edge(container, shadow(lg))` for every interactive card. On a sunken one,
  that swaps the sunken rim for the card halo.
- Inside a card: rest **11.21**, hover **10.26**. The bar is 11.1.
- On the page it rises: 8.89 → 9.49.
- The fill does not change here, so the like-for-like reading of item 1 makes no difference.
- Reach: the React `Card` takes ONE `variant`, so this combination is reachable only by writing the classes by hand.

| Option | Card: rest / hover | Page: rest / hover | Hover signal |
|---|---|---|---|
| **S1 (recommended): hover keeps the sunken edge** | 11.21 / **11.21** | 8.89 / 8.89 | the 2px lift only (pointer devices, motion allowed); edge unchanged |
| S2: hover adds the card halo over the sunken edge | 11.21 / **12.99** | 8.89 / **11.80** | edge pixel `#e8d4b3` → `#e3ceab` (1.80), plus the lift |
| S0: as built | 11.21 / 10.26 | 8.89 / 9.49 | |

**S1 (recommended).** Hover keeps the element's own resting edge, which is the principle L152's fix already chose
for the plain interactive card ("it equals rest, which is not weaker"). It adds no new look.

**Mechanism, for S1 and S2.**
- A new state selector writing `box-shadow` is refused by L154: the allowlist only shrinks. So the variant sets a
  local that the existing allowlisted hover rule reads:
  - `.sb-card--sunken { --card-hover-edge: edge(sunken, shadow(lg)); }`
  - `.sb-card--interactive:hover { box-shadow: var(--card-hover-edge, edge(container, shadow(lg))); }`
  - For S2, the local is `edge(sunken, shadow(lg)), edge(container, 0 0 #0000)`.
- This changes the value at L152's allowlisted site, so L152's sentence "with this value" changes, and so does the
  L152 test's expected string.
- Frozen:
  - On a sunken card the local resolves to `shadow-lg`; on every other card the fallback does. That is the e24df74
    hover exactly: `.sb-card--interactive:hover` (0,2,0) beat `.sb-card--sunken`'s `none`.
  - S2 adds only the placeholder `0 0 #0000`, which L148 allows.

**Outside this item, for the record.** A sunken card on the page reads **8.89 at rest**, below its 11.1 bar. Sheet
2's 12.1 was a figure measured on a card, where it reads 11.21. No hover option changes that.

---

## 3. Checkbox checked on the page: 27.03 → 24.95

**The finding:**
- On the page the ring `#b096d7` reads **24.95 against the page in every state**: vsPage is 24.95 at rest, hover,
  checked and checked+hover.
- Rest reads 27.03 only because its own fill, milk `#fffbf1`, is further from the ring than the page is.
- When checked, the fill becomes lilac `#dac5fc`, which is the checked mark itself. The ring is 13.97 from it, so
  the fill gives no credit.
- Inside a card every state reads 27.03.
- The switch reads 24.95 on the page in both states, with no drop.

**Spec question.** L152 lists "hovered, pressed, focused, selected or open"; "checked" is not there.
- It should be listed, because checked is a state like selected.
- But it needs Q5's like-for-like reading. Under the current reading, every control whose checked fill is darker
  than its rest fill measures "weaker" by construction.

| Option | Page: rest / checked | Card: rest / checked | Ring vs focus ring `#8e6ac7` (worst view) | Decisions touched |
|---|---|---|---|---|
| **C-A (recommended): accept; add `checked` (and `indeterminate`) to L152 under Q5's reading** | 27.03 / 24.95 (vsPage 24.95 / 24.95) | 27.03 / 27.03 | n/a | none |
| C1: checked ring `#9f80cf` (half-way, in OKLab, from `#b096d7` to the focus ring) | 27.03 / **31.04** | 27.03 / **33.12** | 6.09 | row 7 (firm lilac ring `#b096d7`) |
| C2: checked ring `#977ebd` (`#b096d7`, 0.08 darker in OKLab lightness) | 27.03 / **32.89** | 27.03 / **34.97** | **4.31** (tritan): close to the focus ring | row 7 |

**C-A (recommended).** Nothing on screen gets weaker. The ring against the page is identical in both states, and
the checked state is carried by the fill and the tick.

**C1 and C2: a darker checked ring.**
- Mechanism: a new optional token (an L15 row, plus the emitter and sorbet's golden) read through
  `where-defined(border-color, checked-ring, seam-only(<token>), clr(primary-solid))` on `:checked`. No existing
  token holds `#9f80cf` or `#977ebd`.
- Frozen: `primary-solid` exactly.
- Ring change from rest: C1 6.09, C2 7.94.
- Not advised: C2 sits 4.31 from the focus ring, so a checked box would start to look focused.

---

## 4. Raised card (`.sb-card--raised`) in sorbet light: no edge

**The finding:**
- It keeps `shadow(md)` and `border: none`, and no L70 row maps it.
- Weakest point: **0.28** inside a card, **2.64** on the page. The card bar is 11.7.
- Its interactive hover (the container halo) reads 10.26 in a card and 11.81 on the page. That hover is far
  stronger than rest, so rest is the problem here, not hover.
- Reach: React `<Card variant="raised">` reaches it. The playground does not stage it.

| Option | Page: rest / interactive hover | Card: rest / interactive hover | Halo reach vs room (8px) | Notes |
|---|---|---|---|---|
| **R1 (recommended): raised takes the container edge** | **11.81** / 11.81 | 10.26 / 10.26 | 7px, fits | raised looks like a plain card in sorbet light |
| R3b: raised takes the floating edge, its hover too | **14.04** / 14.04 | **12.44** / 12.44 | **12px, exceeds** | distinct from a plain card ("floats like a menu") |
| R2: container edge + `shadow(md)`; hover unchanged | 12.40 / 11.81 (below rest) | 10.81 / 10.26 (below rest) | 7px | fails L152 on hover |
| R2b: R2, hover container + `shadow(lg)` | 12.40 / 12.06 (below rest) | 10.81 / 10.51 (below rest) | 7px | still fails L152 by 0.3 |
| R0: as built | 2.64 / 11.81 | 0.28 / 10.26 | | |

**R1 (recommended).** It brings raised to the card bar on the page with no new data and no new hover rule.
- Mechanism: `.sb-card--raised { box-shadow: edge(container, shadow(md)); }`, a new L70 row. The interactive
  hover is unchanged.
- Frozen: `var(--sb-edge-container, var(--sb-shadow-md))` resolves to `shadow-md`, at the same selector: exactly
  e24df74.
- Cost: in sorbet light "raised" stops looking different from a plain card.

**R3b: the floating edge.**
- Mechanism:
  - Rest: `edge(floating, shadow(md))`.
  - Hover: the per-variant local of item 2, `.sb-card--raised { --card-hover-edge: edge(floating, shadow(lg)); }`.
  - Without the hover change, the raised hover falls to the container's 11.81, below rest.
- Frozen: `shadow-md` at rest and `shadow-lg` on hover, both e24df74's values.
- Cost: the floating halo (`0 0 10px 2px`) reaches 12px, past L151's 8px room.
  - A raised card inside a carousel or marquee would have its halo cut.
  - Either L151's room must also count the floating edge (light room 8 → 12px, every padded parent grows by 4px),
    or raised cards must stay out of clipping parents.

**R2 and R2b.** Both fail L152 on hover, because `shadow(lg)`'s offset sits further out than `md`'s and leaves the
edge lighter. They work only if the hover equals rest (`container + md`), which removes the hover's depth change.

**Dark, for the record.** This is sorbet dark as it stands before step 2.6: raised reads 0.79 in a card and its
hover 0.39. That is pre-existing and comes from the built preset with its edges reset. It is step 2.6's to decide.

---

## 5. Motion: `box-shadow` leaves `color-transition` (a consequence of restoring the frozen presets)

**What changes.** To restore e24df74's computed transitions exactly in the frozen presets, `color-transition` goes
back to `color, background-color, border-color`.
- Its seven users: the calendar day, menu item, pagination links, breadcrumb links, footer links, alert dismiss and
  date-picker trigger.
- Only two of them ever change `box-shadow`:
  - The **pagination's current-page bar** (`selected-mark`, sorbet only) now appears instantly where it faded over
    `dur(fast)`.
  - The **calendar's "today" ring** snaps in every preset, as it did at e24df74. That includes sorbet, where it
    faded at 7a683fd.

| Option | Sorbet | Frozen presets |
|---|---|---|
| **T-A (recommended): accept the snap** | the bar and the today ring appear at once | identical to e24df74, computed `transition` included |
| T-B: fade on the selected rows only (`box-shadow dur(fast)` added to `.sb-pagination a, .sb-pagination button`) | the bar fades | **changes** (see below) |
| T-C: a token-gated duration (`box-shadow var(--sb-<new duration token>, 0s)`) | the bar fades | **changes** (see below) |

**T-A (recommended).** The bar is a selection mark, and the 120ms fade is cosmetic. Both alternatives change
something in a frozen preset or add a token.

**T-B: fade on the selected rows only.** What it changes in a frozen preset:
- The pagination links' computed `transition-property` gains `box-shadow`.
- With the library's own markup it never fires, because a frozen pagination link's `box-shadow` never changes.
- But a pagination link that is also `.sb-button` changes. The pagination's `transition` (molecules layer)
  replaces the button's own (atoms layer), so that button's hover and press shadow would fade where it snapped at
  e24df74. This is the same class of change as frozen-lens F4.

**T-C: a token-gated duration.** What it changes in a frozen preset:
- The computed `transition` gains a `box-shadow 0s` entry, so it is not byte-identical.
- A 0s transition never starts, so `getAnimations()` stays empty and no frame differs.
- Cost: a new token that sorbet emits (sorbet's golden gains it).

---

## Commands run

```
O=.../scratchpad/repair-scratch/owner
cp audit-frozen-scratch/t/{lib,edges}.mts $O/; ln -s ../../audit-frozen-scratch/node_modules $O/node_modules
git -C /Users/homelab/code/sorbet-repair archive 21fdd26 packages/design-system/src/tokens | tar -x -C $O/src
git -C /Users/homelab/code/sorbet-repair diff --stat 7a683fd HEAD -- packages/design-system/src apps/playground   # empty
node mix.mts; node sig.mts                       # candidate colours and separations (edges.ts separationIn)
node runs.mjs && node opt.mts runs.json light > out-light.txt
node runs2.mjs && node opt.mts runs2.json light > out-light-2.txt
node opt.mts runs-dark.json dark > out-dark.txt  # Q0, S0, C0, R0 in sorbet dark (pre-2.6)
```

## Not verified

- Only Chromium (headless shell 1243), and DPR 2 only.
- Option CSS was injected into `@layer sb.atoms` / `@layer sb.molecules` after the library's rules, which is where
  each Sass change would land. The Sass itself was not written or compiled.
- The frozen claims ("Frozen: …") are reasoned from the cascade (same selector, same layer, fallback equal to the
  e24df74 value). None was rendered in a frozen preset.
- Q3h's recipe is my analogy with the filled buttons, not a sheet the owner has seen.
- Dark was measured only for the four as-built rows. Dark options wait for step 2.6.
- The lift on hover (`translate: 0 -2px` on cards, 1px on filled buttons) is off in these measurements
  (`reducedMotion: reduce`), as in the lens's method.

---

## Addendum by the repair agent (after these were measured)

- **The halo room is 9px in sorbet light now, not 8px** (the repair counts the hover rise, frozen lens F5; spec
  proposal P7). Where an option above says "the room stays 8px" (Q3h) read 9px; R3b's floating edge (12px reach) is
  still past it.
- **The quiet button and checkbox numbers above are unchanged by the repair**: nothing the repair did touches their
  fills, edges or rings.

## 6. The compact table cuts a hovered filled button's halo by 1px (frozen lens F5)

**The finding:** `.sb-table-wrap` scrolls (`overflow-x: auto`, so both axes clip), and `.sb-table--compact` cells pad
8px (`space(2)`) at top and bottom. A hovered filled button reaches 9px past its box (its hover halo `0 0 6px 2px`, 8px,
plus its 1px rise), so in a compact table with no head row, the first and last rows' buttons lose the outermost pixel
of their hover halo. Measured on the repaired tree, sorbet light, DPR 2 (`lens/t/halo.mts`, all-round layer alone):
**552 device px cut, at most 3 levels of 255**, 294 of them within the layer's nominal 8px reach. At rest nothing is cut
(the rest halo reaches 5px). The default table (12px cells) is not cut.

| Option | What sorbet light shows | Frozen presets |
|---|---|---|
| **T1 (recommended): accept and record it** — amend L151's table row (spec proposal P7) | unchanged: the outermost 1px of a hovered button's halo, at most 3/255, missing at the wrap's top or bottom edge in a compact table without a head | unchanged |
| T2: compact cells pad by the room at least: `padding-block: max(space(2), halo-room())` | compact rows 1px taller at top and bottom (8px → 9px each side), nothing cut | unchanged: `max(8px, 0px)` computes 8px |
| T3: the wrap pads by the room: `padding: halo-room()` on `.sb-table-wrap` | a 9px band of the wrap's `surface` inside its border, round the whole table, nothing cut | unchanged: 0px |

Why T1: the cut is three levels out of 255 on the last pixel of a transient hover state, in one variant, at one edge; T2
and T3 each change the table's layout in every sorbet page to save it. T2 is the smallest change if the owner wants it
gone.
