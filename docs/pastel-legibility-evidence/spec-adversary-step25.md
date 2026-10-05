SPEC ADVERSARY — step 2.5 "Statuses carry an icon and a word" (worktree /Users/homelab/code/sorbet-repair @ 9b83e50, read-only; nothing in any repo was edited)

## Takeaways
- **3 critical findings:**
  - Step 2.5's shared React change alters what all four frozen presets render, and the spec never reconciles that with L148's reading of L4 as a pixel promise.
  - The icon's colour is not specified, and two natural choices ship colours no rule holds.
  - The `Icon` atom's status tones paint the pastel fill as a mark nobody gates.
- **11 major findings:**
  - What "the word" is; what happens to Alert's `icon` prop; the form of the danger rim; the icon's form, size and names.
  - C10's reading cannot pass from the Sass source.
  - "126 components" is a floor (131 render today).
  - The status-box rendered bar was dropped from 2.5's acceptance.
  - Two step-2.4 tests go red with no spec line authorising the edit.
  - Three status sites stay colour-only.
  - Button and MenuItem have no `tone`.
  - No ARIA expectation is given.
- **C11 today:** 27 of 27 fills hold; 22 of 27 edge reads hold. The 5 status selectors are missing.
- **C10 today, read off the compiled CSS:** every name is read except `info-mark` and the four `--sb-edge-status-*`. Read off the source, it also fails for 17 more names (switch-ring, selected-bar, 4 loop-read marks, 3 filled edges, 8 hover/press edges).

