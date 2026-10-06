## Audit lens: the status components at 6ef4b35 (step 2.5 = 7078b76 + 6ef4b35)

Run 2026-10-05 in a cloud session. The lens was read-only and worked in its own `git archive` copy. The probe
page, scripts, plant runners and evidence (20 look sheets, accessibility-tree dumps) were in the session
scratchpad (`lens-status/`); they are not committed. Chromium 141 (headless shell).

**Hypothesis:** at 6ef4b35 every status renders its icon and its word exactly as §12.5 says (L166 to L191),
everywhere a consumer can reach it, and what a reader meets is L180's table.

**Verdict: fail.**
- **The React components pass.** Every case tried rendered and read as L166 to L191 say: all five presets,
  both modes, both directions, through the real toast provider, at 390px, and in the accessibility tree.
- **One public path renders a toned toast with no icon and no word** (F1): the vanilla `toast()` in
  `@sorbet/design-system/behaviors`, which every `sorbet create` starter page calls.
- **Five holes in the guards** (F2, F3, F4, F8): in each, a plant keeps `test:status` or the compiled-CSS
  checks green while the page is wrong.
- **Two apps read out false words** (F5): `apps/admin` and `apps/meal-kit` use status tones for categories.
- **The rest:** the process (F6), documentation (F7), and a flaky test that predates step 2.5 (F9).

### commands_run
- `git archive 6ef4b35`, then `pnpm install --offline --frozen-lockfile && pnpm build`, then `pnpm test`.
  Then `pnpm --filter playground build`, and `vite build` for admin and meal-kit.
- **A probe page** in the playground, which renders the real built library and takes
  `?preset&mode&dir&scene`. It exposes the real `ToastProvider`'s `toast`.
- **Probes:**
  - **overflow:** 5 presets × 2 modes × 2 directions × 22 scenes, then the same again with
    `position: static` injected;
  - **accessibility tree:** 5 configurations;
  - **also:** the separating space, the toast, the toast in the accessibility tree, the glyph, mirroring,
    gaps, composites, the vanilla toast, the apps, the playground, and the cross's fill.
- **Plants:**
  - 41 component plants, each built and then run with `node tools/test-status.ts`;
  - 25 Sass plants, each run with `node tools/test-contracts.ts`;
  - plants checked in the browser;
  - plants of the stale build and of a missing build.
- `node tools/measure-edges.ts --preset sorbet --mode light --no-build`.
- `node tools/test-contracts.ts` six times each at 6ef4b35 and at ec97a20.

### Findings

**F1. MAJOR, SILENT, a defect of the spec: the vanilla `toast()` shows a toned toast with no icon and no
word.**
- **Where:**
  - `packages/design-system/src/behaviors/toast.ts:29-51`, exported as `@sorbet/design-system/behaviors`;
  - it is called by `packages/cli/src/templates.ts:80-82` (the starter page of every `sorbet create`
    project, with `tone: "success"`) and by `demo/index.html:527-533`.
- **Expected:**
  - L168's toast row and L166 ("every theme").
  - L188 assumes that consumers reach a toast only through `toast()` and `ToastProvider`.
  - L184 exempts only markup that a consumer writes by hand; this markup is written by the library.
- **Actual:** `<div class="sb-toast sb-toast--danger"><div><p class="sb-toast__title">Error</p><p class="sb-toast__body">Deploy failed.</p></div><button … aria-label="Dismiss notification">×</button></div>`.
  It has no slot, no icon and no word. L183 #49 still freezes `behaviors/`, and no test renders this toast.
- **Fix (needs a ruling):**
  - (a) Step 2.5 covers `behaviors/toast.ts` too. With a tone, the toast's first child is the slot, and
    `toast()` takes a `statusLabel`. The glyphs and words come from one source, or a test pins the two
    copies equal. #49 leaves the file out of its comparison.
  - (b) L184 rules the vanilla toast out.

**F2. MINOR, SILENT: L188's textual checks are satisfied by a comment, and its clause "no other `sb-toast`"
is not asserted.**
- **Where:** `test-status.ts:349-377`, `:403-405`.
- **Plant 1:** the provider renders its old inline markup, with the text `<ToastItem … tone={t.tone}
  statusLabel={t.statusLabel} …/>` left in a JSX comment.
  - `test:status` passes all 122 checks.
  - Through the real provider, all 10 toasts in each of 4 configurations have no slot, icon or word.
- **Plant 2:** the stored record writes `statusLabel: undefined`. The test passes, and "Fehler" is read as
  "Error: ".
