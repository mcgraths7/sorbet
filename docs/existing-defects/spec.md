# The existing defects: specification

Owner's instruction: "Lets work through the defects" (after PR #130 merged). This is the PR that decision 16
(`docs/pastel-legibility-evidence/DECISIONS.md`) deferred them to. The facts are `verification-07cb59f.md` beside
this file; statement numbers here are E1, E2, …

- **Revision 1**, 2026-10-07.
- **Revision 2**, 2026-10-07, answers the spec adversary (`spec-adversary-r1.md`, 1 critical, 7 major, 9 minor,
  5 nits); the "Answers" section at the end maps each finding to the text that closes it.

The defects split two ways:

- **Group 1, this PR (PR 3): eight fixes with one obvious answer.** No theme file changes. The frozen presets'
  pixels change only at the sites each statement names, and only as it says.
- **Group 2, a later PR: fixes whose look the owner chooses.** These go to the owner rendered first, as options with
  hex and numbers, before any spec text is written. Nothing here pre-empts them. They are:
  - item 4, the warning progress bar;
  - item 6's selected swatch;
  - item 14, striped-table hover;
  - item 16, the pressed danger button;
  - §4, the dark-mode edges, with NEW-1 (frozen dark table hover);
  - §17 #20, the command palette's focus;
  - L110, the scrim gradient, with NEW-2 (a top-aligned scrim layer);
  - a disabled field's fill in dark, which equals the enabled fill (adversary m-5; the §4 root).
- Item 5 is gone (verification). Nothing is done for it.

## Rules that hold for every statement

**E1. No theme file changes.** `pnpm check:golden` passes with the goldens untouched: every byte of
`tools/golden/*.css` stays as it is, all five presets.

**E2. No contract changes.** `contracts.ts`, `rules.ts` and each preset's declared `contract` stay as they are, and
the reports keep printing `(946 pairings measured): wcag-aa × 8, legibility × 2`.

**E3. Nothing moves but what a statement names.** A hand-run check, `tools/check-defects.ts --signatures`, run
before the PR is marked ready and its output quoted in the PR:
- **Pages:** the playground (`pnpm --filter playground build`, served from its `dist/`) and `demo/index.html`
  (served from the repo root).
- **Builds compared:** main's library stylesheet (`git archive main`, compiled as `build:css` does) against this
  PR's, each swapped into the same page build, the shots tool's `library-css-swap` mechanism (`tools/shots.ts`).
- **Matrix:** all five presets × both modes. Viewport 1280 × 900, `prefers-reduced-motion: reduce`, animations and
  transitions finished (`document.getAnimations()` each finished or cancelled) before reading.
- **Signature:** every element and its `::before` and `::after`, keyed by DOM path. The standard longhands only:
  custom properties are excluded, and so are `transform` and `animation-*`.
- **Expected:** 0 differences at rest. Neither page has a site of E7, E8 or E12 at rest, so any difference is a
  regression.
- **The changed sites** are checked by each statement's own check, on the test page of E4, not by this run.

