# The existing defects: specification

Revision 1, 2026-10-07. Owner's instruction: "Lets work through the defects" (after PR #130 merged). This is the PR
that decision 16 (`docs/pastel-legibility-evidence/DECISIONS.md`) deferred them to. The facts are
`verification-07cb59f.md` beside this file; statement numbers here are E1, E2, …

The defects split two ways:

- **Group 1, this PR (PR 3): eight fixes with one obvious answer.** No theme file changes. The frozen presets'
  pixels change only at the sites each statement names, and only as it says.
- **Group 2, a later PR: seven fixes whose look the owner chooses.** Items 4, 6 (the selected swatch), 14, 16, §4
  with NEW-1, §17 #20 and L110 with NEW-2. Each goes to the owner rendered, as options with hex and numbers, before
  any spec text is written. Nothing here pre-empts them.
- Item 5 is gone (verification). Nothing is done for it.

## Rules that hold for every statement

**E1. No theme file changes.** `pnpm check:golden` passes with the goldens untouched: every byte of
`tools/golden/*.css` stays as it is, all five presets.

**E2. No contract changes.** `contracts.ts`, `rules.ts` and each preset's declared `contract` stay as they are, and
the reports keep printing `(946 pairings measured): wcag-aa × 8, legibility × 2`.

**E3. A frozen preset's computed styles change only where a statement says.** Checked by computed-style signatures,
not by the screenshot tool (whose noise, `shots-792852f.md`, would hide or fake a change): the playground and the
vanilla demo, all five presets × both modes, at rest and in the states a statement names, under main's library
stylesheet and this PR's. Every difference is listed by element and property, and each is one a statement allows.