- **Fix:** strip comments before the checks; assert that no `sb-toast` class appears outside `ToastItem`;
  require `statusLabel` as a shorthand property in the record.

**F3. MINOR, SILENT: no case holds S39 for a danger alert.**
- A2, the only danger alert, passes `role="alert"` itself.
- Plant: `role={tone === "danger" ? "alert" : "status"}` passes all 122 checks.
- **Fix:** a presence-only case of a danger alert with no `role`, which must render `role="status"`.

**F4. MINOR, SILENT: L190 (a) and (d) look only at selectors that name `.sb-status` or `.sb-status-icon`.**

| Plant | The step-2.5 checks | Rendered (390px viewport) |
|---|---|---|
| `.sb-badge > .sb-status { position: static }` | green | L186's probe page is 625px wide |
| `.sb-alert__icon { position: static }` | green | a danger alert in `.sb-table-wrap` makes the page 633px wide |
| `.sb-alert__icon { color: clr(primary) }` | green | sorbet's icon turns `#dac5fc`; ocean's `#0f70d5`, beside `#cb2c31` text |
| `.sb-toast__icon { color: … }` | green | not rendered |

- **Fix:** widen (a) and (d) to every rule whose subject can be the slot or its glyph:
  - `.sb-status` and `.sb-status-icon`;
  - the box classes `.sb-alert__icon` and `.sb-toast__icon`;
  - any selector ending `> .sb-status` or ` .sb-status`.

**F5. MINOR, SILENT, the owner's call: status words on categorical badges.**
- **meal-kit** (`menu.tsx:16-60, 132`, `hero.tsx:21`, `social.tsx:133`) reads "Warning: Spicy", "Warning: 15
  min", "Information: Under 500 cal" and "Success: Veggie".
- **admin** (`App.tsx:87, 90`, `orders.tsx:68, 126`, `kitchen.tsx:86`) reads:
  - "Warning: Packing";
  - "Information: Out for delivery";
  - the nav links "Orders Information: 7" and "Kitchen Warning: 2";
  - "Error: 84" on a stock count.
- Each also shows the matching shape, such as an exclamation mark beside "Spicy".
- **Options:**
  - (A) the apps use brand tones, or none, for categories and counts;
  - (B) accept.
  - An opt-out on `Badge` would contradict L168, so none is offered.

**F6. MINOR, process: acceptance #8 is not quoted in 7078b76.** The table below is the review.

**F7. MINOR, SILENT: the HTML examples show statuses with no slot.**
- `README.md:570-584`: its field error has no slot. It also says "The React `Field` produces the same markup",
  which is no longer true.
- `demo/index.html`: lines 77, 146, 171, 176, 243-246, 325-336, 409, 427-430 and 466.

**F8. NIT, SILENT: nothing checks that the symbol is knocked out.**
- **Plant:** the cross as two overlapping rectangles. It passes all 122 checks, and `isPointInFill(12,12)` is
  true: the centre fills in again.
- **At HEAD:** `isPointInFill(12,12)` is false, and no sample differs from L169's geometry: 0 mismatches in
  56,994, 57,212, 57,020 and 57,284 points (success, warning, danger, info).

**F9. MINOR, loud and flaky, from before step 2.5: `test:contracts` "2.1 #9 … sorbet as main ships it".**
- 2 of 6 clean runs fail at 6ef4b35, and 4 of 6 at ec97a20.
- The failing surface varies: `check-contrast.ts`, `build-tokens.ts`, or the scaffold's copies.
- The report comes back missing rows.
- CI's `build` check goes red at random.

### Acceptance #8: Chromium's accessibility tree, against L180

**Configurations:** observed in sorbet light, left to right. Identical in sorbet light RTL, sorbet dark LTR,
ocean light LTR and noir dark RTL.

**The glyphs and slots:** none of the 44 glyph nodes or 40 slots appears in the tree.

**The toasts** were raised through the real provider.

