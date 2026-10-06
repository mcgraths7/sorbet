## Audit lens: frozen presets at 6ef4b35 (step 2.5 = 7078b76 + 6ef4b35), against 9b83e50

Run 2026-10-05 in a cloud session, read-only, in its own `git archive` copies. `9b83e50` is not in the
pushed history (a pre-push hash); its stand-in is `ec97a20`, the parent of 7078b76. The stand-in is
faithful: the committed recorder run against `ec97a20`'s build writes `status-markup.at-9b83e50.json` byte
for byte. Chromium 141 (headless shell) on both sides of every comparison. Scripts and evidence images were
in the session scratchpad (`lens-frozen/new/audit/`, `lens-frozen/evidence/`); they are not committed.

**Hypothesis:** at 6ef4b35, outside the status slot (`.sb-status`, masked per L167), the four frozen
presets render and lay out exactly as at 9b83e50, in every state, mode and context.

**Verdict: fail.**
- **Masked, the claim holds.** Every element's computed style, the pixels, the values mid-transition, the
  three apps, and the markup over 427 combinations of props (composites included) all match. The only
  differences are the ones the spec allows:
  - empty placeholder shadow layers;
  - the status badge's dot replaced by its icon (L174);
  - the carousel's `scroll-padding`, `0px` → `auto` (L193 intends it: `auto` is e24df74's value).
- **F1:** the mask hides a layout change that L166 does not allow. Status badges and danger buttons rise
  2.4 to 3.4px off the text baseline, and lines and rows grow by 0.8px.
- **F2:** a consumer that uses only the stylesheet loses the glyph in a danger menu item. L185 says such a
  consumer "changes in nothing".
- **F3:** the L187 markup fixture lets five realistic markup regressions through. Its removal pattern
  removes more than the mask hides.
- **F4, F5:** two behaviour changes in frozen apps:
  - `Alert` and `ToastItem` now throw on a non-status `tone`;
  - the vanilla sortable table sorts status badges in a new order.
- **L4 holds:** the theme files and goldens are byte-identical, and `FROZEN_PRESETS` is unchanged.

### commands_run
- **Builds.**
  - `git archive 6ef4b35` and `git archive ec97a20`, each extracted into its own copy.
  - In each: `pnpm install --offline --frozen-lockfile && pnpm build && pnpm --filter playground build`;
    the admin and meal-kit builds too.
  - Plants went into a separate `cp -a` of the new copy.
- **L4.** `cmp` of every `dist/themes/*.css`, old against new and against `tools/golden/*.css`.
  `git diff --stat ec97a20 6ef4b35 -- tools/golden tools/check-golden.ts` is empty.
- **Fixture provenance.** `record-status-markup.mts` run against the ec97a20 copy, then `cmp` with the
  committed fixture: identical.
- **Compiled CSS.** A diff of `dist/css/sorbet.css`. Every declaration in the `where-defined` sublayers
  listed (`wd.mjs`). All 51 structural selectors listed (`sel-scan.mjs`).
- **`markup-matrix.mts`: `renderToStaticMarkup`, old build against new**, slots removed with L187's pattern.
  427 combinations:
  - Button: 9 variants × 17 sets of props.
  - Badge: 8 tones × solid × dot × 3 kinds of child.
  - Alert: 80. MenuItem: 16. Field: 216.
  - Composites: AlertDialog danger (open), DataTable with badge cells, Menu, Modal and Drawer footers,
    InputGroup, TokenStudio.
- **`fixture-run.mts`: a staged fixture page**, each tree's markup rendered by its own build.
  - **Sides:** old (old markup, old CSS); new; swap (new markup, old CSS); a second new as control. The
    mask is on every side.
  - **Content:** 13 forms of danger button; alerts in 5 tones, and composed with `.sb-card` and
    `.sb-button`; badges and a table of badges; an open danger menu; field errors; toasts; AlertDialog
    danger.
  - **Placements:** the page, a card, a scrim layer, a sunken card, an open modal.
  - **Measured:** every computed property (about 360) of every element outside a slot, the pseudo-elements,
    and a full-page pixel diff.
  - **Run 1:** base, RTL and dialog contexts × 5 forced states: rest, hover, active,
    focus + focus-visible + focus-within, and all together.
  - **Run 2:** DPR 2, 390px, forced-colors, print, font 200%, CSS zoom 2, coarse pointer, and motion
    allowed, each at rest and all states.
  - 4 presets × 2 modes: 248 jobs, 992 renders.
