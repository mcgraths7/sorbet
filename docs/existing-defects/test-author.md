## Test author: the checks of `spec.md` revision 3, written before any fix

Run 2026-10-07 by a separate agent that read the spec and the existing tests, and touched no Sass, component,
behavior or token file and no fixture JSON.

### Files
- `packages/design-system/tools/test-contracts.ts`: E5's `MAY_CHANGE` edit (eleven files), E6, E6's guard, E7, E10.
- `packages/component-library/tools/test-status.ts`: E11's server-rendered markup (4 tests) and the D1 to D6
  comparisons (` role="menuitem"` after `type="button"`), with a guard that the rewrite covers exactly D1 to D6.
- `tools/check-defects.ts` (new, `pnpm check:defects`): E8, E9, E11's accessibility tree, E12, E13, and E3 under
  `--signatures`. Builds first unless `--no-build`.

### Red and green on the unfixed tree (9fae5d5)
- `pnpm test`: `✗ 4 of 334 contract checks failed` (E6, E6 guard, E7 count, E10).
- `pnpm test:status`: `✗ 10 of 187 status checks failed` (D1 to D6, and the 4 E11 markup tests).
- `pnpm check:defects`: E8 10 failed / 10 passed; E9 39 / 41 (soft, outline, ghost, link everywhere but sorbet
  light soft); E11 50 / 40 (roles and the menu's name red; `expanded` green, as the spec says); E12 80 / 40 (the
  four focused cases red; hovered-only green); E13 10 / 20.
- `pnpm check:defects --signatures`: `✓ E3: 0 differences … on both pages, in every preset and mode` (20 of 20). A
  planted rule in a scratch copy was caught on both pages, so the swap and the route interception both take effect.
- E12's ring on the menu surface, measured: ocean 3.07 / 4.47, forest 4.50 / 4.72, noir 6.83 / 5.86, midnight
  3.31 / 4.28, sorbet 4.03 / **2.83**.
- `pnpm lint` and `pnpm typecheck` pass.

### Readings the author took where the spec was silent
1. E4's statement numbers were stale; each statement's own "Check (file)" line was followed. (The spec is now
   corrected.)
2. "main" is `origin/main` when no local `main` exists; the tool prints which.
3. E9's `sb-button--primary` is not a class; the literal markup renders as the base button, which is primary.
4. E12's hover fill is main's: `bg-subtle` for a plain item and `danger-subtle` for a danger item; "transparent" is
   alpha 0.
5. E11's names are asserted as the literals "Rename ⌘R", "Duplicate ⌘D", "Delete project", which Chromium computes.
6. E13's MultiCombobox is `{ disabled: true, options: [] }`; "an enabled date range computes as on main" is its
   full signature against main's stylesheet.
7. Two checks were added from statement text beyond the "Check" lines: E6's guard, and the vanilla menu's
   attributes (`id="demo-menu-trigger"`, `aria-labelledby`, roles, `aria-expanded="false"`).
8. E3's settling: finite animations are awaited (up to 3s) then finished; infinite ones are cancelled, alike on
   both sides.
9. E7's "equals main's" compares with a literal recorded at 9fae5d5, so CI needs no main ref.

### sha256 (checked after the implementer)
- `packages/design-system/tools/test-contracts.ts` `3f9cea371bdf426b8714abc51d3b40d9e327563deeb9724b9b552ef5355b6286`
- `packages/component-library/tools/test-status.ts` `10fbf65f11d4ea9671cae29559566da420fabbf3c127b8c78e1b326147dcceb0`
- `tools/check-defects.ts` `6d173f0178899e692245cdbaa692e27c7499f7fbeb116fde8b2088114aabd45a`
- `package.json` `b6f6ccc3445ce4f3228dcedadf1e3361442ffa8786e2ac729977a14ac6fda426`
