## Audit lens: frozen presets and guards, at cd55fbf, and its repair

Run 2026-10-07, read-only. Scratch copies of origin/main (07cb59f) and HEAD, both built; probes and 30 plants
(`audit3-frozen/` in the session scratchpad) not committed.

**Hypothesis:** (1) the five presets change only where E6 to E13 say (E1, E2, E3); (2) every guard the change relies
on fails when it should, and only then.

**Verdict:** (1) holds. (2) partly failed: three plants stayed green on every gate (S1 to S3); five fixes are
guarded only by the hand-run `check:defects` (N1).

### Clean
- **E1:** all five `dist/themes/*.css` and `manifest.json` byte-identical to main; outside `css/sorbet.css`, `dist/`
  differs only in `behaviors/menu.{js,d.ts}` (E11) and `tokens/semantics.d.ts` (E10). `check:golden` green.
- **E2:** `(946 pairings measured): wcag-aa × 8, legibility × 2`.
- **The CSS diff:** 17 hunks, each a statement's: E9 9, E8 3, E6 3, E13 1, E12 1; E7's rule and the combobox field
  compile identical.
- **Hashes:** the four test files equal `test-author.md`; their diff from 410aba9 to cd55fbf is empty.
- **`--button-ink`:** `_button.scss` is first in `sb.atoms`; no later rule sets a `.sb-button`'s colour; forced
  hover and active show 0 differences on every `.sb-button`; the spinner equals the label on every playground button
  (main: 89 preset × mode × class rows differed).
- **Menu specificity:** `.sb-menu__item:hover:not(:focus-visible)` (0,3,0) overrides no other rule.
- **E11:** no selector anywhere keys on `role`, `aria-expanded` or `aria-labelledby`.
- **Plants caught:** E6 revert and `focus-ring(-4)` (build `@error`); raw unitless offsets, E7 and E10 reverts
  (test:contracts); E8, E9, E12 ×4, E13 reverts (check:defects); React roles (test:status and check:defects);
  vanilla roles (check:defects only); a frozen theme byte (build, check:golden); a wcag-aa floor (test); the outline
  ink and `.sb-kbd` colour (`--signatures`).
- **Commits:** each one area. 410aba9 is red by design; 38f535c and 0afba25 are red alone (E10 and the E11 status
  checks); only cd55fbf is green.

### Findings
| id | finding | repair |
|---|---|---|
| S1 (silent) | A change to the shared `field-disabled` mixin was caught by nothing: E13 compares two sites that both read it, and no E3 page has a disabled multi-combobox | `check-defects` E13 pins the disabled multi-combobox to main; a planted `cursor: default` in the mixin failed it in all ten pairs (3 differences each) |
| S2 (silent) | The strong divider's colour had no absolute check: E8 compares two sites that read one variable | E8 asserts the strong `<hr>` paints `border-strong`; a planted 50% `color-mix` failed it in all ten pairs |
| S3 (silent) | E3 saw rest only; a planted outline hover change passed every gate | `--signatures` also compares hover, active, focus, loading and disabled (CDP-forced, or attributes), allowing only E9's, E12's and E13's sites. Clean run: 120 of 120, 0 differences. The same plant: 32 failed, 16 hover and 16 active, nothing else |
| N1 | Five fixes are guarded only by the hand-run tool, which CI does not run (no Chromium) | Accepted as E4 sets it; stated in the PR |
| N2 | `math.is-unitless` threw on a non-number (`focus-ring(space(1))` compiled on main) | The guard checks `meta.type-of(...) == number` first; a test that a `var()` offset compiles was red, then green |

### Also repaired: the rendered audit's note 1
A disabled date range showed `not-allowed` over 30% of its area: its inputs inherit the cursor now. The check (its
inputs show the control's cursor) failed in all ten pairs before, and passes after.

### After the repair (f3deb37)
`pnpm test` (335 contract and 187 status checks), the eight gates, `check:defects` (E8 30, E9 80, E11 90, E12 120,
E13 50, all passing) and `check:defects --signatures` (E3 120 of 120) are green.
