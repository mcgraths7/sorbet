SPEC ADVERSARY: Revision 3.6 (step 2.5), worktree /Users/homelab/code/sorbet-repair @ 9b83e50 plus the uncommitted docs diff. Read-only throughout. Nothing in any repo was edited, staged or built, and sorbet-shots was not touched.

## Takeaways
- **Closure:**
  - 18 of the 20 findings are closed.
  - **C-1 is partly closed.** The Sass half of the frozen check is closed. The markup half is not: no check sees a markup change in the frozen presets beyond the icon.
  - **M-7 is partly closed.** The bar is stated, but the measurer cannot reach two of the four tones.
- **3 new major findings, all silent to every check:**
  - N1: the hidden word escapes scrolling containers, so the page scrolls sideways. Measured.
  - N2: the masked compare cannot see markup regressions.
  - N3: the presence test never sees the toast path consumers actually use.
- **6 new minor findings** (N4 to N9), plus three nits (N10 to N12). Most are loud. One is loud today: the revision itself already turns `pnpm test` red (N4).
- **Check 5, the rim:**
  - I applied L170, L175, L176, L178 and L179 verbatim in a scratch copy.
  - It compiles, and stylelint's state rule passes.
  - Of the 302 contract checks, exactly one fails: the #51 test, as L183 predicts. 5434, 5442, 4946, L150, L153 and L161 all stay green.
  - In Chromium:
    - sorbet: the rim is present at rest, hover and press, and the danger box shows rim plus edge.
    - ocean: the button gains only a `rgba(0,0,0,0) 0 0 0 0` placeholder, and every alert computes `none`.
    - icon ink: `#472400` in sorbet, the component's own text colour in ocean.
- **Check 6, counts:** every count and line reference checks out except the README catalog instruction (N5).

Scratch evidence is in `/private/tmp/claude-501/-Users-homelab/7dafc3c4-72a2-4f8b-b1c7-3c50b101249c/scratchpad/sa36/`:
- `repo/`: the worktree copy with the step-2.5 Sass forms applied.
- `run-25sass.txt` and `base-run.txt`: the contract-test runs.
- `compiled-head.css` and `compiled-25.css`.
- `c10.mjs`, `rim.mjs`, `overflow.mjs`, `overflow2.mjs`, `m1-copy.mts`.

## 1. Closure table

