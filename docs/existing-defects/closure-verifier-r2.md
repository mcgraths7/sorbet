## Closure verifier: `spec.md` revision 2 (E1 to E13), at 69d6144

Run 2026-10-07, read-only. A scratch copy with revision 2 applied exactly as written (and only the two test edits it
allows), built, every gate run, measured in Chromium 141 over all ten preset-mode pairs. Probes not committed.
Revision 3 answers N-1 to N-9 (its second answers table).

### Takeaways
- All eight gates green with revision 2 applied: build, test (598 passing, 0 failures), lint, typecheck, check:cli,
  check:catalog, check:consumable --no-build, check:golden. L70's pin (`_divider.scss` still 1), L72's 47 and L183
  #49 (`date-range.tsx` untouched) hold; the five themes are byte-identical; the reports print `946 … wcag-aa × 8,
  legibility × 2`.
- The compiled CSS changes only where the spec says; the root `:focus-visible` rule and the multi-combobox
  `[data-disabled]` rule are byte-identical to main.
- E3, as revision 2 defines it: **0 differences at rest.** Playground 18,735 elements × 3 (element, `::before`,
  `::after`), demo 1,884 × 3, five presets × two modes, reduced motion, no running animations, no missing nodes; the
  swap verified (9 `--button-ink` declarations in the fixed build, 0 in main's).
- E6: the guard rejects `focus-ring(2)` and `(1)`, passes 0, 2px, -2px; no unitless non-zero offset left (main: 3).
- E7: the declaration 3 times on main, 2 after; the compiled root rule unchanged.
- E9: spinner equals the label colour in 80 of 80 cases; on main 39 differ, exactly E9's set.
- E8: labelled strong lines equal the strong `<hr>` (sorbet `#b096d7`, ocean `#8b95a3`, forest `#777168` / `#999389`,
  noir `#919499`, midnight `#697380` / `#8b95a3`); plain lines and the `<hr>`'s top colour equal main.
- E12 (Tab, Enter, End): focused items solid 3px, the ring colour, -2px, transparent; hover+focus ring plus fill;
  hover only no outline. Ring on the menu surface: ocean 3.07 / 4.47, forest 4.50 / 4.72, noir 6.83 / 5.86,
  midnight 3.31 / 4.28, sorbet 4.03 / 2.83.
- E13: the disabled date range equals the disabled multi-combobox field in all ten (ocean light `#ebeff4`,
  `#8b95a3`, not-allowed); enabled unchanged; the field's computed style unchanged by the mixin.
- E11: fixed React and vanilla menus give `menu "Options ▾"`, menuitems "Rename ⌘R", "Duplicate ⌘D", "Delete
  project", expanded false then true; main gives `group` and `button`s.

### Closures
C-1, M-1, M-2, M-3, M-7, m-1 to m-9, n-1 to n-5: closed. M-4: partly (the demo's swap, the key format, the clock).
M-5: closed for the vanilla menu, not the React one (N-2). M-6: partly (N-3, N-4).

### New findings

| id | sev | finding |
|---|---|---|
| N-1 | minor | React's `useId` overwrites an `id` the consumer gave the trigger (`menu.tsx:74-81`) |
| N-2 | major | A server-rendered React Menu cannot open itself: E11's `expanded` true and E12's focus fail on E4's page |
| N-3 | minor | Hover+focus puts the ring back on the fill: ocean light 2.66 / 2.64, midnight light 2.86 / 2.84, sorbet dark danger 2.16, sorbet light 3.55 / 3.32 |
| N-4 | minor | Sorbet dark ring on the menu surface 2.83 (`#8e6ac7` on `#463425`), outside E12's measured set |
| N-5 | nit | A strong `<hr>`'s unpainted sides go from `border-strong` to `#808080` |
| N-6 | minor | E3's demo swap, key format and clock unspecified |
| N-7 | nit | The `MAY_CHANGE` test's title and message go stale |
| N-8 | minor | The disabled date range's text: 9.38–16.01 → 2.63–4.52 light, 4.05–8.11 dark (as the multi-combobox) |
| N-9 | nit | `MenuProps.trigger`'s type must gain `id?` and `"aria-expanded"?` |

Unmeasured: axe, other engines, `check-status-layout`, screenshots.