- **`transitions.mts`:** real hover in and out, press and focus, with motion allowed and every animation
  paused at 25%, 50% and 75%. 576 element-gestures × 8 properties, old against new.
- **`apps-run.mts`:** each app's old build against its new build, masked on both sides, with a second new
  render as control. 63 properties on every element, plus a full-page pixel diff.
  - Apps: admin (ocean), meal-kit (forest), and the playground in 4 presets × 2 modes.
  - Contexts: base (rest and all states), RTL, 390px, DPR 2. 56 jobs.
- **Smaller probes:**
  - `revert.mts` and `revert2.mts`: revert-layer through composed classes.
  - `inherit.mts`: locals a consumer sets on an ancestor.
  - `geometry.mts`, `baseline-shift.mts`, `table-rows.mts`: unmasked geometry.
  - `htmlapi.mts`: a hand-written danger menu item.
  - `badtone.mts`: a non-status tone.
  - `tablesort.mts`: the vanilla sortable table.

### Findings (silent ones first)

**F1. MAJOR, SILENT. The mask hides a change outside the slot: status badges and the danger button rise off
the text baseline, and lines grow.**

- **Where:** `atoms/_icon.scss`, `.sb-status`.
  - The slot is `display: inline-flex`, and its only child, the glyph, is `display: block` (the reset's
    `svg { display: block }`).
  - The slot is the first flex item of `.sb-badge` and `.sb-button`. So their baseline is now made from the
    slot's bottom edge, not from the label's text.
- **Expected:**
  - L166: "the icon is drawn and takes room. A status badge is wider by the icon and its gap…"
  - L167: "nothing else of the named components moves."
- **Actual,** unmasked, old → new. Identical in all 4 frozen presets × 2 modes, to 0.01px.

  | Case | Label against the text beside it | Line or row height |
  |---|---|---|
  | Badge in a 14px paragraph (4 tones) | 0.00 → −3.39 | 21.59 → 22.39 |
  | The same at 200% font size | +3.00 → −2.78 | unchanged |
  | The same at DPR 2 | −1.00 → −4.39 | 21.00 → 23.39 |
  | Danger button in a paragraph | −1.00 → −4.19 (−7.39 at 200%) | unchanged |
  | Badge in an `h3` | −4.00 → −7.39 | unchanged |
  | Badge in a cluster aligned on its baseline | −1.00 → −4.39 | unchanged |
  | Field error paragraph | the label moves 0.69 within its box | 15.59 → 16.28 |
  | Playground table demo (ocean, noir) | −0.30 → −2.69 | row 46.59 → 47.39; table 295.38 → 298.56 |
  | Admin orders table | −0.30 → −2.70 | unchanged |

  - With the mask on, every value returns exactly to the old one.
  - Rows that centre their items are unaffected.
- **Fix, the owner's call** (L190 (a) pins `inline-flex`): give the slot a text baseline, or allow the shift
  in L166.
- **Check:** an unmasked geometry test. In each frozen preset and mode, place a badge of each tone and a
  danger button beside text in a paragraph, an `h3` and a table cell. Their offset from the text and the line
  height must equal 9b83e50's.

**F2. MAJOR, SILENT. A danger menu item written in plain HTML loses its glyph, against L185.**

- **Where:** `molecules/_menu.scss:59-62`, `.sb-menu__item[data-danger] > svg, > .sb-icon { display: none }`.
- **Expected:**
  - L185: a consumer that vendors only the stylesheet "changes in nothing".
  - `data-danger` is part of the documented HTML API (`demo/index.html:409`).
- **Actual,** for `<button class="sb-menu__item" data-danger><svg/>Delete project</button>`, and the same with
  an `.sb-icon` child, in all 4 presets × 2 modes:
  - the glyph goes from `display: block` (14px wide) to `display: none`;
  - the label moves from x = 59 to x = 37, out of the column the "Rename" item keeps;
  - 1,410 to 1,507px differ per menu, by up to 211 levels;
  - there is no slot here, so the mask cannot hide it.
- **Fix:** hide the consumer's glyph only when the octagon is there:
  `.sb-menu__item[data-danger]:has(> .sb-status) > svg` and `… > .sb-icon`.

**F3. MINOR, SILENT. The L187 fixture lets five markup plants through, and its removal pattern is wider than
the mask.**