**E4. Tests first, by a separate author** (the owner's process, `NEXT.md` of PR 2): each statement's test is written
from this text before the fix, shown red on main, and its file's sha256 recorded; the implementer never changes an
expected value.

## Group 1

**E5. Item 1: every `outline-offset` has a unit, and the colour input renders as today.**
- `atoms/_color-input.scss:82` and `:129`: `focus-ring(2)` becomes `focus-ring(2px)`.
- `:250`: `focus-ring(1)` becomes `focus-ring(2px)`, today's rendered offset (the 1 was invalid and dropped, so the
  base `:focus-visible` rule's 2px applies). Whether the chip's ring moves is decided with item 6, in group 2.
- Check: the built `dist/css/sorbet.css` has no `outline-offset` whose value is a number other than 0 without a unit;
  and E3 finds no difference in the colour input.

**E6. Item 6, first half: the focus ring is written once.** `base/_root.scss:57-61`'s `:focus-visible` rule becomes
`@include focus-ring-style;` (`abstracts/_mixins.scss:29-32`, default offset 2px). The compiled rule is unchanged.
`_color-input.scss:264-267` (`[aria-pressed="true"]`) is item 6's second half and stays for group 2.
- Check: the declaration `outline: token(focus-ring-width) solid clr(focus-ring)` is written in the library Sass only
  inside `focus-ring-style` and at `_color-input.scss:264-267`; and the built CSS's root `:focus-visible` rule is
  byte-identical to main's.

**E7. Item 2: a labelled `--strong` divider draws its lines in `border-strong`.**
- `atoms/_divider.scss`: under `div.sb-divider.sb-divider--strong`, `::before` and `::after` take
  `border-block-start-color: clr(border-strong)`. (The selector must beat `div.sb-divider::before`, (0,1,2).)
- Check, all ten pairs: the computed `border-top-color` of a labelled strong divider's `::before` and `::after` equals
  the computed `border-top-color` of an `<hr class="sb-divider sb-divider--strong">` on the same page; a labelled
  divider without `--strong` keeps `border`.
- E3: frozen pixels change on labelled strong dividers only.

**E8. Item 3: a loading button's spinner takes the button's own label colour.**
- Every variant that sets the label `color` at rest also sets a local custom property, `--button-ink`, to the same
  colour: the base (primary) and the filled variants `on-<variant>`; soft `primary-text`; outline `text`; ghost
  `text-muted`; link `link`. The spinner (`_button.scss:294`) paints `border-block-start-color:
  var(--button-ink, #{clr(on-primary)})`.
- Check, all ten pairs, all eight variants (primary, secondary, accent, danger, soft, outline, ghost, link): with
  `data-loading`, the spinner's computed `border-top-color` equals the same button's computed `color` without
  `data-loading`, at rest.
- E3: the filled variants' spinners keep today's colour in every pair (their `on-<variant>` equals `on-primary` in
  every record); soft, outline, ghost and link change, and only while loading.

**E9. Item 9: the comment in `semantics.ts:51-62` says what the code does.** It says that `brand()` applies the walk
to every role it is given, `primary` included, and that `primary-solid` is the split-off shape colour. No output
changes; E1 and E3 hold.

**E10. Item 12: the React Menu and the vanilla menu say what they are.**
- React (`molecules/menu.tsx`): the panel has `role="menu"`; `MenuItem` renders `role="menuitem"`, written directly
  after `type="button"`; the trigger has `aria-expanded`, `"false"` while closed and `"true"` while open. The
  separator stays an `<hr>` (its implicit role is `separator`, allowed in a menu).
- Vanilla (`behaviors/menu.ts`): on construction, the panel gets `role="menu"` and every `.sb-menu__item` in it
  without a role gets `role="menuitem"`; the trigger gets `aria-expanded="false"` (it already gets `"true"` and
  `"false"` on toggle). Its doc comment's markup gains the roles.
- Arrow-key navigation exists in both and is unchanged.
- **The status-markup fixtures** (`component-library/tools/fixtures/*.json`, pinned by sha256, not edited): for the
  `MenuItem` cases (D1 to D6), what renders is the recorded html with ` role="menuitem"` inserted directly after
  `type="button"`, and nothing else differs. The other components' cases compare exactly as before.
- Check: React, server-rendered and in Chromium's accessibility tree (closed and open): trigger `button`
  `hasPopup=menu` with `expanded` false then true, a `menu`, `menuitem`s with their names. Vanilla: the same from the
  demo's markup after `init()`.

**E11. Item 13: a menu item focused by keyboard shows the focus ring.**
- `molecules/_menu.scss:43-47` and `:66-69`: `:focus-visible` keeps the hover fill and adds
  `@include focus-ring-style(-2px)` (the inset ring of `_accordion.scss:24`, `_segmented-control.scss:16` and
  `_sidebar.scss:29`). `:hover` alone draws no outline.
- Check, all ten pairs, a plain and a danger item: Tab to the item: computed `outline-style` solid, `outline-width`
  equal to the `--sb-focus-ring-width` token, `outline-color` the focus ring, `outline-offset` -2px, background as on
  hover; hover without focus: `outline-style` none.
- E3: frozen pixels change on a keyboard-focused menu item only.

**E12. Item 15: a disabled date range looks disabled, as a disabled combobox does.**
- React (`molecules/date-range.tsx`): `.sb-date-range__control` gets `data-disabled` when `disabled`.
- Sass (`molecules/_date-range.scss`): `__control` matches `[data-disabled]`, and `:has(input:disabled)` for markup
  without the attribute, with `background-color: clr(bg-subtle); color: clr(text-subtle); cursor: not-allowed;`,
  and its inputs inherit that colour.
- Check, all ten pairs: a disabled date range's control computes the same `background-color`, `color` and `cursor`
  as a disabled combobox's control on the same page (`_combobox.scss:84-88`); its inputs' `color` equals the control's;
  an enabled one is unchanged.
- E3: frozen pixels change on a disabled date range only.

## Acceptance

1. Each of E5 to E12's checks, written first, red on main where the defect shows, green after.
2. E1 to E3 hold; E3's list of differences is quoted in the PR.
3. The eight gates green: `build`, `test`, `lint`, `typecheck`, `check:cli`, `check:catalog`,
   `check:consumable --no-build`, `check:golden`.
4. Each area its own commit: the tests; the Sass fixes (E5 to E9, E11, E12's Sass); the React and vanilla markup
   (E10, E12's attribute); the docs.
5. Two read-only audit lenses before the PR is marked ready: frozen presets (E1 to E3) and the fixes as rendered.
