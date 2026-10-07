## Audit lens: the fixes as rendered, at cd55fbf

Run 2026-10-07, read-only. Probes (`audit3-render/` in the session scratchpad) not committed. Chromium 141 headless:
main's and HEAD's library CSS (HEAD's byte-identical to `dist/css/sorbet.css`); the playground built twice with
`SORBET_LIBRARY_CSS`; the demo with its stylesheet swapped by route interception.

**Hypothesis:** each of E6 to E13 is fixed as a user meets it, all five presets × two modes, real keyboard and
mouse, RTL, 390px and forced colours, with no new visible problem.

**Verdict: holds; no silent failure.** Main against HEAD, nothing moved but the sites the spec names.

### Probes
- The playground's "Options ▾" menu (React) and the demo's `#demo-menu` (vanilla), all ten pairs: Tab, Enter,
  ArrowDown ×3 (wrap), ArrowUp from the first, Home, End, Escape, Tab out, Enter on an item; hover one item while
  another is focused; click to open, outside, on an item; computed styles, ring pixels, the CDP accessibility tree
  closed and open; again at 390px with `dir=rtl`, and under `forcedColors: active`.
- A clean mouse-only open, main and HEAD, React and vanilla.
- A test page: Buttons, 8 variants × {md, sm, lg, icon-only, pill, full} × {rest, loading} × {enabled, disabled},
  in an input group, `as="a"`, `aria-pressed`, `aria-disabled`, a consumer class colour and an inline colour;
  dividers; DateRange; MultiCombobox; the colour-input parts; plain `button`, `a`, `input`. States forced through CDP,
  main and HEAD, all ten pairs, normal and forced colours.
- The date range (normal and forced), the hover cursor sampled by area, ids, overflow at 390px.

### Notes
1. **E13: a disabled date range shows `not-allowed` over 30% of its area.** The inputs keep `cursor: default` over
   the other 70% (the control computes `not-allowed`). A disabled `.sb-input` shows it over 100%; the multi-combobox
   field over 43%, for the same reason, on main too. Smallest fix: `cursor: inherit` beside `color: inherit` on the
   disabled date range's inputs, and on the combobox field's `> input`.
2. **E13: a disabled value and the placeholder are the same colour,** `text-subtle` on `bg-subtle` (ocean light
   `#8b95a3` on `#ebeff4` 2.63; sorbet light `#975e2a` on `#f7ecd1` 4.52; sorbet dark 8.11). The calendar icon
   (opacity 0.55): ocean light 1.63 (main 1.74), sorbet light 2.12 (main 2.24). The spec's accepted N-8.
3. **E12: a focus-visible edge case.** If the trigger already shows keyboard focus and is then clicked, Chromium
   opens with item 1 showing the ring; hovering it shows the ring without the fill (main showed the fill). A clean
   mouse path is identical on main and HEAD. Chromium's heuristic, not a CSS defect.
4. **E12 under forced colours is better than main:** a keyboard-focused item showed nothing on main (ratio 1.00);
   now a 3px inset ring (19.09 / 13.76 against the surface, emulated). A hover-only item stays invisible, as on main.
5. **E9: a consumer's colour still wins on the label** (unlayered class and inline, all 8 variants, every state);
   its spinner paints `--button-ink`, not the consumer's colour (main painted `on-primary`). Not a regression.
6. **The ring on the menu surface:** ocean 3.07 / 4.47, forest 4.50 / 4.72, noir 6.83 / 5.86, midnight 3.31 / 4.28,
   sorbet 4.03 / **2.83** (`#8e6ac7` on `#463425`).
7. **E8, sorbet light:** a labelled strong divider is now `#b096d7` on `#fef4dc`, 2.34, as its `<hr>` was on main.
   The token is the theme's, not this PR's.
8. **The vanilla menu** gives roles on construction only; items added later get none (as its comment says).
9. **Not this PR:** at 390px the demo overflows sideways (`scrollWidth` 525, the navbar), on main and HEAD.

### Clean
- **E9:** spinner equals its twin's label colour in 8 variants × 6 sizes × enabled/disabled × 10 pairs, and in the
  input group: 0 mismatches. Lowest against what is behind it: 4.50 (forest light primary), 4.55 (midnight light
  soft). `color: var(--button-ink)` changed no label or background colour in any variant, size or state; forced
  colours 0 differences.
- **E11:** in all ten pairs, React and vanilla:
  - the trigger is a `button`, `hasPopup` `menu`, expanded false then true;
  - the `menu` is named "Options ▾" and holds the `menuitem`s "Rename ⌘R", "Duplicate ⌘D" and "Delete project";
  - `aria-expanded` returns to false after Escape, Tab out, a click outside, an item click and Enter;
  - focus returns to the trigger;
  - a consumer's trigger id is kept; ids are unique with several menus;
  - a consumer's own item role is kept.
- **E12:** the keyboard path in all ten pairs, React and vanilla, RTL at 390px: a solid 3px ring, -2px,
  transparent, hovered or not; an item hovered while another has focus shows the fill (1.14 to 1.66; danger 1.16 to
  1.41); arrows, wrap, Home, End.
- **E13:** the control equals the disabled multi-combobox field in all ten pairs; enabled identical to main
  (sorbet's field fill `#fffbf1`, line and edge included).
- **E8:** labelled strong lines equal the strong `<hr>` (ocean light `#8b95a3` 3.03, was `#dae0e9` 1.33).
- **E6, E7:** colour-input parts, `button`, `a`, `input` and a tab under forced `focus-visible`: 0 differences.

Not measured: real pointer hover/active on buttons (CDP-forced), Firefox, Safari, touch, real Windows
high-contrast, screen-reader speech, the test page in RTL.
