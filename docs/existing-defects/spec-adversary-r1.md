## Spec adversary: `spec.md` revision 1 (E1 to E12), at 7c00dc1

Run 2026-10-07, read-only. Two scratch copies (`git archive`): main, and one with E5 to E12 applied exactly as
written; both built, every gate run, Chromium 141 over all ten preset-mode pairs. Probes not committed. Revision 2
of the spec answers each finding (its last section). The statement numbers below are revision 1's.

### Confirmed by measurement
- E1 (five themes byte-identical) and E2 (946, `wcag-aa × 8, legibility × 2`) hold.
- Compiled CSS diff, complete: `--button-ink` on 8 rules and the spinner reads it; one new divider rule; the three
  unitless offsets become `2px`; two new date-range rules; the menu `:hover`/`:focus-visible` rule split. The root
  `:focus-visible` rule is byte-identical.
- E5: colour-input focus offsets equal main's in all ten pairs (chip 2px, selected chip 1px, area and hue 2px).
- E7: labelled strong lines equal the `<hr>` strong colour after the fix, all ten pairs (ocean `#8b95a3`, forest
  light `#777168`, sorbet `#b096d7`).
- E8: spinner equals the label colour in all 80 cases; filled unchanged. Lowest after: forest light primary 4.50,
  midnight light soft 4.55. On main soft/outline/ghost/link measured 1.00 to 1.51 outside sorbet light.
- E10: after the fix, `menu`, `menuitem` × 3, trigger `expanded` false then true; the vanilla demo likewise.
- E11: focused item solid 3px, focus-ring colour, -2px, hover fill; hover alone no outline.
- E12: a disabled date range equals `.sb-combobox__field[data-disabled]`; the `:has` branch works alone.
- Green with the fixes: lint, typecheck, check:catalog, check:cli, check:golden, check:consumable --no-build,
  test:golden, test:contrast, check-status-layout. test:status fails only D1 to D6, as E10 predicts.

### Findings

| id | statement | finding |
|---|---|---|
| C-1 | E7, E12, E10 vs acceptance | `pnpm test` fails three `test-contracts.ts` pins: L70 (`_divider.scss` `clr(border-strong)` 1 → 2), L72 (47 → 48 with E12's `clr(text-subtle)`), L183 #49 (`date-range.tsx`, `behaviors/menu.ts` not in `MAY_CHANGE`) |
| M-1 | E12 | `_combobox.scss:84-88` is `.sb-combobox__field[data-disabled]` (MultiCombobox); a single Combobox's control computes transparent, `cursor: auto` |
| M-2 | E3 × E8 | `getComputedStyle` lists custom properties; `--button-ink` appears at rest on 55 playground and 40 demo elements |
| M-3 | E3 | Neither page has a labelled strong divider, a non-primary loading button or a disabled DateRange; a full signature found 0 differences main vs fix, so E3 could not catch a wrong E7, E8 or E12 |
| M-4 | E3 | Not runnable without many choices; animations make `transform` differ between samples |
| M-5 | E11 | "Tab to the item": Tab closes the menu (`menu.tsx:60-63`, `behaviors/menu.ts:106-109`) |
| M-6 | E11 | The inset ring over the item fill: ocean light `#3d94fc` on `#ebeff4` 2.66 (on `#ffe9e7` 2.64); midnight light 2.86 / 2.84; sorbet dark `#8e6ac7` on `#5b443a` 2.16. Ocean light against `#ffffff` 3.07 |
| M-7 | E11 | If `:hover { outline: none }` comes after `:focus-visible` (both 0,2,0), a hovered focused item loses its ring |
| m-1 | E8 | Sorbet light soft does not change (`#472400` both); sorbet light outline/ghost/link 13.37 → 9.38, 12.62 → 6.28, 12.62 → 6.93 |
| m-2 | E10 | The fixture comparisons (`test-status.ts:637-641`, `:666-670`) must change; who changes them is unsaid |
| m-3 | E10 | Names include the shortcut ("Rename ⌘R"); the menu has no name; `MenuHeading` `<p>` inside `role=menu` is not allowed (axe not run) |
| m-4 | E10 | Chromium already reports `expanded` through `popovertarget` on main |
| m-5 | E12 | In dark, the disabled fill equals the enabled fill in all five presets (the NEW-1 root) |
| m-6 | E12 | `[data-disabled]` and `:has()` in one selector list: an engine without `:has` drops both (unmeasured) |
| m-7 | E3 | Sorbet is not frozen; scope ambiguous; `apps/admin` uses Menu |
| m-8 | E8 | `--button-ink` right after `color` fails two stylelint rules, 7 times |
| m-9 | E4 | CI has no Chromium; where the rendered checks run is unsaid |
| n-1 | acceptance #4 | E9 is TypeScript, not Sass |
| n-2 | E9 | The comment is 51-61 |
| n-3 | E6 | A grep must exclude comments |
| n-4 | E7 | Specificity text inconsistent ((0,1,2), (0,2,1), (0,2,2)) |
| n-5 | E5 | Nothing stops a new unitless offset |

### Values a test author would have had to invent
E3's property and element sets, keys, settling and stylesheet swap; E5's colour-input states; E6's "root rule";
the test markup of E7, E8 and E12; E8's twin or toggle, transition wait and pseudo-element; E9's assertion; E10's
harness, names, heading and menu name; E11's keyboard route, items and token read; E12's reference element and
props; E4's file and script; C-1's new values.