| id | Closing statement(s), quoted | Verdict |
|---|---|---|
| C-1 | L166 "The icon and the word are markup … they appear in all five presets"; L167 "the tool masks them … the four frozen presets must be pixel-identical"; L185; §17 item 21 | **partly**. The owner's decision, L4/L148 and the Sass side are closed. C-1 also said "it cannot see a React markup change", and that is still open: both sides render this tree's markup, and nothing else holds the rest of the markup (N2) |
| C-2 | L170 "The glyph paints currentColor … two rules decide it". Every pair is re-measured and reproduces (84.18/87.74/89.70/84.21; R091–R093, R128–R134, R153–R159; wcag-aa pairs checked in rules.order.json) | closed |
| C-3 | L179 "`.sb-icon--X { color: clr(X) }` becomes `seam(X-mark)`"; L70 row; §13 row. Figures reproduce (6.47/7.99/12.02/13.10 to 24.45–30.38; dark 42.30/42.93/36.22/44.13) | closed |
| M-1 | L171 (the words table, `u-visually-hidden`, `statusLabel`); L181 | closed |
| M-2 | L172 "Its `icon` prop … is removed". Verified that no caller passes one: 2 in the playground, admin kitchen.tsx:26, buylist's 7 | closed |
| M-3 | L175 (rim folded into the three shadows), L178 (`--danger-box`), L176 "It has no rim" | closed (compiled and run, see check 5) |
| M-4 | L169 (filled, even-odd, the four names, export, tone map, one size rule) | closed, but the catalog sub-instruction is wrong (N5) |
| M-5 | L182 "C10 reads the compiled stylesheet". Re-measured: only `info-mark` and the 4 `--sb-edge-status-*` are missing | closed |
| M-6 | Acceptance #6 "at least its floor of 126 … 131 … 135" | closed (measured 131; 135 with four stub glyphs exported) |
| M-7 | Acceptance #5 "each of the four tones, on a card … no lower than 9.9" | **partly**: the measurer cannot stage the warning or info box (N6) |
| M-8 | L183 #49–#51 | closed for those three. The 3.6 bump itself turns a fourth test red (N4) |
| M-9 | L177 (field error), L168 (brand tones none), §13 rows (progress 4.02/4.04/4.50, 11 of 15; Token Studio 0.00; dropzone; rating), S49 | closed |
| M-10 | L175 (variant="danger" only; none on iconOnly; transparent under loading; a consumer's glyph stays), L176 (replaces the leading glyph) | closed |
| M-11 | L180 table; S39 | closed |
| m-1 | L70 status-mark row "change at their own sync, not in step 2.5" | closed |
| m-2 | C11 row "the five status selectors after step 2.5" | closed |
| m-3 | Acceptance #2 "C10 is first enforced here; C11's fills and its other 22 edge reads have been since step 2.4" | closed |
| m-4 | L184 bullet 2 (React only; HTML API via comments; why `glyph()` was not chosen) | closed by deferral: where and why are both named |
| m-5 | L184 bullet 3 | closed |
| m-6 | L184 bullet 1 (deferred with decision 16) | closed by deferral, named |

## 2. New findings (severity by silence first)

| id | sev | Quoted text | Conflicting text or evidence | Smallest fix |
|---|---|---|---|---|
| N1 | major | L167 "the hidden word paints nothing (`u-visually-hidden`…)"; L166 "What changes in a frozen preset, and only inside the named components: the icon is drawn and takes room" | The word is `position:absolute` (`_mixins.scss:45-55`). Inside a non-positioned scroller its containing block is outside the scroller, so it is not clipped and extends the page's scrollable overflow. Measured with the real compiled CSS under ocean at 390px: a status Badge in `.sb-table-wrap` (`table.tsx:61`, not positioned) makes the document 595px wide against 390, where today it is 390. This breaks `_table.scss:3-4` "The wrapper owns horizontal overflow so the page never scrolls sideways", in every preset. The masked compare cannot see it (same markup on both sides, 1280px viewport), and SSR cannot either | Give the word a containing block inside the component: `position: relative` on the element holding it (badge, field error, alert and toast slots), or wrap glyph and word in one positioned status slot that L167 then masks. Add a case: status badge in an overflowing `.sb-table-wrap` at 390px, `documentElement.scrollWidth === innerWidth` |
| N2 | major | L166 "a frozen preset's rendered content changes only by the icon"; L167 "nothing else of the named components moves" | L167's own premise: "Both sides … render this tree's markup". A React regression in the eight files #49 unfences shows on both sides of every masked shot and passes. Examples: a moved or re-wrapped title, a changed class, children reordered or wrapped. L181 checks only icon and word presence and order | L181 gains a case: for each component and props, the markup with `svg.sb-status-icon`, the word span and empty `.sb-alert__icon`/`.sb-toast__icon` removed equals a fixture recorded from 9b83e50's dist for the same props (without Alert's `icon` and without the status-tone `dot`) |
| N3 | major | L181 "`ToastItem` comes from `dist/molecules/toast.js`"; L173 "`ToastProvider` renders [ToastItem] for each record" | Consumers reach toasts only through `toast()` and the provider, which renders after mount and so is untested. If the provider stops using ToastItem, or drops `statusLabel` or `tone`, every real toast silently loses its word, and the test stays green. That is the exact silent class L181 exists for (L171 "A missing hidden word changes nothing on screen") | Add a case: the provider renders `<ToastItem` with the record's `tone` and `statusLabel` (a source assertion, or a render with a minimal DOM) |
| N4 | minor (loud, red today) | L183 "Step 2.5's test author edits them … and no other existing assertion" | Bumping "Revision 3.5" to "3.6" makes `2.1 #2 (fixture)` red (`tools/test-contracts.ts:2582`): legibility-values.json and legibility-appendix-a.json say "revision 3.5". The re-transcription differs only in `transcribedFrom`. The fixtures README:79-81 says to re-run the transcriber on any revision; §12.5 does not say who does it | Re-run the transcriber in the revision-3.6 commit and say so in §12.5's preamble |
| N5 | minor (loud) | L169 "'the nine icons' becomes 'the thirteen icons' and line 705's list gains Success, Warning, Danger and Info" | `check-catalog.ts:35-47` needs the exported name verbatim, or a line whose lead word prefixes it. Applied literally in scratch: "✗ 4 exported component(s) absent … DangerIcon InfoIcon SuccessIcon WarningIcon". Line 704's own slash list would also still show nine | Line 704's list gains `SuccessIcon/WarningIcon/DangerIcon/InfoIcon` |
| N6 | minor (loud) | Acceptance #5 "the status box in each of the four tones, on a card"; L167/S51 "no playground demo" | `measure-edges.ts:131` stages by cloning a playground instance. The playground has only success and danger alerts, and the danger one is not on a card (`alerts-toasts.tsx:14,17`). `<root>/tools/measure-edges.ts` is not in 2.5's file list | Add the measurer to the file list: three staged rows cloning the success box with its tone class swapped (warning, info, danger), filed against sheet 2's "Status box"/card |
| N7 | minor (testability trap) | L178 `#{edge(status-danger, 0 0 #0000)}`; L175's compiled block `<today's rest falloff>`; acceptance #3 "in their stated forms" | Compiled, the L178 local reads `var(--sb-edge-status-danger, 0 0 rgba(0, 0, 0, 0))`, because Sass evaluates `#0000` inside `#{}`. 35 such spellings already exist and `state-definition.js:102` PLACEHOLDER accepts both. The falloff text is never given. A test typed from the spec fails on a correct build | State: "the placeholder in either spelling PLACEHOLDER accepts", and "each fallback is textually `.sb-button--secondary`'s for the same state" (or quote it) |
| N8 | minor (visible) | DECISIONS row 37 "with the symbol knocked out, so the surface shows through it" (owner); L169 | The sheet the owner chose from (`~/homelab/drop/sorbet-pastel-2026-10-05-status-icons/index.html`, section A) draws the symbol in a fixed `#fffbf1` stroke, not knocked out. Sheet 2 does the same (`build-edges.mjs:143-144`). With the knock-out, the solid danger button's symbol is blush `#f9c3c6` and the washes show their own hex; the owner saw neither | Record the knock-out as the author's call (S36, DECISIONS row 41) and show a solid fill on the look sheet |
| N9 | minor | L181 "renders … from the built `dist` … so `pnpm build` runs first" | The root `test` chain does not build. A local `pnpm test` after a source edit silently tests the previous dist. CI builds first, so only local runs are exposed | Fail when any `src` file is newer than `dist`, or build as `check:consumable` does without `--no-build` |
| N10 | nit | L183 "step 2.5 makes each false" | #50's test (`:4718`) stays green after 2.5 (it filters `status-*` out; verified). It is widened, not falsified | "widens #50" |
| N11 | nit | §16 "the visible ones among them (S35, S37, S39, S40, S43) are also DECISIONS row 41" | S49 (no icon on the dropzone error or the rating) and S36 (N8) are visible and missing from row 41 | Add both to row 41 |
| N12 | nit | L170 "Each is the only colour declaration a status icon gets" | `.sb-menu__item > svg { color: clr(text-muted) }` (`_menu.scss:28-32`) also matches the danger item's octagon. It is overridden, so behaviour is unaffected | "the only one that wins" |

## 3. Values a test author would have to invent
1. Dist import paths for Alert, Badge, Button, MenuItem, Field and the four glyphs. Only ToastItem's path is given.
2. Button "each size" (sm/md/lg) and "every other variant" (primary, secondary, accent, soft, outline, ghost, link). Neither list is in the spec.
3. Field's required child control and its props. The error and message strings. Alert title and children. ToastItem `message`, `onDismiss` and `leaving`.
4. What "before the content" means in case 2, e.g. "the slot is the root's first element child".
5. The exact failure text and exit code when `dist` is missing ("naming `pnpm build`").
6. Whether a non-empty `statusLabel` with surrounding spaces (`" Fehler "`) is trimmed.
7. The `test:status` script body in `packages/component-library/package.json`.
8. The internal export names of the tone map and the words, if "not public" is tested.
9. The properties of the `.sb-status-icon` size rule: "sets 1.1em" does not say inline-size/block-size or width/height.
10. The falloff text inside L175's four compiled lines (N7).
11. The compiled placeholder spelling in L178's `--danger-box` (N7).
12. Where "with the status icons masked" goes in the shots success line, and whether `baseline.json` records the mask.
13. How the measurer stages the warning, info and danger boxes on a card, and which sheet-2 key each row files under (N6).

## 4. Checks with no finding (evidence)
- **Check 2, contradictions with L4, L98, §11.4, L148–L155, L161, L165, C9–C11 and L105:**
  - None beyond N1, N4, N5, N8, N10 and N12.
  - Step 2.5 adds no token, so no golden changes.
  - L148's cascade is held, and only placeholders are added (Chromium, ocean).
  - L105's base differs from L183's, which states its own (9b83e50).
  - C10/C11 agree with L178/L182.
  - L149's 3.6 amendment matches the hand-written rims; 4946 is green.
- **Check 4, tightness:**
  - The mask covers only the glyph and the two slots. A Sass change to `.sb-alert`, its title, `.sb-toast`, `.sb-badge`, `.sb-button`, `.sb-menu__item` or `.sb-field__error` still differs in the masked run.
  - L166 accounts for the layout effects of the insertion: badge width, the alert and toast slot, the leading octagon, field error, dot replaced, consumer glyph hidden, table reflow under "what composes them".
  - Not accounted for: the hidden word's overflow (N1) and markup regressions (N2).
- **Check 5, the rim:**
  - The verbatim forms compile. The other variants compile unchanged.
  - Every local is declared in its own rule and read with a fallback (4946 green).
  - No state rule writes `box-shadow`; L153 and stylelint pass.
  - A frozen preset gains a placeholder only.
  - The rim is present at rest, hover and press in sorbet. The danger box gives the edge alone, the rim alone, both, or `revert-layer` across the four cases, as S44 says.
  - The only red test is #51, with exactly L183's message.
- **Check 6, counts:**
  - Icons: README:704 says "nine" and atoms/index.ts:11-23 exports nine; 9+4 = 13. Exported components: 148 to 152.
  - check:consumable: 131 measured at HEAD's dist; 135 with four glyphs. `RENDERED_FLOOR` = 126 at check-consumable.ts:206.
  - Test lines: 4823, 4718, 5452, 5434, 5442 and 4946 match.
  - Counts in the text: C11 has 22 non-status selectors; there are 17 source-unreadable names; 11 of 15 bar pairs are under 10; DECISIONS rows 36–41; S35–S51.
  - Every cited Sass and TSX line checked matches: `_icon.scss:58-72`, `_menu.scss:28-32`/`45-47`, `_alert.scss:3-8`/`27-32`, `_toast.scss:65-69`, `_button.scss:24-28`/`259`/`276-280`, `_mixins.scss:128-148`, `_progress.scss:17-19`, `_badge.scss:6`/`30-36`, `_field.scss:27-37`, `field.tsx:45-46`, `toast.tsx:84`/`91`, `alert.tsx:8,11,21-25`, `_dropzone.scss:87-91`, `_token-studio.scss:126`, `build-edges.mjs:109`/`142`/`144`/`195`.
  - Every figure in L170, L179 and §13 reproduces with `color.ts`.