**E4. Tests first, by a separate author** (the owner's process, `NEXT.md` of PR 2). Each statement's check is
written from this text before the fix, shown red on main, and its file's sha256 recorded; the implementer never
changes an expected value.
- **Where the checks live:**
  - Source and built-CSS checks (E5, E6, E9, E10's server-rendered markup and fixtures) go in the existing test files
    (`packages/design-system/tools/test-contracts.ts`, `packages/component-library/tools/test-status.ts`), so
    `pnpm test` and CI run them.
  - The rendered checks (E7, E8, E10's accessibility tree, E11, E12) go in a new hand-run tool,
    `tools/check-defects.ts` (root script `pnpm check:defects`). It is not in CI, which has no Chromium, as
    `tools/check-status-layout.ts`.
- **The test page:** `tools/check-defects.ts` builds the page itself: the built library stylesheet and one theme
  file, `data-theme` set to the mode, and the markup each statement names, written into the tool (React components
  server-rendered with `react-dom/server`, the vanilla menu with `init()` from the built behaviors).
- **What "red on main" means:** each check states which parts fail on main (see E10).

**E5. The pins of PR 2 that this PR moves (adversary C-1).** `test-contracts.ts` holds three source-text pins from
legibility-spec L70, L72 and L183 #49:
- **L70** (`REMAINING`, `clr(border-strong)` by file) and **L72** (`clr(text-subtle)` + `seam(text-caption)` = 47)
  stay true and unchanged, because E8 and E13 are written so as not to move them (see there).
- **L183 #49** (`MAY_CHANGE`, the files under `component-library/src` and `behaviors/` that may differ from
  `e6fd3d5`): `packages/design-system/src/behaviors/menu.ts` is added to the list, for E11's vanilla roles. The test
  author makes that one-line edit in the tests commit; its comment cites E5 of this spec. No other expected value of
  an existing test changes, except the fixture comparisons of E11.

## Group 1

**E6. Item 1: every `outline-offset` has a unit, and the colour input renders as today.**
- `atoms/_color-input.scss:82` and `:129`: `focus-ring(2)` becomes `focus-ring(2px)`.
- `:250`: `focus-ring(1)` becomes `focus-ring(2px)`, today's rendered offset (the 1 was invalid and dropped, so the
  base `:focus-visible` rule's 2px applies). Whether the chip's ring moves is decided with item 6, in group 2.
- `focus-ring-style` (`abstracts/_mixins.scss:29-32`) raises a Sass `@error` for a unitless offset other than 0
  (`math.is-unitless`), so it cannot recur (adversary n-5).
- **Check** (`test-contracts.ts`): the built `dist/css/sorbet.css` has no `outline-offset` whose value is a number
  other than 0 without a unit (red on main: three). E3 covers the rendering; E8's test page includes no colour
  input, and none is needed, since the compiled offset equals what main renders.

**E7. Item 6, first half: the focus ring is written once.**
- `base/_root.scss:57-61`'s rule `:focus-visible` (in `@layer sb.base`) becomes `@include focus-ring-style;`
  (default offset 2px). The compiled rule is byte-identical to main's.
- `_color-input.scss:264-267` (`[aria-pressed="true"]`) is item 6's second half and stays for group 2.
- **Check** (`test-contracts.ts`): with comments removed (as `partials()` does), the declaration text
  `outline: token(focus-ring-width) solid clr(focus-ring)` occurs in the library Sass exactly twice, in
  `abstracts/_mixins.scss` and `atoms/_color-input.scss` (red on main: three).
- **Check:** the built CSS's `:focus-visible` rule in `sb.base` equals main's, text for text.

**E8. Item 2: a labelled `--strong` divider draws its lines in `border-strong`.**
- `atoms/_divider.scss`: the line colour becomes a local custom property:
  - `.sb-divider` sets `--divider-line: #{clr(border)}`, and both the `<hr>` line and the pseudo-element lines paint
    `var(--divider-line)`;
  - `&--strong` sets `--divider-line: #{clr(border-strong)}`, in place of its `border-color`.
- So `clr(border-strong)` is still written once in the file (L70's pin holds). No new selector needs to out-rank
  `div.sb-divider::before` (0,1,2), because the pseudo-elements read the property, which inherits.
- **Check** (`check-defects.ts`), all ten pairs: the computed `border-top-color` of a labelled strong divider's
  `::before` and `::after` equals the computed `border-top-color` of an `<hr class="sb-divider sb-divider--strong">`
  on the same page; a labelled divider without `--strong` paints `border`. Red on main: the labelled strong lines
  paint `border`.
- **Markup:** `<div class="sb-divider sb-divider--strong" role="separator">or</div>` and the same without
  `--strong`.

**E9. Item 3: a loading button's spinner takes the button's own label colour.**
- Every rule that sets a variant's resting label `color` also sets `--button-ink` to the same colour:
  - the base (primary) and the filled variants: `on-<variant>`;
  - soft: `primary-text`;
  - outline: `text`;
  - ghost: `text-muted`;
  - link: `link`.
- The spinner (`_button.scss:294`) paints `border-block-start-color: var(--button-ink, #{clr(on-primary)})`.
- A local custom property is allowed in library Sass: the stylelint rule only requires it declared in the same
  file, and `--edge`, `--shadow-rest`, `--danger-box` and `--card-hover-edge` are precedent. Place each declaration
  so `custom-property-empty-line-before` and `declaration-empty-line-before` pass (adversary m-8).
- **Check** (`check-defects.ts`), all ten pairs, all eight variants: the `::after` of a `<button class="sb-button
  sb-button--<variant>" data-loading>` computes a `border-top-color` equal to the `color` of a twin button without
  `data-loading`, side by side on the page. Read after transitions finish.
- **Expected:** red on main for soft, outline, ghost and link everywhere, except sorbet light soft, whose
  `primary-text` equals `on-primary` (`#472400`).
- **The filled variants keep today's colour** in every pair: `on-<variant>` equals `on-primary` in every record.
- **Known and accepted:** sorbet light outline, ghost and link spinners go from 13.37, 12.62 and 12.62 to 9.38,
  6.28 and 6.93. They now match their labels.

**E10. Item 9: the comment in `semantics.ts:51-61` says what the code does.** It says that `brand()` applies the
pastel walk to every role it is given, `primary` included, and that `primary-solid` is the split-off shape colour.
- **Check** (`test-contracts.ts`): the file no longer contains "PRIMARY is exempt" (red on main).
- No output changes; E1 and E3 hold.

**E11. Item 12: the React Menu and the vanilla menu say what they are.**
- **React** (`molecules/menu.tsx`):
  - the panel has `role="menu"` and `aria-labelledby` naming the trigger, which gets an `id` from `useId`;
  - `MenuItem` renders `role="menuitem"`, written directly after `type="button"`;
  - the trigger renders `aria-expanded`, `"false"` while closed and `"true"` while open.
- **The separator** stays an `<hr>` (implicit role `separator`, allowed in a menu).
- **`MenuHeading`** is out of scope: a `<p>` inside `role="menu"` is not an allowed child, and giving the headed
  items a `group` changes the component's structure. Recorded for a later PR (adversary m-3).
- **Vanilla** (`behaviors/menu.ts`), on construction:
  - the panel gets `role="menu"`, and `aria-labelledby` the trigger's `id`, giving the trigger one if it has none;
  - every `.sb-menu__item` in it without a `role` gets `role="menuitem"`;
  - the trigger gets `aria-expanded="false"` (it already toggles it).
  - Its doc comment's markup gains the roles.
- Arrow-key navigation exists in both and is unchanged.
- **The status-markup fixtures** (`component-library/tools/fixtures/*.json`, pinned by sha256, not edited): for the
  `MenuItem` cases D1 to D6, what renders is the recorded html with ` role="menuitem"` inserted directly after
  `type="button"`, and nothing else differs. The test author rewrites the two comparisons in `test-status.ts`
  (`:637-641`, `:666-670`) for those cases, in the tests commit (adversary m-2). The other components' cases compare
  exactly as before.
- **Check, server-rendered** (`test-status.ts`): the markup has the roles, `aria-labelledby` matching the trigger's
  `id`, and `aria-expanded="false"`. Red on main.
- **Check, accessibility tree** (`check-defects.ts`), React and vanilla, with the menu closed and then opened by
  Enter on the Tab-focused trigger:
  - the trigger is a `button` with `hasPopup` `menu` and `expanded` false, then true;
  - a `menu` named by the trigger's text;
  - `menuitem`s whose names are their text content as Chromium computes it ("Rename ⌘R" for a shortcut item).
  - Red on main: the roles and the name. Chromium already reports `expanded` through `popovertarget` (adversary
    m-4), so that part is green on main.

**E12. Item 13: a menu item focused by keyboard shows the focus ring.**
- `molecules/_menu.scss:43-47` and `:66-69`: `:hover` keeps the fill and no longer sets `outline`; `:focus-visible`
  draws `@include focus-ring-style(-2px)` and no fill of its own. A focused item that is also hovered has the ring
  and the hover fill.
- **Why no fill under the ring (adversary M-6):** the inset ring over the hover fill measures under 3:1 in three
  pairs: ocean light `#3d94fc` on `#ebeff4` 2.66; midnight light 2.86; sorbet dark `#8e6ac7` on `#5b443a` 2.16. Over
  the menu's own surface it is the ring every other inset site shows (accordion, segmented control, sidebar).
- **Check** (`check-defects.ts`), all ten pairs, on a plain item and a danger item. The route is Tab to the trigger,
  Enter (focus lands on the first item, `:focus-visible` true), then End for the danger item (adversary M-5). Each
  focused item computes:
  - `outline-style` solid;
  - `outline-width` equal to `getComputedStyle(document.documentElement).getPropertyValue("--sb-focus-ring-width")`;
  - `outline-color` the focus ring;
  - `outline-offset` -2px;
  - `background-color` transparent.
- **The same, hovered and focused:** the ring, with the hover fill.
- **Hovered, not focused** (the pointer on another item): `outline-style` none, with the hover fill.
- **Red on main:** the outline.
- **Also measured** (quoted, not asserted): the ring against the menu's surface in the four frozen presets, both
  modes. Under 3:1 anywhere is reported to the owner, not changed (adversary M-6).

**E13. Item 15: a disabled date range looks disabled, as a disabled multi-combobox does.**
- **A shared mixin.** `abstracts/_mixins.scss` gains `field-disabled`: `background-color: clr(bg-subtle);
  color: clr(text-subtle); cursor: not-allowed;`. `_combobox.scss:84-88`'s `&[data-disabled]` block (the
  multi-combobox's `.sb-combobox__field`, adversary M-1) becomes `@include field-disabled;`. So `clr(text-subtle)` is
  still written the same number of times, and L72's 47 holds.
- **The date range:** `_date-range.scss` `__control` matches `&:has(.sb-date-range__input:disabled)` with
  `@include field-disabled;`, and its inputs take `color: inherit` there. The React component already disables its
  inputs, so no markup changes and `date-range.tsx` is untouched (L183 #49 holds for it).
  - `:has()` is already used across the library (14 sites), so it adds no new browser floor (adversary m-6).
- **Check** (`check-defects.ts`), all ten pairs:
  - a server-rendered `<DateRange disabled …>` has a control that computes the same `background-color`, `color` and
    `cursor` as a disabled `<MultiCombobox>`'s field on the same page;
  - its inputs' `color` equals the control's;
  - an enabled date range computes as on main.
  - Red on main.
- **Left as it is:**
  - the multi-combobox's own input keeps `clr(text)` when disabled. That is a separate inconsistency, out of
    scope, and recorded for group 2.
  - in dark, `bg-subtle` equals the enabled fill in all five presets (adversary m-5); recorded in group 2 with §4.

## Acceptance

1. Each check of E6 to E13, written first, red on main as stated, green after. `test-contracts.ts`,
   `test-status.ts` and `check-defects.ts` sha256 recorded before the implementer starts, and checked after.
2. E1 to E3 hold; E3's output (0 differences) is quoted in the PR, with `pnpm check:defects`'s.
3. The eight gates green: `build`, `test`, `lint`, `typecheck`, `check:cli`, `check:catalog`,
   `check:consumable --no-build`, `check:golden`.
4. Each area its own commit:
   - the tests (with E5's one-line `MAY_CHANGE` edit and E11's fixture comparisons);
   - the Sass (E6 to E9, E12, E13);
   - the token comment (E10);
   - the React and vanilla menu (E11);
   - the docs.
5. Two read-only audit lenses before the PR is marked ready: the frozen presets (E1 to E3) and the fixes as
   rendered.

## Answers to the adversary of revision 1

| Finding | Closed by |
|---|---|
| C-1 three `test-contracts` pins | E5; E8 and E13 are written so L70's and L72's pins hold; L183 #49 gains `behaviors/menu.ts` |
| M-1 the combobox selector | E13 compares with `.sb-combobox__field[data-disabled]` (MultiCombobox); a shared mixin |
| M-2 `--button-ink` in signatures | E3 excludes custom properties |
| M-3 no sites on the pages | E3 expects 0 differences; the sites are on E4's test page |
| M-4 E3 underspecified | E3 defines pages, swap, matrix, settling, signature, keys |
| M-5 Tab closes the menu | E12's route: Tab, Enter, End |
| M-6 ring on the fill under 3:1 | E12 drops the fill under the ring; the ring on the surface is measured and reported |
| M-7 hover and focus order | E12: `:hover` sets no outline; both together show the ring |
| m-1 sorbet light soft | E9 |
| m-2 fixture comparisons | E11 |
| m-3 names, heading, menu name | E11: names as computed, `aria-labelledby`, `MenuHeading` out of scope |
| m-4 what is red on main | E11 |
| m-5 dark disabled fill | Group 2 |
| m-6 `:has` in one selector list | E13 uses `:has` alone; no React attribute |
| m-7 scope | E3: all five presets; the apps are out (the owner: "the apps cant be worked on in this context") |
| m-8 stylelint placement | E9 |
| m-9 where the checks run | E4 |
| n-1 E9 is TypeScript | Acceptance #4 |
| n-2 line range | E10: 51-61 |
| n-3 comments | E7 |
| n-4 specificity text | E8 needs no selector |
| n-5 a guard | E6 |