- **Where:** `component-library/tools/test-status.ts:482`; the 39 cases of `status-markup.at-9b83e50.json`.
- **Actual:** each plant below changed markup outside the slot, and `test:status` still passed all 122 checks.
  A control plant (an attribute added to the Alert root) was caught.

  | Plant | Change | Why the test misses it |
  |---|---|---|
  | P1 | `field.tsx:50`: the `aria-describedby` order swapped | no case has both `hint` and `error` |
  | P2 | `alert.tsx:36`: `dismissLabel` ignored | A4 uses the default label |
  | P3 | `badge.tsx`: an extra `<span class="sb-status-pad"><svg/></span>` | `<span class="sb-status[^"]*">` matches any class that starts with `sb-status` and removes it. The mask `.sb-status{display:none!important}` matches the whole class only, so this span is visible in every masked shot and invisible to the fixture |
  | P4 | `button.tsx`: a danger button drops `sb-button--pill` | no case combines danger and pill |
  | P5 | `menu.tsx`: a disabled danger item gains a span | no disabled case |

- **Fix:** an exact removal pattern, and cases widened toward the matrix (ec97a20 reproduces 9b83e50's
  fixture byte for byte, so it can record them).

**F4. MINOR, SILENT. `Alert` and `ToastItem` throw on a non-status `tone`; the old build rendered.**

- **Where:** `StatusMark` (`atoms/icons.tsx`). `STATUS_GLYPHS[tone]` is undefined, so React throws "Element
  type is invalid".
  - It is called with no guard from `molecules/alert.tsx:27` and `molecules/toast.tsx:72`.
  - `Badge` guards with `isStatus`.
- **Actual:**
  - `tone="primary"`, `"neutral"` and `"error"` rendered `sb-alert--primary` and so on at the old build. All
    six cases throw at the new one.
  - A JavaScript or loosely typed caller, such as `toast(msg, { tone: apiValue })`, unmounts its React tree.
  - TypeScript callers cannot reach this, because `Tone` is closed.

**F5. MINOR, SILENT. The hidden word changes `textContent`, so the vanilla sortable table sorts React status
badges differently.**

- **Where:** `behaviors/table-sort.ts:42` sorts by the cell's `textContent`.
- **Actual:** a `<Table data-sb="sortable">` with `<Badge tone>` cells, sorted ascending:
  - old: `["9","12","Delivered","Failed","Out for delivery","Packing"]`;
  - new: `["Error: 12","Error: 9","Error: Failed","Information: Out for delivery","Success: Delivered","Warning: Packing"]`.
- **Fix:** sort on text that skips `.u-visually-hidden`.

**F6. NIT.** `abstracts/_tokens.scss:159-164`: the old doc comment of `halo-room()` was left above the new one.

### Clean
- **L4:** the five theme files are byte-identical old against new, and each equals its golden. `FROZEN_PRESETS`
  (`check-golden.ts:91`) is still ocean, forest, noir and midnight.
- **Markup:** 427 combinations give 403 identical, 24 changed as the spec allows, and 0 other.
- **Fixture page, masked:** 248 jobs × 4 renders.
  - Old against new: 0 differences beyond the placeholder layers and the new locals.
  - Swap against new: 0. Control: 0.
  - Pixels: 0 in 246 jobs. The other two (noir and midnight dark, forced-colors, rest) differ by 6px at
    1 level, and the same-tree control differs in the same 6px.
- **revert-layer:**
  - an alert also classed `.sb-button` keeps the button's shadow, in its warning form and in its danger form;
  - an alert also classed `.sb-card` keeps the card's shadow;
  - a plain alert computes `none`;
  - locals a consumer sets on an ancestor do not leak in: 208 of 208 box-shadows identical.
- **Transitions:** 576 gestures × 3 instants × 8 properties: 0 differences.
- **Colours:** the re-pointed `.sb-icon--X` colours, the toast stripe and the slot's ink all compute their old
  values.
- **Selectors:** no structural selector has a status component's child as its subject, but the `> svg` rules
  (F2).
- **Whole apps:** only the dots and `scroll-padding` differ, as allowed.
  - Pixels are 0, apart from an admin chart region that differs by as much in the same-tree control.
- **`shots.ts`:**
  - `MASK` is exactly `.sb-status{display:none!important}`.
  - `fresh()` writes it on both sides of every shot.
  - `baseline.json` records it, and `maskRefusal` exits 1 on a missing or different mask.
  - The success line has the masked wording.
  - No other element carries `sb-status`.
