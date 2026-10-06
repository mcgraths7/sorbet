## Audit lens: how sorbet dark renders at ea7a2a8 (step 2.6), against a96bc02

Run 2026-10-06 in a cloud session. The lens was read-only and worked in its own `git archive` copies; its probes and
evidence images (`audit26-render/` in the session scratchpad) are not committed. Chromium 141, headless.

**Hypothesis:** at ea7a2a8 sorbet dark renders as the spec promises in every state and context:
- every edge is present, and no state is weaker than rest;
- no clipping or scrolling parent cuts anything at the 3px halo room;
- the danger press, the icon ink, the rims, the marks and the selected pill are as specified;
- every focusable shows a visible focus ring;
- the two dark paths are identical;
- sorbet light, the frozen presets and the apps are unchanged.

**Verdict: fail, narrowly.** Everything step 2.6 names holds as rendered. Two new problems appear only inside clipping
parents, and nothing catches either (F1, F2). Three more findings predate the step (F3 to F5).

### commands_run (main)
- **Builds:** `git archive` of both commits, each fully built, and the three apps built.
- **Byte comparisons:** of the dist output, the frozen themes, the library CSS, sorbet's light block and the apps.
- **Computed-style signatures:** 38 properties on every element and pseudo-element, with states forced through CDP:
  - light, a96bc02 against ea7a2a8, at base, 390px, RTL and DPR 2;
  - dark, through `data-theme` against through the system preference;
  - same-commit controls.
- **State against rest (L152):** the whole boundary at DPR 2, worst view, read against the backdrop alone and with
  the fill credited. 11 components on the page and in a card, across rest, hover, press, focus, disabled,
  disabled-and-focused, checked, indeterminate, invalid and loading.
- **Clipping, from geometry:** the playground and staged fixtures (an accordion, a carousel, pills tabs, a compact
  table, a scrim layer), in six contexts and three states.
- **Also:** `measure-edges --mode dark`, `check-status-layout`, forced colours, a dialog over a drawer, and the vanilla
  demo in dark.

### Findings

**F1. SILENT. New in 2.6. Clipping parents cut the dark filled buttons' glow flat.**
- **The recipes:** dark rest `0 0 14px -2px @ 0.35`, hover `0 0 20px -1px @ 0.5`.
- **Why the room missed it:** `haloRoom()` counted only layers with a positive spread (L47's all-round). The glow has
  no offset, so it is not depth, and its spread is negative, so it is not all-round. L151 did not decide it.
- **The cut:** the carousel, the marquee and the accordion pad 3px. Each draws a hard rectangle at its clip line.
- **Measured at a carousel, worst view:**

  | Mode | Rest | Hover |
  |---|---|---|
  | Dark | 6.88 | 14.98 (`#47373b` on `#211409`) |
  | Light | 0.00 | 0.44 |

  The dark hover cut is stronger than a card's own measured edge (13.2).

**F2. SILENT. In dark, focus rings are cut by 2px in the carousel, the marquee and an accordion's first item.**
- **The cause:** the room was 3px. The focus ring reaches 5px: `focus-ring-width`, 3px, plus a 2px offset.
- **Measured:** at DPR 2, 2 of the ring's 6 device pixels survive in dark. Light shows all 6.

**F3. SILENT. Predates 2.6. The right-to-left selected bar is not mirrored in the playground.**
- Vite 8's minifier lowered `:dir(rtl)` to `:is(:lang(ae), :lang(ar), …)`.
- So with `dir="rtl"` and `lang="en"`, the bar sits on the inline-end side.

**F4. Predates 2.6. L151's table misreads the compact table's cell padding.**
- It is 8px in the block axis, not "12 or more".
- A hovered filled button in an edge row loses 1px of its light halo; L165 (d) already records this. In dark it
  loses the outer part of its glow there.

**F5. Step 2.8's.** "WCAG AA enforced" in the playground and "AA verified" in the demo now read as untrue in both of
sorbet's modes.

**Notes:**
- **N1.** A pressed filled button in dark loses its rim: L45's press recipes have no all-round layer. By L165 (a)'s
  reading the press is not weaker: 58.06 at rest and pressed.
- **N2.** The focus ring `#8e6ac7` measures 2.04 to 2.83:1 on the dark raised surface and washes. That is under
  WCAG's 3:1, and holds the contract's floor (17.96 against 17.0).
- **N3.** Disabled controls are weaker than rest, in both modes. L152 does not cover disabled.
- **N4.** Under forced colours, status boxes, sunken panels and the pills' selection show no boundary. It predates
  2.6.

### Clean
- **Light unchanged:**
  - the theme light blocks, the library CSS and the frozen themes are byte-identical;
  - 0 signature differences over 6,304 elements in five states;
  - the apps are byte-identical.
- **The dark paths:** `data-theme` and the system preference match in every state.
- **Name parity:** 116 names in each dark block, and no `initial`.
- **L160:** the pressed danger button paints `#f9c3c6` from the dark block. At a96bc02 it showed the leak: `#ff8e86`
  at rest, `#f9c3c6` pressed.
- **`measure-edges --mode dark`:** every bar holds.
- **L152 in dark:** no state reads below rest, for any component.
- **The colours:**
  - L170's ink: `#f3e7ce` off the fills, `#472400` on them, `#fffbf1` in a scrim layer;
  - L175 and L178's rims hold in every state;
  - L179's marks;
  - L157 and L164's pill.
- **Clipping:** no rest or hover edge is cut in RTL, at 390px, at zoom 2 or at DPR 2, beyond F1 and F2.
