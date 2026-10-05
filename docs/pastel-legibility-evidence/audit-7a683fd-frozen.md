## Audit lens: frozen presets and sorbet halos at 7a683fd, against e24df74

**Hypothesis:** at 7a683fd the four frozen presets (ocean, forest, noir, midnight) render pixel-identically to e24df74 in every state, and sorbet's halos are never clipped or weaker in a state than at rest.

**Verdict: fail.**
- **Frozen presets:** they change in two places.
  - An element that carries a selected-row class (selected tab, current page/link, current sidebar item) together with `.sb-button` loses its shadow.
  - `.sb-button.sb-fab` gets a different hover and press shadow.
  - The calendar's "today" ring now fades out instead of vanishing.
- **Sorbet:** the accordion clips the halo of whatever sits first in its body. The quiet (outline) button is weaker when hovered than at rest.
- **Coverage:** all of these are outside what `shots.ts` walks, and no test or check fires on any of them.

Outside the composed fixtures, frozen rendering is clean across every context and state I tried (the evidence is under "Clean").

Worktree untouched. All scripts are in `/private/tmp/claude-501/-Users-homelab/7dafc3c4-72a2-4f8b-b1c7-3c50b101249c/scratchpad/audit-frozen-scratch/` (scripts in `t/`). Evidence images are in `/Users/homelab/homelab/drop/sorbet-pastel-2026-10-05-audit-frozen/` (https://meowlab.taild4b60e.ts.net/files/sorbet-pastel-2026-10-05-audit-frozen/).

### commands_run
- `git -C <wt> show --stat 7a683fd`; `git show 7a683fd -- '*.scss' src/tokens/{edges,emit}.ts tools/golden/sorbet.css`; read `tools/shots.ts`, `tools/playground-browser.ts`, `tools/measure-edges.ts`, `test-contracts.ts:4804-5130`, spec L146–L164.
- Built the e24df74 tree:
  - `git -C <wt> archive e24df74 | tar -x -C scratch/e24`
  - `pnpm install --offline && pnpm build` there
  - `pnpm --filter playground build` in both trees
- `site-old` and `site-new` are the same 7a683fd playground build. Only `assets/index-*.css` is swapped for e24df74's. Frozen theme assets are byte-identical (cmp). This isolates CSS, because the playground JS itself differs (see F6).
- `diff -u e24/.../dist/css/sorbet.css wt/.../dist/css/sorbet.css`
- `node rules.mjs <css> 'box-shadow'` and the clipping-property scan (postcss, both trees)
- `node l149.mjs <new css>`
- `node t/glob.mts t/jobs-big.json out-big 3` — full-page tiled pixel diff plus a computed-style signature, both trees.
  - The signature covers 36 properties on every `body *` element and 12 pseudo-elements.
  - 268 old/new job pairs plus 20 same-commit controls; the run was stopped after 268, and the rest moved to fresh pages.
  - Contexts: base, dpr2, motion (no-preference), rtl.
  - States, forced on every node at once over CDP: rest, hover, active, focus+focus-visible+focus-within, everything plus aria-invalid, disabled (+fieldset), selected/checked/aria-current/aria-pressed, every popover and dialog open.
  - Nested fixtures (`t/fixtures.mts`): a scrim layer holding every control, a carousel inside a drawer, a card and a second scrim, an input group, a disabled fieldset, `.sb-input` on color/file/date/search/number inputs, compact table, accordion, composed classes.
- `python3 sigclass.py out-big`
- `N=2|3 node t/fresh.mts t/jobs-fr-{0,1,2,3}.json` — fresh page per render, region hash, old×N vs new×N.
  - 108 jobs: dpr2 for all 8 preset-modes; zoom2, font200, print, forced-colors and narrow (390px) for ocean light and noir dark; each at rest and "all", at 3 anchors (scrim fixture, form controls, carousel).
  - Plus 5 rechecks of big-run candidates.
- `node t/recheck.mts`, `node t/fullcs.mts` (full computed-style diff)
- `node t/probes.mts scrollpad|today|statelayer|midcomp|midframe <preset> <mode>`; `CONTROL=1` variants
- `node t/compose.mts ocean light`, `node t/compose.mts noir dark`
- `node t/halo.mts light|dark`, also with `MOTION=1` and `ISO=1` (the all-round layer alone)
- `node t/edges.mts light|dark` — L159's method per state, inside a card and on the page, DPR 2
- `node t/scrim.mts`, `node t/checks.mts`, `node t/rl.mts`

### Findings (silent ones first)

**F1. Frozen pixel change from class composition. SILENT.**
- **Where:**
  - `abstracts/_mixins.scss:175-187`, `selected-mark($side, $old: none)`.
  - Its call sites: `molecules/_tabs.scss:54`, `molecules/_pagination.scss:41`, `organisms/_navbar.scss:71`, `organisms/_sidebar.scss:58`.
  - The `.sb-button` hover/press move (from e6fd3d5, kept here): `atoms/_button.scss`, and `abstracts/_mixins.scss:121` (`soft-edge`).
- **Expected:**
  - L148: "its fallback is **the element's old value exactly**".
  - L4: "pixel-identical".
- **Actual, (a): selected rows.** In all 4 frozen presets × 2 modes, every context and every state, an element that has a selected-row class plus `.sb-button` renders `box-shadow: none` where e24df74 rendered the button's shadow. Examples:
  - `.sb-pagination button.sb-button--outline[aria-current=page]`
  - `.sb-tabs__tab.sb-button[aria-selected=true]`
  - `.sb-navbar__nav a.sb-button[aria-current=page]`
  - `.sb-sidebar__item.sb-button--outline[aria-current]`
- Ocean light, composed fixture: 4,223 px differ, up to 124 levels.
  - Computed: `rgb(139,149,163) 0 0 0 1px inset => none` (outline).
  - Computed: `oklab(.55 …/.22) 0 1px 2px, … => none` (filled).
  - Present in 268 of 268 signature jobs.
- **Cause (a):** `var(--selected-bar-layer, none)` lives in the molecules/organisms cascade layers, which beat atoms whatever the specificity. `$old` is the selector's old value, not the element's.
- **Actual, (b): fab hover/press.** `.sb-button.sb-fab` hover and press, in ocean light and noir dark:
  - e24df74: the button's hover/press elevation (`0 2px 4px …/.26, 0 6px 14px …`).
  - 7a683fd: `.sb-fab:hover` `0 24px 48px -12px`.
- **Cause (b):** the box-shadow used to be declared on `.sb-button:hover:not(…)` (0,3,0). Now only `--edge-layer` is set there, and the box-shadow is written on `.sb-button` (0,1,0), so `.sb-fab:hover` (0,2,0) wins.
- **Precondition:** an undocumented composition. The library's own markup never does this. The only documented composition, `sb-button … sb-close`, is unaffected (I checked it).
- **Why silent:**
  - The test "2.4 L148 … falls back to the element's old value exactly" (`test-contracts.ts:4949-4971`) compares only the same selector string's last unconditional declaration: `lastIn(oldStylesheet(), selector)`.
  - `shots.ts` stages no composed classes.
- **Fix:**
  - Use `$old: revert-layer` for selected-mark. I verified in Chromium 153 that `box-shadow: var(--x, revert-layer)` falls back to the atoms-layer value and still paints the bar when the token is defined. Check other browsers.
  - Re-declare the composed list (`box-shadow: var(--state-layer, 0 0 #0000), var(--edge-layer)`) on `.sb-button:hover/:active:not(…)` to restore the old precedence.
  - Add composed fixtures to shots.
  - Make the L148 test cascade-aware.
- **Evidence:** `01-ocean-light-composed-rows-{e24df74,7a683fd}.png`.

**F2. Sorbet: a clipping parent L151 never lists cuts the all-round layer. SILENT.**
- **Where:**
  - `molecules/_accordion.scss:76-78`: `.sb-accordion::details-content { overflow-y: clip }` (inside `@supports (interpolate-size)`; Chromium matches it).
  - `molecules/_accordion.scss:64-65`: `.sb-accordion__body { padding: 0 space(4) space(4) }`. That is 0px of room at the top.
- **Expected:** L151, "a clipping parent … never [cuts] its all-round layer". Its table names only the six parents from proposal §7.
- **Actual, sorbet light, DPR 2, all-round layer alone, clipped vs released:**

| First child of the accordion body | Device px cut within the all-round reach | Up to |
|---|---|---|
| Card at rest | 13,243 (within 7px) | 44 levels |
| Filled button at rest | 1,622 (within 5px) | 51 levels |
| Filled button hovered | 2,776 (within 8px) | 63 levels |

- The cut is visibly flat. See `02-sorbet-light-accordion-card-halo-cut-top-vs-released-bottom.png` (top shot is clipped).
- **Other clipping parents L151 does not name:**
  - `.sb-layer`, `.sb-frame`, `.sb-modal__body`, `.sb-drawer__body`, `.sb-command__list`, `.sb-app-shell__sidebar`, `.sb-number-input`, `.sb-marquee--fade` (mask), `.u-truncate`.
  - Of these, only the accordion has under 8px of room in the library's own CSS.
- **Fix:**
  - Give the accordion body `padding-block-start: halo-room()`, or set `overflow-clip-margin: var(--sb-halo-room, 0px)` on `::details-content`.
  - Make L151 derive its parent list from the compiled CSS instead of the proposal.

**F3. Sorbet L152: a hover is measurably weaker than rest. SILENT.**
- **Expected:** L152, "never draws less edge than it does at rest".
- **Actual, L159 method, worst simulated view, DPR 2:**
  - **Quiet (outline) button on the page** (bg `#fef4dc`): rest **13.79**, hover **11.47**, press **11.47**. That is −2.32, and below the 11.7 bar. The hover/press fill `bg-subtle #f7ecd1` replaces `quiet-fill #fffbf1` (`.sb-button--outline:hover,:active`). Inside a card it holds: 12.25 at rest and hovered.
  - **`.sb-card--sunken.sb-card--interactive` hover inside a card:** rest 11.21, hover 10.26. The hover swaps the sunken edge for the container edge. On the page it rises: 8.89 → 9.49.
  - **Checkbox checked on the page:** 27.03 → 24.95. "Checked" is not in L152's list of states.
- **Comment:** `molecules/_card.scss:87-89` says "a theme with edge data keeps its container edge". That is false for the sunken variant.
- **Every other state is at or above rest.** For example, filled primary in a card: rest 14.46, hover 17.31, press 17.48, focus 39.21. Fields: rest 11.36, focus 39.21, invalid 30.38. Switch: rest 27.03, checked 27.03.
- **Why silent:** the L152 test (`test-contracts.ts:5014`) is a static check of the card's hover only.

**F4. Frozen transient: the today ring now transitions. SILENT.**
- **Where:**
  - `abstracts/_mixins.scss:217-223`: `color-transition` gained `box-shadow` in e6fd3d5.
  - Used by `.sb-calendar__day` (`molecules/_calendar.scss:138`) and six other selectors.
- **Expected:** pixel-identical (L4, L148).
- **Actual:** at motion no-preference, when a day stops being today (`data-today` removed):
  - e24df74: the ring vanishes in one frame.
  - 7a683fd: it fades over 120ms.
  - `getAnimations()`: `['box-shadow']` at 7a683fd, `[]` at e24df74.
  - 15ms in (ocean light): 124 px differ, up to 43 levels. Same in midnight dark.
  - See `03-…today-ring-15ms-*.png`.
- **The other affected selectors:** menu item, pagination, breadcrumb, footer links, alert dismiss, date-picker trigger. In frozen presets none of them ever changes box-shadow. Paused-frame computed values (891 element×state pairs at 30ms, ocean light and midnight dark) show 0 differences.
- **Why silent:** `playground-browser.ts` always runs `reducedMotion: "reduce"`, and `shots.ts` sets `transition: none!important`. No transition can ever be observed.
- **Fix:** take box-shadow out of `color-transition` and add it only where a box-shadow really changes. Or accept it and write it down.

**F5. L151's room ignores the hover lift; its table misstates the compact table. SILENT, small.**
- **Hover lift:**
  - Filled buttons translate `0 -1px`, so their reach is 8 + 1 = 9px.
  - The interactive card translates `0 -2px` (with `(hover: hover)` and motion allowed), so its reach is 7 + 2 = 9px.
  - The room is 8px.
- **Measured, all-round layer alone:**
  - Carousel, marquee and compact table: 294 device px of the hovered filled button cut, at most 3 levels.
  - Single-slide carousel, interactive card hovered: 1,908 px within 7px, at most 3 levels.
  - A card at rest in the carousel is no longer cut (0 px). M2 is fixed for the rest state.
- **Compact table:** L151's table says "cell padding of 12px or more". `.sb-table--compact` (`molecules/_table.scss:51-52`) has 8px block padding.
- **Comment:** `edges.ts` `haloRoom`, "so it never cuts the layer presence measures", overclaims.
- **Fix:** add `--lift` to the room, or remove the lift for elements inside clipping parents. Correct the table row.

**F6. `pnpm shots compare` against e24df74 cannot produce the frozen verdict. LOUD, not silent.**
- The playground's own text differs by commit, in every preset: "**700** checks across 5 presets × 2 modes" at e24df74 versus "**823** checks…" at 7a683fd (`apps/playground/src/contrast-checks.ts`, in the hero card and the marquee).
- So every frozen full-page shot, and any crop containing that text, differs. A baseline `--at e24df74` (L4's reference) always fails. A later baseline only proves "unchanged since that commit".
- **Related:** the header claim (`shots.ts:156-165`) that "fresh pages are byte-identical across sessions" does not hold everywhere. Fresh-page renders of one tree came out in two different ways: the overlay region (hashes 59bed52c and c13c3d5f in both trees), and the sticky sidebar badge under forced hover (new vs new: 96 px, 61 levels). This causes false "unstable" or "differ" results, never a false pass.
- **Fix:** add a mode that shoots one playground build with the base commit's CSS (what I did), or mask the counted text.

**Comment-versus-code mismatches** (item 6, beyond the ones noted above):
- `_mixins.scss:169-174`: "`$old` … keeps exactly". False under F1.
- `test-contracts.ts:4949`: the title says "element's old value"; the code reads the same selector only.
- `_mixins.scss:155-157`: "a registered property falls back to its initial value". That is true only when the registration has an initial value; a `syntax:"*"` registration without one still takes the `var()` fallback. The rule it supports (never register a local) still holds. Trivial.
- `_switch.scss:33`: "1px ring under the thumb's shadow". The ring is listed first, so it paints above `shadow(xs)`. The wording predates this commit. Trivial.

### Outside this lens (found by the same inputs)
- **Sorbet light inside a `.sb-layer--scrim`:** the scrim overrides `--sb-text*`, but the new seams bypass it.
  - `h3`, `.sb-label` and `.sb-text--subtle` paint `#472400` (heading-ink, text-strong, text-caption) on the dark scrim. That is about 1.1:1 over a mid-grey image.
  - Ocean is unaffected (`#f6f8fa`).
- **`.sb-card--raised` in sorbet light keeps `shadow(md)` with no border.** Its weakest point is 0.28 inside a card and 2.64 on the page. It is a variant, not a state, and no L70 row maps it.

### Clean, and how I showed it
- **Computed styles.** In all 268 frozen job pairs (10 contexts, up to 9 global states, all nested fixtures) the only differences are:
  - placeholder layers `0 0 #0000` (135,656);
  - `.sb-carousel__viewport` `scroll-padding: auto → 0px` (2,480);
  - F1's composed elements.
  - Padding, width and height are identical everywhere, so the padding L151 added to the carousel and marquee changes no frozen layout.
- **Scroll padding.** `auto` versus `0px` produced identical snap positions for 80+ scroll positions across 2 carousels, and identical `scrollIntoView` results per slide.
- **Placeholders do not change pixels.** Fresh-page hashes are identical between old and new in all 108 jobs: dpr2 for all 8 preset-modes; zoom2, font200, print, forced-colors and narrow for 2 preset-modes; rest and "all"; 3 anchors.
  - Every big-run pixel difference outside the composed fixture was re-shot in fresh pages (N=3). Each was either identical across commits or flipped between the same two renders within one commit (noise).
- **L149, static check on the compiled CSS:** all 10 fallback-less seam reads sit in a local declared in the same rule; all 9 reads of those locals have a fallback; no local is registered; no C2 shape remains.
- **L150:**
  - Setting `--state-layer` paints on 60 of 60 combinations (15 composing elements × rest/hover/press/focus) in ocean light and dark and sorbet light and dark. Soft, ghost and link are fixed.
  - No frozen token is `none`.
  - The `@property` registrations (`syntax:"*"`, no initial value) still take the `var()` fallback.
- **Sorbet dark:** halo room 0 and edges reset, so the only behaviour is the pre-existing one. There is no dark-mode L152 regression beyond pre-existing tiny raised-card hover numbers (0.79 → 0.39).

### Final git state
`git -C <wt> status --porcelain`: empty.

`git -C <wt> log --oneline -3`:
```
7a683fd fix(design-system): repair steps 2.3 and 2.4 after their audit
49d2cea docs: legibility spec L164, the selected segment is cream (DECISIONS row 32)
856606b docs: legibility spec L163, the e24df74 shadow-site fixture is the compiled check's 22
```