Scratch evidence is in `/private/tmp/claude-501/-Users-homelab/7dafc3c4-72a2-4f8b-b1c7-3c50b101249c/scratchpad/sa25/`:
- `compiled.css` (HEAD Sass compiled `--style=expanded`, same as `build:css`)
- `c10.mjs`, `c11.mjs`
- `ssr2.mjs` (check:consumable's exact SSR logic)
- `pk.mts`, `pk2.mts`, `pk3.mts` (measurements with `color.ts`)

## Findings table

| id | sev | Step text / spec quoted | Conflicting code / spec (file:line) | Smallest fix to the SPEC |
|---|---|---|---|---|
| C-1 | critical | 2.5: "the icon and word are derived from `tone` inside each component, so a status cannot render without them". The acceptance says nothing about frozen pixels. §12 preamble: "the four frozen goldens are unchanged". | L148 (spec:2250): "'Pixel-identical' (L4, step 2.3 and 2.4 acceptance) is a promise about pixels".<br>Proposal:1584: "from step 2.3 on, the playground is rendered under all four frozen presets … compared pixel for pixel … at each step".<br>Proposal:1756 (buylist, ocean): "What changes: nothing, by design: its readers are not the owner".<br>buylist does use the components: `~/code/buylist/web/src/Quote.tsx:76,89,96,107,119,135` (`<Alert tone="danger"/"warning">`), `:180` (`<Badge tone="warning" solid>`), `App.tsx:37` (`<Badge tone=… dot>`). apps/admin (ocean, proposal:1768 "in-repo stand-in") and apps/meal-kit (forest) use them too.<br>The L155 comparer (spec:2506, 2532) builds its baseline from THIS tree's playground, so it cannot see a React markup change. New icon-slot Sass (badge, toast) makes it report frozen differences; with no new Sass it prints "identical" while the frozen presets visibly changed.<br>§17 has no item on this. | Add L166, an owner call. Either:<br>(a) The icon and word are shared component markup and change every preset, the frozen four included. L4 (theme files) and L148's box-shadow and transition cascade still hold. The L155 run's frozen differences must be confined to the five components' icon and word. buylist, apps/admin and apps/meal-kit change on their next re-pack (new §17 item superseding proposal §12).<br>(b) The icon renders only where a theme opts in, through a non-colour seam, so frozen pixels stay identical; the DOM and ARIA still change. |
| C-2 | critical | 2.5 names the four shapes but never the icon's colour. §8 (L73 preamble): "the stylesheet and the apps draw marks with it". | If the icon is painted in X-mark on a solid badge (`_badge.scss:24-26`, fill X), the worst-view separations are success 18.20 (tritan), danger 18.36 (deutan), info 13.97 (tritan), all under the light mark-line floor of 19.5. No rule holds mark-on-fill (only R196–R203, R280–R283: card, wash, raised).<br>Reusing `<Icon tone>` paints the pastel instead (C-3).<br>Sheet 2 (`build-edges.mjs:143-144`) paints the shape in `--on-fill` (#472400, the strong ink) with a #fffbf1 glyph, i.e. ink, not mark. | State the icon's colour per context, with the rule that holds it. Recommended: currentColor, so X-text on a wash, on-X on a solid badge, `text` on a toast, as sheet 2 draws it. Or X-mark only on wash, card and raised, naming R196–R203 and R280–R283, and never on a solid fill. |
| C-3 | critical | L70 has no row for the `Icon` atom; neither does §13. | `atoms/icon.tsx:6` (`IconTone` includes the four statuses); `_icon.scss:58-71` paints `color: clr(success\|warning\|danger\|info)`. In sorbet light on the card (#fffbf1) the worst-view separation is success #a6edee 6.47, warning #f5e3a2 7.99, danger #f9c3c6 12.02, info #dac5fc 13.10, against a mark-line floor of 19.5. No rule holds it. Note `--primary` already uses `primary-solid` (`:54-56`). | Add an L70 row for step 2.5: `.sb-icon--X` reads `seam(X-mark)`. It is a colour seam whose fallback X leaves the frozen presets identical (L148 bullet 4). Or add a §13 row with these figures. |
| M-1 | major | "an icon and a word". | The word is undefined: visible text, visually hidden (`u-visually-hidden` exists, `base/_utilities.scss:5`), or `aria-label`. Sheet 2's "words" are the consumer's titles ("Saved.", "Could not save.", `build-edges.mjs:218-221`) and the button's own label ("Delete", `:181`), not a word derived from the tone.<br>Duplication cases: `<Alert tone="danger" title="Payment failed">` (playground `alerts-toasts.tsx:17`), `<Badge tone="danger">Overdue</Badge>` (`data-table.tsx:29`), `<Badge tone="info">7</Badge>` (`apps/admin/src/App.tsx:87`).<br>No i18n override. A visually hidden word is invisible on screen, so its absence is SILENT, which contradicts "loud". | Name the four words (or "none: the consumer's title is the word"), say whether they are visible, give the prop that overrides them, and add an SSR test (component × tone → glyph and word present) if the word is hidden. |
| M-2 | major | "derived from tone … cannot render without them" | Alert already takes `icon?: ReactNode` (`molecules/alert.tsx:8, 21-25`). The spec does not say whether it is removed (a breaking TS change), overrides the derived icon (which opens a hole in the invariant), or renders beside it. | State it. The pre-1.0 policy allows a break, but the spec has to say which. |
| M-3 | major | L70 "Invalid rim … the danger button \| 2.4, 2.5"; L116; §13 "looked at in step 2.5". | The rim is not built (`atoms/_button.scss:117-141`) and its form is unstated. Constraints that make a guess fail:<br>• L153: a third item at soft-edge's hover/active state rules (`_mixins.scss:128-150`) is forbidden.<br>• L152: a rim set at rest only, via `--shadow-rest`, vanishes on hover.<br>• L148/L149: a `seam-only` read without a `var(--local, 0 0 #0000)` fallback makes `--edge-layer` invalid, and every frozen danger button loses its shadow.<br>• L149 test: the local must be declared in every rule that reads it.<br>Also unsaid: the danger MenuItem ("delete", decision 13) and the danger status box, which sheet 2 draws with the rim (`build-edges.mjs:142`, `.al.danger{--state:inset 0 0 0 2px …}`). | Give the rim's Sass form (e.g. a `--danger-rim` local in `.sb-button--danger` and its hover/active rules, read `var(--danger-rim, 0 0 #0000)` inside `--edge-layer`), and say yes or no for the menu item and the danger alert. |
| M-4 | major | "four outlined shapes, decision 23: … as on sheet 2" | Sheet 2 draws FILLED silhouettes with a knocked-out glyph, 22px (24×22 for the triangle) (`build-edges.mjs:143-147`). The house glyphs are stroke-only (`atoms/icons.tsx:20-27`).<br>Unspecified: size per site (alert slot 1.25rem `_alert.scss:27-32`; badge text 12px; toast and menu 14px; button `> svg` 1.1em `_button.scss:276`), names, whether they are exported, the shape-to-tone mapping (only implied by list order).<br>The file list omits `atoms/index.ts`, though check:catalog matters only if the icons are exported. README line 46 says "the nine icons", which goes stale. | Say "filled silhouette as sheet 2" or "stroke outline", give the names and the export, add `atoms/index.ts` to the files, map each shape to its tone, and give one size rule. |
| M-5 | major | C10: "read by at least one `seam(…)` or `edge(…)` call under `src/styles`" | Source reading:<br>• `switch-ring`, `selected-bar` are read only through `seam-only(…)` (L149, added later).<br>• `success-`, `warning-`, `secondary-`, `accent-mark` are read only through `seam(#{$tone}-mark)` (`_progress.scss:31-35`); `info-mark` will be too, through the toast loop.<br>• `filled-secondary`, `-accent`, `-danger` and all 8 hover/press edges are read only through `edge($element, …)` in `filled-edge` (`_button.scss:24-27, 125`).<br>• `--sb-halo-room` is read only through `halo-room()`.<br>So C10 read off the source can never pass. Read off the compiled CSS, it is checkable (table below). | C10 reads the compiled CSS: each name appears as `var(--sb-<name>` in some declaration value (a `seam-only` read counts; comments excluded). |
| M-6 | major | "`check:consumable` still renders its 126 components" | `tools/check-consumable.ts:206` `RENDERED_FLOOR = 126` is a floor. 148 components are exported; **131 render** with no props today (exact copy of its logic). That becomes 135 if four icons are exported. | "check:consumable passes (at least RENDERED_FLOOR = 126 render; 131 today)". |
| M-7 | major | Step 2.4 #2 CORRECTION (spec:1883): "the status box is measured at step 2.5" | 2.5's acceptance has no rendered-edge bar. Sheet 2: light 10.9 (`edges-measure.json`, "Status box on card", the success box `#m-al`), so the bar is ≥ 9.9 over the whole boundary (L159). The tones to measure and the danger box's rim are unstated. | Add to 2.5's acceptance: "status box, light, each tone on a card, ≥ 9.9 (sheet 2 10.9 − 1.0, L159)". Dark is 22.6 at 2.6. |
| M-8 | major | (silent) | Two existing tests change at 2.5 with no spec line, and L10/L105 cover PR-1 assertions only:<br>• `tools/test-contracts.ts:4823` "2.4 #3" (fixture `step-2.4-untouched.json`, hashing every `component-library/src` file) turns red on 2.5's first React edit.<br>• `:4718` "…all but the status boxes, whose edge is step 2.5's" must lose its exemption. | List both under 2.5: retire 2.4 #3, or narrow it to the files 2.5 does not name; lift the C11 status exemption. |
| M-9 | major | 2.5 file list (five components) | Status sites left colour-only after 2.5:<br>• **Progress** `tone` (`atoms/progress.tsx:9`, `_progress.scss:31-35`): the success bar is 4.04 from the default bar under deutan; danger vs secondary is 4.50 (deutan).<br>• **Field error** (`molecules/field.tsx:63-66`, `_field.scss:27-30`): sheet 2 draws the octagon on it (`build-edges.mjs:195`); proposal row "Invalid; delete: … an icon, and words".<br>• **TokenStudio failures** (`_token-studio.scss:126`): proposal:1603 names it.<br>• **Badge brand tones** (primary, secondary, accent, neutral): the spec does not say they get no icon. In sorbet, danger = secondary, warning = accent and info = primary share hexes (`presets.ts` SORBET_LIGHT), so the icon is the only difference between them. | Add each to 2.5 or §13 with its figure; state "brand and neutral tones carry no icon". |
| M-10 | major | "derived from `tone`" | `Button` has `variant` (`atoms/button.tsx:5`) and `MenuItem` has `danger?: boolean` (`menu.tsx:102`); neither has a `tone`. Unspecified: an `iconOnly` danger button (square, `_button.scss:243-253`, already holding a glyph), `loading` (`color: transparent`), a consumer svg in a danger MenuItem (`_menu.scss:28-47`, two icons). | Name the mapping and these three cases. |
| M-11 | major | "the diff is reviewed as an ARIA change" | No expected accessible names or roles are given. The word enters live regions (Alert `role="status"`, `alert.tsx:20`; toast region `toast.tsx:91`) and accessible names (Badge inside a link; the danger Button's name, "Danger Delete"?). Is danger `role="alert"` derived? (`_alert.scss:8` says use it for danger; buylist does not pass it.) | List the expected role and accessible name per component × tone, as the review's oracle. |
| m-1 | minor | L70 "Status mark … the app sites of proposal §12 \| 2.5" | Those app sites are out of repo, and 2.5's files are all in-repo. | "the app sites change at their sync (proposal §12), not in 2.5". |
| m-2 | minor | C11 row (§9): "reads … `--sb-edge-<element>` (after step 2.4)" | The status exemption lives only in step 2.4's CORRECTION. | "(after step 2.4; the five status selectors after step 2.5)". |
| m-3 | minor | "C10 and C11 pass (both are first enforced here…)" | C11's fill half (27/27) and 22 of its edge reads are enforced since 2.4 (`test-contracts.ts:4697, 4718`). | "C10 first enforced; C11's status half". |
| m-4 | minor | "a status cannot render without them" | Holds for React only. The documented HTML API (`_alert.scss:3-7`, `_badge.scss:30`) and the CSS-only consumers get no icon. A CSS `glyph()` mask (`_glyphs.scss:20`) is the alternative that would reach them. | Scope the claim to the React components. |
| m-5 | minor | Icon drawn in CSS | L161's fixed function list: `polygon()` is already used; `circle()`, `ellipse()`, `path()` are not, so they would fail. | Note it if the shapes may be CSS. |
| m-6 | minor | — | The proposal's "Does not: fix the React Menu ARIA defect" (proposal:1368) is not carried into 2.5. | Carry it. |

## Status-rendering sites (file:line)

React components:
- **Alert** `molecules/alert.tsx:6, 18-25`; `_alert.scss:15-25` (fill and text), `:27-32` (icon slot). Named by 2.5.
- **Toast** `molecules/toast.tsx:19, 95`; `_toast.scss:65-69` (stripe `clr($tone)` → `seam(X-mark)`, L70). Named.
- **Badge** `atoms/badge.tsx:6, 15-16`; `_badge.scss:18-28`, dot `:31-36`. Named.
- **Button** danger: `atoms/button.tsx:5`; `_button.scss:117-141` (rim to build). Named.
- **MenuItem** danger: `molecules/menu.tsx:102, 113`; `_menu.scss:42-53`. Named.
- **AlertDialog** `organisms/alert-dialog.tsx:31, 112`: reaches the Button transitively.
- **Icon** `atoms/icon.tsx:6`; `_icon.scss:58-71`. NOT named (C-3).
- **Progress** `atoms/progress.tsx:9`; `_progress.scss:31-35`. NOT named (M-9).
- **Rating** `atoms/rating.tsx:5, 40`; `_rating.scss:49, 78-80`. Not a status, but its stars are `clr(X)` pastel (warning 7.99 on the card). §13 covers only the off star.
- **Field error** `molecules/field.tsx:63`; `_field.scss:27-30`. NOT named (M-9).
- **Dropzone error** `molecules/dropzone.tsx:185` (`role=alert`, words); `_dropzone.scss:87-91`.
- **Stat delta** `molecules/stat.tsx:9, 21`; `_stat.scss:35-50`. The arrow glyph carries it; no finding.

Sass-only sites:
- **Label required** `_label.scss:10-13`: the `*` glyph carries it; no finding.
- **TokenStudio failures** `_token-studio.scss:126`. NOT named (M-9).
- **Invalid fields** `_input.scss:40-43`, `_number-input.scss:27-30`, `_combobox.scss:77-80`, `_date-range.scss:29-32`. Already on `seam(danger-mark)` (step 2.4).

## Tone × component: what the spec gives each

| Component | success | warning | danger | info | primary | secondary | accent | none / neutral |
|---|---|---|---|---|---|---|---|---|
| Alert (`tone`, default info) | tick in a circle + word? | triangle + word? | octagon + word? | i in a square + word? | n/a | n/a | n/a | n/a (defaults to info); `icon` prop unspecified |
| Toast (`tone?`) | shape + word? | same | same | same | n/a | n/a | n/a | silent |
| Badge (`tone?`, `solid`, `dot`) | shape + word? (colour on a solid badge unspecified) | same | same | same | silent | silent | silent | silent; `dot` unspecified |
| Button (`variant`) | n/a | n/a | octagon + word? + rim (L70) | n/a | silent | silent | silent | soft, outline, ghost, link silent |
| MenuItem (`danger`) | n/a | n/a | octagon + word? (rim?) | n/a | n/a | n/a | n/a | silent |
| Icon (`tone`) | not covered | not covered | not covered | not covered | `primary-solid` | — | — | muted, subtle |
| Progress (`tone`) | X-mark bar only | same | same | no Sass rule (renders the default bar) | default | X-mark | X-mark | default |

A "?" means the word, the form, the size or the colour is undefined (M-1, M-4, C-2).

## C10, line by line (compiled HEAD; count of `var(--sb-<name>` reads)

- **Optional tokens:**
  - text-strong 1, heading-ink 1, text-caption 12, field-fill 9, control-checked 2, switch-off 1, slider-track 2
  - switch-ring 4 (all `seam-only`), selected-wash 1, selected-bar 5 (all `seam-only`)
  - container-line 8, field-line 10, filled-line 1, quiet-fill 1
  - success-mark 1, warning-mark 1, danger-mark 25, secondary-mark 1, accent-mark 1 (the four progress marks loop-written)
  - **info-mark 0 (fails)**
- **Edges:**
  - container 5, floating 8, field 8, sunken 3, quiet 3
  - filled-primary, -secondary, -accent, -danger: 1 each; all 8 `-hover`/`-press`: 1 each (all via variable or loop)
  - **status-success, -warning, -danger, -info: 0 each (fail)**
- **Other:** `--sb-halo-room` 4. `button-label(md)` and `button-label(sm)`: 1 call each (`_button.scss:58, 223`).
- **What 2.5 must add:** the toast stripe through `seam(#{$tone}-mark)` (covers info-mark) and the four status-box edges.

## C11, line by line (HEAD; fill / reads its own edge)

| Selectors | Fill | Edge read |
|---|---|---|
| `.sb-card` | ok | ok |
| `.sb-card--sunken`, `.sb-progress` (bg-subtle, where-defined sublayer) | ok | ok |
| `.sb-popover`, `.sb-menu`, `.sb-combobox__panel`, `.sb-calendar`, `.sb-color-input__panel`, `.sb-toast`, `.sb-modal`, `.sb-drawer` | ok | ok |
| `.sb-input`, `.sb-textarea`, `.sb-select select`, `.sb-number-input`, `.sb-combobox__field`, `.sb-date-range__control` | ok | ok |
| `.sb-button--outline` | ok | ok |
| `.sb-button`, `--secondary`, `--accent`, `--danger` | ok | ok |
| `.sb-alert`, `.sb-alert--info`, `--success`, `--warning`, `--danger` | ok | **MISSING** (no box-shadow) |

- The `@layer` order statement is present and in order.
- **What 2.5 must add:** each of the five alert selectors reads `--sb-edge-status-<tone>` (`.sb-alert` reads info). Under L148 that has to go through `where-absent`, falling back to `revert-layer`, as `_progress.scss:17-19` does.

## No finding, with what was looked at

- **L4:** 2.5 adds no token, so all five theme files and goldens stay unchanged.
- **Toast stripe re-point:** a colour seam whose fallback equals the old `clr(X)`, so frozen output computes identically (L148 bullet 4).
- **Status box edge:** covered by L148's general rule and its existing cascade test (`test-contracts.ts:5434, 5452`).
- **L151 halo room:** the status halo reaches 6px in light (≤ 9) and 1px in dark (≤ 3).
- **R280–R283** match the toast's raised fill.
- **L70/L106 line numbers** (`_toast.scss:66`, `_alert.scss:15, 22`) are e24df74's, as stated.
- **C11's dist reading:** `build:css` is sass `--style=expanded`, which is what the test compiles in memory.
- **Stat, Label, Stepper** carry a shape.
- **L165** has nothing about 2.5.