| L180 row | Role | Accessible name | Read text, in order | Result |
|---|---|---|---|---|
| Alert, each tone, and the default (info) | `status`, live polite | "" | the word ("Success:", "Warning:", "Error:", "Information:"), the title, the body, then button "Dismiss" | pass |
| Alert, danger, with the consumer's `role="alert"` | `alert`, assertive (kept, not derived) | "" | "Error:", "Payment failed", "We could not charge your card." | pass |
| Toast with a tone | the toast is ignored; the region is `region` "Notifications", polite | — | "Success:", "Sticky", "I stay until dismissed.", then button "Dismiss notification" | pass |
| Toast without a tone | as above | — | "All changes saved.", then button "Dismiss notification" | pass |
| Toast, `statusLabel: " Fehler "` | as above | — | "Fehler:", "x", then the button | pass |
| Badge, status tone, soft, solid or with `dot` (4 tones each) | none (an ignored span) | none | the word, then the children; no dot | pass |
| Danger badge inside a link | `link` | "Error: Overdue" | "Error:", "Overdue" | pass |
| Danger badge inside a button | `button` | "Error: Overdue" | "Error:", "Overdue" | pass |
| Badge, brand tone or none | none | unchanged | "New", "Draft", "Neutral" | pass |
| Danger button, sm, md, lg | `button` | "Delete", "Delete account", "Delete" | the label | pass |
| Danger button, `as="a"` | `link` | "Delete" | "Delete" | pass |
| Danger button, `iconOnly` | `button` | "Delete" (its `aria-label`) | — | pass |
| The alert dialog's danger confirm | `button` | "Delete" | "Delete" | pass |
| Danger menu item | `button` | "Delete project Del" (unchanged) | "Delete project", "Del" | pass |
| Danger menu item with a consumer glyph | `button` | "Delete with glyph" (the glyph computes `display: none`) | "Delete with glyph" | pass |
| Field with an error, invalid | `textbox` | "Rice" | description "Error: That is more rice than the pantry holds." | pass |
| Field with an error, invalid, `statusLabel: " Fehler "` | `textbox` | "Reis" | description "Fehler: Zu viel Reis." | pass |
| `statusLabel` "Fehler", " Fehler ", "" and "  " | — | — | "Fehler:", "Fehler:", "Error:", "Error:" | pass |

**The separating space:** the tree cannot show it, because Chromium inserts a separator of its own. With the
space deleted from the word, the names still read "Error: Overdue". The presence test holds the space:
deleting it turns 32 cases red.

### Acceptance #5: the status boxes, re-measured (light, weakest point at the worst simulation)

| Status box on a card | Figure | Bar |
|---|---|---|
| success | 10.8 | 9.9 |
| warning | 12.2 | 9.9 |
| info | 11.8 | 9.9 |
| danger | 30.4 | 9.9 |

### Clean
- **Plants that the presence test caught:** 36 of 38 turned their case red; F3 and F8 are the other two.
  - Each component's icon, word and slot.
  - Button `as="a"`, `sm`, loading and `iconOnly`.
  - The separating space, the trimming, and the word placed before the icon.
  - "Danger" written for "Error", and "Info" for "Information".
  - A lost `aria-hidden`; a swapped glyph map; a `stroke`; `nonzero` for the fill rule.
  - The barrel exporting `StatusMark`.
- **The L189 build gate:**
  - A stale or a missing build prints L189's line exactly and exits 1, and so does the root
    `pnpm run test:status`.
  - With two stale files, the first in sorted order is the one named.
- **Toasts through the provider:** 10 toasts × 4 configurations.
  - Each tone gives a 20 × 20 `sb-status sb-toast__icon` slot first, with the right icon and word.
  - With no tone there is no slot. " Fehler " gives "Fehler: ", and "" or "  " give "Error: ".
- **Overflow:** 440 of 440 builds keep `scrollWidth == innerWidth == 390`.
  - In `.sb-table-wrap`, in a card with `overflow: auto`, and in a tabs panel.
  - With `position: static` injected, all 80 probes overflow (581 to 1915px), so the slot's position is
    what holds the width.
- **RTL:**
  - Every slot is on the start side, and every gap matches the left-to-right one.
  - The toast's stripe moves to the right.
  - No glyph mirrors.
- **The glyphs:**
  - Each is one `svg` with one even-odd path in `currentColor`.
  - There is no stroke, style, id, `url()` or colour literal.
  - Sizes: 13.19px in a badge or a field error; 13.19, 15.39 and 17.59px in the buttons; 14px in the menu;
    a 20 × 20 slot in an alert or a toast.
- **The ink:**
  - In sorbet light, every slot that is not on a fill is `#472400`. On a fill it inherits, and under
    `loading` it turns transparent.
  - In the frozen presets, and in sorbet dark before 2.6, the slot takes its component's own text colour.
- **Compiled CSS:** 21 of 25 Sass plants turned the matching L190 row, C10 or C11 red; the other four are F4.
