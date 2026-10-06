# Spec: the `legibility` contract and sorbet's new values (PR 2, step 2.0)

Revision 3.7, 2026-10-06. Written against `main` at `e24df74` (the groundwork is
merged). Steps 2.1 to 2.5 are built and audited (§12.2, §12.4, L194); nothing after them exists yet. Step 2.6 is
settled in full, after its spec adversary and the owner's answers (§12.6, L195). Paths are relative to
`packages/design-system/` unless they start with `packages/`, `apps/`, `docs/`
or `<root>/`. So `tools/test-contracts.ts` is
`packages/design-system/tools/test-contracts.ts`, and the repo root's own
`tools/` folder is always written `<root>/tools/` (the convention of
`contract-mechanism-spec.md`).

### Revision 2

Revision 1 was attacked by a spec adversary
(`legibility-spec-adversary.txt` in the session scratchpad: 2 critical, 5
major, 19 minor, one noted), and building sample sheet 3 with the library's
real compiled Sass found six more (S3-1 to S3-6). The owner answered sheet 3 on
2026-10-04 (DECISIONS rows 25 to 27). Every finding is closed below or rejected
with its evidence. Statement numbers are stable: new statements are L105
onward, and nothing was renumbered. Rule numbers are stable too: six rules are
withdrawn (their numbers are kept and marked) and four are appended as R280 to
R283. Revision 2's measurements are made by `rev2/rev2.ts` (appendix C).

| Id | Closed where, and how |
|---|---|
| C1 | The new field is `Preset.buttonLabel`; the existing `Preset.label` (the display name) is untouched. L5, L19, L22, L56, L65, L70, C9 (L79), step 2.1 #7, step 2.2, S25 rewritten |
| C2 | L106 maps every edge element's fill to the Sass line that paints it; check C11 (L79) holds the stylesheet to it. The outline button paints `transparent`, so its fill becomes a new optional token `quiet-fill` painted at `atoms/_button.scss:144` in step 2.4 (sheet 2 drew the quiet button on a milk / raised fill); a fill may also be `"backdrop"` (L107). No floor moves under the recommended option; the other option is §14.1 item 1 |
| M1 | L10 now points at L105, the complete list: 41 entries (26 in `tools/test-contracts.ts`, 14 in `tools/test-contrast.ts`, 1 in `tools/test-golden.ts`), each with file:line, step, new expectation and the sentence that requires it. Every test file under `tools/` and `<root>/tools/` was read; `<root>/tools/check-cli.ts`, `check-catalog.ts`, `check-consumable.ts`, the stylelint rule and `tools/check-golden-base.ts` hold no assertion this spec makes false |
| M2 | Closed by the owner, not by choice: DECISIONS row 27 passed sheet 3's item 12, the six † pairings, and rows 25 and 26 passed the chart and hover items. Each † floor in L61 cites row 27. The one † floor revision 2 creates (edge-filled, light) is provisional, §14.1 item 2 |
| M3 | L111: 12px text on fills, washes and the ink (solid badges, soft badges, the tooltip) is named as not size-checked and left to the eye with its numbers (row 27). C9, L65 and L66 now say they speak for the button only; §18 G20 corrected |
| M4 | `filled-success`, `filled-warning`, `filled-info` and their six rules (R268 to R271, R274, R275) are withdrawn: the library has no button in those fills. Edge-filled's light floor moves 15.7 → **17.7**, pinned to R265 (the blush button on the bare page, 18.73), which no sheet drew: provisional, §14.1 item 2 |
| M5 | L55 now names every property reset: each optional token and each edge property (`--sb-edge-X`, `-hover`, `-press`) the light block emits and the dark block does not. 41 lines for the new sorbet in steps 2.2 to 2.5 |
| m1 | Path convention in this header; L25 and every repo-root path now written `<root>/tools/` |
| m2 | §17 item 8 now says 13 edge elements (16 in revision 1, of which 3 withdrawn by M4) |
| m3 | Step 2.1 #2 now says 191 rule measurements against appendix A and the two scrim measurements 5.5562 and 4.6844 (typical) to 1e-4 |
| m4 | Step 2.1 #7 breaks C2 by setting `text-muted` to `text`'s hex, which fails in both modes |
| m5 | "A fallback followed twice" removed from the planted list (no seam's fallback is a seam, so it cannot turn a test red); replaced by "a css fallback read as a colour", which acceptance #5 now plants |
| m6 | L59 and S3 now give the measured maxima, 0.593 Lc and 0.409 separation for one 8-bit step, and say the 0.5 minimum margin is about 1.2 such steps |
| m7 | L48, L51, §13 and S23 no longer call presence an upper bound: it is a heuristic; sheet 2's rendered figures sit clearly above it in at least five places and at or below it in most others |
| m8 | L80 rewritten with the true reasons (measured); L114 says what C2 and C3 do with a name that has no value: it fails, as L39 does |
| m9 | L59's last sentence now says a whole-step drift fails at the weakest member only, and names what catches the rest (sorbet's golden) |
| m10 | R280 to R283 hold the four status marks on `surface-raised`, which the toast paints them on |
| m11 | Partly rejected with evidence: fifteen `focus-ring(…)` calls in the Sass draw the ring at offset 0 or less, and two of them (`molecules/_calendar.scss:106`, `_pagination.scss:29`; revision 2 wrote `:48`, corrected in revision 3) put it against a lilac fill, so R210 is a pair that is painted, and it pins the light floor (R216 has the same hexes; revision 2 overclaimed it as painted). Appendix A's "for" column for R210 and R216, and L68, now say where; R211 to R215 are kept as the ring against the fill it surrounds |
| m12 | L109 states that the minified spelling of a see-through value moves a blended measurement (11.08 → 11.21; 12.62 → 12.86) and what Token Studio and the test do about it |
| m13 | L72's rule now classes a site by its computed font size in the rendered playground, which needs no judgement |
| m14 | L70 maps the switch thumb's ring and the slider track's ring to `switch-ring`; the library's lilac slider thumb, and the selected wash in a dark menu (6.38), are listed in §13 |
| m15 | L48's prose now says a layer is blended over one thing only, never over the element's other layers |
| m16 | L90: structure failures are counted on their own line, never in "✗ N contrast failure(s)"; step 2.1 #8 now says 24 rules (22 edge rules plus R224 and R227) |
| m17 | L69's last paragraph rewritten: the check holds a butter button on the bare page to a floor, which is not A14's convention; A14's robin's-egg convention is not a check, because the library has no robin's-egg button |
| m18 | L68's label row now says R168 and R169 are fills no Sass paints today, kept because `wcag-aa` holds the same pairs |
| m19 | Kept on purpose and listed: §17 item 17 records that a rule naming a colour that is no role, optional token or edge is now a `TypeError` where PR 1 returned `actual: null`. No PR-1 test plants such a rule (checked) |
| Noted | L78 now compares like with like: today's ring is 39.46 at its worst view, the new ring 24.31 |
| S3-1 | L110: the scrim tier holds the full-strength scrim; the default `sb-layer--scrim` gradient reaches it only at its bottom edge. Recorded as an existing defect of all five presets, deferred with the others; §13 row with the numbers |
| S3-2 | Joined to M3: L111 |
| S3-3 | L112: disabled controls are left to the eye with sheet 3's eleven figures (the three in the finding among them), citing row 27, and the rule stated: no floor, as WCAG exempts inactive components; no floor is pinned to them on the owner's answer |
| S3-4 | Recorded in the hover decision (§14.0, row 26): a hovered light table row is the header's and the striped row's hex |
| S3-5 | §15 item 6 corrected: the chart's axis is `border`; only the hover crosshair is `border-strong` |
| S3-6 | L113: the 1px `border-subtle` line `popover-surface` and the toast draw goes, through `container-line` (sorbet: transparent), as on sheet 2's floating menu |

### Revision 3

Revision 2 was verified the same day
(`legibility-spec-rev2-verify.txt` in the session scratchpad; its probes in
`spec2-verify/`). Every number reproduced (382 appendix-A cells, 44 appendix-B
rows, all 40 floors); 32 of revision 2's 34 ids were closed, two were partly
closed, and it raised N1a to N15. The owner answered revision 2's questions
and one more (DECISIONS rows 28 to 31). Statement and rule numbers are
unchanged; new statements are L115 and L116. Revision 3's measurements are
`rev2/rev3.ts` (appendix C).

| Id | Closed where, and how |
|---|---|
| M1 (partly) | L105 now has 46 numbered entries, #43 to #47 added for N1a to N1e, and its citation errors are corrected (N10). Counted by file: 28 in `tools/test-contracts.ts`, 17 in `tools/test-contrast.ts`, 1 in `tools/test-golden.ts` |
| M3 (partly) | The small button (N2) is specified by L19, C9, C10 and L115; the neutral badge (N12) is in L111 |
| N1a | L105 #43, step 2.1: `tools/test-contracts.ts:1213-1223`, `MAY_CALL` gains `src/tokens/rules.ts` and `src/tokens/edges.ts` |
| N1b | L105 #46, step 2.2 (and again in 2.6): `tools/test-contracts.ts:1326-1328` throws only for preset-modes that declare `wcag-aa` |
| N1c | L105 #44, step 2.1: `tools/test-contrast.ts:514`'s literal gains `metric: "ratio"`, `view: "typical"` |
| N1d | L105 #45, step 2.1: `tools/test-contrast.ts:661-665`'s failures gain `tier`, `metric`, `view` |
| N1e | L105 #47, step 2.6 (may go with #33 in 2.2): the impossible-alpha `scrim` tamper at `tools/test-contrast.ts:215` moves from sorbet dark to forest dark, so C1's structure line never reaches `printedModes` |
| N2 | Answered by DECISIONS row 31 and specified: `buttonLabel.smallPx` (14), token `--sb-button-font-size-sm`, accessor `button-label(sm)` at `atoms/_button.scss:193` in step 2.4 (12px fallback for the frozen four), C9 and C10 over both sizes. L115: the 14px label is held by the `label` tier's 68.9 for its colours (71.32 / 70.92 / 82.57) and by no size-specific floor |
| N3 | Closed by the owner: DECISIONS row 29 passed the blush, danger, lilac and butter buttons on the page, so the `edge-filled` light floor 17.7 is approved and no floor is provisional (L61, §14.0); step 2.1's "waits on" is removed |
| N4 | S17 now says 24 named failures |
| N5 | L69 marks R263 (lilac on the page) † as well; all three passed by row 29 |
| N6 | L112 split into a faded control (no floor) and a disabled field (unfaded; R176, held by `placeholder`) |
| N7 | Moot: DECISIONS row 28 chose option (a). L107 and §14.0 say so |
| N8 | C11 now reads the compiled CSS, selector by selector, so the two loop-written lines are checkable |
| N9 | Settled by DECISIONS row 30: the touching placement of R210 was passed; L68, §14.0, §15 item 17 and S4 cite it |
| N10 | `colorsOf` cited at `:168`; #5 now names `:466` only (`:468` stays true); #20 defines `k` = 261 − (measured + unmeasurable); #11's margin is derived from appendix A (×1.02 both modes); #21's README phrases are "245 apply in both modes" and "32 mode-restricted chart entries"; L96's `:1011` sits inside #40 and is kept as a pointer |
| N11 | L68 and the revision-2 table now cite `_calendar.scss:106`; R216 is said to share R210's hexes, not to be painted |
| N12 | L111 gains the neutral badge (12px `text-muted` on `bg-subtle`, R136, 71.60 / 73.10), passed on sheet 3 (row 27) |
| N13 | Rejected as a gate defect, with evidence (L116): the rim is painted from `danger-mark`, so leaving it out of the recipe understates presence (light 18.73 → 28.48 with it), never overstates it. The rim against its own fill, 18.36, is listed in §13 |
| N14 | Step 2.5's files add `README.md`'s Component catalog; step 2.1's add the tracked `src/styles/abstracts/_generated.scss` |
| N15 | L58's `shape` row: `secondary-solid` and `accent-solid` on `bg` are held by nothing, on purpose, because sorbet stops painting them (they were the buttons' border and falloff); their hexes are held as marks (R185, R186) |
| m7 (note) | L48 now separates the three clear cases from the two inside the file's rounding |
| Row 28 | §14.0: the quiet button is the milk slab; §14.1 item 1 closed; §15 item 16 answered |
| Row 29 | §14.0, L61, L69: the filled buttons on the page pass; §15 item 15 answered |
| Row 30 | §14.0, L68: the touching focus ring passes; §15 item 17 answered |
| Row 31 | §14.0, L19, C9, C10, L115 |

### Revision 3.1

A re-verification of revision 3 raised N16 to N23. Statement and rule numbers
are unchanged, and no statement was added. Script: `rev2/c11.mjs` (appendix C).

| Id | Closed where, and how |
|---|---|
| N16 | L105 #47 is one well-formed table row; the note on #39 that ran on from it is its own paragraph |
| N17 | C11 states one reading: among rules whose selector list contains the selector as a whole item, outside conditional at-rules, the last `background-color` or `background` in source order (source order is cascade order, layer blocks being in declared order, which the test asserts). It names all 27 selectors, derives the floating and field lists from the compiled CSS, and was checked against the real `dist/css/sorbet.css`: it holds for all 27 |
| N18 | L65 and L115 say only what row 31 records: the question stated "Labels on lilac and blush read Lc 70.9", the figure does not depend on size (71.32, 70.92), and no sheet drew a 14px label |
| N19 | L66's `label` reason and retirement, and S25's reason, cover both sizes: 16px approved by eye, 14px decided on the figure (row 31) |
| N20 | L111's title is "12px text off cream and milk", it counts four, and §13's row lists all four |
| N21 | `pre` is taken out of L106's sunken map: it is not a sunken element (no L70 row, no sheet drew it), so C11 and L106 agree |
| N22 | L105 #24 cites `tools/test-contracts.ts:168` |
| N23 | L105 #43 says where an oracle may live (`tools/test-contracts.ts`, or a file added to `MAY_CALL` in the same edit), that step 2.1 needs none for the four instruments, and that its functions must not share their names |

This is what step 2.0 of `docs/pastel-legibility-contract.md` ("the proposal")
says it delivers. It replaces the proposal's §5, which is marked "not
implementable as written". Where the two disagree, this document is the one to
build and test from, and §17 lists each disagreement with its reason.

**Where things stand**

- Everything a test needs is here: every value as hex, every rule, every floor,
  and the number each rule measures today (appendix A).
- The owner answered sheet 3 on 2026-10-04 (DECISIONS rows 25 to 27): the
  chart baseline and the hover fill are decided, and all fourteen sheet-3 items
  passed as drawn, so every floor revision 1 pinned to an undrawn pairing
  stands as approved.
- The owner answered revision 2's questions the same day (rows 28 to 31): the
  quiet button is the milk slab, the filled buttons on the page pass (so no
  floor is provisional), the focus ring touching a lilac fill passes, and
  sorbet's small button label is 14px. Nothing waits on the owner (§14.1).
- Revision 1 was attacked by a spec adversary before any test was written
  (proposal §8, step 2.0); revision 2 closes its findings, and revision 3
  closes the verification of revision 2 (the tables above).
- Step 2.5's text was attacked the same way on 2026-10-05, and the owner
  answered its four questions that day (DECISIONS rows 36 to 39): the status
  icon and word appear in every theme, the icon is a filled shape in the dark
  ink with its symbol knocked out, the word is hidden for screen readers, and
  the field's error message takes the octagon. §12.5 settles the step.

## 0. How to read this

- **Numbering.** Every statement a test can cite is numbered `L1`, `L2`, … in
  order. A table that follows a numbered statement is part of it; cite a row by
  its role name or its rule number (`R087` … `R283`, appendix A; six numbers
  are withdrawn in revision 2 and kept, marked).
- **Who reads what.** A test author reads §2 to §11 and the appendices and
  never the implementation. An implementer builds from the same sections and
  may not change an expected value (the lab's write-tests-first lane).
- **Every number was measured, not estimated,** with the repo's own instruments
  in `src/tokens/color.ts`: `oklabOf`, `apcaLc`, `simulateCvd`, `separation`,
  `compositeOver`, `worstCaseContrast`. The scripts are kept in
  `/private/tmp/claude-501/-Users-homelab/06652a5c-23e2-4a00-8579-52c3b446d84b/scratchpad/spec2/`
  and each table names the one that made it (appendix C lists them). They
  import `color.ts` and re-implement nothing.
- **Colour is given as hex plus measured numbers.** The owner is colourblind
  and reads numbers, not colour names; a name such as "lilac" is only a handle
  for a hex.

### Terms

| Term | Meaning |
|---|---|
| **Role** | What a colour token is for (`primary`, `surface`, `text-muted`). The builder names 69 (`SEMANTIC_COLOR_NAMES`, `src/tokens/semantics.ts:14-29`) |
| **Token** | A named design value, emitted as a CSS custom property (`--sb-primary`) |
| **Preset** | One theme's recipe: sorbet, ocean, forest, noir, midnight |
| **Contract** | The data that says what a preset is held to: for each tier, a metric and a floor (`src/tokens/contracts.ts`) |
| **Rule** | One comparison the gate makes: `fg` against `bg`. A rule carries a tier and a reason, never a number |
| **Tier** | A group of rules that owe the same floor under a contract |
| **Kind** | What a tier protects (text, a shape with no label, the focus ring, …). One table, `TIER_KIND` |
| **Floor** | The least value that passes |
| **Metric** | The ruler a tier is measured with (the four are defined in §4.2) |
| **Contrast ratio** | WCAG 2's measure: how many times brighter the lighter colour is. 1 is identical, 21 is black on white |
| **Lc** | APCA's lightness contrast: how strongly text stands off its background by brightness. About 106 is black on white; under about 15 is invisible. It carries a sign (§4.2) |
| **Separation** ("sep") | How far apart two colours look: the straight-line distance between them in OKLab (a colour space built so equal distances look equally different), times 100. Under 5 is hard to tell apart; 10 or more is clearly different |
| **View** | One way of seeing a pair: typical vision, or one of three simulations of colour blindness (protan and deutan, the two red-green kinds; tritan, the rare blue-yellow kind), each in its complete form |
| **Worst view** | The smallest value among the views a contract lists |
| **Wash** | A fill at part strength over what is behind it |
| **Seam** | An optional token read with a fallback, so a theme that does not define it gets today's value. The pattern is a CSS custom-property fallback: `var(--sb-field-fill, var(--sb-surface))` |
| **Edge pixel** | The colour one layer of a shadow makes where it is strongest: the layer's colour at its strength, blended over what is under it |
| **Golden file** | A stored copy of a theme file that the build must reproduce byte for byte. Four are frozen (ocean, forest, noir, midnight); sorbet's is pinned and changes only on purpose |
| **Known-bad fixture** | A fixed input the check must reject: here, sorbet exactly as `main` ships it |
| **†** | A pairing built from approved values that no sample sheet actually drew. Revision 1's six (and the chart pairs) were drawn on sheet 3 and passed by the owner (DECISIONS row 27) |
| **Provisional** | A floor pinned to a † pairing the owner has not yet passed; its step-2.1 test is not written until the owner answers. None remains since DECISIONS row 29 |

## 1. What this spec settles, in one table

| The task asked for | Where |
|---|---|
| The role-to-value table, light and dark, all 69 roles | §3 |
| The `legibility` contract as data: tiers, metrics, floors, margins | §4, §6 |
| Every new rule, and the token or data field and Sass site behind each | §7, appendix A |
| Shadows as data, and the edge arithmetic | §5 |
| What each see-through input is blended over | §4.4 |
| The scope of each true-or-false check | §9 |
| The mark-strength status tokens (decision A5) | §8 |
| The known-bad fixture, with expected measurements | §10 |
| Carry-overs: report lines, unheld counts, placeholder text, TokenStudio, the golden | §11 |
| Steps 2.1 to 2.8: files, acceptance, what is tests-first | §12 |
| Step 2.5's status icon and word: where, what shape, what ink, what a reader hears, how the frozen presets are still checked | §12.5 |
| Appendix G of the proposal, item by item | §18 |

## 2. What does not move

**L1.** `contracts["wcag-aa"]` is unchanged, key for key and character for
character: its `name`, `calibratedFor`, and all seven tiers with their
`metric`, `min`, `why` and `retire`. It gains no `views` and no `checks` key.

**L2.** The first 86 entries of `RULES` are today's 86, in today's order, with the
same `fg`, `bg`, `tier`, `why` and `mode`. New rules are appended after them
(§7), so `RULES.length` becomes 277 (279 in revision 1).

**L3.** For each mode, `measureColors(mode, colors, "wcag-aa")` still returns
exactly 70 measurements: the same `(fg, bg, min)` triples in the same order,
the same `actual` (to 1e-9) and the same `holds` as the fixtures
`tools/fixtures/contracts/wcag-aa.triples.json` and
`wcag-aa.measurements.json` record, for every preset and mode whose colours
have not been rebuilt by this pull request: all ten until step 2.2, nine from
step 2.2 (sorbet's light record is new), eight from step 2.6. The triples are
the same for every record, so check 5 itself is not edited. (Revision 1 said
"each mode" without the limit; sorbet's new light record measures different
ratios under `wcag-aa`, and seven of them fail it: L105.)

**L4.** The four frozen golden files (`tools/golden/{ocean,forest,noir,midnight}.css`)
do not change in any step. `FROZEN_PRESETS` (`tools/check-golden.ts:91`) is not
edited. (Revision 3.6: what those presets *render* changes from step 2.5, by
the owner's decision, in the status components only, and L166 says what of
the promise still holds.)

**L5.** `shadowDecls` (`src/tokens/emit.ts:34-43`) is not edited, and is still
called for every preset in both modes, sorbet included. A preset that defines
no optional token, no `edges` and no `buttonLabel` (§3.3, §5) emits exactly the
lines it emits today, in the same order. (`buttonLabel` is a new field. The
existing `Preset.label`, the display name every preset already carries, is not
touched by this spec.)

**L6.** The chart order gate (`tools/check-cvd.ts`) is not edited: its two views
and its `FLOORS` stay (decision A3).

**What changes on purpose for `wcag-aa`,** and nothing else:

**L7.** Every `Measurement` gains two keys, `metric` and `view` (§4.1). For a
`wcag-aa` measurement they are `"ratio"` and `"typical"` (`view` is `null` when
`actual` is `null`). Every `Failure` gains `tier`, `metric` and `view`.

**L8.** `TIERS`, `TIER_KIND`, `Kind`, `Tier`, `ContractName` and
`Object.keys(contracts)` grow (§4.1). The seven tier names and four kind names
of PR 1 are not renamed or reordered (decision A21); the new ones follow them.

**L9.** Report text changes as §11 states: the success lines name the contract, and
each mode's line says how many rules its contract does not hold.

**L10.** The assertions of PR 1 that this spec makes false are edited by the
test author, on purpose, in the step that makes each false, and only those:
L105 is the complete list, each with its file and line, the new expectation and
the statement here that requires it. (Revision 1 named eight of them.) No other
assertion of PR 1 is changed. A test author or implementer who finds one more
does not edit it: that is a defect of this spec, reported with the four-field
contradiction report of the lab's write-tests-first lane, and L105 is amended
first. (Revision 3.6: the tests written for this pull request's own steps
that a later step makes false are listed by that step's statements, in the
same form; for step 2.5, L183.)

**L105.** The complete list: 47 numbered entries, #1 to #38 and #40 to #48
(#39 is unused; #48 added in revision 3.3), plus "#11 again", the same line's step-2.2 expectation.
Revision 2 listed 41; verification finding N1 found five more, #43 to #47. Line numbers are at `e24df74`. `colorsOf` is the helper
`colorsOf(mode, preset = "sorbet")` at `tools/test-contracts.ts:168`.
Every test file under `tools/` and
`<root>/tools/` was read for this list; `<root>/tools/check-cli.ts`,
`check-catalog.ts`, `check-consumable.ts`, `<root>/tools/stylelint/` and
`tools/check-golden-base.ts` hold no assertion this spec makes false
(`check-cli.ts:57` matches the mode line from its start only, so L91's suffix
does not break it; its own measuring call changes under L25, which is the
implementer's edit).

*Step 2.1* (the member, the rules, the reports; every preset still declares
`wcag-aa`):

| # | File:line | What it asserts today | New expectation | Required by |
|---|---|---|---|---|
| 1 | `tools/test-contracts.ts:402` | removing `RULES[RULES.length − 1]` is caught by check 5 | remove at `[0, 12, 21, 53, 54, 85]`: the last index is the last of the first 86. The last entry is now R283, which `wcag-aa` does not hold, so removing it changes nothing check 5 sees | L2 |
| 2 | `tools/test-contracts.ts:426` | `TIERS` equals the seven | the seven, then the 20 of L23, in that order | L8, L23 |
| 3 | `tools/test-contracts.ts:430` | `TIER_KIND` equals the seven kinds | the seven, plus the 20 with the kinds L23 gives | L8, L23 |
| 4 | `tools/test-contracts.ts:460-463` | every rule of `RULES` is a pair of the 2d3b765 fixture, in the tier M4 puts it | the same, for `RULES.slice(0, 86)`; every later rule equals appendix A's row (fg, bg, tier) in R order | L2, L67 |
| 5 | `tools/test-contracts.ts:466` | 70 rules apply in each mode | the same, counted over `RULES.slice(0, 86)`; over all of `RULES`, 261 apply in each mode. (`:468`, each M4 tier's count, stays true: every new rule has one of the 20 new tiers) | L2, L58 |
| 6 | `tools/test-contracts.ts:474-477` | `RULES` equals the 86 of the fixture; length 86; 54 / 16 / 16 by mode | `RULES.slice(0, 86)` equals the fixture; length 277; 245 / 16 / 16 | L2, L67 |
| 7 | `tools/test-contracts.ts:507` | the contracts are `["wcag-aa"]` | `["wcag-aa", "legibility"]` | L8, L57 |
| 8 | `tools/test-contracts.ts:533` | a measurement's keys are the seven of PR 1 | those seven plus `metric` and `view` | L7 |
| 9 | `tools/test-contracts.ts:544` | a failure's keys are the six of PR 1 | those six plus `tier`, `metric` and `view` | L7 |
| 10 | `tools/test-contracts.ts:651` | `wcag-aa`'s 70 measurements are every rule that applies in the mode | they are every rule that applies in the mode whose tier `wcag-aa` lists, in `RULES` order | L2, L58 |
| 11 | `tools/test-contracts.ts:982` | `tools/check-contrast.ts` prints `fixtures/contracts/check-contrast.report.txt` byte for byte | the fixture is not re-recorded (its README forbids it). The expected text is the fixture transformed as L86 and L91 say: each mode line gains ` — wcag-aa; 191 rules not held`, and the last line becomes `✓ every declared contract holds for every preset in both modes (700 pairings measured): wcag-aa × 10`. The transformation is written in the test, from this spec's sentences | L86, L91 |
| 43 | `tools/test-contracts.ts:1213-1223` | the four instruments (`oklabOf`, `apcaLc`, `simulateCvd`, `separation`) are called only by `color.ts`, `tools/check-cvd.ts` and the test itself | `MAY_CALL` gains `packages/design-system/src/tokens/rules.ts` and `packages/design-system/src/tokens/edges.ts`, the two files L24, L27 and L101 make measure with them; the test's name loses "in this increment". The barrel test above it (`:1205-1211`, the instruments are not on `src/tokens/index.ts`) stays true: L101's exports add none of the four. **Where the tests' independent oracle lives:** the step-2.1 tests need none of their own for these four, because their expected values are this spec's numbers typed in (appendix A, appendix B, L29, L30, L50, L82), and the instrument values themselves are already held by PR 1's fixtures. If the test author writes one anyway, it lives in `tools/test-contracts.ts` (already in `MAY_CALL`) or in a file added to `MAY_CALL` in the same edit; and its own functions are not named `oklabOf`, `apcaLc`, `simulateCvd` or `separation`, because the test's regex (`:1219`) matches a call by its name, whoever defines the function (verification finding N23) | L24, L27, L101 |
| 44 | `tools/test-contrast.ts:514` | a scrim measurement deep-equals a seven-key literal (`tier`, `kind`, `min`, `actual`, `holds`, `fg`, `bg`) | the literal gains `metric: "ratio"` and `view: "typical"` (the pair is measured, `actual` 1) | L7 |
| 45 | `tools/test-contrast.ts:661-665` | `checkColors` deep-equals failures built with six keys, over the shipped and broken presets | the built failures gain `tier`, `metric` and `view` from the measurement. (`:668`, the other half of the test, is #38) | L7 |
| 12 | `tools/test-contracts.ts:994-995` | each of the five measuring surfaces matches `measureColors(`/`checkColors(` and `contractOf(` | each matches `measurePreset(` and matches neither `measureColors(` nor `checkColors(` | L25 |
| 13 | `tools/test-contracts.ts:1796` | `<root>/tools/check-cli.ts` and `apps/playground/src/contrast-checks.ts` make at least one `measureColors(`/`checkColors(` call, each passing a `contractOf` result | each calls `measurePreset(` and makes no `measureColors(`/`checkColors(` call (`measurePreset` takes the preset itself, so there is no contract argument left to check) | L25 |
| 14 | `tools/test-contracts.ts:1923, 1926, 1979` | `CONTRACT_NAMES` is `["wcag-aa"]` | `["wcag-aa", "legibility"]` | L8 |
| 15 | `tools/test-contracts.ts:2008, 2009` | the contracts and `CONTRACT_NAMES` are `["wcag-aa"]` after the mutations | `["wcag-aa", "legibility"]` | L8 |
| 16 | `tools/test-contracts.ts:2012` | `RULES` equals the 86 of the fixture after the mutations | `RULES.slice(0, 86)` equals the fixture, and `RULES.length` is 277 | L2 |
| 17 | `tools/test-contrast.ts:107-123` | `FLOORS` is the seven tiers' floors, and a tier it does not know is a failure | unchanged for the seven. `applies(mode)` becomes the rules whose tier is one of the seven; a rule whose tier is one of the 20 of L23 (typed into the test) is not `wcag-aa`'s and is left out; a tier in neither list is still a failure | L2, L23 |
| 18 | `tools/test-contrast.ts:305-307` | the three reports read `measureColors` | they read `measurePreset` | L25 |
| 19 | `tools/test-contrast.ts:384` | a passing mode line is exactly `all N pairings pass[ (tightest margin ×M)]` | the same, then ` — <contract>; <k> rules not held`, with the contract the preset declares and `k` = 261 − N | L91 |
| 20 | `tools/test-contrast.ts:390` | a failing mode line is exactly `F failing (M measured[, U could not be measured])` | the same, then ` — <contract>; <k> rules not held`, with `k` = 261 − (M + U): the count of measurements returned, measured or not, as L91 defines it | L91 |
| 21 | `tools/test-contrast.ts:778-801` | README.md says `86 entries`, `70 apply in each mode`, `54 hold in both modes`, `32 chart-mark entries`, `16 in light and 16 in dark`, `measures all 70`, and no other count | README says `277 entries`, `261 apply in each mode`, `245 apply in both modes` (the word "hold" is reserved for what a contract holds, L58, L91), `32 mode-restricted chart entries`, `16 in light and 16 in dark` (these are `wcag-aa`'s `chart` tier rules, the only rules with a mode; the new `chart-mark` tier's 16 rules apply in both modes and are inside the 245), and, in place of `measures all 70`, that `wcag-aa` measures 70 and `legibility` 193 in each mode (both counted by the test, never typed). The stray-number set gains 70, 193, 68 and 191. README.md's paragraph is therefore edited in step 2.1, not 2.8 | L58, L67 |
| 22 | `tools/test-contrast.ts:810` | `contrast-checks.ts` calls `measureColors(` | it calls `measurePreset(` | L25 |
| 23 | `tools/test-golden.ts:252` | the failing build's stdout says `contrast contract holds` | it says `every preset holds the contract it declares` | L87 |
| 48 | `tools/test-contracts.ts:468` (at `e24df74`; `:791-796` as edited) | each M4 tier has M4's count, over all of `RULES` | counted over `RULES.slice(0, 86)`, as #4 to #6 are. Added in revision 3.3: the test author made this narrowing and L105 #5 had said `:468` stays true. No coverage is lost: a later rule carrying one of the seven M4 tiers would be caught by the appendix-A deep-equal on `RULES.slice(86)` (#4), which pins every later rule's tier | L2, L10 |

*Step 2.2* (sorbet light declares `legibility`; its light record is rebuilt
whole). Measured with `rev2/rev2.ts`: the new sorbet light record fails seven
`wcag-aa` pairs (`border-strong` on `bg` 2.34 and on `surface` 2.48;
`primary-solid` on `bg` 2.34 and on `surface` 2.48; `secondary-solid` on `bg`
2.30; `accent-solid` on `bg` 1.85; `chart-6` on `bg` 2.99), and the new dark
record of step 2.6 fails none. Every assertion that measures sorbet under the
literal `"wcag-aa"` and expects a pass, or expects the 2d3b765 ratio, is made
false here:

| # | File:line | What it asserts today | New expectation | Required by |
|---|---|---|---|---|
| 24 | `tools/test-contracts.ts:168` | `colorsOf`'s default preset is sorbet | the default is `"ocean"`. This one edit keeps lines 692, 858 and 1932 true (each measures the default under `wcag-aa` and expects a pass) | L3 |
| 25 | `tools/test-contracts.ts:202-215`, `2019` (check700) | the 700 measurements, sorbet included | the rows of preset-modes that still declare `wcag-aa`: 630 from step 2.2, 560 from step 2.6, compared with the fixture's rows of those preset-modes | L3 |
| 26 | `tools/test-contracts.ts:552, 554` | all five declare `wcag-aa` in both modes | sorbet declares `{ light: "legibility", dark: "wcag-aa" }`; from step 2.6 `legibility` in both; the four others unchanged | L101, steps 2.2 and 2.6 |
| 27 | `tools/test-contracts.ts:665` | every shipped preset-mode has no `wcag-aa` failure with one tier removed | the same, over the preset-modes that declare `wcag-aa` | L3 |
| 28 | `tools/test-contracts.ts:827` | each pair's verdict equals the 2d3b765 ratio against the floor, sorbet included | the same, over the fixture rows of #25 | L3 |
| 29 | `tools/test-contracts.ts:845, 851` | with `text` raised, verdicts match the 2d3b765 ratios, and the gate fails exactly those | the same over the rows of #25, and the gate's count is compared with the failures of the `wcag-aa`-declaring preset-modes only (sorbet's light mode is judged by `legibility`, which lists no `text` tier) | L3 |
| 30 | `tools/test-contracts.ts:1031` | the manifest says `{ light: "wcag-aa", dark: "wcag-aa" }` for every preset | it says each preset's declaration (sorbet's as in #26) | M6.9 of the mechanism spec, L101 |
| 31 | `tools/test-contracts.ts:1669` | every preset-mode but the planted one prints `all 70 pairings pass` | each prints `all N pairings pass`, N being its declared contract's count: 193 for a `legibility` mode | L91 |
| 32 | `tools/test-contracts.ts:1971` | `contractOf(sorbet, "light")` is `"wcag-aa"` | it is `"legibility"` (or the test asks it of ocean) | step 2.2 |
| 33 | `tools/test-contrast.ts:227` (and the expectations at `651`, `727`, `751`) | the hair-under tamper (`link-hover` `#d92360`, 4.4990 on the page `#f8f7f5`) is on sorbet light | it moves to forest light, whose page is the same `#f8f7f5` and measures the same 4.498999 (`rev2/tamper.ts`); `651` finds it on forest, `751` reads `  forest/light: link-hover on bg = 4.499 (needs 4.5)`. Under `legibility`, `link-hover` is an Lc rule and the test's point (a ratio a hair under 4.5) cannot be made on sorbet | L58 |
| 34 | `tools/test-contrast.ts:376-377` | each printed mode is checked against `measureColors(…, "wcag-aa")` | against `measurePreset(preset, mode)` and its failures, so each mode is checked under the contract it declares | L25 |
| 35 | `tools/test-contrast.ts:520` | every value of every shipped record is respelled by this file's `presetForm`, which reads `#rrggbb` and `rgb(… / a)` only | only the 69 role values are respelled; the optional tokens (whose values include `transparent`) are carried over unchanged. `wcag-aa` reads roles only | L16 |
| 36 | `tools/test-contrast.ts:551` | a minified record passes `wcag-aa` for every shipped preset-mode | it passes the contract each preset-mode declares, measured as Token Studio does (L92) | L92, L95 |
| 37 | `tools/test-contrast.ts:586` | every shipped preset-mode passes `wcag-aa` | every shipped preset-mode passes the contract it declares (`measurePreset`), and none has an unmeasurable pair | L25 |
| 38 | `tools/test-contrast.ts:668` | `checkPreset` equals `checkColors(…, "wcag-aa")` per mode | it equals the failures of `measurePreset` per mode | L25 |
| 11 again | `tools/test-contracts.ts:982` | (as #11 of step 2.1) | the transformed fixture, with sorbet's heading line carrying its new tagline (L21), sorbet's light line reading `all 193 pairings pass (tightest margin ×1.02) — legibility; 68 rules not held`, and the last line `… (823 pairings measured): wcag-aa × 9, legibility × 1`. The margin is derived from this spec, not from the code under test: the smallest `actual ÷ floor` over the mode's 193 measurements, from appendix A's values and L61's floors and the two scrim ratios: light 84.8629 ÷ 82.8 = 1.0249 (R087), dark 85.2412 ÷ 83.2 = 1.0245 (R089), each printed ×1.02 (`rev2/rev3.ts`) | L21, L86, L91 |
| 46 | `tools/test-contracts.ts:1326-1328` | with `wcag-aa`'s `text` respelled `txet`, `contractOf(preset, "light")` throws for every shipped preset | it throws for each shipped preset and mode that declares `wcag-aa` (from step 2.2 not sorbet light; from step 2.6 not sorbet at all), and `contractOf` for a mode declaring `legibility` still returns `"legibility"` | step 2.2, L57 |

*Step 2.6* (sorbet dark declares `legibility`; CORRECTION 2026-10-06: and #27 to #29 and nine step-2.2 tests,
with current anchors, as L195 (c) lists them): #11, #25, #26, #30, #31 and
#46 again, for the dark mode (#11's last line then reads `(946 pairings
measured): wcag-aa × 8, legibility × 2`, and sorbet's dark line ×1.02), and
one more:

| # | File:line | What it asserts today | New expectation | Required by |
|---|---|---|---|---|
| 47 | `tools/test-contrast.ts:215` (and the report rows read at `:349-363`, `:380`) | the tamper "an impossible alpha", `scrim` `rgb(0 0 0 / 1.5)`, is on sorbet dark | it moves to forest dark. On sorbet dark under `legibility` the unreadable `scrim` also fails C1 (`roles-complete`), and L90 prints `    ✗ roles-complete: …`, which `printedModes` reads as a failure row, so every report's `p.rows` comparison would fail. Forest dark has no tamper yet; the six unmeasurable pairs and "the mode beside a broken one" (`:654`, ocean) are unchanged. The move may be made in step 2.2 with #33 | L90, C1 |

(#39 is not used: `tools/test-contrast.ts:552`
compares a minified record with the preset's under `wcag-aa`, which reads no
see-through foreground, so it stays true. It must not be widened to the
declared contract without L109's exception: under `legibility` the new dark
divider, R234 and R235, reads 11.21 minified against 11.08.)

*Step 2.7* (Token Studio):

| # | File:line | What it asserts today | New expectation | Required by |
|---|---|---|---|---|
| 40 | `tools/test-contracts.ts:1009-1020` | `token-studio.tsx` holds exactly one line `setFailures(checkColors("studio", mode, colors, "wcag-aa"));` under a fixed comment | the file contains no contract name as a string literal, and its one `setFailures(` call takes the failures of the contract L92 resolves | L96 |
| 41 | `tools/test-contrast.ts:572` | Token Studio reads ``SEMANTIC_COLOR_NAMES.map((n) => [n, styles.getPropertyValue(`--sb-${n}`).trim()])`` | it reads ``[...SEMANTIC_COLOR_NAMES, ...Object.keys(SEAMS)].map((n) => [n, styles.getPropertyValue(`--sb-${n}`).trim()])`` | L93 |
| 42 | `tools/test-contrast.ts:576` | the same `setFailures` line as #40 | as #40 | L96 |

Unaffected, checked: the five bad-declaration and planted-tree runs
(`tools/test-contracts.ts:623-642`, `1596-1622`) still hold, because the
planted presets are ocean, forest, noir and midnight; the M10.7 gate test's
`42 contrast failure(s)` still holds, because a structure failure is counted
on its own line (L90); its report test's heading parser reads
`preset.label`, the display name, which C1 leaves alone; and
`tools/test-contracts.ts:374`, which revision 1 listed, asserts the length of
the fixture `rules.order.json`, not of `RULES`, and stays true.

## 3. The values

Script: `values.ts` (the table as data), `basics.ts` (derivations), `gen.ts`
(the tables printed here).

### 3.1 The 69 roles

**L11.** The builder names 69 roles and every shipped preset emits 68 of them in
each mode: `danger-active` is named and produced by none (counted by
`basics.ts` from `presets` on `main`). The new sorbet defines all 69 in both
modes.

**L12.** The new sorbet's `colors.light` and `colors.dark` hold exactly these
values for the 69 roles. A value is either *copied* from an approved sheet's
data (the file and key are named; paths are in
`docs/pastel-legibility-evidence/`) or *derived* by one of the rules D1 to D12
below from a value that is.

| # | Role | Light | From | Dark | From |
|---|---|---|---|---|---|
| 1 | `bg` | `#fef4dc` | copied: `values.json` `palette.cream` (decision 2) | `#211409` | copied: `edges-measure.json` Dark `backdrop` of Card (decision 9) |
| 2 | `bg-subtle` | `#f7ecd1` | D1: equals `surface-sunken` | `#140903` | D1 |
| 3 | `surface` | `#fffbf1` | copied: `values.json` `palette.surface` (decision 2) | `#342417` | copied: `edges-measure.json` Dark `fill` of Card (decision 9) |
| 4 | `surface-raised` | `#fffbf1` | copied: `edges-values.json` `tokens.light.raised` | `#463425` | copied: decision 9, raised; `build-edges.mjs:20` |
| 5 | `surface-sunken` | `#f7ecd1` | copied: `edges-values.json` `tokens.light.well` | `#140903` | copied: decision 9, well; `build-edges.mjs:20` |
| 6 | `scrim` | `rgb(0 0 0 / 0.6)` | unchanged from `main` (proposal §2, kept) | `rgb(0 0 0 / 0.6)` | unchanged |
| 7 | `on-scrim` | `#fffbf1` | D2: the light `surface` | `#fffbf1` | D2 |
| 8 | `on-scrim-muted` | `#f3e7ce` | D3: the dark `text` | `#f3e7ce` | D3 |
| 9 | `text` | `#693800` | copied: `values.json` `pick.hex` (decision 4) | `#f3e7ce` | copied: `edges-values.json` `tokens.dark.ink` (decision 9) |
| 10 | `text-muted` | `#844d16` | copied: `values.json` `pick.muted` (decision 5) | `#d7c9ae` | copied: `edges-values.json` `tokens.dark.muted` (decision 21) |
| 11 | `text-subtle` | `#975e2a` | copied: `values.json` `pick.subtle` (decision 5) | `#b3a58d` | copied: `edges-values.json` `tokens.dark.subtle` (decision 21) |
| 12 | `text-inverse` | `#fef4dc` | D4: equals `bg` | `#211409` | D4 |
| 13 | `border` | `#e3d2b0` | copied: sheet 2 `--divider` (`build-edges.mjs:45`) | `rgb(254 244 220 / 0.14)` | copied: sheet 2 `--divider`, the rim at 14% (`build-edges.mjs:54, 59`) |
| 14 | `border-subtle` | `#e3d2b0` | D5: equals `border` | `rgb(254 244 220 / 0.14)` | D5 |
| 15 | `border-strong` | `#b096d7` | copied: `edges-values.json` `ring` (decision 7) | `#b096d7` | the same (proposal §7: the same ring) |
| 16 | `focus-ring` | `#8e6ac7` | copied: `values.json` `focus` (decision A9) | `#8e6ac7` | the same (A9: one tone for both modes) |
| 17 | `primary` | `#dac5fc` | copied: `values.json` `palette.lilac` (decision 3) | `#dac5fc` | the same (decision 8) |
| 18 | `primary-hover` | `#dac5fc` | D6: equals the fill | `#dac5fc` | D6 |
| 19 | `primary-active` | `#dac5fc` | D6 | `#dac5fc` | D6 |
| 20 | `primary-subtle` | `#ede0f7` | D7: the fill at 50% over `surface` | `#554445` | D7: the fill at 20% over `surface` |
| 21 | `primary-text` | `#472400` | D8: the label ink, `values.json` `pick.labelInk` | `#f3e7ce` | D8: `edges-values.json` `tokens.dark.strong` |
| 22 | `on-primary` | `#472400` | copied: `edges-values.json` `onFill` (decision 5) | `#472400` | the same (decision 8) |
| 23 | `primary-solid` | `#b096d7` | copied: `values.json` `shade.lilac` (D10) | `#b096d7` | the same |
| 24 | `secondary-solid` | `#d29397` | copied: `values.json` `shade.blush` (D10) | `#d29397` | the same |
| 25 | `accent-solid` | `#ccb563` | copied: `values.json` `shade.butter` (D10) | `#ccb563` | the same |
| 26 | `secondary` | `#f9c3c6` | copied: `values.json` `palette.blush` (decision 3) | `#f9c3c6` | the same (decision 8) |
| 27 | `secondary-hover` | `#f9c3c6` | D6: equals the fill | `#f9c3c6` | D6 |
| 28 | `secondary-active` | `#f9c3c6` | D6 | `#f9c3c6` | D6 |
| 29 | `secondary-subtle` | `#fcdfdc` | D7: the fill at 50% over `surface` | `#5b443a` | D7: the fill at 20% over `surface` |
| 30 | `secondary-text` | `#693800` | D9: equals `text` (A13) | `#f3e7ce` | D9 |
| 31 | `on-secondary` | `#472400` | copied: `edges-values.json` `onFill` (decision 5) | `#472400` | the same (decision 8) |
| 32 | `accent` | `#f5e3a2` | copied: `values.json` `palette.butter` (decision 3) | `#f5e3a2` | the same (decision 8) |
| 33 | `accent-hover` | `#f5e3a2` | D6: equals the fill | `#f5e3a2` | D6 |
| 34 | `accent-active` | `#f5e3a2` | D6 | `#f5e3a2` | D6 |
| 35 | `accent-subtle` | `#faefca` | D7: the fill at 50% over `surface` | `#5b4a33` | D7: the fill at 20% over `surface` |
| 36 | `accent-text` | `#693800` | D9: equals `text` (A13) | `#f3e7ce` | D9 |
| 37 | `on-accent` | `#472400` | copied: `edges-values.json` `onFill` (decision 5) | `#472400` | the same (decision 8) |
| 38 | `success` | `#a6edee` | copied: `values.json` `palette.robin` (decision 3) | `#a6edee` | the same (decision 8) |
| 39 | `success-hover` | `#a6edee` | D6: equals the fill | `#a6edee` | D6 |
| 40 | `success-subtle` | `#d3f4f0` | D7: the fill at 50% over `surface` | `#4b4c42` | D7: the fill at 20% over `surface` |
| 41 | `success-text` | `#693800` | D9: equals `text` (A13) | `#f3e7ce` | D9 |
| 42 | `on-success` | `#472400` | copied: `edges-values.json` `onFill` (decision 5) | `#472400` | the same (decision 8) |
| 43 | `warning` | `#f5e3a2` | copied: `values.json` `palette.butter` (decision 13) | `#f5e3a2` | the same (decision 8) |
| 44 | `warning-hover` | `#f5e3a2` | D6: equals the fill | `#f5e3a2` | D6 |
| 45 | `warning-subtle` | `#faefca` | D7: the fill at 50% over `surface` | `#5b4a33` | D7: the fill at 20% over `surface` |
| 46 | `warning-text` | `#693800` | D9: equals `text` (A13) | `#f3e7ce` | D9 |
| 47 | `on-warning` | `#472400` | copied: `edges-values.json` `onFill` (decision 5) | `#472400` | the same (decision 8) |
| 48 | `danger` | `#f9c3c6` | copied: `values.json` `palette.blush` (decision 13) | `#f9c3c6` | the same (decision 8) |
| 49 | `danger-hover` | `#f9c3c6` | D6: equals the fill | `#f9c3c6` | D6 |
| 50 | `danger-active` | `#f9c3c6` | D6 | `#f9c3c6` | D6 |
| 51 | `danger-subtle` | `#fcdfdc` | D7: the fill at 50% over `surface` | `#5b443a` | D7: the fill at 20% over `surface` |
| 52 | `danger-text` | `#693800` | D9: equals `text` (A13) | `#f3e7ce` | D9 |
| 53 | `on-danger` | `#472400` | copied: `edges-values.json` `onFill` (decision 5) | `#472400` | the same (decision 8) |
| 54 | `info` | `#dac5fc` | copied: `values.json` `palette.lilac` (decision 13) | `#dac5fc` | the same (decision 8) |
| 55 | `info-hover` | `#dac5fc` | D6: equals the fill | `#dac5fc` | D6 |
| 56 | `info-subtle` | `#ede0f7` | D7: the fill at 50% over `surface` | `#554445` | D7: the fill at 20% over `surface` |
| 57 | `info-text` | `#693800` | D9: equals `text` (A13) | `#f3e7ce` | D9 |
| 58 | `on-info` | `#472400` | copied: `edges-values.json` `onFill` (decision 5) | `#472400` | the same (decision 8) |
| 59 | `link` | `#654199` | copied: `values.json` `link` (decision A10) | `#dac5fc` | D11: equals `primary` |
| 60 | `link-hover` | `#654199` | D12: equals `link` | `#dac5fc` | D12 |
| 61 | `chart-1` | `#008289` | unchanged from `main` (decision A3) | `#4cc7d1` | unchanged |
| 62 | `chart-2` | `#9e6400` | unchanged from `main` (decision A3) | `#efa024` | unchanged |
| 63 | `chart-3` | `#ec5198` | unchanged from `main` (decision A3) | `#ff85b6` | unchanged |
| 64 | `chart-4` | `#8a6f00` | unchanged from `main` (decision A3) | `#d4b000` | unchanged |
| 65 | `chart-5` | `#0f70d5` | unchanged from `main` (decision A3) | `#7db6ff` | unchanged |
| 66 | `chart-6` | `#e8672e` | unchanged from `main` (decision A3) | `#ff9164` | unchanged |
| 67 | `chart-7` | `#5761db` | unchanged from `main` (decision A3) | `#9dacff` | unchanged |
| 68 | `chart-8` | `#598100` | unchanged from `main` (decision A3) | `#92c73c` | unchanged |
| 69 | `chart-muted` | `#b8b2a9` | unchanged from `main` (decision A3) | `#999389` | unchanged |

**L13.** The derivation rules. Each is a statement about the record, so each can be
tested as written.

| Rule | In words | Why |
|---|---|---|
| D1 | `bg-subtle` equals `surface-sunken`, in both modes | It is what the light builder does today (`semantics.ts:182, 185`), and the sheet's progress track, which the Sass paints in `bg-subtle` (`atoms/_progress.scss:10`), is the well |
| D2 | `on-scrim` is the light `surface`, `#fffbf1`, in both modes | The scrim is dark in both modes, so text on it is the lightest approved tone. Measured: 5.56:1 at the scrim's worst case |
| D3 | `on-scrim-muted` is the dark `text`, `#f3e7ce`, in both modes | The lightest approved tone that is visibly quieter than D2 and still clears 4.5:1 at the worst case: 4.68:1. (The dark muted text `#d7c9ae` reads 3.51:1 and fails) |
| D4 | `text-inverse` equals `bg` | No Sass reads `text-inverse` (0 uses). The one place text sits on the text colour is the tooltip, which paints `bg` on `text` (`atoms/_tooltip.scss:13-14`) |
| D5 | `border-subtle` equals `border` | Sheet 2 has one line tone |
| D6 | Every `-hover` and `-active` fill equals its resting fill: 11 roles, `danger-active` among them | Decision A13: hover and pressed move the shadow and never darken a fill. Held by check C7 (§9) |
| D7 | `X-subtle` is the fill `X` at 50% (light) or 20% (dark) over `surface`, blended with `compositeOver` and stored as the resulting opaque hex | Sheet 2's wash (`--wash`, `build-edges.mjs:45, 54`). Stored opaque so that a wash is one colour wherever it sits (§17, item 6) |
| D8 | `primary-text` is the label ink in light (`#472400`) and the body text in dark (`#f3e7ce`) | Sheet 2 sets a selected tab's and row's text in the strong ink at weight 600 (`build-edges.mjs:132, 135`); `primary-text` is what the Sass colours that text with (`molecules/_tabs.scss:49`) |
| D9 | The other six `-text` roles equal `text` | Decision A13: status text is the ordinary ink. Sheet 2's status boxes are set in it |
| D10 | `primary-solid`, `secondary-solid`, `accent-solid` are the fill's shade: the fill 0.14 darker and a quarter more colourful (proposal §6) | The shade is what sheet 2 paints every mark with no label in |
| D11 | The dark `link` is the `primary` fill, `#dac5fc` | The light link `#654199` cannot be read on a dark page. Today's dark builder also takes a pale step of the lead hue. Measured: Lc 75.99 / 73.50 / 69.53 on page / card / raised. **Never drawn: §15** |
| D12 | `link-hover` equals `link` | A link is always underlined (A10); hover changes nothing a floor depends on |

**L14.** A whole-built record lists its keys in the order of `SEMANTIC_COLOR_NAMES`,
then the optional names of §3.2 in the order of that table. (The theme file
prints them in record order, `emit.ts:30-32`, so the golden pins the order.)

### 3.2 The optional colour tokens

A legibility theme needs colours that have no role: the fill inside a text
field, the track of a switch, the bar on a selected row. Each becomes an
*optional token*: only a theme that wants it defines it, and the stylesheet
reads it through a seam.

**L15.** There are 20 optional colour tokens (19 in revision 1; `quiet-fill` is new, C2). The table is the whole of
`SEAMS`, a new export of a new file `src/tokens/seams.ts`:
`Record<SeamName, { fallback: SemanticColorName } | { css: string }>`. The
fallback is what the stylesheet paints when the theme does not define the
token, and it is always today's value at that site.

| Optional token | Light | Dark | Fallback | From |
|---|---|---|---|---|
| `text-strong` | `#472400` | `#f3e7ce` | role `text` | decision 5, the label ink, for strong text that is `text` today (field labels); `edges-values.json` `tokens.*.strong` |
| `heading-ink` | `#472400` | `#f3e7ce` | css `inherit` | decision 5, the heading ink. Headings set no colour today, so the fallback is `inherit` |
| `text-caption` | `#472400` | `#f3e7ce` | role `text-subtle` | decision A15: 12px text in the label ink |
| `field-fill` | `#fffbf1` | `#140903` | role `surface` | sheet 2 `--field`: the card in light, the well in dark (`build-edges.mjs:49, 56`) |
| `control-checked` | `#dac5fc` | `#dac5fc` | role `primary-solid` | sheet 2: a checked box is the lilac fill (`build-edges.mjs:121`) |
| `switch-off` | `#f7ecd1` | `#140903` | role `border-strong` | sheet 2: the off track is the well (`build-edges.mjs:122`) |
| `slider-track` | `#f7ecd1` | `#140903` | css `color-mix(in oklab, currentColor, transparent 80%)` | sheet 2 (`build-edges.mjs:125`) |
| `switch-ring` | `#b096d7` | `#b096d7` | css `transparent` | sheet 2: the ring round a switch's track, round its thumb and round a slider's track (`build-edges.mjs:122, 123, 125`). One token for the three, because sheet 2 draws all three in the same `--ring` |
| `selected-wash` | `#ede0f7` | `#554445` | css `transparent` | equals `primary-subtle` (D7); sheet 2 (`build-edges.mjs:132, 135`) |
| `selected-bar` | `#b096d7` | `#b096d7` | css `transparent` | sheet 2: the 3px bar (`build-edges.mjs:135`) |
| `container-line` | `transparent` | `transparent` | role `border-subtle` | sheet 2: a card keeps a 1px transparent border (`build-edges.mjs:81`) |
| `field-line` | `transparent` | `transparent` | role `border-strong` | sheet 2 (`build-edges.mjs:112`) |
| `filled-line` | `transparent` | `transparent` | css `var(--edge)` | sheet 2 (`build-edges.mjs:92`) |
| `quiet-fill` | `#fffbf1` | `#463425` | css `transparent` | sheet 2: the quiet button is the card in light and the raised surface in dark (`build-edges.mjs:105, 107`). The library's outline button paints `transparent` today (`atoms/_button.scss:144`); this is what it paints instead (L106; DECISIONS row 28) |
| `success-mark` | `#00b5b8` | `#00b5b8` | role `success` | §8 |
| `warning-mark` | `#bb9c12` | `#bb9c12` | role `warning` | §8 |
| `danger-mark` | `#d77784` | `#d77784` | role `danger` | decision 13, the rose rim; `edges-values.json` `dangerRim` |
| `info-mark` | `#b096d7` | `#b096d7` | role `info` | §8 |
| `secondary-mark` | `#d29397` | `#d29397` | role `secondary` | `values.json` `shade.blush` |
| `accent-mark` | `#ccb563` | `#ccb563` | role `accent` | `values.json` `shade.butter` |

**L16.** An optional token's value lives in `preset.colors[mode]` beside the roles:
`Preset.colors` becomes
`Record<Mode, SemanticColors & Partial<Record<SeamName, string>>>`. So
`colorDecls` (`emit.ts:30-32`) emits it as `--sb-<name>` (since revision 3.3
only when present and readable, L130, L136), and everything that hands a colour record to the measurement hands the
optional tokens with it.

**L17.** No WCAG preset defines an optional token. That is what keeps their theme
files unchanged, and the frozen goldens prove it.

**L18.** Three more values are data and not tokens: the halo tone and the deep tone
of each fill, and the two edge tints. They appear only inside shadow layers
(§5.2) and are written there as hex.

| Name | Hex | From |
|---|---|---|
| Halo tone of lilac / blush / butter / robin's egg | `#af88e6` / `#e87783` / `#bb9c12` / `#00b5b8` | proposal §6: the fill's hue at lightness 0.70, chroma 0.14; recomputed by `basics.ts` |
| Deep tone of the same four | `#7f5fab` / `#ac505b` / `#877000` / `#008284` | `values.json` `deep` |
| Caramel (card and menu halo) | `#a16e32` | `values.json` `edgeColour` (decision 7) |
| Field tone (the field's inset line) | `#815b1f` | proposal appendix E, `rgb(129 91 31)` |
| Rim (dark edges) | `#fef4dc` | proposal appendix E, `R` on the cocoa page |
| Pool (dark depth shadow) | `#05020a` | proposal appendix E, `rgb(5 2 10)` |

### 3.3 Two values that are not colours

**L19.** `Preset` gains an optional
`buttonLabel?: { px: number; smallPx: number; weight: number }`: the type size
of a button's label at the default size and at the small size, and its
weight. (Revision 1 called it `label`, which is already a required field of
every preset, the display name read by the manifest, the reports' headings and
Token Studio. That field is not touched. Revision 2 had no `smallPx`.) The new
sorbet sets `buttonLabel: { px: 16, smallPx: 14, weight: 600 }` (decisions 6
and 14; `smallPx`, DECISIONS row 31). A preset that sets it emits, once, in
the light block of `:root`, after the shadow lines:
`--sb-button-font-size: <px/16>rem;` then
`--sb-button-font-size-sm: <smallPx/16>rem;` (here `1rem` and `0.875rem`).
Neither is reset in dark (L55): they are the same in both modes.

The Sass reads them through one new accessor in `abstracts/_tokens.scss`,
`button-label($size)`, `$size` being `md` or `sm`, which returns
`var(--sb-button-font-size, fs(sm))` and `var(--sb-button-font-size-sm,
fs(xs))`; any other size is a compile error. (An accessor, not a raw `var()`
in the partial, because library Sass reads tokens only through accessors and
the stylelint rule `<root>/tools/stylelint/no-undeclared-custom-property.js`
refuses a raw `var(--sb-…)` outside `_tokens.scss`. Revision 2 wrote the raw
form.) The two sites, both re-pointed in step 2.4:

| Size | Line at `e24df74` | Today | Becomes | Fallback (the four frozen presets) |
|---|---|---|---|---|
| default | `atoms/_button.scss:26` | `font-size: fs(sm);` | `font-size: button-label(md);` | `fs(sm)`, 14px |
| `.sb-button--sm` | `atoms/_button.scss:193` (in the block at `:190-195`) | `font-size: fs(xs);` | `font-size: button-label(sm);` | `fs(xs)`, 12px |

`.sb-button--lg` (`fs(md)`) is not touched. The weight is already 600 at every
size (`fw(semibold)`, line 25); it is carried so check C9 can read it (§9).

**L20.** Sorbet's `shadowTint` becomes the caramel `#a16e32`, so that
`--sb-shadow-xs` to `-xl`, which about 20 Sass sites still read, are tinted
with the edge colour in light. Dark is unaffected: `shadowDecls` ignores the
tint there.

**L21.** Sorbet's `tagline` is rewritten in step 2.2. Its text is not a contract
matter; the only rule is that it names the lead colour first (lilac) and no
colour the theme no longer has.
CORRECTION 2026-10-05: the text is fixed here, so the implementer types it and
writes none of its own: "Light and fun: lilac, blush pink, butter yellow and
robin's-egg blue on warm cream." Its colours are decisions 2 and 3, in role
order (primary, secondary, accent, success). Sorbet has no edges for dark until
step 2.6 (L55's reset lines are what dark carries in steps 2.2 to 2.5).

## 4. The mechanism, extended

This section says how a second kind of measurement enters the mechanism PR 1
built (`contract-mechanism-spec.md`, M1 to M10). Everything M1 to M10 says
still holds unless a statement here changes it by name.

### 4.1 Types

**L22.** `src/tokens/contracts.ts`:

```ts
export type Kind = "text" | "shape" | "focus" | "chart" | "distinction" | "edge";
export type Tier =
  | "text" | "text-subtle" | "scrim" | "control-border" | "shape" | "focus" | "chart"   // PR 1, unchanged
  | "body" | "secondary" | "on-wash" | "tinted" | "label" | "placeholder"
  | "mark-area" | "mark-line" | "divider"
  | "focus-visible"
  | "tell-apart" | "palette"
  | "chart-mark"
  | "edge-container" | "edge-floating" | "edge-field" | "edge-sunken" | "edge-quiet" | "edge-filled" | "edge-status";
export type Metric = "ratio" | "lc" | "sep" | "presence";
export type View = "typical" | "protan" | "deutan" | "tritan";
export type CheckName = "roles-complete" | "hierarchy" | "edge-not-fill" | "fills-steady" | "edge-direction" | "label-type";
export type ContractName = "wcag-aa" | "legibility";
export interface TierFloor {
  metric: Metric;
  min: number | Record<Mode, number>;
  why: string;
  retire: string;
  /** Only on a tier whose floor is true at one type size: what the preset's `buttonLabel` must reach (check C9). */
  requires?: { buttonLabelPx: number; buttonLabelSmallPx: number; buttonLabelWeight: number };
}
export interface Contract {
  name: ContractName;
  calibratedFor: string;
  /** The views `lc`, `sep` and `presence` tiers are measured in. Absent means typical vision only. */
  views?: readonly View[];
  /** The true-or-false checks of §9 this contract holds. Absent means none. */
  checks?: readonly CheckName[];
  tiers: Partial<Record<Tier, TierFloor>>;
}
```

**L23.** `TIER_KIND` gives the 20 new tiers these kinds, and `TIERS` lists the seven
of PR 1 first, in their order, then the 20 in the order written above:
`body`, `secondary`, `on-wash`, `tinted`, `label`, `placeholder` are `text`;
`mark-area`, `mark-line`, `divider` are `shape`; `focus-visible` is `focus`;
`tell-apart`, `palette` are `distinction` (two colours whose difference is the
message); `chart-mark` is `chart`; the seven `edge-*` tiers are `edge` (where
an element ends).

**L24.** `src/tokens/rules.ts` (`EdgeElement` is defined in `src/tokens/edges.ts` and imported here, L142):

```ts
export type EdgeElement = "container" | "floating" | "field" | "sunken" | "quiet"
  | `filled-${"primary" | "secondary" | "accent" | "danger"}`
  | `status-${"success" | "warning" | "danger" | "info"}`;
/** What a rule's side names: a role, an optional token, or the edge of an element. */
export type ColorRef = SemanticColorName | SeamName | `edge:${EdgeElement}`;
export interface Rule { fg: ColorRef; bg: ColorRef; tier: Tier; why: string; mode?: Mode }
export interface Measurement {
  fg: ColorRef; bg: ColorRef; tier: Tier; kind: Kind;
  metric: Metric;            // the contract's metric for this tier
  min: number;
  actual: number | null;     // null: could not be measured
  view: View | null;         // the view `actual` was taken in; null when actual is null
  holds: boolean;            // actual !== null && actual >= min
}
export function measureColors(mode: Mode, colors: ColorRecord | undefined, contract: ContractName, edges?: EdgeData): Measurement[];
export function checkColors(presetName: string, mode: Mode, colors: ColorRecord | undefined, contract: ContractName, edges?: EdgeData): Failure[];
/** The one way a PRESET is measured: its colours, its edges and its declared contract for the mode. */
export function measurePreset(preset: Preset, mode: Mode): Measurement[];
/** The metric a contract measures a tier with; undefined when it does not list the tier. Validates as floorFor does. */
export function metricFor(contract: ContractName, tier: Tier): Metric | undefined;
/** How many rules apply in a mode, whatever any contract holds (L108). Refuses a mode that is not a mode, as measureColors does. */
export function applyingCount(mode: Mode): number;
```

`EdgeElement` has 13 members. (Revision 1 had 16: `filled-success`,
`filled-warning` and `filled-info` are withdrawn, because the library has no
button in those fills and no Sass site could read their edges; the only
full-strength success, warning and info fills it paints are 12px solid
badges, which carry no edge. See L111 and §13.)

`ColorRecord` is `Partial<SemanticColors & Record<SeamName, string>>`.
`EdgeData` is defined in §5.1.

**L25.** `measurePreset(preset, mode)` is
`measureColors(mode, preset.colors[mode], contractOf(preset, mode), preset.edges?.[mode])`.
Every surface that measures a preset calls it and nothing else: `checkPreset`,
the three reports, `<root>/tools/check-cli.ts` and
`apps/playground/src/contrast-checks.ts`. None of them calls `measureColors` or
`checkColors` on a preset, and none imports `RULES` (`tools/test-contrast.ts`
forbids it); the count of rules a report needs for L91 comes from
`applyingCount`. The PR-1 assertions this changes are L105 #12, #13, #18, #22. A surface that calls `measureColors`
on a preset itself can forget the edges, and for a `wcag-aa` preset nothing
would show.

**L26.** `floorFor(contract, tier, mode)` keeps its signature and, for a `ratio`
tier, every behaviour M6.7 and M10 give it. It returns the floor of a tier of
any metric.

### 4.2 The four metrics

**L27.** What `actual` is, for a rule whose two sides have been read as
opaque colours `F` (the `fg` side) and `B` (the `bg` side) by §4.4:

| Metric | In words | In symbols | Views |
|---|---|---|---|
| `ratio` | The WCAG 2 contrast ratio, at the worst case when `B` is see-through. Unchanged from PR 1 | `worstCaseContrast(fg, bg)` on the values as written | typical only, whatever the contract's `views` says |
| `lc` | How strongly the text `F` stands off the background `B`, as a size: the sign is dropped. The smallest size among the views | `min over views of abs(Lc_view)`; `Lc_typical = apcaLc(F, B)`; under a simulation, `Lc_view = apcaLc(simulateCvd(F, view), simulateCvd(B, view))` | the contract's |
| `sep` | How far apart `F` and `B` look, at the view where they look closest | `min over views of separation(F, B, view)`; typical is `separation(F, B)` | the contract's |
| `presence` | How clearly an element's edge shows against what it sits on (§5.3) | §5.3 | the contract's |

**L28.** `holds` is `actual !== null && actual >= min` for every metric.

**L29.** **Lc and its sign.** `apcaLc` is positive for dark text on a light
ground and negative for light text on a dark one, and it is not symmetric:
`#693800` on `#fef4dc` is 85.84 and `#fef4dc` on `#693800` is −89.44. So: the
`fg` of an `lc` rule is always the text and is always the first argument; the
floor is a size; `actual` is the absolute value. A floor is never compared
with a signed value. Example (`gen.ts`): dark body text `#f3e7ce` on the dark
page `#211409` is −91.87 typical, −90.87 protan, −92.45 deutan, −91.84 tritan;
`actual` is 90.87 and `view` is `"protan"`.

**L30.** **Lc under a simulation** uses the 8-bit hex `simulateCvd` returns, because
APCA is defined on 8-bit sRGB values. `separation` under a view keeps the
unrounded simulated values, as M7 requires. Example: the ink `#693800` on the
cream `#fef4dc` is seen under tritan as `#742d2f` on `#fff0ed`, Lc 84.86, the
smallest of 85.84 / 87.79 / 85.18 / 84.86.

**L31.** `view` is the first view, in the order the contract lists them, at which
the smallest value is reached.

**L32.** **Ratio rules are measured in typical vision only,** under every contract.
The 4.5:1 of the scrim tier is a published number defined on the colours as
they are; simulating them first would be a different rule with the same name.

### 4.3 What a contract may say, and what is refused

`contractNamed` (`contracts.ts:182`) validates a contract whole before any of
it is used. It keeps every refusal it has and gains these. Each is a
`TypeError` that names the key the contract was reached by.

**L33.** A tier's `metric` must be one of the four. A `ratio` floor must be a
finite number greater than 1 (unchanged). An `lc`, `sep` or `presence` floor
must be a finite number greater than 0: no pair measures below 0, so a floor
of 0 or less passes everything.

**L34.** The metric must suit the tier's kind: `lc` only on a `text` tier;
`presence` only on an `edge` tier, and an `edge` tier only `presence`; `sep`
on `shape`, `focus`, `chart` and `distinction` tiers; `ratio` on `text`,
`shape`, `focus` and `chart` tiers. Anything else is refused. (A `presence`
floor on a text tier would be measured as nothing at all.)

**L35.** `views`, when present, is a non-empty array of distinct `View` names.
`checks`, when present, is an array of distinct `CheckName`s. `requires`, when
present, has three finite positive numbers. A wrong name in either list is
refused, not ignored.

**L36.** `metricFor` and `floorFor` refuse the same contracts, by the same call.

### 4.4 Reading a rule's side

A rule names its sides; the measurement has to turn each name into one opaque
colour. This is where a checker can pass on a token while the stylesheet
paints something else, so the reading is the same one CSS does.

**L37.** **Resolving a name** `N` against the colour record:

1. If `N` is `edge:<element>`, it is that element's edge pixel (§5.4).
2. If the record has an own string value for `N` that is not empty after
   trimming, that is the value. (An empty string is what a browser returns
   for a custom property that is not set, and what Token Studio therefore
   reads.)
3. Otherwise, if `N` is an optional token whose fallback is a role, the value
   is the record's value for that role, by step 2.
4. Otherwise there is no value.

In words: exactly what `var(--sb-N, var(--sb-fallback))` computes. A role
fallback is always a role and never another optional token, so there is one
hop and no chain. A css fallback (`inherit`, `transparent`, a `color-mix()`)
is not a colour the measurement can read, so a token that has one has no value
until a theme defines it.

**L38.** **Turning a value into an opaque colour.** The value is read by
`parseColor`. Then:

| The value is | As `fg` of an `lc` or `sep` rule | As `bg` of an `lc` or `sep` rule; as a backdrop or a fill of a `presence` rule | Under `ratio` |
|---|---|---|---|
| opaque | itself | itself | as PR 1 |
| see-through (alpha under 1, `transparent` included) | blended over the rule's `B` with `compositeOver`, which rounds each channel to a whole number | **cannot be measured** | as PR 1: a see-through `bg` is measured at its worst case between white and black; a see-through `fg` cannot be measured |
| unreadable (`color-mix()`, `var()`, `oklch()`, a missing value) | cannot be measured | cannot be measured | cannot be measured |

So each see-through input has one stated thing under it:

| See-through input | Blended over |
|---|---|
| The dark `border` and `border-subtle`, `rgb(254 244 220 / 0.14)` | the rule's `bg`: the surface the line is drawn on |
| A shadow layer drawn outside its element | the backdrop the rule names (§5.3) |
| A shadow layer drawn inside its element (`inset`) | the element's own fill (§5.3) |
| A wash (`X-subtle`, `selected-wash`) | nothing at check time: it is stored already blended over `surface` (D7) |
| `scrim` | white and black, the worst of the range (PR 1's rule, unchanged) |
| `container-line`, `field-line`, `filled-line` (`transparent`) | no measurement reads them; L130 and C3 (c) hold them (L133) |

**L39.** **A rule that cannot be measured is a named failure, never a
skip and never a throw.** It comes back with `actual: null`, `view: null`,
`holds: false`, under every metric. The cases: a side with no value; a side
`parseColor` cannot read; a see-through value where the table above says so;
an `edge:` name with no data for that element; no `edges` argument at all
under a contract that lists an edge tier.

**L40.** What is still a `TypeError`, because it is a mistake in the rules or the
data and not in a theme: everything M6 and M10 refuse; a rule whose `fg` or
`bg` is not a role, an optional token or `edge:` plus an `EdgeElement`; an
`edge:` name as the `bg` of a `presence` rule or as the `fg` of an `lc` rule;
a `presence` rule whose `fg` is not an `edge:` name; and edge data that is
malformed (§5.1). The second of these is a change from PR 1, whose
`measureColors` measured a rule naming a colour that does not exist and
returned `actual: null` (`rules.ts:249-250`). Now the name is checked against
the three lists first, so a mistyped name in a new rule is refused as the
mistake in the rules it is, rather than reported as a theme's failure. No test
of PR 1 plants such a rule (checked: every planted rule names two roles), so
nothing of L105 follows; §17 item 17 records it.

**L41.** M6.4 stands: a contract that yields no measurement in a mode throws.

## 5. Shadows as data, and edge presence

Today a shadow is a string built in `emit.ts:34-43`, so nothing can measure
it. A legibility preset writes each edge as data; the theme file's string and
the checker's number are both made from that one record.

### 5.1 The shape

**L42.** `Preset` gains an optional `edges?: Record<Mode, EdgeData>`:

```ts
export interface ShadowLayer {
  inset: boolean;     // true: drawn inside the element's box
  x: number;          // px, how far right
  y: number;          // px, how far down
  blur: number;       // px, at least 0
  spread: number;     // px, how far it grows past the box (may be negative)
  color: Hex;         // six-digit hex, opaque
  alpha: number;      // its strength: greater than 0, at most 1
}
export interface EdgeRecipe {
  fill: SemanticColorName | SeamName | "backdrop";   // the element's own fill, as its Sass site paints it (L106); "backdrop": it paints none (L107)
  rest: ShadowLayer[];                  // the edge at rest. THE ONLY STATE THE GATE MEASURES
  hover?: ShadowLayer[];                // emitted, not measured
  press?: ShadowLayer[];                // emitted, not measured
}
export type EdgeData = Partial<Record<EdgeElement, EdgeRecipe>>;
```

**L43.** Malformed edge data is a `TypeError` naming the preset or caller, the
element and the layer's position, when it is measured or emitted: a number
that is not finite; `blur` below 0; `alpha` not greater than 0 and at most 1;
`color` not a six-digit hex; `fill` not a role, an optional token or `"backdrop"`; `rest`
not an array. An empty `rest` is valid (an element with no shadow). A mistyped
recipe must never be read as a weak edge.

**L44.** An element the data leaves out is not an error. A rule that names it
cannot be measured (L39).

### 5.2 The new sorbet's edge data

**L45.** `presets.sorbet.edges` holds exactly these recipes: sheet 2's, as
proposal appendix E writes them, on the cocoa page. Lengths are px. A layer is
written `[inset] x y blur spread colour @ alpha`. Script: `values.ts`,
printed by `gen.ts`.

**light**

| Element | `fill` | `rest` layers, in order | `hover` | `press` |
|---|---|---|---|---|
| `container` | `surface` | 0 0 6px 1px #a16e32 @ 0.38 **(all-round)**; 0 2px 4px 0 #a16e32 @ 0.18; 0 10px 28px -8px #a16e32 @ 0.26 | — | — |
| `floating` | `surface-raised` | 0 0 10px 2px #a16e32 @ 0.44 **(all-round)**; 0 4px 8px 0 #a16e32 @ 0.2; 0 18px 44px -10px #a16e32 @ 0.36 | — | — |
| `field` | `field-fill` | inset 0 0 0 1px #815b1f @ 0.24 **(all-round)**; inset 0 2px 3px 0 #815b1f @ 0.14; 0 1px 0 0 #ffffff @ 0.9 | — | — |
| `sunken` | `surface-sunken` | inset 0 1px 3px 0 #a16e32 @ 0.3; inset 0 0 0 1px #a16e32 @ 0.12 **(all-round)** | — | — |
| `quiet` | `quiet-fill` (`#fffbf1`) | 0 0 4px 1px #a16e32 @ 0.42 **(all-round)**; 0 1px 2px 0 #a16e32 @ 0.3; 0 4px 10px -2px #a16e32 @ 0.24 | — | — |
| `filled-primary` | `primary` | 0 0 4px 1px #af88e6 @ 0.7 **(all-round)**; 0 1px 2px 0 #af88e6 @ 0.6; 0 4px 10px -2px #7f5fab @ 0.26 | 0 0 6px 2px #af88e6 @ 0.75 **(all-round)**; 0 2px 4px 0 #af88e6 @ 0.6; 0 9px 18px -3px #7f5fab @ 0.32 | 0 0 2px 1px #af88e6 @ 0.8 **(all-round)**; inset 0 1px 3px 0 #7f5fab @ 0.38 |
| `filled-secondary` | `secondary` | 0 0 4px 1px #e87783 @ 0.7 **(all-round)**; 0 1px 2px 0 #e87783 @ 0.6; 0 4px 10px -2px #ac505b @ 0.26 | 0 0 6px 2px #e87783 @ 0.75 **(all-round)**; 0 2px 4px 0 #e87783 @ 0.6; 0 9px 18px -3px #ac505b @ 0.32 | 0 0 2px 1px #e87783 @ 0.8 **(all-round)**; inset 0 1px 3px 0 #ac505b @ 0.38 |
| `filled-accent` | `accent` | 0 0 4px 1px #bb9c12 @ 0.7 **(all-round)**; 0 1px 2px 0 #bb9c12 @ 0.6; 0 4px 10px -2px #877000 @ 0.26 | 0 0 6px 2px #bb9c12 @ 0.75 **(all-round)**; 0 2px 4px 0 #bb9c12 @ 0.6; 0 9px 18px -3px #877000 @ 0.32 | 0 0 2px 1px #bb9c12 @ 0.8 **(all-round)**; inset 0 1px 3px 0 #877000 @ 0.38 |
| `filled-success` | *withdrawn in revision 2* (M4: no Sass site paints a success fill on an element with an edge) | — | — | — |
| `filled-warning` | *withdrawn in revision 2* (M4: no Sass site paints a warning fill on an element with an edge) | — | — | — |
| `filled-danger` | `danger` | 0 0 4px 1px #e87783 @ 0.7 **(all-round)**; 0 1px 2px 0 #e87783 @ 0.6; 0 4px 10px -2px #ac505b @ 0.26 | 0 0 6px 2px #e87783 @ 0.75 **(all-round)**; 0 2px 4px 0 #e87783 @ 0.6; 0 9px 18px -3px #ac505b @ 0.32 | 0 0 2px 1px #e87783 @ 0.8 **(all-round)**; inset 0 1px 3px 0 #ac505b @ 0.38 |
| `filled-info` | *withdrawn in revision 2* (M4: no Sass site paints an info fill on an element with an edge) | — | — | — |
| `status-success` | `success-subtle` | 0 0 5px 1px #00b5b8 @ 0.6 **(all-round)**; 0 1px 2px 0 #00b5b8 @ 0.5 | — | — |
| `status-warning` | `warning-subtle` | 0 0 5px 1px #bb9c12 @ 0.6 **(all-round)**; 0 1px 2px 0 #bb9c12 @ 0.5 | — | — |
| `status-danger` | `danger-subtle` | 0 0 5px 1px #e87783 @ 0.6 **(all-round)**; 0 1px 2px 0 #e87783 @ 0.5 | — | — |
| `status-info` | `info-subtle` | 0 0 5px 1px #af88e6 @ 0.6 **(all-round)**; 0 1px 2px 0 #af88e6 @ 0.5 | — | — |

**dark**

| Element | `fill` | `rest` layers, in order | `hover` | `press` |
|---|---|---|---|---|
| `container` | `surface` | inset 0 1px 0 0 #fef4dc @ 0.22; 0 0 0 1px #fef4dc @ 0.18 **(all-round)**; 0 10px 28px -6px #05020a @ 0.7 | — | — |
| `floating` | `surface-raised` | inset 0 1px 0 0 #fef4dc @ 0.28; 0 0 0 1px #fef4dc @ 0.28 **(all-round)**; 0 18px 44px -10px #05020a @ 0.8 | — | — |
| `field` | `field-fill` | inset 0 1px 3px 0 #05020a @ 0.7; inset 0 0 0 1px #fef4dc @ 0.34 **(all-round)**; 0 1px 0 0 #fef4dc @ 0.12 | — | — |
| `sunken` | `surface-sunken` | inset 0 1px 3px 0 #05020a @ 0.7; inset 0 0 0 1px #fef4dc @ 0.16 **(all-round)** | — | — |
| `quiet` | `quiet-fill` (`#463425`) | inset 0 1px 0 0 #fef4dc @ 0.22; 0 0 0 1px #fef4dc @ 0.22 **(all-round)** | — | — |
| `filled-primary` | `primary` | inset 0 1px 0 0 #ffffff @ 0.5; 0 0 0 1px #dac5fc @ 0.35 **(all-round)**; 0 0 14px -2px #dac5fc @ 0.35 | inset 0 1px 0 0 #ffffff @ 0.5; 0 0 0 1px #dac5fc @ 0.45 **(all-round)**; 0 0 20px -1px #dac5fc @ 0.5 | inset 0 2px 4px 0 #7f5fab @ 0.55; 0 0 6px -2px #dac5fc @ 0.3 |
| `filled-secondary` | `secondary` | inset 0 1px 0 0 #ffffff @ 0.5; 0 0 0 1px #f9c3c6 @ 0.35 **(all-round)**; 0 0 14px -2px #f9c3c6 @ 0.35 | inset 0 1px 0 0 #ffffff @ 0.5; 0 0 0 1px #f9c3c6 @ 0.45 **(all-round)**; 0 0 20px -1px #f9c3c6 @ 0.5 | inset 0 2px 4px 0 #ac505b @ 0.55; 0 0 6px -2px #f9c3c6 @ 0.3 |
| `filled-accent` | `accent` | inset 0 1px 0 0 #ffffff @ 0.5; 0 0 0 1px #f5e3a2 @ 0.35 **(all-round)**; 0 0 14px -2px #f5e3a2 @ 0.35 | inset 0 1px 0 0 #ffffff @ 0.5; 0 0 0 1px #f5e3a2 @ 0.45 **(all-round)**; 0 0 20px -1px #f5e3a2 @ 0.5 | inset 0 2px 4px 0 #877000 @ 0.55; 0 0 6px -2px #f5e3a2 @ 0.3 |
| `filled-success` | *withdrawn in revision 2* (M4: no Sass site paints a success fill on an element with an edge) | — | — | — |
| `filled-warning` | *withdrawn in revision 2* (M4: no Sass site paints a warning fill on an element with an edge) | — | — | — |
| `filled-danger` | `danger` | inset 0 1px 0 0 #ffffff @ 0.5; 0 0 0 1px #f9c3c6 @ 0.35 **(all-round)**; 0 0 14px -2px #f9c3c6 @ 0.35 | inset 0 1px 0 0 #ffffff @ 0.5; 0 0 0 1px #f9c3c6 @ 0.45 **(all-round)**; 0 0 20px -1px #f9c3c6 @ 0.5 | inset 0 2px 4px 0 #ac505b @ 0.55; 0 0 6px -2px #f9c3c6 @ 0.3 |
| `filled-info` | *withdrawn in revision 2* (M4: no Sass site paints an info fill on an element with an edge) | — | — | — |
| `status-success` | `success-subtle` | 0 0 0 1px #a6edee @ 0.34 **(all-round)** | — | — |
| `status-warning` | `warning-subtle` | 0 0 0 1px #f5e3a2 @ 0.34 **(all-round)** | — | — |
| `status-danger` | `danger-subtle` | 0 0 0 1px #f9c3c6 @ 0.34 **(all-round)** | — | — |
| `status-info` | `info-subtle` | 0 0 0 1px #dac5fc @ 0.38 **(all-round)** | — | — |

(Revision 3.7, L195 (a), DECISIONS row 46: in dark, the sunken panel's all-round layer is `@ 0.16`, sheet 2's
0.14, and the info status box's `@ 0.38`, sheet 2's 0.34: as drawn they rendered 0.1 and 0.4 under step 2.6's
bars. Every other recipe is sheet 2's.)

**L46.** `danger` uses the recipe of `secondary`: they share the blush fill
(decision 13). In dark, `F` in appendix E is the fill's own hex. The quiet
element's fill is the optional token `quiet-fill`, which resolves to the same
hexes revision 1 named (`surface` in light, `surface-raised` in dark), so no
measurement of it moves (L106).

### 5.3 The arithmetic

**The all-round layer.**

**L47.** A layer is *all-round* when `x` is 0, `y` is 0 and `spread` is
greater than 0. In words: it reaches the same distance past (or, when inset,
inside) every side of the box, so it is the layer that can stand in for a
border. A layer that is offset, or that only blurs, does not reach every side
at full strength and is not counted. It is computed from the numbers; nothing
is flagged by hand.

**The edge pixel.**

**L48.** The edge pixel `P` of an all-round layer is its colour at its
strength, blended over one thing, chosen by which side of the box the layer is
drawn on, and never over the element's other shadow layers (CSS stacks the
layers, first on top, but this measurement takes each layer alone):

- a layer drawn **outside** the box (`inset: false`) is blended over the
  **backdrop**, the surface the element sits on;
- a layer drawn **inside** the box (`inset: true`) is blended over the
  element's **own fill**.

The blend is straight alpha compositing, channel by channel, rounded to a
whole number: `round(layer × alpha + under × (1 − alpha))`. It is exactly
`compositeOver(withAlpha(color, alpha), under)` in `color.ts`. Blur is
ignored and layers are not stacked, so `P` is the colour of one layer at full
strength. That is neither an upper nor a lower bound on what renders: blur
weakens a layer, and stacked layers (an all-round layer under an offset one)
strengthen it. Sheet 2's rendered weakest edges sit above this figure in
five places (`edges-measure.json`, `weakest.worstSim`: light sunken panel 12.1
against 8.69, light field 11.4 against 11.03, dark box in a well 19.1 against
17.62; and two inside the file's one-decimal rounding, dark quiet button 17.2
against 17.18 and dark lilac button 58.1 against 58.06), and at or below it
in most others. Three are clear cases, which is enough to show the figure is
not an upper bound.

**Presence.**

**L49.** In words: crossing an element's boundary, the eye can meet
three steps: from the backdrop to the fill, from the backdrop to the edge
pixel, and from the edge pixel to the fill. The element's edge is as present
as the largest of them. That is measured in each view, and the result is the
view where it is smallest.

In symbols, for an element with fill `F`, on a backdrop `K`, whose all-round
layers give edge pixels `P1 … Pn`:

```
presence_view = max( sep_view(F, K),  sep_view(Pi, K) for each i,  sep_view(Pi, F) for each i )
presence      = min over the contract's views of presence_view
```

With no all-round layer the result is the fill step alone, `sep(F, K)` at its
worst view. `F` and `K` must each resolve to an opaque colour
(L38); otherwise the rule cannot be measured.

**L107.** A recipe whose `fill` is `"backdrop"` describes an element that
paints no fill of its own (its Sass site paints `transparent`, or nothing).
Its `F` is then the rule's backdrop `K`: the fill step is 0, and an inset
layer is blended over `K`. This is what the stylesheet paints, so it is what is
measured; naming a token the site does not paint is the fault C11 refuses. The
new sorbet has no `"backdrop"` fill: DECISIONS row 28 chose the milk slab
for the quiet button. Had it stayed transparent, `quiet` would have had one,
and its light floor would have fallen to 15.0 (R261, the quiet button on the
bare page, measures 15.88 with the page showing through, against 18.18 on its
approved milk fill; `rev2/rev2.ts`). The value stays in the type for a theme
whose element paints no fill.

**L50.** Worked examples, all four views, typical / protan / deutan / tritan
(`gen.ts`, `out/worked.txt`):

| Case | Pixels | Backdrop to fill | Edge pixel to backdrop | Edge pixel to fill | Presence |
|---|---|---|---|---|---|
| Light card on the page: fill `#fffbf1` on `#fef4dc`; layer `0 0 6px 1px #a16e32 @ 0.38`, outside | `P` = `#dbc19b` | 2.77 / 3.00 / 2.68 / 2.36 | 14.76 / 15.54 / 14.52 / 14.40 | 17.10 / 18.17 / 16.73 / 16.70 | **16.70** (tritan) |
| Light field on a card: fill `#fffbf1` on `#fffbf1`; layer `inset 0 0 0 1px #815b1f @ 0.24` | `P` = `#e1d5bf` | 0 | 11.32 / 11.72 / 11.17 / 11.03 | the same | **11.03** (tritan) |
| Dark card on the page: fill `#342417` on `#211409`; layer `0 0 0 1px #fef4dc @ 0.18`, outside | `P` = `#493c2f` | 7.06 / 6.93 / 7.09 / 7.09 | 16.07 / 16.23 / 16.06 / 16.07 | 9.03 / 9.31 / 8.98 / 9.03 | **16.06** (deutan) |
| Dark field on a card: fill `#140903` on `#342417`; layer `inset 0 0 0 1px #fef4dc @ 0.34` | `P` = `#64594d` | 12.24 / 12.04 / 12.31 / 12.28 | 19.53 / 19.99 / 19.44 / 19.51 | 31.73 / 32.00 / 31.71 / 31.73 | **31.71** (deutan) |

Appendix B gives the same breakdown for all 22 edge rules in both modes.

**L51.** **What presence is not.** It is a heuristic and a regression baseline,
not a bound and not a verdict. It can rank a blurred glow above a crisp line
that renders weaker (proposal §5: 18.5 by the proposal's two-boundary arithmetic, 9.0 rendered), and
it can read below what renders (the five cases of L48). So a passing figure is
neither necessary nor sufficient for an edge that shows; what it does
guarantee is that the recipe has not drifted from the approved one. Whether an
edge is enough is judged from rendered pixels in steps 2.4 and 2.6 (§12).

### 5.4 An edge used as a colour

**L52.** `edge:<element>` as a side of a `sep` rule means that element's edge pixel
`P`. It is defined only when the element's `rest` has exactly one all-round
layer and that layer is inset, because then `P` depends on nothing but the
element (it is blended over its own fill). Anything else cannot be measured.
The new sorbet uses it for one element, `edge:field`: `#e1d5bf` in light and
`#64594d` in dark.

### 5.5 Emitting

**L53.** A preset with `edges[mode]` emits, in that mode's block after the
shadow lines (and after `--sb-button-font-size` and `--sb-button-font-size-sm`
in the light block), one line
per element in the order of `EdgeElement` as §4.1 writes it:
`--sb-edge-<element>: <rest>;`, then `--sb-edge-<element>-hover` and
`--sb-edge-<element>-press` where the recipe has them. A layer is written
`[inset ]<x> <y> <blur> <spread> <colour>` with each length as `0` or
`<n>px`, the colour as `withAlpha(color, alpha)`, and layers joined by `, `.
Examples (`gen.ts`):

```
  --sb-edge-container: 0 0 6px 1px rgb(161 110 50 / 0.38), 0 2px 4px 0 rgb(161 110 50 / 0.18), 0 10px 28px -8px rgb(161 110 50 / 0.26);
  --sb-edge-field: inset 0 1px 3px 0 rgb(5 2 10 / 0.7), inset 0 0 0 1px rgb(254 244 220 / 0.34), 0 1px 0 0 rgb(254 244 220 / 0.12);
```

**L54.** An element with an empty `rest` emits `--sb-edge-<element>: none;`. CORRECTION 2026-10-05 (L146): it emits `--sb-edge-<element>: 0 0 #0000;`.

**L55.** **A mode that lacks what the other mode defines resets it, property
by property.** The unit is the emitted custom property, never the element. For
every property the light block emits from optional data, namely each optional
colour token `--sb-<name>` and each edge property `--sb-edge-<element>`,
`--sb-edge-<element>-hover` and `--sb-edge-<element>-press` (L53), that the
dark block does not emit, each dark block emits `--sb-<that name>: initial;`,
after everything else in the block, in the order the light block emits the
names. So a dark recipe that has `rest` and no `hover` still resets the light
`-hover` property. In words: `initial` makes a custom property count as not
set, so the seam's fallback applies in dark instead of the light value
inherited from `:root`. Without it, between steps 2.2 and 2.6 sorbet's old dark
page would paint light-mode halos, light hover and press halos, and a milk
field. For the new sorbet in steps 2.2 to 2.5 that is 41 lines in each dark
block (CORRECTION 2026-10-06: 42 since L151 added `--sb-halo-room: initial`; L195 (b)): the 20 optional tokens, the 13 `rest` properties, and the 4 `-hover`
and 4 `-press` properties of the four filled elements. From step 2.6 it is
none. (`--sb-button-font-size` and `--sb-button-font-size-sm` are not reset:
they are the same in both modes.)
Revision 1 said "for it" of an element, which read as 16 lines or as 30;
this is the one reading.

**L56.** The four WCAG presets define no optional token, no `edges` and no
`buttonLabel`, so `themeCss` produces for them the bytes it produces today. No code path checks "is this a WCAG preset": the
absence of the data is the whole switch.

## 6. The `legibility` contract

### 6.1 The record

**L57.** `contracts.legibility` is:

- `name`: `"legibility"`.
- `calibratedFor`: one sentence that says it was calibrated for one reader,
  the owner, by eye on sample sheets 1 and 2 on 2026-10-03, and that the
  three simulations stand in for a colour-vision type that has not been
  formally tested. The wording is the implementer's; a test checks that it
  contains `one reader` and `2026-10-03`.
- `views`: `["typical", "protan", "deutan", "tritan"]`.
- `checks`: `["roles-complete", "hierarchy", "edge-not-fill", "fills-steady", "edge-direction", "label-type"]` (§9).
- `tiers`: the 21 of L61.

**L58.** Of PR 1's seven tiers it lists **one**, `scrim`, with the same metric,
floor and reasons as `wcag-aa`. It leaves out the other six:

| PR 1 tier | Why `legibility` does not list it | What holds those pairs instead |
|---|---|---|
| `text` (42 rules a mode) | one ratio for body copy, links and labels cannot see where this palette is tight (proposal §5, "Why Lc") | `body`, `secondary`, `on-wash`, `label` |
| `text-subtle` (2) | the same | `placeholder` |
| `control-border` (2) | the 3:1 outline is the look decision 1 retires | `mark-line` (the control ring), `edge-field` (the field) |
| `shape` (4) | the same | `primary-solid` on `bg` and `surface`: `mark-line` (R192, R193, the tab indicator). `secondary-solid` on `bg` and `accent-solid` on `bg`: **nothing, on purpose**. They paint only the filled buttons' `--edge` (`atoms/_button.scss:97`, the border and the old falloff), which sorbet replaces: the border through `filled-line` (transparent) and the falloff through the edge recipe (L70). Their hexes are held where they are painted, as `secondary-mark` and `accent-mark` on the track (R185, R186). (Revision 2 said `mark-area` and `mark-line` held all four; verification finding N15) |
| `focus` (2) | two backgrounds; a ratio | `focus-visible`, 20 backgrounds |
| `chart` (16) | `chart-6` `#e8672e` on the new page `#fef4dc` is 2.99:1, under the tier's 3 (§14.0, DECISIONS row 25) | `chart-mark` |

So of the 261 rules that apply in a mode, `legibility` holds 193 (2 + 191)
and leaves 68 unheld; `wcag-aa` holds 70 and leaves 191 unheld (§11).
(Revision 1: 263, 195 and 193. Six edge rules are withdrawn by M4 and four
mark rules added by m10.)

### 6.2 How a floor gets its number

**L59.** (CORRECTION 2026-10-06, DECISIONS row 46 and the owner's answer to the verifier's N-2: one exception.
The dark `edge-sunken` floor stays 13.3 although its one rule now measures 15.92, which this rule would pin at
15.1. So the gate alone would pass a return to the rejected `@ 0.14` recipe (14.06); sorbet's pinned golden (C4)
and step 2.6's acceptance #1 catch it, byte for byte. L195 (a).) Each floor is a regression baseline: the weakest pair of its tier,
as the approved values measure it at the worst view, in that mode, minus a
margin, rounded **down** to one decimal.

- **Lc tiers:** the margin is 2.0.
- **Separation and presence tiers:** the margin is 5% of the measurement, and
  never less than 0.5.

In symbols: `floor = floor1(m − 2)` for Lc, `floor = floor1(m − max(0.5, 0.05 × m))`
otherwise, where `floor1` rounds down to one decimal.

Why these sizes. One step of one 8-bit channel, on either colour of any text
or separation pair of appendix A, moves a measurement by at most 0.593 Lc
(dark R087, the text side) and 0.409 separation (dark R183, the track side)
(`rev2/onestep.ts`; revision 1 quoted 0.42 and 0.25 from a sample). So the Lc
margin of 2.0 is about 3.4 such steps: no single rounding step can fail an Lc
floor. The separation and presence margin is never less than 0.5, which is
about 1.2 steps: one step cannot fail it, but two in the same direction can,
and three tiers sit within 0.1 of that minimum in one mode (`palette`, 0.58; dark
`divider`, 0.58; light `edge-sunken`, 0.59). That is the intended tightness:
these floors are regression baselines, and a value that moves two 8-bit steps
in a pinned theme has changed. (Revision 1 of the proposal had margins of
0.06.) And each margin is under half the smallest step the owner chose
between: sheet 1's ink ladder moves 5.4 Lc a step, and the three edge
treatments sit 2.7 to 4.7 apart. So a whole ladder step of drift fails **at
the tier's weakest member**. The other members carry more slack (dark
`edge-filled` has 70.95 against 54.7; dark `mark-area` 70.27 against 45.7), and
a change to one of them is caught by sorbet's pinned golden file (C4), which
shows every changed value as a diff, not by its floor.

**L60.** A floor is re-pinned only when the owner approves a new sheet. It is never
lowered by an agent (the repo's `CLAUDE.md`, "A preset's declared contract is
binding").

### 6.3 The floors

**L61.** Script: `evaluate.ts new` (`floors.json`), and `rev2/rev2.ts` for
revision 2. "Weakest" is the smallest measurement in the tier for the new
sorbet; appendix A has every pair. † marks a weakest pair no sheet drew before
sheet 3. Each † of revision 1 was drawn on sheet 3 and passed by the owner as
drawn (DECISIONS row 27; the chart pairs also row 25), so those floors stand
as approved. One floor moved in revision 2, `edge-filled` light, 15.7 → 17.7;
revision 2 marked it provisional, and the owner passed its pairing on
2026-10-04 (DECISIONS row 29), so no floor is provisional.

| Tier | Kind | Metric | Rules | Light: weakest → floor (margin) | Dark: weakest → floor (margin) |
|---|---|---|---|---|---|
| `scrim` | text | ratio | 2 | 4.5, as `wcag-aa` (new values measure 5.56 and 4.68) | the same |
| `body` | text | lc | 15 | 84.86, `text` on `bg` → **82.8** (2.06) | 85.24, `text` on `surface-raised` → **83.2** (2.04) |
| `secondary` | text | lc | 26 | 76.30, `text-muted` on `bg` → **74.2** (2.10) | 66.79, `text-muted` on `surface-raised` † (row 27) → **64.7** (2.09) |
| `on-wash` | text | lc | 8 | 75.33, `info-text` on `info-subtle` → **73.3** (2.03) | 78.22, `success-text` on `success-subtle` → **76.2** (2.02) |
| `tinted` | text | lc | 17 | 66.45, `text-muted` on `selected-wash` → **64.4** (2.05) | 59.77, `text-muted` on `success-subtle` † (row 27) → **57.7** (2.07) |
| `label` | text | lc | 19 | 70.92, `on-secondary` on `secondary` → **68.9** (2.02) | the same hexes (decision 8) → **68.9** (2.02) |
| `placeholder` | text | lc | 6 | 64.17, `text-subtle` on `bg-subtle` † (row 27) → **62.1** (2.07) | 47.02, `text-subtle` on `surface-raised` † (row 27) → **45.0** (2.02) |
| `mark-area` | shape | sep | 9 | 13.10, `control-checked` on `field-fill` → **12.4** (0.70) | 48.20, `danger-mark` on `bg-subtle` † (row 27) → **45.7** (2.50) |
| `mark-line` | shape | sep | 21 | 20.63, `primary-solid` on `selected-wash` → **19.5** (1.13) | 23.23, `danger-mark` on `danger-subtle` → **22.0** (1.23) |
| `divider` | shape | sep | 2 | 11.97, `border` on `surface` → **11.3** (0.67) | 11.08, `border` on `surface` → **10.5** (0.58) |
| `focus-visible` | focus | sep | 20 | 26.13, `focus-ring` on `primary` → **24.8** (1.33) | 17.96, `focus-ring` on `accent-subtle` † (row 27) → **17.0** (0.96) |
| `tell-apart` | distinction | sep | 4 | 12.18, `focus-ring` against `border-strong` → **11.5** (0.68) | the same hexes → **11.5** (0.68) |
| `palette` | distinction | sep | 6 | 5.38, `secondary` against `success` → **4.8** (0.58) | the same hexes → **4.8** (0.58) |
| `chart-mark` | chart | sep | 16 | 29.98, `chart-3` on `bg` † (rows 25, 27) → **28.4** (1.58) | 44.20, `chart-6` on `surface` † (rows 25, 27) → **41.9** (2.30) |
| `edge-container` | edge | presence | 2 | 16.70, on `bg` → **15.8** (0.90) | 16.06, on `bg` → **15.2** (0.86) |
| `edge-floating` | edge | presence | 2 | 17.77, on `surface` → **16.8** (0.97) | 21.58, on `surface` → **20.4** (1.18) |
| `edge-field` | edge | presence | 3 | 11.03, on `surface` → **10.4** (0.63) | 31.71, on `surface` → **30.1** (1.61) |
| `edge-sunken` | edge | presence | 1 | 8.69, on `surface` → **8.1** (0.59) | 15.92, on `surface` → **13.3** (2.62; pinned at revision 3.6's 14.06, L60, L195 (a)) |
| `edge-quiet` | edge | presence | 2 | 16.90, on `surface` → **16.0** (0.90) | 17.18, on `surface` → **16.3** (0.88) |
| `edge-filled` | edge | presence | 8 | 18.73, `filled-secondary` on `bg` (R265; R273 the same) † (row 29) → **17.7** (1.03). Revision 1: 15.7, pinned to R269, withdrawn | 57.60, `filled-secondary` on `surface` → **54.7** (2.90) |
| `edge-status` | edge | presence | 4 | 15.46, `status-success` on `surface` → **14.6** (0.86) | 21.45, `status-danger` on `surface` → **20.3** (1.15) |

**L62.** Every floor above except `scrim`, `label`, `tell-apart` and `palette` is
written per mode, `{ light, dark }`. Those four are one number.

**L63.** The floors in the table are the numbers to build and test. "Weakest" is
printed to two decimals and the floor was computed from the unrounded value,
which matters in two cells: light `secondary` is 76.2953 (floor 74.2, not
74.3) and dark `edge-floating` is 21.5781 (floor 20.4, not 20.5). `exact.ts`
prints all forty to four decimals.

**L64.** The owner's three decisions of 2026-10-04 are met as follows. Decision 20
(pinned to the sheets, per mode): L59. Decision 21 (keep the dark
muted `#d7c9ae` and subtle `#b3a58d`, with their own floors): the dark
`secondary` and `placeholder` floors are pinned to those two hexes; they sit
at 64.7 and 45.0, not at the 70 and 51 the record quotes, because the record
quotes them on a card and the tier also holds them on a raised surface, where
they measure 66.79 and 47.02. Those two pairings were not on sheets 1 or 2;
the owner passed them on sheet 3 (row 27), so the floors are pinned to
approved pairings, as decision 20 asks. Decision 22 (a floor per kind of
element, the field's pinned to the field as approved, 11.0 on a card):
`edge-field` light is 10.4, pinned to 11.03. Decisions 25 and 26: §14.

**L65.** The `label` tier carries
`requires: { buttonLabelPx: 16, buttonLabelSmallPx: 14, buttonLabelWeight: 600 }`
(the small size from DECISIONS row 31). In words: Lc 70.92
on a fill is an acceptable **button** label only at the size the owner
approved it at (decision 6); at 14px the published guidance asks about 75.
For the small button's 14px label, DECISIONS row 31 records exactly this: the
question that was answered stated "Labels on lilac and blush read Lc 70.9",
and no sheet drew a 14px label; the size was decided on that figure, not by
eye (L115). Check C9 holds the preset's `buttonLabel` to both sizes. C9 speaks for the button
only. The same colour pairs are also painted at 12px semi-bold by the solid
badge (`atoms/_badge.scss:9-10, 24-27`), which no type size in the theme
controls: the tier's number is not a claim about that size, and L111 says what
holds it instead. The small button is a third size, decided separately: L115.

**L115.** **The small button's label (DECISIONS row 31).** Sorbet's
`.sb-button--sm` sets its label at 14px semi-bold through
`--sb-button-font-size-sm` (L19); the four frozen presets keep 12px. What
holds it:

- **Its size** is held by C9 (`buttonLabel.smallPx` ≥ 14) and painted through
  `button-label(sm)`, which C10 requires to be read. Revision 2 left the small
  button out: it painted 12px labels on the label pairs while C9 claimed to
  hold "the button" (verification finding N2).
- **Its colours** are the same pairs as the default button's, so the filled
  small buttons are held by the `label` tier (R153 to R170), floor 68.9 in
  both modes. That floor was pinned to the pairs as approved at 16px
  (decision 6); no floor is pinned to the 14px size, and none is raised for
  it. Measured at the worst view, the same in both modes (the figure does not
  depend on size): lilac (primary) `#472400` on `#dac5fc` Lc 71.32 (deutan);
  blush (secondary, danger) on `#f9c3c6` 70.92 (protan); butter (accent) on
  `#f5e3a2` 82.57 (tritan). The published guidance L65 cites asks about 75 at
  14px; two of the three sit under it. What row 31 records, and no more: the
  question the owner answered stated "Labels on lilac and blush read Lc 70.9",
  and no sheet drew a 14px label. So the 14px small label is decided on that
  figure and has not been seen. (Revision 3 called row 31 "the owner's
  decision to use 14px with these colours", which claimed more; verification
  finding N18.) What would retire it: a small button the owner finds hard to read,
  or "small buttons feeling crowded" (row 31).
- **The other small variants** take their colours from tiers that are not
  `label` and are held there, not by size: outline (`text` on `quiet-fill`)
  by `body`, light 88.78 / dark 85.24; ghost (`text-muted` on the surface it
  sits on) by `secondary`, light 76.30 on the page and 79.89 on a card, dark
  72.42 and 70.32; soft (`primary-text` on `primary-subtle`) by `on-wash`,
  84.18 / 79.90; link by `secondary` (`rev2/rev3.ts`).

### 6.4 The reasons

**L66.** Each tier's `why` and `retire` must say at least this. The sentences are
the implementer's; each must be non-empty, and a failing tier's two sentences
are printed once under its failures by the gate and the reports.

| Tier | `why` must say | `retire` must say |
|---|---|---|
| `scrim` | copied from `wcag-aa` | copied |
| `body` | paragraph text and headings on the page and on surfaces, at the Lc the owner chose the ink at | the owner picks a new ink on a sheet, or body type changes size |
| `secondary` | secondary text, links and brand-coloured text on the page and on surfaces | the owner finds small text hard to read while the gate is green (decision 21) |
| `on-wash` | status and selected text on its own wash | the wash strength changes, or status text stops being the ordinary ink |
| `tinted` | secondary text and links on a tinted ground: the well or a wash | the same as `secondary` |
| `label` | a label on a full-strength fill: approved by eye for the default button at 16px semi-bold (decision 6), and for the small button at 14px semi-bold on the figure alone (row 31, L115); C9 holds the button to both sizes; the 12px solid badge paints the same pairs and is not size-checked (L111) | a fill gets lighter or darker, or either button label size changes (decision 6, row 31) |
| `placeholder` | placeholder and disabled text; nothing a reader needs | `text-subtle` being used for text a reader needs |
| `mark-area` | a filled shape that carries a state with no label, against what it is read against | a bar or switch state missed on a real screen |
| `mark-line` | a ring, bar or status mark 3px or thinner | the ring or a status mark proving faint or heavy in use |
| `divider` | a dividing line against the surface it is drawn on; an edge colour may never equal its fill (proposal §4) | dividers being dropped from the look |
| `focus-visible` | the one deliberately firm edge, against everything it can be drawn on | never by this change; it may go up |
| `tell-apart` | two edges whose difference is the message: invalid, focused, resting | each of them gaining a second cue that needs no colour |
| `palette` | no two brand fills may become one colour for one kind of reader | a formal colour-vision test: then one view is checked |
| `chart-mark` | a chart mark against the surface and the page; a regression baseline of the shipped chart colours on the new surfaces | the chart proposal (decision A3) |
| `edge-*` (seven) | the named element's edge against what it sits on, pinned to sheet 2's recipe | the owner reporting a page where things run together while the gate is green: the floor goes to that page's measurement |

## 7. The rules

**L67.** `RULES` gains 191 entries, none restricted to a mode, in the order of
their rule numbers: R087 to R279 without the six withdrawn in revision 2
(R268, R269, R270, R271, R274, R275), then R280 to R283. (Appendix A prints
R280 to R283 in the `mark-line` table, where they belong by tier; their place
in `RULES` is last.) Appendix A is the literal list: each rule's `fg`, `bg` and
tier, what it measures for the new sorbet in each mode, and whether the same
pair is in today's 86 ("today") or not ("new"). 66 are today's pairs re-held
under a new tier; 125 are new. `RULES.length` is 277. A rule's `why` is the "for" column, or
for a tier with one reason, the tier's line in the summary below; the
sentence is the implementer's and must be non-empty.

**L68.** All 191 run in both modes. Floors differ by mode; rules do not.

Summary, and the scope questions the proposal left open:

| Tier | The pairs, in words | Decided here |
|---|---|---|
| `body` | `text`, `text-strong`, `heading-ink` and `text-caption` on `bg`, `surface`, `surface-raised`; `text` on `field-fill`; the tooltip, `bg` on `text`; `text-inverse` on `text` | The tooltip gets a rule, and it reads what the Sass paints (`atoms/_tooltip.scss:13-14`), which is `bg` on `text`, not `text-inverse` |
| `secondary` | `text-muted` on the three surfaces and `field-fill`; `text` on `bg-subtle` and `surface-sunken`; `link` and `link-hover` on the three surfaces; all seven `-text` roles on `bg` and `surface` | Six `-text` on `surface` are new pairs |
| `on-wash` | each `-text` on its own `-subtle`; `primary-text` on `selected-wash` | Its own tier (appendix G, G7) |
| `tinted` | `text-muted` on `bg-subtle`, `surface-sunken`, `selected-wash` and the seven washes; `link` on the seven washes | New. Sheet 2 draws muted text on a selected row |
| `label` | each `on-X` on `X` and `X-hover` (7 + 7); `on-X` on `X-active` for `primary`, `secondary`, `accent`, `danger`; `on-primary` on `control-checked` (the tick and the radio dot) | The 19 pairs whose roles exist. `success-active`, `warning-active`, `info-active` are not roles. Two of the 19 hold a fill no Sass paints today: R168 and R169, because the pressed secondary and accent buttons paint `-hover` (`atoms/_button.scss:107-112`); they are kept because `wcag-aa` holds the same pairs and D6 makes the hex the resting fill's |
| `placeholder` | `text-subtle` on `bg`, `surface`, `surface-raised`, `field-fill`, `bg-subtle`, `surface-sunken` | Four are new |
| `mark-area` | progress bar on its track; switch on against off; slider thumb on its track; checked against unchecked; five toned progress bars on the track | Against the thing each is read against, not the page |
| `mark-line` | the control ring on four grounds; the switch ring on its off track; the tab indicator on `surface`, `bg` and the selected wash; the selected bar on its wash; four status marks on a card, on their own wash, and on a raised surface (R280 to R283, revision 2) | The tab indicator is checked on `surface` as well as `bg`. The raised surface is where the library paints a status mark: the toast's stripe, `molecules/_toast.scss:66` on the toast's `surface-raised` (`:23`). The card rules stay, because decision A5 names the card |
| `divider` | `border` and `border-subtle` on `surface` | On a card only: the placements sheet 2 drew (§13) |
| `focus-visible` | `focus-ring` on the five surfaces, `field-fill`, the seven fills and the seven washes | Listed literally. "Every brand fill" is seven roles. Where it touches what: the focus mixin's default offset is 2px (`abstracts/_mixins.scss:29-38`), so a ring round a button sits on the surface beside it (R204 to R209), 2px from the fill; but fifteen `focus-ring(…)` calls draw it at offset 0 or less, and two of them put it directly against a lilac fill: the selected calendar day (`molecules/_calendar.scss:106`, `&__day`, `focus-ring(0)`, filled at `:139`) and the current page (`molecules/_pagination.scss:29, 38`). So R210 (`primary`, `#dac5fc`), which pins the light floor, is a pair the stylesheet paints touching, and the owner passed that placement (DECISIONS row 30). R216 is the `info` role, which neither site paints: it measures the same hexes, so its figure is R210's, and it is kept because `info` is a fill a ring can sit beside. R211 to R215 hold the ring against the fill it surrounds at 2px. (Revision 2 cited `_calendar.scss:48`, which is the month arrows, and called R216 painted; verification finding N11.) The selected tab (`_tabs.scss:20`, offset −4px) and the current sidebar item (`organisms/_sidebar.scss:29`, −2px) draw it inside their wash, which R217 measures |
| `tell-apart` | invalid rim against the resting field edge; invalid rim against the focus ring; focus ring against the control ring; focus ring against the resting field edge | The resting field edge is `edge:field`, the field's own inset line, not the caramel (appendix G, G24) |
| `palette` | the six pairs among `primary`, `secondary`, `accent`, `success` | "The four fills" are these four roles. `info`, `danger`, `warning` are aliases of the first three by decision 13 and are not compared |
| `chart-mark` | `chart-1` to `chart-8` on `surface` and on `bg` | Both grounds, as today. `chart-muted` is not held, as today |
| `edge-*` | §5; 22 rules | One backdrop list per element class (below) |

**L69.** The backdrops each element class is gated on. Each was drawn on sheet 2,
or (†) is the same recipe on the other approved surface.

| Tier | Rules |
|---|---|
| `edge-container` | `edge:container` on `bg` (a card on the page); on `surface-sunken` (a box in a well) |
| `edge-floating` | `edge:floating` on `surface`; on `bg` † |
| `edge-field` | `edge:field` on `surface`; on `bg` †; on `surface-raised` † |
| `edge-sunken` | `edge:sunken` on `surface` |
| `edge-quiet` | `edge:quiet` on `surface`; on `bg` |
| `edge-filled` | each of the four `edge:filled-X` (primary, secondary, accent, danger) on `surface` and on `bg`; on `bg` † for primary, secondary and danger (sheet 2 drew only the butter and robin's-egg buttons on the page), all three passed by the owner on 2026-10-04 (DECISIONS row 29). Revision 2 marked only secondary and danger; R263, lilac on the page, was undrawn too (verification finding N5) |
| `edge-status` | each of the four `edge:status-X` on `surface` |

What this checks of decision A14, and what it does not. A14 has two
conventions: robin's egg is never a lone button on the bare page, and butter
is used small, on cards. The gate does not enforce either; it holds a
placement to a floor, which is a different thing from a usage rule. A butter
button on the bare page (`edge:filled-accent` on `bg`) is checked and passes,
18.98 against 17.7, where the fill alone is 5.63: the halo is what passes; so
A14's butter convention is a matter of taste the gate does not speak to. A
robin's-egg button cannot be checked, because the library has none (there is
no `sb-button--success`; `atoms/_button.scss:92` loops secondary, accent and
danger), so its convention stays a usage rule, written in the docs of step
2.8. (Revision 1 said this paragraph turned both conventions into a check, and
pinned the light floor to the robin's-egg button that does not exist.)

### 7.1 Where each input lives

**L70.** This is the map the proposal's largest open defect asks for (appendix
G, G5): for each thing a new rule reads, the token or data field the checker
reads, and the Sass site that must paint from the same name. A site is
re-pointed in the step named; until then the rule passes on a value the
stylesheet does not yet paint, which is why nothing merges before step 2.6.

| What is read | The checker reads | The Sass site that consumes it | Step |
|---|---|---|---|
| Control ring (checkbox, radio) | role `border-strong` | `atoms/_choice.scss:13` (unchanged) | 2.2 |
| Switch ring | optional `switch-ring` | `atoms/_switch.scss`, a new inset ring on `.sb-switch`, through `where-defined` with old value `revert-layer`, in the `where-defined` nested layer (L148, L149; revision 3.5, repair of 7a683fd) | 2.4 |
| Switch thumb's ring; slider track's ring (sheet 2, `build-edges.mjs:123, 125`) | optional `switch-ring` | `atoms/_switch.scss:26`, a 1px ring layer added before `shadow(xs)` on the thumb; `atoms/_slider.scss:29, 51`, an inset 1px ring on the track. Both through `where-defined` and `seam-only(switch-ring)`, with old values `shadow(xs)` (thumb) and `revert-layer` (track, in the `where-defined` nested layer) (L148, L149). Revision 2 to 3.4 wrote `seam(switch-ring)` as an added transparent layer and said that left the frozen presets pixel-identical; it did not (audit C2, C3). Without the thumb's ring the milk thumb sits 4.47 from the light off-track (`rev2/rev2.ts`); R191 holds the ring against that track | 2.4 |
| Switch off-track | optional `switch-off` | `atoms/_switch.scss:12` | 2.4 |
| Switch on-track; progress fill; slider thumb; tab indicator | role `primary-solid` | `atoms/_switch.scss:31`; `_progress.scss:16`; `_slider.scss:39, 59`; `molecules/_tabs.scss:52` (unchanged) | 2.2 |
| Progress track | role `bg-subtle` | `atoms/_progress.scss:10` (unchanged) | 2.2 |
| Slider track | optional `slider-track` | `atoms/_slider.scss:29, 51` | 2.4 |
| Toned progress bar | optional `success-mark`, `warning-mark`, `danger-mark`, `secondary-mark`, `accent-mark` | `atoms/_progress.scss:25` | 2.4 |
| Checked fill | optional `control-checked` | `atoms/_choice.scss:27, 53` | 2.4 |
| Tick and radio dot | role `on-primary` | `atoms/_choice.scss:48, 70` (unchanged) | 2.2 |
| Unchecked interior; field fill | optional `field-fill` | `atoms/_choice.scss:14`; `atoms/_input.scss:10` and its hand copies (`_number-input.scss`, `_color-input.scss`, `molecules/_combobox.scss`, `_date-range.scss`, `_input-group.scss`) | 2.4 |
| Resting field edge | data `edges[mode].field.rest`, emitted `--sb-edge-field` | `atoms/_input.scss:8` and the same copies; the border colour through `field-line` | 2.4 |
| Invalid rim | optional `danger-mark` | `atoms/_input.scss:34, 37` and the same copies (2.4); the danger button's rim, a local in `filled-edge` read ahead of the edge in its three shadows, and the danger status box's rim, one local with its edge through `where-absent` (2.5; L175, L178, revision 3.6) | 2.4, 2.5 |
| Selected wash | optional `selected-wash` | `molecules/_tabs.scss:48`; the current item of navbar, sidebar, menu, pagination | 2.4 |
| Selected bar | optional `selected-bar` | the same rows, a new inset 3px bar, through `selected-mark`, which writes it by `where-defined` with old value `revert-layer`, in the `where-defined` nested layer, and mirrors the start bar under `:dir(rtl)` (L148, L156). Not on the pills variant (L157) | 2.4 |
| Status mark | optional `success-mark`, `warning-mark`, `danger-mark`, `info-mark` | `molecules/_toast.scss:66`, on the toast's `surface-raised` (R280 to R283), through `seam(#{$tone}-mark)` (L179). The app sites of proposal §12 change at their own sync, not in step 2.5 (CORRECTION 2026-10-05, revision 3.6: this row named them as 2.5's; adversary m-1) | 2.5 |
| Status icon (the `Icon` atom's four status tones) | optional `success-mark`, `warning-mark`, `danger-mark`, `info-mark` | `atoms/_icon.scss:58-72`, `color: clr(X)` becomes `seam(X-mark)` (L179; added in revision 3.6) | 2.5 |
| Status icon ink (the four status glyphs) | optional `text-strong` on a wash or a surface; role `on-X` on a fill | the status slot `.sb-status` (`atoms/_icon.scss`), through `where-defined` falling back to `revert-layer`; `color: inherit` on `.sb-badge--solid > .sb-status` and `.sb-button > .sb-status` (L170, L186; added in revision 3.6) | 2.5 |
| Halo and deep tones | data: layer colours in `edges[mode]["filled-X"]` for X = primary, secondary, accent, danger, emitted `--sb-edge-filled-X`, `-hover`, `-press` | `atoms/_button.scss:70-90` (`--shadow-rest`, `-hover`, `-press`, read through `edge()` for the default button and each variant of the loop at line 92); border through `filled-line` at line 51 | 2.3 |
| Card edge | data `edges[mode].container`, emitted `--sb-edge-container` | `molecules/_card.scss:7-9`; border through `container-line`; the interactive card's hover reads the same edge and its line through `where-defined` (L152) | 2.4 |
| Raised card edge; sunken card's hover edge | data `edges[mode].container`; data `edges[mode].sunken` | `molecules/_card.scss`: `.sb-card--raised` `box-shadow: edge(container, shadow(md))`; `.sb-card--sunken` sets `--card-hover-edge: edge(sunken, shadow(lg))`, which the interactive hover reads with the container edge as its fallback (L165 (b), (c); the frozen presets keep `shadow(md)` and the `shadow(lg)` hover) | repair of 7a683fd |
| Room for the halo in clipping parents | derived from edge data, emitted `--sb-halo-room` | `molecules/_carousel.scss:28`, `molecules/_marquee.scss:33` (L151) | 2.4 fix |
| Menu, popover, modal, toast edge | data `edges[mode].floating` | `abstracts/_mixins.scss:176-186` (`popover-surface`, read by menu, popover, combobox, calendar, colour input) and the hand copies: `molecules/_toast.scss:20-27`, `organisms/_modal.scss:19-21`, `organisms/_drawer.scss:20-22`. The 1px `border-subtle` line `popover-surface` draws (`:180`) and the toast draws (`_toast.scss:22`) goes through `container-line` (L113) | 2.4 |
| Well and track edge | data `edges[mode].sunken` | `atoms/_progress.scss:10` and sunken panels | 2.4 |
| Quiet button edge | data `edges[mode].quiet` | `atoms/_button.scss:132-150` | 2.4 |
| Quiet button fill | optional `quiet-fill` | `atoms/_button.scss:144`, `background-color: transparent` becomes `seam(quiet-fill)` (fallback `transparent`: the frozen presets are unchanged) | 2.4 |
| Status box edge | data `edges[mode]["status-X"]` | `molecules/_alert.scss:15-25`, through `where-absent` falling back to `revert-layer`; the danger box with its rim (L178, revision 3.6) | 2.5 |
| Focus ring | role `focus-ring` | `abstracts/_mixins.scss:29-32`; `base/_root.scss:42-45`; `atoms/_color-input.scss:263-266` (unchanged) | 2.2 |
| Divider | roles `border`, `border-subtle` | existing sites (unchanged) | 2.2 |
| Heading ink | optional `heading-ink` | the heading rule of `base/_typography.scss:3-12`, a new `color` declaration | 2.4 |
| Strong text | optional `text-strong` | `atoms/_label.scss:7` | 2.4 |
| 12px captions | optional `text-caption` | the `text-subtle` sites L72 classes as captions | 2.4 |
| Button label size | `preset.buttonLabel`, emitted `--sb-button-font-size` and `--sb-button-font-size-sm` | `atoms/_button.scss:26` and `:193`, through `button-label()` (L19) | 2.4 |
| Each edge element's fill | the recipe's `fill` | the lines of L106 | 2.4, 2.5 |

**L106.** **Every edge element's fill is the fill its Sass site paints.** An
edge rule measures the element's fill against its backdrop and against its
edge pixels, so the fill named in the recipe must be the token the stylesheet
paints behind that element; otherwise the gate passes on a colour that is
never on screen (revision 1's quiet button: 18.18 on the page as measured,
15.88 as painted). The map, with the line that paints each fill at `e24df74`:

| Element | Recipe `fill` | The Sass that paints it | Equal by |
|---|---|---|---|
| `container` | `surface` | `molecules/_card.scss:8` | the same token |
| `floating` | `surface-raised` | `abstracts/_mixins.scss:182` (`popover-surface`); `molecules/_toast.scss:23`; `organisms/_modal.scss:19`; `organisms/_drawer.scss:20` | the same token |
| `field` | `field-fill` | `atoms/_input.scss:10` (today `clr(surface)`, re-pointed to `seam(field-fill)` in 2.4) and its hand copies (L70) | the same token after 2.4 |
| `sunken` | `surface-sunken` | `molecules/_card.scss:71` (`.sb-card--sunken`); `atoms/_progress.scss:10` paints `bg-subtle` | the same token; for the progress track, D1 (`bg-subtle` equals `surface-sunken`), which C11 checks. (`pre`, `base/_typography.scss:89`, also paints `surface-sunken` but is not a sunken element: no L70 row gives it the sunken edge, sheet 2 drew no code block, and it keeps its flat fill. Revision 3 listed it here; verification finding N21) |
| `quiet` | `quiet-fill` | `atoms/_button.scss:144` (today `transparent`, re-pointed to `seam(quiet-fill)` in 2.4) | the same token after 2.4 |
| `filled-primary` | `primary` | `atoms/_button.scss:40` | the same token |
| `filled-secondary`, `filled-accent`, `filled-danger` | `secondary`, `accent`, `danger` | `atoms/_button.scss:100` (the loop of line 92) | the same token |
| `status-X` (four) | `X-subtle` | `molecules/_alert.scss:15, 22` | the same token |

An element whose site paints no fill has `fill: "backdrop"` (L107). Check C11
(L79) holds the stylesheet to this table.

**L113.** **The floating line goes.** `popover-surface` draws a 1px border in
`border-subtle` (`abstracts/_mixins.scss:180`) and so does the toast
(`molecules/_toast.scss:22`); sheet 2's floating menu has none
(`build-edges.mjs:85`, the edge alone). Both read
`seam(container-line)` in step 2.4, as the card's border does: sorbet sets
`container-line` to `transparent`, so the 1px of layout stays and the line
does not show; the fallback `border-subtle` leaves the four frozen presets
pixel-identical. A visible line would be a second edge sheet 2 did not
approve, so it is not kept. (Sheet 3 finding S3-6.)

**L116.** **The danger button's rose rim is not in its edge recipe, on
purpose.** Decision 13 gives the delete (danger) button a 2px rose rim
`#d77784`, and sheet 2 draws it as a state layer above the halo
(`build-edges.mjs:109`, `inset 0 0 0 2px var(--danger-rim)`). The library
paints it from the optional token `danger-mark` (L70, "Invalid rim", step
2.5), so the rim's colour already has one source; writing it into
`edges[mode]["filled-danger"]` as a hex too would be a second copy that can
disagree with the token. So R272 and R273 measure the danger button by its
halo alone, which is a lower figure than what is painted: measured with the
rim added as an inset all-round layer, light 30.38 on a card and 28.48 on the
page, against 20.19 and 18.73 without; dark unchanged at 57.60 and 64.52, the
fill step being the larger term there (`rev2/rev3.ts`). Understating presence
cannot make the gate pass falsely; it holds the danger button to the same
halo as the blush one, whose recipe it shares. The rim itself is held where
it is a colour against what it sits on: `danger-mark` against the field edge
and the focus ring (R224, R225), on a card and on its wash (R200, R201), and
on a raised surface (R282). Against the blush fill it is 18.36 (deutan),
which no rule holds; it is listed in §13. (Verification finding N13,
rejected as a defect of the gate with this evidence; the omission is now
stated.) The rim's Sass form, on the button and on the danger status box, is
L175 and L178 (revision 3.6).

**L71.** The Sass reads an optional colour token only through a new accessor,
`seam($name)` in `abstracts/_tokens.scss`, which returns
`var(--sb-<name>, <fallback>)` with the fallback taken from a `$seams` map
that `generatedScss()` writes from `SEAMS`. So the fallback is typed once, in
`seams.ts`, and the checker and the stylesheet cannot disagree about it. An
unknown name is a compile error, as it is for `clr()`. An edge is read through
`edge($element, $fallback)`, which validates the element against a generated
list and takes today's declaration as the fallback at the site.

**L72.** **The 47 `text-subtle` sites** (decision A15; counted by
`grep -rn "clr(text-subtle)" src/styles`: 25 files). Each is put in one of two
classes by one rule: it is a **caption** when any element it colours renders
text smaller than 14px; otherwise it **stays** `text-subtle` (placeholders,
disabled text, icons, separators, and text of 14px or more). The size is not
read from the Sass, because about 39 of the 47 declare none near the colour
and inherit it: it is the computed `font-size` of each element the selector
matches in the playground, rendered under sorbet at the default root size,
read with the browser tooling of step 2.3. A selector that matches nothing in
the playground is a caption if its own rule or the nearest enclosing rule in
the same partial sets a size under `0.875rem`, and stays otherwise, and the
table says which way it was decided. Darker text at a larger size is never a
legibility loss, which is why "any element under 14px" decides. A caption site
becomes `seam(text-caption)`. Step 2.4's commit carries the 47-row table (file,
line, computed sizes, class, and how the size was obtained); the count is
re-checked by the same grep.

## 8. The mark-strength status tokens (decision A5)

"Danger" does two jobs: a pale fill behind a label, and a mark with no label
(a toast's stripe, linecook's alarm ring, imagefeed's armed border). As a
pastel the fill cannot do the second job. So each status gets an optional
*mark* token, and the stylesheet and the apps draw marks with it.

**L73.** The four status mark tokens, the same hex in both modes, and what
each measures (separation, worst view; `explore2.ts`, appendix A):

| Token | Hex | Fallback | On a card, light / dark | On its own wash, light / dark | As a bar on its track, light / dark |
|---|---|---|---|---|---|
| `success-mark` | `#00b5b8` | `success` | 24.45 / 42.30 | 21.24 / 28.79 | 20.25 / 54.34 |
| `warning-mark` | `#bb9c12` | `warning` | 29.05 / 42.93 | 25.11 / 28.51 | 24.67 / 55.02 |
| `danger-mark` | `#d77784` | `danger` | 30.38 / 36.22 | 24.31 / 23.23 | 26.12 / 48.20 |
| `info-mark` | `#b096d7` | `info` | 27.03 / 44.13 | 20.63 / 31.29 | not a progress tone |

**L74.** Each must clear the `mark-line` floor (19.5 light, 22.0 dark) on `surface`
and on its own `-subtle` wash (rules R196 to R203), and on `surface-raised`,
where the toast paints it (R280 to R283: 24.45 / 29.05 / 30.38 / 27.03 in
light, the same as on a card because the light raised surface is the card's
hex; 35.94 / 36.41 / 29.81 / 37.65 in dark). As a toned progress bar it
must clear the `mark-area` floor (12.4 light, 45.7 dark) on `bg-subtle`.

**L75.** How the values were picked, so the pick can be repeated: for each status,
the lightest of its fill's shade, halo tone and deep tone that clears the
`mark-line` floor on a card and on its own wash in both modes. For danger the
decided rose rim `#d77784` is taken first (decision 13), and it clears.

| Status | Shade | Halo tone | Result |
|---|---|---|---|
| success | `#66c2c4`: 16.51 on its wash in light, under 19.5 | `#00b5b8`: clears | halo tone |
| warning | `#ccb563`: 17.47 on its wash in light, under 19.5 | `#bb9c12`: clears | halo tone |
| info | `#b096d7`: 20.63, clears | — | shade |

The deep tones are not used: in dark they fall to 10.01 to 14.45 on their own
wash.

**L76.** Two more mark tokens exist for the toned progress bars of the two brand
hues that are not statuses: `secondary-mark` `#d29397` and `accent-mark`
`#ccb563` (the shades; 21.75 and 17.03 on the track in light, 54.93 and 62.30
in dark). They are held by `mark-area` only.

**L77.** The success and warning marks are the two colourful values in this spec
nobody has seen as a solid: on the sheets those hexes are only ever a glow at
60 to 70% strength. They are on the third sheet's list (§15, item 3).

**L78.** What the apps get (proposal §12): linecook's alarm ring drawn in
`--sb-danger-mark` on `--sb-danger-subtle` measures 24.31 in light and 23.23
in dark at the worst view, against about 6 for the pale fill. Today's vivid red
`#cb2c31` on its own subtle `#ffe9e7` measures 39.46 at the worst view (deutan;
43.43 in typical vision), as the proposal says ("39.5 at worst"); the ring is
weaker than today and far stronger than the pastel alone. (Revision 1 set the
new worst view beside today's typical figure.) The app
edit reads `var(--sb-danger-mark, var(--sb-danger))`, so it is safe before or
after the sync.

## 9. The checks with no number

Six true-or-false checks belong to a contract (its `checks` list); two more
are about the mechanism itself. "A legibility mode" below means a preset and
mode whose declared contract lists the check. `wcag-aa` lists none, so none of
C1 to C3 or C7 to C9 ever runs on ocean, forest, noir or midnight, in either
mode, nor on a sorbet mode that still declares `wcag-aa`.

**L79.** A new export `checkStructure(preset: Preset): StructureFailure[]`
(`{ preset, mode, check, detail }`) runs the listed checks for each mode.
`tools/build-tokens.ts`, its scaffold copy and the three reports run it beside
`checkPreset`, and a non-empty result fails the build and the report exactly as
a contrast failure does.

| # | `CheckName` | Scope | True when |
|---|---|---|---|
| C1 | `roles-complete` | a legibility mode | every one of the 69 names in `SEMANTIC_COLOR_NAMES` has an own, non-empty string value in the mode's record that `parseColor` reads. (This is what makes `danger-active` exist for sorbet. The four WCAG presets keep 68: that defect stays deferred, proposal §9 item 16, so check 4 below is not contradicted) |
| C2 | `hierarchy` | a legibility mode | by the size of Lc on `bg`, in typical vision: `heading-ink` ≥ `text` > `text-muted` > `text-subtle`. Light: 93.88 ≥ 85.84 > 77.23 > 69.98. Dark: 91.87 ≥ 91.87 > 73.65 > 53.35. "Darker" is not the measure, so nothing reverses in dark; the `on-X` label inks are not in the ordering (they sit on fills, not on the page) |
| C3 | `edge-not-fill` | a legibility mode | (a) for each of these pairs the first, blended over the second when see-through, is not the same hex as the second: `border`, `border-subtle` each against `surface`, `surface-raised`, `bg`; `border-strong` against `field-fill`, `surface`, `bg`; `switch-ring` against `switch-off`; and (b) every element in the mode's `edges` has at least one all-round layer in `rest`, and on every backdrop its rules name, no edge pixel is the same hex as the fill. This is the fault of proposal §4 stated exactly: the line round a card was the card's own colour (c), since revision 3.3: for each of `container-line` (serving `container`, `floating`), `field-line` (`field`) and `filled-line` (every `filled-X`) whose elements the mode's `edges` define, the record defines the token and its value parses with alpha 0 (L133) |
| C4 | — (the golden gate, PR 1) | all five presets | unchanged. Sorbet's golden is regenerated on purpose in steps 2.2 and 2.6 (§11.4) |
| C5 | — (`tools/test-contracts.ts`, PR 1) | `wcag-aa` | unchanged: §2 |
| C6 | — (a test, §10) | the known-bad fixture | the fixture fails `legibility` on the three named rules |
| C7 | `fills-steady` | a legibility mode | each of the 11 `-hover` and `-active` roles equals its resting fill (D6) |
| C8 | `edge-direction` | a legibility mode | for each rule of `edge-container`, `edge-floating`, `edge-quiet`, `edge-filled` and `edge-status`: every edge pixel is darker than the backdrop in light, and lighter in dark, by OKLab lightness (`oklabOf(…)[0]`), in typical vision. `edge-field` and `edge-sunken` are left out: a sunken thing is edged the other way on purpose. All 18 such rules pass in both modes (24 in revision 1, six withdrawn; `gen.ts`). A rule whose element has no data is not a C8 failure: its measurement already fails by name (L39) |
| C9 | `label-type` | a legibility mode whose contract has a tier with `requires` | the preset has a `buttonLabel`, and `buttonLabel.px` ≥ `requires.buttonLabelPx`, `buttonLabel.smallPx` ≥ `requires.buttonLabelSmallPx` and `buttonLabel.weight` ≥ `requires.buttonLabelWeight`. It holds the button, at both sizes, and nothing else (L65, L111, L115). That the stylesheet paints those sizes is held by C10 |
| C10 | — (a test, step 2.5) | the stylesheet | every name in `SEAMS`, and every edge property sorbet emits (each `--sb-edge-X` and each `-hover` and `-press`, L53), is read by at least one `seam(…)` or `edge(…)` call under `src/styles`, and `button-label(md)` and `button-label(sm)` are each called at least once (L19), and `--sb-halo-room` is read (L151). A token no site reads is a rule passing on a value nobody paints. CORRECTION 2026-10-05 (revision 3.6, L182; adversary M-5): read off the Sass source this could never pass, since 17 names are read only through `seam-only`, a loop's interpolated name or `filled-edge`, and `--sb-halo-room` only through `halo-room()`. C10 reads the compiled stylesheet, as C11 does: each name appears whole in a `var(--sb-<name>` inside some declaration's value |
| C11 | — (a test, step 2.5) | the compiled stylesheet | The test reads the **compiled** CSS (`dist/css/sorbet.css` after `pnpm build`), not the Sass source, because two of L106's lines are written inside loops (`atoms/_button.scss:100`, `clr($variant)`; `molecules/_alert.scss:22`, `clr(#{$tone}-subtle)`) and only compile to a name per variant. One selector compiles to several rule blocks (`.sb-button` to five, the first from `control-reset` saying `background: none`; `.sb-input` to four), so the reading is exact (revision 3.1, verification finding N17): **for a selector S, take every rule whose selector list contains S as one whole item (so `.sb-button:hover:not(…)` is not S), that is not nested in a conditional at-rule (`@media`, `@supports`, `@container`); among them, S's fill is the last `background-color` or `background` declaration in source order.** Source order is cascade order here because the file's `@layer` blocks appear in the order its first line declares them, which the test asserts first. The fill must be `var(--sb-<fill>)` (from `clr`) or `var(--sb-<fill>, <fallback>)` (from `seam`) for the recipe's `fill`; for `.sb-progress`, `var(--sb-bg-subtle)` while D1 holds in sorbet's record; for a recipe whose fill is `"backdrop"`, `transparent` or no declaration. And at least one of those rules reads the element's `--sb-edge-<element>` property (after step 2.4 for the 22 selectors that are not status boxes; the five status selectors after step 2.5, L178 and L183 #50: CORRECTION 2026-10-05, revision 3.6, adversary m-2). The selectors: container `.sb-card`; sunken `.sb-card--sunken`, `.sb-progress`; floating `.sb-popover`, `.sb-menu`, `.sb-combobox__panel`, `.sb-calendar`, `.sb-color-input__panel` (the five that include `popover-surface`), `.sb-toast`, `.sb-modal`, `.sb-drawer`; field `.sb-input`, `.sb-textarea`, `.sb-select select`, `.sb-number-input`, `.sb-combobox__field`, `.sb-date-range__control`; quiet `.sb-button--outline`; filled `.sb-button`, `.sb-button--secondary`, `.sb-button--accent`, `.sb-button--danger`; status `.sb-alert`, `.sb-alert--success`, `--warning`, `--danger`, `--info`. The floating and field lists are derived from the compiled CSS at `e24df74`: every rule painting `surface-raised` with `shadow-lg` or `shadow-xl`, and every rule painting `surface` with a `border-strong` border, less the checkbox and radio (a `choice`, not the field element; L70's unchecked-interior row), the dropzone (a dashed ring, §15 item 6) and the command trigger's hover state. Checked against that stylesheet with today's tokens, the reading picks the fill each L106 line paints for all 27 selectors (`rev2/c11.mjs`). A recipe whose fill is `"backdrop"` passes only where its rules paint `transparent` or nothing. (Revision 2 said the Sass lines must read `clr(<fill>)` literally, which the two loop lines cannot; verification finding N8) |

**L80.** What C1 to C3 are **not** scoped to, and why it matters: read without a
scope, each fails all five shipped presets, measured (`rev2/scope.ts`):
C1 because each emits 68 roles and no `danger-active`; C2 because
`heading-ink` has no value in a WCAG preset (its fallback is css `inherit`)
and L114 fails a name with no value (the other three inks do descend: light
93.4 / 78.9 / 68.8 for sorbet as shipped); C3 because `switch-ring` has no
value (css fallback `transparent`), and in dark also because the shipped
`border` equals `surface-raised` and `border-subtle` equals `surface`. They
are true of a legibility mode because its values were picked to make them
true. (Revision 1 gave two wrong reasons: C2 does not read the `on-X` label
inks, and C3 does not compare `border-subtle` with `bg-subtle`.)

**L114.** C2 and C3 resolve every name they compare as L37 does, and a name
with no value, or one `parseColor` cannot read, is a failure of the check,
whose detail names it: never a skip and never a pass. That is L39's rule for a
measurement, carried to a structure check. For the new sorbet every name
resolves, so this matters only for a preset that declares `legibility`
without the optional tokens C2 and C3 read (`heading-ink`, `switch-ring`,
`switch-off`).

## 10. The known-bad fixture

A gate that cannot see the September dark-mode fault is not worth adding
(proposal §4). So the test of step 2.1 runs the new contract against sorbet
exactly as `main` ships it, and it must fail.

**L81.** The fixture is a JSON file,
`tools/fixtures/contracts/sorbet-as-shipped.json`, recorded once from `main`
at `e24df74` by a committed recorder script (as M10.12 requires of PR 1's
fixtures): `presets.sorbet.colors` for both modes (68 roles each, no optional
token), and one edge element per mode, `container`, transcribed from what
`main` paints round a card (`molecules/_card.scss:7-9`: a 1px border in
`border-subtle`, and `shadow-sm`, `emit.ts:38`):

| Mode | `container.fill` | `container.rest` |
|---|---|---|
| light | `surface` | `inset 0 0 0 1px #f1eeeb @ 1`; `0 1px 3px 0 #26231f @ 0.09`; `0 1px 2px 0 #26231f @ 0.05` |
| dark | `surface` | `inset 0 0 0 1px #38342f @ 1`; `0 1px 3px 0 #000000 @ 0.216`; `0 1px 2px 0 #000000 @ 0.12` |

A CSS border is drawn inside the element's box, so it is written as an inset
layer of spread 1. The two shadow layers are offset and have no spread, so
neither is all-round (L47) and neither is counted.

**L82.** Measured against `legibility` (`measureColors(mode, fixture.colors[mode], "legibility", fixture.edges[mode])`),
the result must **contain** these three failures, with these values to 1e-4.
Script: `evaluate.ts shipped`, and `gen.ts` for the four views.

| Rule | Mode | What is read | Typical / protan / deutan / tritan | `actual` (`view`) | Floor |
|---|---|---|---|---|---|
| R252, `edge:container` on `bg` — **the dark card edge** | dark | fill `#38342f` on `#26231f`; edge pixel `#38342f` (the border, which is the fill's own colour) | presence 6.9482 / 6.8958 / 6.9633 / 6.9571 | **6.8958** (`protan`) | 15.2 |
| R179, `primary-solid` on `switch-off` — **the light switch** | light | `#008289` against `#777168`: no `switch-off` in the record, so its fallback `border-strong` is read, as the Sass does | 10.3232 / 5.2781 / 5.7253 / 11.1071 | **5.2781** (`protan`) | 12.4 |
| R171, `on-primary` on `control-checked` — **the tick** | light | `#26231f` on `#008289`: no `control-checked`, so its fallback `primary-solid` | Lc 29.1918 / 31.9755 / 26.3547 / 31.3363 | **26.3547** (`deutan`) | 68.9 |

How each was computed: the dark card by L49 (backdrop to fill is
6.8958 at its worst view; the edge pixel is 6.8958 from the backdrop and 0
from the fill; the largest is 6.8958); the switch by `separation` in the four
views; the tick by `apcaLc` on the two hexes, and under each simulation on
the two `simulateCvd` hexes (deutan: `#25241f` on `#677089`).

**L83.** For the record, the three figures the proposal quotes for the dark card
(fill 6.9, shadow 3.4, border 0) are: the fill step, 6.90; `shadow-sm`'s
stronger layer at full strength over the page, `#1e1b18`, 3.36, which this
spec does not count; and the border against its own fill, 0.00.

**L84.** The test asserts the three are present, not that they are the only
failures. Informative, not pinned: with this fixture `rev2/rev2.ts` counts
66 failures of 191 in light and 86 in dark, 32 of them in each mode rules that
cannot be measured: the fixture has no data for the other edge elements;
`main` has no `danger-active`; and an optional token whose fallback is not a
role has no value. (Revision 1: 72 and 92 of 193, 38 unmeasurable. The six
withdrawn rules were all unmeasurable here, and R280 to R283 pass on the
shipped colours.)
Among the measured ones: the dark tick is 57.95 against 68.9; the dark switch
is 11.39 against 45.7; a focused field's ring against its resting border
would be the same 5.28 as the switch if the fixture carried a `field`
element.

**L85.** The fixture is not edited after it is recorded. Step 2.6's proof re-runs
it unchanged.

## 11. Carry-overs from the groundwork

PR 1 recorded four things for this spec to settle
(`contract-mechanism-spec.md`, M10, "Recorded, not changed here"; proposal §8).

### 11.1 The reports name the contract actually declared

Today all three reports end "✓ WCAG AA contract holds for every preset…"
whatever a preset declares, and the build gate says "contrast contract".

**L86.** The three reports (`tools/check-contrast.ts`, `sorbet contrast` in
`packages/cli/src/index.ts`, `packages/cli/scaffold/tools/check-contrast.ts`)
end, on success, with exactly:

```
✓ every declared contract holds for every preset in both modes (<N> pairings measured): <list>
```

`<list>` names each contract some preset declares, in the order of
`Object.keys(contracts)`, with the number of preset-modes that declare it,
joined by `, `: after step 2.6 it reads `wcag-aa × 8, legibility × 2`, and `N`
is 946 (8 × 70 + 2 × 193; 950 in revision 1). The words
`holds for every preset in both modes (<N> pairings measured)` are kept, so
`<root>/tools/check-cli.ts:62` still finds them.

**L87.** The build gate (`tools/build-tokens.ts:60` and the scaffold's copy) prints
`✓ every preset holds the contract it declares: <list>` with the same list.

**L88.** A failing pair of a `ratio` tier prints exactly as today. A failing pair of
another metric prints the metric's word, the value by the rule `ratioText`
applies (two decimals, more only when two would round a failure onto its
floor), the floor and the view:

```
    ✗ on-primary on control-checked: Lc 26.35 < 68.9 (deutan view)
    ✗ primary-solid on switch-off: separation 5.28 < 12.4 (protan view)
    ✗ edge:container on bg: edge presence 6.90 < 15.2 (protan view)
    ✗ heading-ink on bg: could not be measured (needs Lc 82.8)
```

In the gate's one-line form: `  sorbet/dark: edge:container on bg = edge presence 6.90 (needs 15.2, protan view)`.

**L89.** Under the failures of a preset and mode, each failing tier's `why` and
`retire` are printed once (proposal §10, risk 10: a floor's reason is in front
of whoever is tempted to lower it), as two lines indented six spaces,
`      why (<tier>): <text>` and `      retire (<tier>): <text>`, after that
mode's failure rows, in the reports and in the gate. Neither line starts with
`✗` or with `<preset>/<mode>:`, so no PR-1 parser counts it as a failure.

**L90.** A failing structure check (§9) prints
`    ✗ <check>: <detail>` in the reports and
`  <preset>/<mode>: <check>: <detail>` in the gate, and fails the run as a
contrast failure does. It is counted on its own line,
`✗ <n> structure failure(s)`, and never in `✗ <n> contrast failure(s)`, which
keeps counting failed measurements only (PR 1's tests read that number:
`tools/test-contrast.ts:406, 748`, `tools/test-contracts.ts:1684`). Both lines
print when both kinds fail.

### 11.2 A report says how many rules a contract leaves unheld

**L91.** Each mode's line in the three reports ends with the contract and the
number of rules that apply in that mode and that the contract does not list:

```
  light all 193 pairings pass (tightest margin ×1.02) — legibility; 68 rules not held
  dark  all 70 pairings pass (tightest margin ×1.00) — wcag-aa; 191 rules not held
```

The count is `(rules that apply in the mode) − (measurements returned)`, both
counted, never typed (the margins shown are examples). A failing mode line
ends with the same suffix. The line still begins `all <n> pairings pass`, and
`<root>/tools/check-cli.ts:57` matches only that beginning; but
`tools/test-contrast.ts:384` and `:390` anchor the end of the line as well, so
they are edited (L105 #19, #20). (Revision 1 said PR 1's tests match only the
beginning; two do not.)

**L108.** A report counts the rules that apply in a mode with
`applyingCount(mode)` from `rules.ts` (L24), which is `RULES` filtered by mode
and counted there. A report never imports `RULES` itself:
`tools/test-contrast.ts:710-716` fails any file outside `rules.ts`, the barrel
and the two test files that takes it, and that test is not edited.

### 11.3 Token Studio reads the contract from the preset

Today `packages/component-library/src/organisms/token-studio.tsx:381` passes
the literal `"wcag-aa"`, with a comment saying why that is wrong the day a
preset declares anything else. That day is step 2.2.

**L92.** Token Studio resolves the contract and the edge data for the live mode in
this order, and never from a CSS variable (a variable would add a line to each
frozen theme file):

1. a new optional prop `contract?: Record<Mode, ContractName>`, for a theme
   that is not a shipped preset;
2. otherwise, when its existing `preset` prop is the name of a shipped preset,
   `contractOf(presets[preset], mode)` and `presets[preset].edges?.[mode]`;
3. otherwise it shows "no declared contract" where the badge is, and no list
   of failures. It never falls back to `wcag-aa`.

**L93.** It reads the optional colour tokens off the page as it reads the roles,
in one expression:
``[...SEMANTIC_COLOR_NAMES, ...Object.keys(SEAMS)].map((n) => [n, styles.getPropertyValue(`--sb-${n}`).trim()])``.
An unset one arrives as an empty string and resolves to its fallback (L37).
`tools/test-contrast.ts:572` pins today's expression and is edited to this one
(L105 #41).

**L109.** **A minified see-through value can move a blended measurement.** A
production build respells `rgb(254 244 220 / 0.14)` as `#fef4dc24`, whose alpha
is 36/255, 0.1412. Opaque colours measure the same however they are spelled
(PR 1's invariant, `tools/test-contrast.ts:517-539`), and so does the scrim's
worst case; but a see-through foreground that is blended (L38) is rounded to
whole channels after the blend, so the two alphas can land on different bytes.
For the new sorbet dark this happens on the divider: `#504133` from the record
and `#514133` from the minified page, 11.08 and 11.21 on a card (R234, R235),
and 12.62 and 12.86 against the page (`spec2-adversary/p9_minify.ts`,
reproduced). The gate measures the record, and the record is authoritative;
Token Studio on a production build may show those two figures up to 0.25
apart from the gate's, both on the same side of the floor (10.5). No
measurement of the new sorbet's light record is affected (it has no
see-through input), and the dark border is kept as sheet 2 drew it. A test
that compares a minified record with the preset's under `legibility` allows
this, and only for a rule with a see-through blended input.

**L94.** Token Studio does not run the checks of §9: they need the whole preset,
and the build runs them.

**L95.** The badge names the contract in use. Under `legibility` the list shows
legibility failures only; it never lists a WCAG ratio sorbet no longer owes.

**L96.** The source file contains no contract name as a string literal. The line
`tools/test-contrast.ts:576` and `tools/test-contracts.ts:1011` require of it
today (`setFailures(checkColors("studio", mode, colors, "wcag-aa"));`, the
latter under a fixed comment) is replaced, by the test author, with that
assertion (L105 #40, #42).

### 11.4 The goldens

**L97.** Sorbet's golden, `tools/golden/sorbet.css`, is regenerated on purpose
twice, with `pnpm --filter @sorbet/design-system update:golden sorbet`, and
the diff is the review artefact:

| Step | What the diff may contain |
|---|---|
| 2.2 | line 1 (the tagline); the light block of `:root` (the 69 roles, the 20 optional tokens, the five shadow lines re-tinted, `--sb-button-font-size` and `--sb-button-font-size-sm`, the 21 edge lines: 13 `rest`, 4 `-hover`, 4 `-press`); and, at the end of each of the two dark blocks, the 41 reset lines of L55  (CORRECTION 2026-10-06: 42 reset lines since L151, L195 (b)) |
| 2.6 | the two dark blocks only: the 69 roles, the 20 optional tokens and the 21 edge lines with their dark values, in place of the 41 reset lines (CORRECTION 2026-10-06: 42, and `--sb-halo-room: 3px;` replaces the halo room's reset, as L98 says; step 2.6's acceptance #5 gives each block's lines; L195 (b)) |

**L98.** No other step changes it, except one fix commit of step 2.4 (revision 3.5, L151): the light line `--sb-halo-room: 9px;` (8px until the repair of 7a683fd counted the hover rise, L151) and its reset at the end of each dark block, which step 2.6 replaces with `3px`. The four frozen goldens change in no step; the
update tool refuses them and `check-golden-base.ts` holds them to the base
branch.

### 11.5 Placeholder text (decision 21)

PR 1 recorded that placeholder text is held at 3:1 by the `text-subtle` tier,
where a strict reading of WCAG 1.4.3 asks 4.5:1.

**L99.** Under `legibility`, placeholder and disabled text is `text-subtle`, held
by the `placeholder` tier at Lc 62.1 in light and 45.0 in dark, pinned to the
shades the owner kept (decision 21): six pairs, where `wcag-aa` holds two.
The 3:1 question is not answered here because it does not arise for sorbet;
it stays open for the four WCAG presets and belongs to the later PR of
decision A4.

### 11.6 One more, found while writing this

**L100.** `tools/build-tokens.ts:70-73` reads the list of legal `--sb-` names from
the **first** theme only (`Object.values(themes)[0]`). After step 2.2 only
sorbet defines optional names, and sorbet is first by the accident of object
order. Step 2.1 makes the list the union over every theme, so a partial that
assigns `--sb-field-fill` locally is checked the same whichever preset comes
first.

## 12. Steps 2.1 to 2.8

For every step: the four frozen goldens are unchanged, check 5 still holds
(§2), and `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`,
`pnpm check:cli`, `pnpm check:catalog`, `pnpm check:consumable --no-build` and
`pnpm check:golden` are green at the repo root. Each step is audited before
the next is built on it (the lab's audit-increment lane).

"Tests first" means the lab's write-tests-first lane: a test author writes the
tests from this document without seeing the implementation, and the
implementer may not change an expected value. It is used where a wrong answer
would be **silent**: a number that still looks plausible, a rule quietly not
run. Work that **fails loudly** (it does not compile, or it is visibly wrong
on screen) is written by the implementer and looked at.

**L101.** Step by step:

**2.1 The `legibility` member** — tests first, all of it

- *Files:* `src/tokens/contracts.ts` (types, the member, validation: §4.1,
  §4.3, §6); new `src/tokens/seams.ts` (§3.2); `src/tokens/rules.ts` (the 191
  rules, name resolution, the metrics, `measurePreset`, `metricFor`,
  `applyingCount`, `checkStructure`: §4, §7, §9); new `src/tokens/edges.ts` (types,
  validation, the edge pixel and presence: §5); `src/tokens/emit.ts` (optional lines,
  edge lines, reset lines: §5.5; `$seams` and the edge-element list in
  `generatedScss`); `src/styles/abstracts/_generated.scss` (tracked build
  output, regenerated because `generatedScss` changes, and committed with the
  step); `src/tokens/presets.ts` (the `Preset` type only);
  `src/tokens/index.ts` (exports); `tools/build-tokens.ts` and the scaffold
  copy (§11.1, §11.6, `checkStructure`); the three reports (§11.1, §11.2);
  `<root>/tools/check-cli.ts` and `apps/playground/src/contrast-checks.ts`
  (`measurePreset`); `README.md`'s "The accessibility contract" paragraph (its
  counts, L105 #21); `tools/test-contracts.ts`, `tools/test-contrast.ts`,
  `tools/test-golden.ts` (the edits of L105 for this step) and new fixtures
  under `tools/fixtures/contracts/`.
- *No preset changes:* all five still declare `wcag-aa` in both modes, so all
  five goldens are unchanged and every report prints `wcag-aa × 10`.
- *Acceptance, each shown red without the change:*
  1. §2 holds: the 70 triples and 700 measurements of `wcag-aa`, exactly.
  2. A fixture holding the values of §3 and the edges of §5.2 passes
     `legibility` in both modes, and its 193 measurements a mode are: the 191
     rules of appendix A, each equal to the table to 0.01 with the stated
     view; and the two scrim rules, `on-scrim` and `on-scrim-muted` on
     `scrim`, measured as ratios at the worst case, 5.5562 and 4.6844 to
     1e-4 in both modes, view `typical` (L32). The fixture is transcribed from
     this document by the test author, not produced by the new code. (Revision
     1 said 195 against appendix A, which holds 193 rules; the scrim
     values had no stated precision.)
  3. Every floor equals L61; every tier has the kind and metric stated.
  4. The known-bad fixture fails on the three rules of §10, to 1e-4.
  5. Each refusal of §4.3 and §5.1 throws; each case of L39
     returns `actual: null` and is listed as a failure, never dropped. Among
     them, a record that does not define an optional token whose fallback is
     css (`switch-ring`, `selected-wash`): R191 and R135 come back
     unmeasurable, not 0 and not a pass.
  6. The four worked examples of §5.3 and the two of §4.2 reproduce, and
     L107's: the light quiet recipe with `fill: "backdrop"`, on `bg`, is
     15.8798 to 1e-4 (tritan), where with `quiet-fill` it is 18.1794.
  7. C1, C2, C3, C7, C8, C9 pass on the §3 fixture and each fails, in each
     mode it is applied to, when the fixture is broken in the one way it
     guards: remove `danger-active`; set `text-muted` to `text`'s hex (C2's
     `text > text-muted` is then false in both modes; revision 1's "darker
     than `text`" failed only in light: on the dark page a darker muted ink
     has less Lc than the text, which is the passing order); set the dark `border` to `surface`'s
     hex; darken `primary-hover`; make the dark rim darker than the page;
     set `buttonLabel.px` to 14, and separately `buttonLabel.smallPx` to 12
     (each alone must fail C9). C11 is a stylesheet test of step 2.5.
     (Revision 3.6: C11's fills and 22 of its edge reads were enforced from
     step 2.4; its five status selectors are step 2.5's, L183 #50.)
  8. A planted preset that declares `legibility`, with the §3 colours and
     `buttonLabel` and no `edges`, fails by name on 24 rules, in the gate and
     all three reports: the 22 edge rules, and R224 and R227, whose `bg` is
     `edge:field` (L39). It prints
     `✗ 24 contrast failure(s)` and no structure failure (C3 (b) and C8 read
     the elements `edges` defines, and it defines none).
  9. The report and gate lines of §11.1 and §11.2, checked as text.
  10. Only structure checks failing fails every surface (L140).
- *Planted-defect list for the audit* (each must turn a test red): the sign
  of Lc not dropped; text and background swapped; the simulated hex not used
  for Lc; an inset layer blended over the backdrop; the edge-pixel-to-fill
  term left out; a see-through `bg` composited over white instead of refused;
  an unset optional token read as a failure instead of its fallback; a css
  fallback (`transparent`, `inherit`, a `color-mix()`) read as a colour
  instead of as no value (acceptance #5 plants it); a `"backdrop"` fill read
  as the element's own token; a mistyped tier in the member; `views` ignored for
  `sep`; `ratio` measured in four views; the worst view taken as the largest;
  a floor rounded up.

**2.2 Sorbet light** — tests first for the values; the look is loud

- *Files:* `src/tokens/presets.ts` (sorbet: `colors.light` built whole from
  §3, `edges.light` from §5.2, `buttonLabel`, `shadowTint`, `tagline`,
  `contract.light = "legibility"`; `colors.dark` still from `buildMode`);
  `tools/golden/sorbet.css`; the edits of L105 for this step (#24 to #38),
  made by the test author.
- *Acceptance:* `presets.sorbet.colors.light` equals L12 and L15
  key for key, in the stated order (a test written before the values are
  typed: a mistyped hex that still clears its floor is silent);
  `edges.light` equals L45; sorbet light passes `legibility` and the
  six checks; sorbet dark still passes `wcag-aa`; the golden diff is what
  §11.4 allows; the reports print `wcag-aa × 9, legibility × 1` and 823
  pairings (825 in revision 1).
- *Known state after this step:* the stylesheet does not read the new tokens
  yet, so the screen shows new colours on old edges. Nothing merges.

**2.3 Edge tokens and the mixin** — the generated maps tests first; the Sass loud

- *Files:* `src/styles/abstracts/_tokens.scss` (`seam()`, `edge()`);
  `abstracts/_mixins.scss` (a soft-edge mixin; `control-glow` becomes a state
  layer; `color-transition` eases `box-shadow`); `atoms/_button.scss:49-90`
  (first consumer: `filled-line`, `--sb-edge-filled-X`); the lint rule and the
  two hand-run tools of proposal §8, step 2.3.
- *Acceptance:* `_generated.scss` carries `$seams` equal to `SEAMS` (a test);
  `seam()` with an unknown name fails the Sass compile; the playground under
  each of the four frozen presets, light and dark, is pixel-identical before
  and after (the screenshot comparer, run by hand); the lint rule's allowlist
  is generated from `main` and may only shrink.

**2.4 Components by layer** — loud; one text check tests first

- *Files:* the Sass sites of L70 marked 2.4, by layer (atoms, then
  molecules, then organisms and templates), the two button-label sites among
  them (`atoms/_button.scss:26, 193`); the `button-label()` accessor in
  `abstracts/_tokens.scss` (L19); the 47-row table of L72.
- *Acceptance:*
  1. The four frozen presets render pixel-identical in both modes.
  2. Rendered edges are re-measured on the real components with the edge
     measurer of step 2.3, in light (dark waits for 2.6). For each element
     sheet 2 measured, the weakest point of its whole boundary (L159) at the worst simulation is no lower
     than sheet 2's figure less 1.0. Sheet 2's figures (`edges-measure.json`,
     `Light`, `weakest.worstSim`): card 12.7; sunken panel 12.1; box in a well 14.4;
     floating menu 12.8; lilac / blush / butter button on a card
     14.9 / 14.8 / 14.7 (the danger button is the blush one); quiet button on
     a card 12.8; butter button on the page 13.5; quiet button on the page
     14.4; text field 11.4; checkbox and switch, off, 27.0; status box 10.9.
     CORRECTION 2026-10-05: the status box is measured at step 2.5, not here.
     L70 schedules its edge for 2.5, and C11's edge test exempts it until then.
     The implementer found the clash; L70, the more specific statement, wins.
     Its bar is step 2.5's acceptance #5 (revision 3.6): each of the four
     tones on a card, light, at least 9.9.
     (Sheet 2's robin's-egg button, 13.3 and 12.3, has no component to
     measure.) This is by hand and is the only check of *sufficiency*: the
     gate's number is a heuristic (L51).
  3. `git diff main --stat -- packages/component-library/src packages/design-system/src/behaviors`
     lists nothing (this step is Sass only).
  4. No `clr(border-strong)` remains at a field frame or an off fill (the
     three-job split of proposal §7): `grep` shows it only at the ring and
     line sites.

**2.5 Statuses carry an icon and a word** — the presence test (L181), C10
and C11's status half tests first; the look loud

(Rewritten in revision 3.6, §12.5. Revision 3.5's text named five components
and "four outlined shapes", gave no colour, size, word or rim form, and said
"`check:consumable` still renders its 126 components" and "C10 and C11 pass
(both are first enforced here)": the spec adversary's findings, closed in
§12.5's table.)

- *Files:* in `packages/component-library/src/`: `atoms/icons.tsx` (the four
  glyphs, `STATUS_GLYPHS`, `STATUS_WORDS` and the slot `StatusMark`: L169,
  L171, L186), `atoms/index.ts`
  (the four exports), `atoms/badge.tsx` (L174), `atoms/button.tsx` (L175),
  `molecules/alert.tsx` (L172), `molecules/toast.tsx` (L173),
  `molecules/menu.tsx` (L176), `molecules/field.tsx` (L177). The Sass, in
  `src/styles/`: `atoms/_icon.scss` (`.sb-status` and `.sb-status-icon`,
  L186; the re-point, L179), `atoms/_badge.scss` (L170, L174),
  `atoms/_button.scss` (L170; the rim, L175), `molecules/_alert.scss` (L172,
  L178), `molecules/_toast.scss` (L173, L179), `molecules/_menu.scss` (L169,
  L176), `molecules/_field.scss` (L177). `<root>/README.md`'s Component
  catalog (L169). `<root>/tools/shots.ts` (the mask, the success line and
  `baseline.json`'s `mask`, L167). `<root>/tools/measure-edges.ts` (three
  staged status boxes, L191). The presence test and its wiring (L181, L187
  to L189): `packages/component-library/tools/test-status.ts`, the fixture
  `packages/component-library/tools/fixtures/status-markup.at-9b83e50.json`
  and its recorder `record-status-markup.mts.txt` beside it, the
  `test:status` scripts in `packages/component-library/package.json` and
  `<root>/package.json`, the root `test` chain, `.github/workflows/build.yml`
  and the `pnpm test` line of `<root>/CLAUDE.md`, which lists the chain.
  `tools/test-contracts.ts` (C10, C11's status half, the compiled checks of
  L190, and L183's #49 to #51), and the fixtures README's row for
  `step-2.4-untouched.json` (L183). No playground demo (L167), and no token.
  The commit that carries revision 3.6 re-runs the spec's transcriber, before
  step 2.5 (§12.5's addendum).
- *Acceptance* (each test among them shown red without the change):
  1. The presence test of L181 passes: every case, the markup fixture (L187)
     and the provider's form (L188) among them. It fails with any one
     component's icon, word or slot for any status removed, and it refuses a
     missing or stale build (L189). It and its fixture are written before
     the components are changed.
  2. C10 (L182) and C11's five status selectors (L178, L183 #50) pass. C10 is
     first enforced here; C11's fills and its other 22 edge reads have been
     since step 2.4 (adversary m-3).
  3. On the compiled stylesheet, in `pnpm test`: L190's rows (a) to (k),
     among them the slot's `position: relative` (L186). L183's #49 to #51
     edited as stated, and no other existing assertion.
  4. With the status icons masked (L167), the four frozen presets render
     pixel-identical in both modes to the previous commit's library
     stylesheet, and the run's summary is quoted in the commit (L155).
  5. Rendered edges, light, with the edge measurer of step 2.3, at the
     weakest point of the whole boundary (L159) at the worst simulation: the
     status box in each of the four tones, on a card, is no lower than 9.9,
     sheet 2's 10.9 (`edges-measure.json`, `Light`, "Status box",
     `weakest.worstSim`) less 1.0 (S23). Sheet 2 measured the success box; the
     same bar holds all four, staged as L191 says, and the danger box is
     measured with its rim, as painted (adversary M-7). Dark (22.6) is step
     2.6's.
  6. `pnpm check:consumable --no-build` passes: at least its floor of 126
     components render with no props (`RENDERED_FLOOR`,
     `<root>/tools/check-consumable.ts:206`, a floor and not a count; not
     raised here, S50). 131 render at `9b83e50` (counted by the step-2.5
     adversary with the tool's own logic), and 135 once the four glyphs are
     exported (adversary M-6). `check:catalog` passes with the
     four listed.
  7. Looked at: the rendered sheet of L167, each component and status in all
     five presets and both modes, among them the danger button's rim on its
     blush fill (§13), the knocked-out symbol on a solid fill and on a wash
     (L169, the owner's first sight of it), and the icons beside 12px text.
  8. The ARIA change is reviewed against L180's table in a browser's
     accessibility tree, row by row, and the result is quoted in the commit.
  9. The overflow probe of L186: a status badge in an overflowing
     `.sb-table-wrap` at 390px leaves `document.documentElement.scrollWidth`
     equal to `innerWidth`, in each of the five presets and both modes,
     quoted in the commit.
- *Does not:* L184 (among it, the React Menu's ARIA defect).

**2.6 Sorbet dark** — tests first for the values; the look shown first (L195)

(Rewritten in revision 3.7, §12.6. Revision 3.6's text said `--sb-halo-room` reads `1px` in dark, compared "the
light block" with "the dark block" by name alone, listed no test file, authorised none of the nine step-2.2 tests it
turns red, and had no rendered look: the spec adversary's findings, closed in §12.6's table. Two dark recipes of
L45 change, DECISIONS row 46.)

- *Files:* `src/tokens/presets.ts`: sorbet's `colors.dark` written out whole from §3 (the 69 roles in
  `SEMANTIC_COLOR_NAMES` order, then the 20 optional tokens in L15's), as `colors.light` is; `edges.dark` from L45;
  `contract.dark = "legibility"`. `SORBET_RECIPE` and its comment go (nothing reads it once both records are
  written out, and lint refuses an unused name); the file's header says sorbet's two records are the exception to
  "every preset is built by `buildMode`"; `chartThemes.sorbet` stays (`tools/check-cvd.ts` reads it).
  `tools/golden/sorbet.css`. `tools/test-contracts.ts` and `tools/test-contrast.ts`: L105's edits for this step and
  L195 (c)'s table, and no other existing assertion.
- *Acceptance* (#1 to #6 each shown red without the change; #7 and #9's `check:status-layout` are guards, green
  before and after; #8 is by hand):
  1. `presets.sorbet.colors.dark` equals §3's dark record key for key and in order, and `presets.sorbet.edges.dark`
     equals L45's dark table element for element in `EdgeElement` order. The expected values may be read from
     `tools/fixtures/contracts/legibility-values.json`, whose dark half is §3 and L45 as transcribed (2.1 #2).
  2. Sorbet dark passes `legibility`: its 193 measurements through `measurePreset` are the two scrim ratios
     (5.5562 and 4.6844 to 1e-4, view `typical`) and appendix A's 191 dark figures, each to 0.01 in its stated view
     (the form of step 2.2's light test); every one holds, and none of the six checks fails.
  3. No name is left to leak (L160): in sorbet's theme file, every `--sb-` name declared from `color-scheme: light;`
     to the end of `:root` (the light block as `modeBlock` writes it; the fonts and radii above it hold in both
     modes), but `--sb-button-font-size` and `--sb-button-font-size-sm` (L19), is declared in **each** of the two
     dark blocks with a value that is not `initial`: 116 names each. No `initial` is left in the file, and
     `--sb-danger-active` reads `#f9c3c6` in both dark blocks.
  4. `--sb-halo-room` reads `3px` in each dark block, its last line, after the edge lines (L151, L98: the rims'
     `0 0 0 1px`, 1, plus the card's rise, 2). (CORRECTION 2026-10-06: `20px`, L197: the room counts the dark hover
     glow, 19, plus the button's rise, 1; DECISIONS row 48.)
  5. The golden changes only inside the two dark blocks. Each becomes, in the light block's order,
     `color-scheme: dark;`, the 69 roles, the 20 optional tokens, the five shadow lines (unchanged), the 21 edge
     lines and `--sb-halo-room: 3px;`: 117 lines. Today it is 116: `color-scheme`, buildMode's 68 roles
     (`danger-active` missing, L160), the five shadows and the 42 `initial` lines of L55 and L151. The file goes
     from 375 lines to 377. The four frozen goldens are unchanged, and the build's golden gate passes.
  6. The three reports' last line is `✓ every declared contract holds for every preset in both modes (946 pairings
     measured): wcag-aa × 8, legibility × 2`, and the two gates' (L87) is `✓ every preset holds the contract it
     declares: wcag-aa × 8, legibility × 2`, with no count; the reports' sorbet dark line is `all 193 pairings pass (tightest margin ×1.02) — legibility; 68 rules not held` (×1.02 where the
     report prints a margin, L91).
  7. The known-bad fixture still fails as §10 states, unchanged (it holds e24df74's sorbet, not the shipped one).
  8. Rendered edges in dark, with `<root>/tools/measure-edges.ts --preset sorbet --mode dark` (L159's whole
     boundary, worst simulation), each no lower than sheet 2's figure less 1.0: card 12.2; sunken panel 12.8; the
     lilac, blush (the danger button is the staged "Blush (danger)" row, as in step 2.4) and butter buttons on a
     card 57.1 / 56.6 / 62.9; floating menu (the combobox panel row) 16.2; quiet button 16.2; butter on the page
     70.0; quiet on the page 18.3; text field 17.9; checkbox and switch 55.3; each of the four status boxes on a card
     21.6 (L191). "Box in a well" (19.1) has no component in the library, as in step 2.4. The run's table is
     quoted in the commit. A rendered bar that fails is a contradiction report to the owner, never a value edit.
  9. Looked at: the owner saw the library in sorbet dark with these values (the playground, and the dark status
     boxes and sunken panel at 2x) on 2026-10-06, and approved it (DECISIONS row 47); `pnpm check:status-layout`
     passes in all five presets and both modes.
- *Does not:* change a floor. The edge-sunken dark tier's weakest pair rises from 14.06 to 15.92 under its pinned
  floor of 13.3 (L60; L195 (a)).

**2.7 Token Studio** — the resolution tests first; the panel loud

- *Files:* `packages/component-library/src/organisms/token-studio.tsx`,
  `_token-studio.scss`; the edits of L105 for this step (#40 to #42), and
  L183's #49 again, which leaves `organisms/token-studio.tsx` out of the
  "2.4 #3" comparison (revision 3.6).
- *Acceptance:* §11.3; loading each of the five themes in the playground, the
  badge names that theme's contract and sorbet shows no WCAG failure.

**2.8 Docs and stale numbers** — loud

- *Files:* as proposal §8, step 2.8. Every count is derived from the rule
  list (261 a mode, 277 entries, 946 measurements), never typed.
- *Acceptance:* `check:catalog` and `check:cli` green; no document says
  sorbet is "WCAG AA verified".

### 12.1 Revision 3.2: readings fixed after step 2.1's test author (2026-10-04)

The step 2.1 test author listed thirteen places where the text allows two
readings. These statements fix each one. Where they and earlier text
disagree, these win.

**L117.** Step 2.1 acceptance #8's planted preset declares `legibility` in
LIGHT only; dark stays `wcag-aa`. The 24 failures and "✗ 24 contrast
failure(s)" are per mode. Declared in both modes it would be 48.

**L118.** A gate line for a rule that could not be measured, whatever its
metric, starts `<preset>/<mode>: <fg> on <bg> ` and contains "could not be
measured". Nothing after that is pinned.

**L119.** From step 2.1, the package barrel exports `measurePreset`,
`metricFor`, `applyingCount`, `checkStructure` and `SEAMS`.

**L120.** The order of several failing tiers' why/retire lines (L89) is not
pinned. They are compared as a set per preset and mode.

**L121.** *Replaced by L139 in revision 3.3.* Structure rows (L90) sit after the mode lines of the preset they
belong to. "✗ <n> structure failure(s)" may be on either stream. The
contrast count stays on stderr, as today.

**L122.** L43's refusal names the element and the layer's position when
measured, counting from 1 in the element's `rest` list. It names the preset
and the element when emitted. A measuring call that knows no preset name need
not invent one.

**L123.** An edge-data key that is not one of the thirteen elements (L44) is
malformed. That includes the withdrawn `filled-success`, `filled-warning` and
`filled-info`. It is refused, as L43 refuses a malformed layer, both when
emitted and when measured. A key nothing reads is a silent no-op, so it may
never pass quietly.

**L124.** A malformed `hover` or `press` layer is refused when emitted. Only
`rest` is measured, so the measuring path need not look at the others.

**L125.** For `views`, `checks` and `requires` (L35), "present" means an own
key whose value is not `undefined`. `null` is present, and refused as
malformed. This is the convention M10.3 set for a rule's `mode`.

**L126.** M10.1's rule that a per-mode floor needs a usable number in both
modes holds for every metric. `{ light: 50 }` is refused.

**L127.** README's counts (L105 #21) may be worded freely. They must state
`wcag-aa` measuring 70 and `legibility` measuring 193 a mode. They may never
say "measures all N".

**L128.** C3 and C8 apply in both modes, so step 2.1 #7 breaks each in both
modes. The text names the dark break only as an example.

**L129.** A planted defect that moves a figure by less than appendix A's 0.01
is caught by the tests' own arithmetic, to 1e-9, and not by the table.

### 12.2 Revision 3.3: after step 2.1's audits (2026-10-05)

Two agents audited step 2.1 as built (`audit21-hostile.txt`, invariants and
hostile data; `audit21-diff.txt`, the diff, the tests and 85 planted
defects). The code matched the spec everywhere. These statements close the
holes the spec left. Where they and earlier text disagree, these win.

| Id | Closed where, and how |
|---|---|
| hostile CRITICAL 1 | L130: a present optional-token value must be a string `parseColor` reads, or it is refused when emitted and when measured; `undefined` is absent (not emitted, still reset in dark). L131 reconciles this with Token Studio's blank = unset |
| hostile CRITICAL 2 | L132: edge data, recipes and layers are read through own keys of plain objects and dense arrays only; anything else is refused at emission and at measurement |
| hostile MAJOR 1 | L133: `container-line`, `field-line` and `filled-line` are held by L130 (parseable) and by a new part (c) of C3: in a legibility mode whose `edges` define an element they serve, the token is defined and fully transparent |
| hostile minor 1, diff MINOR 3 | L134: `views` and `checks` must be dense arrays; a hole is refused |
| hostile minor 2 | L135: a recipe holds only `fill`, `rest`, `hover`, `press`; a layer holds exactly its seven keys; any other key is refused (L123's principle, one level down) |
| hostile minor 3 | L136: a colour-record key of a preset that is neither a role nor an optional token is refused when emitted and when measured |
| hostile minor 4 | L137: a contract whose tier carries `requires` must list `label-type` in `checks`; otherwise it is refused |
| hostile minor 5 | L138: recorded under §13, left to sorbet's golden and the eye, with the probe's example; no minimum is set |
| hostile minor 6 | L139: L121 now says what was built: each mode's structure rows follow that mode's failure rows and why/retire lines |
| hostile minor 7 | Not a defect (the audit says so): `_generated.scss`'s header comment and `measurePreset`'s refusal naming `measureColors:` are both within L122 |
| diff MAJOR 1 | L140: every surface exits non-zero and writes nothing when only structure checks fail; step 2.1 acceptance #10 plants that case through all five surfaces (a test gap, the spec's statement made explicit) |
| diff MINOR 2 | L105 #48 records the `:468` narrowing to `RULES.slice(0, 86)` and why no coverage is lost |
| diff MINOR 4 | Header line 3 now says "Revision 3.3", so the transcriber stamps the fixtures 3.3; L141 names the two comments to fix (`rules.ts:14-16`, `edges.ts:98`) |
| diff MINOR 5 | L142: `EdgeElement` lives in `edges.ts` (L101 wins); L24 amended to say so |

**L130.** **What an optional token's value may be, in a preset's own
record.** The convention is L125's: an own key of `preset.colors[mode]` whose
value is not `undefined` is **present**. A present value of an optional token
(a name in `SEAMS`) must be a string that `parseColor` reads. That covers
every value §3.2 gives, `transparent` included (`parseColor` reads it as alpha
0, `color.ts:189`), so §3.2 needs no exception. Anything else is refused with
a `TypeError` that names the preset (or the caller, as L122 allows), the mode
and the token: `null`, `""`, a string that is blank after trimming, a
non-string (`0`, `true`, an object), and text `parseColor` cannot read
(`"not-a-colour"`, `"red; } body { …"`). It is refused **both when emitted**
(`themeCss`, before a line is written) **and when measured** (`measurePreset`,
`checkPreset`, `checkStructure`, before any rule is measured). An own key
holding `undefined` is **absent**: it is not emitted, it is measured as its
fallback (L37 step 3), and when the light record defines that token the dark
block still writes its `initial` reset (L55 counts only present keys). This
replaces L16's "with no change to the emitter": `colorDecls` emits only
present keys of a preset's record, and refuses as above. The four WCAG
presets define no optional token, so their files are unchanged. Why: the gate
measured a blank or `null` `field-fill` as its fallback `surface` and passed,
while the theme file wrote `--sb-field-fill: undefined;`, which CSS
substitutes, so the field's fill was dropped on screen (hostile CRITICAL 1).

**L131.** **Token Studio's blank = unset is not a preset's.** L37 step 2's
reading, where an empty string is unset, is about a record **read off a
page**: there an empty string is what the browser returns for a custom
property nobody set, and Token Studio hands that record to `measureColors`
(L93). It stays. L130 is about a record **a preset defines**, where a blank
would be emitted and painted. So `measureColors` itself keeps L37 for any
record handed to it; the preset-level entry points of L130 refuse first. The
two cannot meet: a preset that passes L130 has no blank value to emit, and a
page built from it has none to read back except for tokens it does not set.

**L132.** **Edge data is read through own keys only.** `preset.edges`,
`edges[mode]`, each recipe and each layer must be a **plain object**: one
whose prototype is `Object.prototype` or `null`. `rest`, `hover` and `press`
must be arrays (`Array.isArray`) whose every index from 0 to `length − 1` is
an own property. Every read, in validation, emission and measurement alike,
is of an own property; an element, recipe field or layer field present only
through the prototype chain is refused, not read. Anything else is refused
with L43's `TypeError` (L122's naming), at emission and at measurement. Why:
validation looked at own keys while emission and measurement read through the
prototype, so an inherited recipe with `blur: -6` measured 16.70 and passed
while the theme file wrote invalid CSS that drops the card's whole shadow
(hostile CRITICAL 2).

**L133.** **The three line tokens are held.** `container-line`, `field-line`
and `filled-line` paint the 1px borders of the card and the floating
surfaces (L113), the field, and the filled buttons from step 2.4 on. They
are held twice:

1. as every optional token, by L130: a present value parses;
2. by a new part of C3, **(c)**: in a legibility mode, for each line token
   whose elements the mode's `edges` define, the record defines the token
   (an own, present key) and its value parses with alpha 0. The elements:
   `container-line` serves `container` and `floating`; `field-line` serves
   `field`; `filled-line` serves every `filled-X`. The detail names the token
   and its value.

Why transparent, not "a line that differs from the fill": in this look the
element's edge is its recipe (§5), sheet 2 draws no line, and a visible line
would be a second edge no rule or floor speaks for. `container-line:
"#000000"`, a hard black border round every card, passed every check before
this (hostile MAJOR 1). A mode with no `edges` for those elements is not held
by (c): its edge rules already fail by name (L39). The new sorbet passes:
all three are `transparent` in both modes. L38's last table row ("no rule
reads them") now reads: no measurement reads them; C3 (c) and L130 hold them.

**L134.** **`views` and `checks` are dense.** Present (L125), each must be an
array whose every index from 0 to `length − 1` is an own property; a hole is
refused as malformed, with the contract's key named, by the same validation
L35 describes. `[ , "tritan"]` was accepted and then threw from inside the
simulation, or would have been measured as typical vision; `[ , "hierarchy"]`
was accepted and the hole skipped.

**L135.** **No unknown key in a recipe or a layer.** L123's principle (a key
nothing reads may never pass quietly) applies one level down. A recipe's own
keys are a subset of `fill`, `rest`, `hover`, `press`, with `fill` and `rest`
required. A layer's own keys are exactly `inset`, `x`, `y`, `blur`,
`spread`, `color`, `alpha`. Any other key (`hovr`, `Rest`, a layer's
`colour`) is refused with L43's `TypeError`, at emission and at measurement.
A misspelt `hovr` used to drop `--sb-edge-filled-primary-hover` from the
theme with no error.

**L136.** **No stray key in a preset's colour record.** An own key of
`preset.colors[mode]` that is neither one of the 69 roles nor one of the 20
optional tokens is refused with a `TypeError` naming the preset, the mode
and the key, at emission and at measurement (L130's entry points). A
misspelt `feild-fill` was emitted as a stray `--sb-feild-fill`, the real
token silently took its fallback, and the stray name joined L100's
legal-name union. The four WCAG presets hold exactly their 68 roles, so they
are unaffected.

**L137.** **`requires` needs `label-type`.** A contract any of whose tiers
carries `requires` must list `label-type` in `checks`; otherwise
`contractNamed` refuses the whole contract, naming its key and the tier. The
§9 preamble stands (a check runs only when the contract lists it); C9's row
is read under it, and this rule makes the two agree. Why refuse rather than
run C9 regardless: a contract that states a size condition and does not hold
it is a contradiction in the contract's own data, and the mechanism refuses
those (M10.1), as it refuses a key that is not a tier. `legibility` lists
both, so nothing changes for it.

**L138.** **Presence can be inflated by a layer that barely renders, and that
is left to the golden and the eye.** L47 counts any layer with no offset and
a positive spread, and L48 ignores blur, so a layer that hardly shows can
carry the number. The audit's example: the light card's all-round layer
replaced by `0 0 200px 0.01px #000000 @ 1` measures 98.63 on the page and in
a well (protan), far over the 15.8 floor, and passes C8 in light; in dark the
same layer measures 26.59 and fails C8, black being darker than the dark page
(`rev2/inflate.ts`). No minimum blur, spread or alpha is set: any number would
be one nobody approved, and the approved recipes span blur 0 to 10px and
alpha 0.12 to 0.8. What holds it instead is sorbet's pinned golden (any
change to a recipe is a diff in review) and the rendered measurement of steps
2.4 and 2.6. A §13 row says so.

**L139.** **Where structure rows go (replaces L121).** In the three reports,
a mode's structure rows (`    ✗ <check>: <detail>`, L90) follow that mode's
failure rows and its why/retire lines (L89), before the next mode's line; a
mode whose rules all pass has its structure rows directly under its mode line.
This is what was built. `✗ <n> structure failure(s)` may be on either stream;
the contrast count stays on stderr. L121's "after the mode lines of the
preset" read as after both; that reading is withdrawn.

**L140.** **Structure failures alone fail every surface.** When the contrast
measurements all hold and only `checkStructure` fails, each of the five
surfaces (the three reports, `tools/build-tokens.ts` and the scaffold's
`build-tokens.ts`) exits non-zero, prints no success line, and the two gates
write nothing. This is L79 and L90 said for the one case the tests never
planted. Step 2.1 acceptance gains: **10.** A planted tree in which the only
failure is structural (the step-2.6 shape with `buttonLabel.px` set to 14, so
C9 fails and every rule holds) is run through all five surfaces: each exits
non-zero, prints `✗ 2 structure failure(s)` (C9 runs once per legibility
mode and the step-2.6 shape declares `legibility` in both; CORRECTION
2026-10-05: revision 3.3 said 1. A twin declaring `legibility` in light only
prints `✗ 1 structure failure(s)`, and is planted too), prints no "✓ every declared…"
or "✓ every preset holds…" line, and neither gate writes. Four planted
defects survived the suite for want of this case (the audit's M32, M33, M59,
M60).

**L141.** **Two comments the implementer corrects** (comments only; no
behaviour):

- `src/tokens/rules.ts:14-16` says the 191 after the first 86 "are the pairs
  the `legibility` contract holds". It holds 193: those 191 and the two scrim
  rules among the first 86 (L58).
- `src/tokens/edges.ts:98` says `edgeDataOf` names "the preset, when there is
  one". On the measuring path it names its caller (`measureColors`), which
  L122 allows; the comment says so.

**L142.** **Where `EdgeElement` lives.** It is defined and exported in
`src/tokens/edges.ts`, with the other edge types (L101); `rules.ts` imports
it; the barrel exports it. L24's code block, which shows it among
`rules.ts`'s declarations, shows the shape, not the file. No consumer is
affected.

### 12.3 Revision 3.4: the Sass accessors' forms, fixed after step 2.3's test author (2026-10-05)

**L143.** `edge($element, $fallback, $state: rest)` is the accessor's
signature. `$state` is `rest`, `hover` or `press`. It compiles to
`var(--sb-edge-<element>, <fallback>)` for `rest`, and to
`var(--sb-edge-<element>-<state>, <fallback>)` otherwise. `$element` must be
one of the thirteen in `$edge-elements`. A `$state` other than the three, or
`hover`/`press` on an element that is not a `filled-*` one, fails the
compile, naming both. A state is never a separate element name:
`edge(filled-primary-hover, …)` fails.

**L144.** `seam($name)` compiles to `var(--sb-<name>, var(--sb-<role>))` for
a role fallback, and to `var(--sb-<name>, <css>)` for a css fallback. An
unknown name fails the compile, naming it.

**L145.** A quoted name (`seam("field-fill")`) is the same name as its
unquoted form, as Sass compares strings. It is accepted and compiles
identically.

**L146.** **An empty shadow is `0 0 #0000`, never `none`, wherever it can
join a list.** From step 2.3 the stylesheet composes an element's shadow as a
list, its state layer over its edge layer. In CSS a `box-shadow` list
containing `none` is invalid, and an invalid declaration paints no shadow at
all. So a theme writing `--sb-edge-X: none` would silently remove the focus or
invalid glow from every element that also carries a state layer. Found by
step 2.3's implementer. Therefore L54's emitted value is `0 0 #0000` (a
transparent zero shadow, which paints nothing and is a valid list item). And
every Sass fallback that can sit in such a list is `0 0 #0000`, not `none`.
`none` stays legal only where a shadow is never composed. No shipped theme has
an empty `rest`, so no golden changes. Amends L54; L53's own examples are
unaffected.

**L147.** **Readings fixed after step 2.4's test author (2026-10-05).**
(a) D1 is a rule of §3's record. C11's track check holds against §3's values,
not against sorbet's dark record before step 2.6. (b) Acceptance #4's "off
fill" is the switch's alone, as L70 re-points it. The rating's empty star and
the carousel's off dot stay `border-strong` as the ring colour (§13, §15 item
6). (c) `.sb-alert` with no tone modifier is the info status box
(`status-info`). (d) L72's 47-row table is committed with step 2.4 as
`docs/pastel-legibility-evidence/caption-sites.md`: one row per site, with
file:line, computed size and class. (e) L146's Sass half is held through the
compiled CSS: no composed `box-shadow` list may resolve to `none`.

### 12.4 Revision 3.5: after the audit of steps 2.3 and 2.4 (2026-10-05)

An independent agent audited steps 2.3 (`e6fd3d5`) and 2.4 (`f9add57`)
rendered, against `c0504b7` (`audit234.txt`; probes in `audit234/`;
screenshots in `drop/sorbet-pastel-2026-10-05-audit234/`). Sorbet dark has
no light-only value leaking (41 resets, as L55 says), no focus indicator was
lost, and every computed difference in the eight frozen preset-modes is an
added fully transparent shadow layer. Two of those layers change pixels, the
hand comparer could pass falsely, and four places fall short of what the
spec asks. These statements close each finding. Where they and earlier text
disagree, these win.

| Id | Closed where, and how |
|---|---|
| C1 | L155: the screenshot tool covers every state the audit walked, plus staged fixtures for what the playground lacks, runs a same-commit control first, and never prints the frozen success line unless every frozen preset was compared in both modes |
| C2, C3 | L148, L149: a frozen preset gains no new rendered layer. A new ring, bar or line comes wholly from a token the frozen presets do not define, through `where-defined`, with the element's old value as the fallback. L70's rows for the switch ring, the thumb and slider-track rings and the selected bar change; the "transparent fallback leaves them pixel-identical" sentence is withdrawn |
| M1 | L150: L146 restated to cover a fallback-less `var()` whose declaration is `none` (`flat-elevation`), with the test's resolution: the closure of custom properties a composed list reads, over the compiled CSS. `flat-elevation` sets `0 0 #0000` |
| M2 | L151: a clipping parent never cuts an all-round layer. The emitter derives `--sb-halo-room` from edge data (8px light, 1px dark; CORRECTION 2026-10-06: 9px and 3px since the repair of 7a683fd, L195 (b)); the carousel viewport and the marquee pad by it, through `calc(<old> + var(--sb-halo-room, 0px))`; each of proposal §7's six parents is named with its reach and decision |
| M3 | L152: a state is never weaker than rest. The interactive card's hover reads `edge(container, shadow(lg))` and its line through `container-line` by `where-defined`; the frozen presets keep `shadow(lg)` and `border` exactly |
| M4 | L153: a check on the compiled CSS catches every way a state selector gets a `box-shadow`: shadow-writing mixins, vendor prefixes, interpolated names, `@at-root`, and named BEM state modifiers. Out of scope, with reasons: style variants that are not states |
| M5 | L154: "may only shrink" is held by a test in `pnpm test` (the allowlist plus an append-only removed list equals the e24df74 sites, recorded as a fixture) and by a CI base-branch check like `check-golden-base.ts`; `--check`'s false claim is corrected |
| m1 | L156: the start bar is on the inline-start side in both directions (`:dir(rtl)` mirrors the offset) |
| m2 | L157: the pills variant keeps its raised segment and takes no bar, on purpose; §13 records its figures and §15 item 18 puts it in front of the owner's eye |
| m3 | L158: the input-group addon is cosmetic and left to the eye, with the reason |
| m4 | L159: the rendered check takes the weakest point over the whole boundary, all four sides; the card's 11.81 against the bar 11.7 is recorded |
| m5 | L161: a misspelt accessor is caught by a test on the compiled CSS: no function call whose name is not a CSS function |
| m6 | No action in the spec: session-dependent corner rasterisation that does not reproduce in fresh pages. L155's control run is what keeps such noise from being read as a pass or a fail |
| m7 | L160: the pre-existing `danger-active` light-to-dark leak is closed by step 2.6, which defines all 69 roles in dark (C1); roles are not reset before then, and why |
| m8 | Out of scope: the playground's missing gutter at 390px predates these steps and is playground layout, not the library |
| Noted (focus) | The command palette input has no visible focus indicator in either commit: a defect of `main`, recorded in §17 item 20 and deferred with the others (decision 16) |

**L148.** **A frozen preset gains no new rendered layer.** (Revision 3.6:
from step 2.5 the frozen presets' rendered content changes by the status
icon, inside the status components only, by the owner's decision; L166 says
what of this statement still holds, all of its cascade rule among it, and
L167 how it is checked.) "Pixel-identical"
(L4, step 2.3 and 2.4 acceptance) is a promise about pixels, and a
transparent layer is not nothing: a `transparent` inset ring added to the
disabled slider's track moved 520 pixels by one level in every frozen preset
and mode (C2), and one added to the switch moved two pixels by up to three
levels when a disabled switch is focused (C3), through antialiasing. So:

- A **rendered layer** is a shadow layer with any non-zero offset, blur or
  spread, whatever its colour. A frozen preset's computed `box-shadow` may
  gain none, in any state.
- The one exception is the **placeholder** `0 0 #0000`, a layer with no
  offset, blur, spread or colour, which L146 needs wherever two layers
  compose. It has no geometry to rasterise. The audit's 101 groups of added
  transparent layers in every frozen preset-mode changed no pixel except the
  two spread rings above.
- A new layer, ring, bar or line in sorbet comes **wholly from a token the
  four frozen presets do not define**, and its fallback is **the element's
  old value exactly**. Where the same selector declared the property before,
  that is its old value, in the same rule's place in the cascade (the
  thumb's `shadow(xs)`, the card hover's `clr(border)`). Where it declared
  none, the old value is whatever reached the element from any other rule,
  which no literal can name: a literal `none` beats every lower layer and
  every weaker rule, and a selected tab that is also an `.sb-button` lost the
  button's shadow (repair of 7a683fd, frozen lens F1 (a)). So the pair is
  written in the nested layer `where-defined` of its own layer (the mixin
  `where-absent`), falling back to `revert-layer`: a nested layer ranks below
  every rule written directly in its parent layer, and `revert-layer` hands
  the property back to the layers below, so the element computes exactly what
  it did before the declaration existed, whatever classes it composes. That is
  the edge seams' shape already (`edge(container, shadow(sm))`), and L149
  gives the shape for a ring painted from a colour token.
- Withdrawn: L70's sentence "fallback `transparent` leaves the four frozen
  presets pixel-identical". It holds for a colour (`background-color`,
  `border-color`), not for an added layer.
- **The frozen presets' cascade is e24df74's, selector by selector.** For
  `box-shadow` (and its vendor spellings) and every `transition` property: a
  selector that declared one at e24df74 still declares it, in the same layer
  and conditional context, and a frozen preset computes the same value from
  it (resolving every `var()` as a frozen preset does); a selector that did
  not declares one only from the `where-defined` nested layer, falling back to
  `revert-layer`. Moving a declaration to a weaker selector is a change even
  when the value is the same: `.sb-button:hover:not(…)` (0,3,0) used to write
  the hover shadow, and once only `.sb-button` (0,1,0) did, `.sb-fab:hover`
  (0,2,0) won on a `.sb-button.sb-fab` (frozen lens F1 (b)). A transition is
  part of the promise too: `box-shadow` in the shared `color-transition` made
  the calendar's today ring fade over 120 ms in every frozen preset where it
  had vanished (frozen lens F4), so `color-transition` eases colour, fill and
  border only. One recorded exception, open: the six field selectors' composed
  edge list (`.sb-input`, `.sb-textarea`, `.sb-number-input`, `.sb-select
  select`, `.sb-combobox__field`, `.sb-date-range__control`) is new at
  selectors that declared no `box-shadow` at e24df74 and computes to
  placeholders only in a frozen preset; it paints nothing on its own element,
  but an element that also carries a class from a lower cascade position that
  paints a shadow (an `.sb-input` that is also an `.sb-button`, which the
  library's markup never does) would lose that shadow. A seventh is a finding.

The L70 rows this changes, each re-pointed through L149 in a step-2.4 fix
commit: the switch ring (`atoms/_switch.scss`, no old declaration:
`revert-layer` from `where-defined`), the switch thumb's ring (old value
`shadow(xs)`), the slider track's ring (`atoms/_slider.scss`, both engines,
no old declaration) and the selected bar (`selected-mark`, at the tab,
pagination, navbar and sidebar sites, none of which declared a `box-shadow`).
The progress track's sunken edge (`atoms/_progress.scss`, `edge(sunken, …)`,
no old declaration) takes the same form through `where-absent`. The
interactive card's hover line (L152) uses the same shape. No other added
layer exists: the field, button and card edges already fall back to their
old values or to placeholders. How it is held: the static check of L149, and the cascade check of this
statement, on the compiled CSS in `pnpm test`; and L155's staged fixtures
(slider, disabled and focused switch states) in the screenshot tool.

**L149.** **The shape for a ring painted from a colour token.** A new mixin,
`where-defined($property, $local, $value, $old)` in `abstracts/_mixins.scss`,
writes

```
--<local>: <value>;
<property>: var(--<local>, <old>);
```

and a new accessor, `seam-only($name)` in `abstracts/_tokens.scss`, compiles
to `var(--sb-<name>)` with **no** fallback (an unknown name fails the compile,
as for `seam()`). `<value>` reads the token through `seam-only`, so in a
theme that does not define the token the local property holds a `var()` of
an unset property with no fallback. CSS makes such a custom property
invalid at computed-value time, which is the same as unset, so `<property>`
takes `<old>`, exactly. In sorbet the token is defined, the local property is
valid, and the ring paints. For example the switch's track:
`@include where-defined(box-shadow, switch-ring-layer, inset 0 0 0 1.5px
seam-only(switch-ring), revert-layer)`; its thumb: `… thumb-ring-layer, (0 0 0 1px
seam-only(switch-ring), shadow(xs)), shadow(xs))`. With `<old>` =
`revert-layer` (the selector declared no such property before, L148) the
mixin writes the pair inside `@layer where-defined { … }`, through
`where-absent`; the nested layer holds nothing a frozen preset can see (every
declaration in it is a custom property or computes to `revert-layer` there).
Rules for the pattern:
the local property is declared on the same element (or pseudo-element) that
reads it, is never registered with `@property` (a registered property falls
back to its initial value, not to the `var()` fallback), and `seam-only` is
legal only inside a `where-defined` value. (Revision 3.6: "a `where-defined`
value" is the pattern, a local declared on the element and read only with a
fallback, which is what the test below checks. The danger rims write it by
hand: L175 reads its local as one item of a list, and L178's fallback is an
edge read inside the `where-defined` sublayer, and the mixin writes
neither.) Test, on the compiled CSS: every
`var(--sb-<seam>)` without a fallback sits in the value of a custom property
`--<local>`, and every read of `--<local>` is `var(--<local>, <old>)` with a
fallback; and no `box-shadow` value anywhere contains a layer whose colour is
a seam with a `transparent` fallback (the C2 shape).

**L150.** **L146, restated.** No composed `box-shadow` list may resolve to a
list containing `none`, in any state, **resolving every `var()`**: one with a
fallback through its fallback when its property is unset, and one without a
fallback through the declarations of its property. Found: `flat-elevation`
(`atoms/_button.scss:33-38`) sets `--shadow-rest`, `-hover`, `-press` to
`none`; `soft-edge` makes `--edge-layer: var(--shadow-rest)`; so the soft,
ghost and link buttons compose `var(--state-layer, 0 0 #0000), none`, which
is invalid and computes to no shadow at all, dropping any state layer (M1;
latent, as no state layer is set on a button yet). Fix: `flat-elevation`
sets the three to `0 0 #0000`. How a test resolves it, on the compiled CSS:
take the custom properties a composed list reads as items (`--state-layer`,
`--edge-layer`); add, repeatedly, every custom property any declaration of a
property already in the set reads anywhere in its value (`var(--shadow-rest)`
puts `--shadow-rest` in, and so does `var(--sb-edge-quiet, var(--flat))`
put `--flat` in); then no declaration of a property in the set has the value
`none`, holds `none` as an item of a list (`0 0 1px red, none`), or a `var()`
whose fallbacks end in either. The rendered half,
in L155: on every element whose `box-shadow` composes, setting
`--state-layer` to a visible ring paints it (the audit's probe,
`audit234/tools/l146.mts`). L147(e) is replaced by this statement.

**L151.** **Clipping parents make room for the all-round layer.** A
clipping or scrolling parent may cut an element's offset falloff (depth) but
never its all-round layer, which is what presence measures. The room comes
from edge data, so nothing is typed twice: a preset with `edges[mode]` emits
`--sb-halo-room: <n>px` in that mode's block, after the edge lines, where `n`
is the largest outward reach, `max(|x|, |y|) + blur + spread`, of any
all-round outset layer in the `rest`, `hover` and `press` of `container`,
`quiet` and the four `filled-*` elements, plus the element's rise wherever
it is hovered (`HOVER_LIFT` in `src/tokens/edges.ts`: the filled buttons
rise 1px by `pressable(1px)`, the interactive card 2px by `translate: 0
-2px`, the quiet button not at all; a press drops a button back; the
container's hover is its rest recipe, so its rest counts with the rise),
rounded up to a whole px. For the new sorbet: **9px in light** (the filled
buttons' hover, `0 0 6px 2px`, 8, plus their rise, 1; and the card's rest,
7, plus its rise, 2) and **3px in dark** (the rims, `0 0 0 1px`, 1, plus the
card's rise, 2). Revision 3.5 said 8px and 1px and counted no rise; a
hovered filled button and a hovered interactive card then reached 9px past
their boxes and were cut by 1px in the carousel and the marquee (repair of
7a683fd, frozen lens F5). The test reads both rises off the compiled
stylesheet and holds `HOVER_LIFT` to them. It is reset in
dark by L55 until step 2.6, like the edge lines: 42 reset lines from the fix
commit until then, and sorbet's golden gains the light line and the two
resets (L97 is amended for this one change). A parent pads by it as
`padding: calc(<old padding> + var(--sb-halo-room, 0px))`, with
`scroll-padding` the same, so a frozen preset's computed padding equals its
old value. C10 requires the property to be read. Proposal §7 item 8's six
parents:

| Parent | What it clips | Decision |
|---|---|---|
| `.sb-carousel__viewport` (`_carousel.scss:28`) | cards flush to its edge; their all-round layer (7px light) was cut on every side (M2) | pads by the room |
| `.sb-marquee` (`_marquee.scss:33`) | arbitrary items flush to its edge | pads by the room |
| `.sb-table-wrap` (`_table.scss:7`) | buttons in cells, inside cell padding of 12px or more (`:20, :53`) | no room: 12 > 8, so only offset falloff can be cut |
| `.sb-tabs__list` (`_tabs.scss:15`) | underline tabs (an inset bar) and pills (`shadow(sm)`, 3px, inside the list's 4px padding) | no room: no all-round outset layer inside |
| `.sb-combobox__panel` (`_combobox.scss:117`) | options, which carry no edge | no room |
| `.sb-card` (`_card.scss:10`) | children inside its `space(4)` padding (16px) | no room: 16 > 8 |

Visible in sorbet: the carousel and the marquee inset their content by 8px
in light (1px in dark from step 2.6). (CORRECTION 2026-10-06: 9px in light and 3px in dark, as this statement's
own arithmetic and L98 give; L195 (b).) Nothing changes in a frozen preset.

**L152.** **A state is never weaker than rest.** A hovered, pressed, focused,
selected, checked, indeterminate or open element never draws less edge than it
does at rest (checked and indeterminate added by L165): its
state edge is its rest edge or a stronger recipe, never a replacement that
measures lower. The interactive card broke this (M3): its allowlisted hover
wrote `box-shadow: shadow(lg)` and `border-color: clr(border)`, replacing
sorbet's caramel container edge with a faint shadow and showing the
transparent line. Fix, in the step-2.4 fix commit:
`.sb-card--interactive:hover` writes `box-shadow: edge(container,
shadow(lg))` (the container edge, since `edge()` allows a state only on
`filled-*`; it equals rest, which is not weaker) and its line through
`where-defined(border-color, card-hover-line, seam-only(container-line),
clr(border))`. The frozen presets keep exactly `shadow(lg)` and `border`.
A grown hover recipe for cards would be new edge data and an owner's look;
it is not proposed. The site stays on the lint allowlist (L154), with this
value.

**L153.** **What the state-shadow rule catches.** The stylelint rule reads
source and gives line numbers; it is backed by a check on the **compiled**
CSS, in `pnpm test`, which sees every route at once. A rule of the compiled
stylesheet is a **state rule** when a compound of its selector carries a
state: a user-action or form pseudo-class (`:hover`, `:active`, `:focus`,
`:focus-visible`, `:focus-within`, `:checked`, `:indeterminate`,
`:disabled`, `:enabled`, `:invalid`, `:user-invalid`, `:open`,
`:popover-open`, `:target`, in any letter case, also inside `:is()`,
`:where()`, `:not()` and `:has()`); an `[aria-*]` attribute; a `[data-*]`
attribute unless it is on the named list of facts — `data-today`,
`data-outside`, `data-align`, `data-numeric`, `data-reverse`, `data-trend`,
`data-status`, `data-optional`, `data-required`, `data-danger`,
`data-pause-on-hover`, things true of the element that no user action
changes; the HTML state attributes `[open]`, `[checked]`, `[selected]`,
`[disabled]`; or a BEM modifier from the named list `--selected`, `--active`,
`--current`, `--open`, `--checked`, `--pressed`, `--expanded`, `--invalid`,
`--disabled`, `--loading`. (Revision 3.5 named `[data-state]`, which the
library never uses, and missed `[data-invalid]`, `[data-highlighted]`,
`[data-selected]`, `[data-disabled]`, `[data-loading]` and `[open]`, which it
does: repair of 7a683fd, guards F6. A new `data-*` attribute is a state until
a spec line names it a fact.) A rule inside `@starting-style` is read like
any other. A state rule may declare `box-shadow`, `-webkit-box-shadow` or
`-moz-box-shadow` only with the composed form, read whole: exactly two items,
`var(--state-layer)` then `var(--edge-layer)`, each with no fallback or the
placeholder `0 0 #0000` (a third layer, a visible fallback, or a property
whose name merely starts `--state-layer` is not it: guards F3); or at an
allowlisted site. The definition is one module,
`<root>/tools/stylelint/state-definition.js`, which the source rule, the
compiled check and the e24df74 recorder import. That catches a shadow-writing mixin such as `elevation` or
`elevate` included under `&:hover`, a vendor prefix, an interpolated property
name and `@at-root`, because all four are ordinary declarations once
compiled. Out of scope, and why: a BEM modifier not on the list is a style
variant (`--raised`, `--flat`, `--sm`, `--outline`), whose shadow is its
resting look, not a state's; and a `@media` condition (`(hover: hover)`) is
not a state of the element. The list is the spec's; adding a state modifier
to a component adds it here.

**L154.** **"May only shrink", enforced.** Three parts: (1) a fixture,
`tools/fixtures/contracts/state-box-shadow-sites.at-e24df74.json`, recorded
once from `git archive e24df74` by a committed recorder, lists the sites the
rule finds there; (2) a committed, append-only list of removed sites,
`tools/stylelint/state-box-shadow-removed.json`; (3) a test in `pnpm test`
asserting that the allowlist and the removed list are disjoint, that their
union is exactly the fixture, that every allowlisted site still exists in
the source, and that no site outside the allowlist is found. So a hand-added entry that was never a site fails (1); one that was removed
and is put back must be taken out of the removed list, a diff in review; and
a CI step, `tools/check-allowlist-base.ts`, beside `check-golden-base.ts`,
fails a pull request whose removed list lacks an entry its base branch's has.
Both fixtures are pinned by sha256 in the test, so a site appended to the
recorded stylesheet and the site list together (and then to the allowlist)
fails (guards F8). The base check fails closed, like its sibling: a ref git
does not know, a removed list at the ref that does not parse, and a list here
that does not parse are each a failure; only a ref that exists and has no
list passes as "no list yet" (guards F7). A test in `pnpm test` runs it
against a throwaway repository, and holds `build.yml` to a `run:` line that
runs it. `--write`
regenerates nothing the test could not reproduce; the file's claim that
`--check` "catches one" is corrected to what it checks (each entry is a site
at e24df74). Re-adding `.sb-button:hover` (M5) fails (2) and the base check.

**L155.** **What the screenshot tool must cover, and when it may say
"identical".** (Revision 3.6: the tool is `<root>/tools/shots.ts`, not
`tools/shots.ts`; and from step 2.5 both sides of a compare mask the status
icons, L167.) `tools/shots.ts compare` covers, for each of the four frozen
presets in light and dark, in `ltr`, `rtl` and coarse-pointer runs (with
animations frozen): the full page; a keyboard Tab walk over every focus stop;
every roving and `tabindex=-1` item; a hover and a press on every interactive
element; every overlay open (menu, popover, drawer, modal, confirm, toast,
command palette, combobox, date range, date picker, colour panels) with hover
and key navigation inside; every field invalid and focused; every control
disabled, and disabled and hovered, and disabled and focused. For what the
playground lacks it renders **staged fixtures**: the slider (resting,
disabled), the switch (off, on, disabled, focused, focused and disabled), the
interactive, raised, flat and sunken cards (rest and hover), pills tabs,
toned progress bars, a static toast, small and large buttons, and
`aria-disabled` controls. The audit's `audit234/tools/run.mts` and
`staged.mts` are the reference list. The baseline is THIS tree's playground: `baseline --at <ref>` compiles
`<ref>`'s `packages/design-system/src/styles/index.scss` and builds this
tree's playground with it in place of this tree's library stylesheet (Vite
resolves `@sorbet/design-system/css` to it; the theme files stay this
tree's, which for the frozen four the golden gate holds byte for byte to
e24df74). So the library stylesheet is the only thing that differs: a
baseline of `<ref>`'s whole playground differed in every frozen full-page
shot, because the playground counts the design system's checks in its own
text (repair of 7a683fd, frozen lens F6). `baseline.json` records the commit
the stylesheet came from, a content digest of the playground shot, the
tree, the Chromium and the shot count; `compare` refuses, with a non-zero
exit, a baseline that does not record them, one whose stylesheet came from a
working tree with uncommitted changes, from a commit this checkout does not
have, or from this checkout's own HEAD (the tree compared with itself, which
printed the success line: guards F14), one taken by another Chromium, and
one shot on a different playground. Every crop is of what it names (guards
F13): an element whose crop does not fit in the viewport is scrolled to the
middle of it first; a missing element, one with no size, or one whose crop
still does not fit though the element would, is an error, which fails the
run; the margin stops only at the document's edge, or the viewport's for an
element in a fixed layer; an element larger than the viewport, and an
overlay recipe that leaves no overlay open, are shot as what is in view and
their description says so. Every kept screenshot is taken until two takes in
a row agree (a forced state is not always painted on the first frame). Before
comparing it runs a same-commit control; a shot that differs in the control
is reported as unstable and blocks the success line. It prints "The frozen
presets are pixel-identical to `<commit>`'s library stylesheet" only when
every frozen preset was compared in both modes with no difference and no
unstable shot; `--only` that excludes any frozen preset, or a run that
compared no frozen shot, ends with "no frozen preset compared" and a
non-zero exit. The tool stays hand-run (step 2.3); a run's summary, with its
shot count and the baseline's commit, is quoted in the commit that relies on
it.

**L156.** **The start bar follows the writing direction.** `box-shadow` has
no logical offsets, so `selected-mark(start)` writes `inset 3px 0 0 0 …` and,
under `&:dir(rtl)`, `inset -3px 0 0 0 …`, so the bar is on the inline-start
side in both directions (m1). `selected-mark(end)`, the bottom bar, needs no
mirroring. The staged RTL runs of L155 hold it.

**L157.** **The pills tab keeps its raised segment, on purpose.** The pills
variant is a segmented control: its selected segment is the raised fill
(`surface-raised`) with `shadow(sm)`, over the list's well. The bar and the
wash belong to underline tabs and rows, so the pills variant takes neither,
and that is now stated rather than an accident of specificity (m2). Measured
in sorbet: the raised fill against the well, light `#fffbf1` on `#f7ecd1`
4.47 (tritan), dark `#463425` on `#140903` 18.49 (protan); `shadow(sm)` is
caramel-tinted in light (L20), and the selected label is the strong ink at
weight 600 (CORRECTION 2026-10-05, L164: it is `text` at 500). Light's 4.47 is weak and no sheet drew it: §13 records it, and
§15 item 18 asks the owner's eye. (Drawing the quiet slab there instead,
19.69 light and 21.33 dark, would put a halo inside the list's 4px padding,
which L151 forbids.)

**L158.** **The input-group addon is left to the eye.** The addon is the well
(`bg-subtle`) joined to the field, whose line is transparent in sorbet, so
the field's inset ring stands next to an unframed well (m3). The addon is
part of the field, not an element with an edge of its own, and sheet 2 drew
none; it is cosmetic and listed in §13.

**L159.** **The rendered check takes the whole boundary.** Step 2.4 and 2.6
acceptance #2's "weakest side" is the weakest point along the whole boundary,
all four sides, sampled along each side's full length less the corner radius,
not one line per side (m4). Re-measured by the audit for the light card:
11.81 at its weakest point, 0.1 above the bar of 11.7, so step 2.4's verdict
stands. The measurer is changed to sample this way before step 2.6.

**L160.** **The `danger-active` leak closes at step 2.6.** (CORRECTION 2026-10-06: "the light block" and "the
dark block" are as L195 (d) and step 2.6's acceptance #3 bound them: both dark blocks are checked.) Sorbet's light
block defines `danger-active`, its dark block (still from `buildMode`) does
not, and roles are not reset, so a pressed danger button in sorbet dark
paints the light `#f9c3c6` (m7). It predates these steps (`c0504b7`). Roles
are not added to L55's resets: a reset role has no fallback at its sites
(`clr()` writes none), so the press would paint no background at all, which
is worse. Step 2.6 closes it by defining all 69 roles in dark, `danger-active`
`#f9c3c6` by D6, which C1 then holds; its acceptance gains: no name the light
block emits is missing from the dark block, but the two button-size lines
(L19). Nothing merges before step 2.6 (L70).

**L161.** **A misspelt accessor fails a test.** Sass passes an unknown
function through as text, so `seem(...)`, `egde(...)` or
`button-lable(...)` compile and lint cleanly and paint nothing (m5). A test
on the compiled CSS asserts that every function call is a CSS function from
a fixed list (`var`, `calc`, `min`, `max`, `clamp`,
`color-mix`, `rgb`, `hsl`, `oklch`, `oklab`, `linear-gradient`,
`radial-gradient`, `repeating-conic-gradient`, `url`, `translate`, `scale`,
`rotate`, `cubic-bezier`, `steps`, `attr`, `env`, and the others the file
already uses at `f9add57`, recorded with the test): in a declaration value,
inside `@starting-style` and `@keyframes` too, with a leading `-` counted as
part of the name (`-space(2)` compiles to the literal `-space(2)`, and
`- space(1)` to `-var(…)`; only a vendor spelling of a listed function may
start with `-`), and in an at-rule's prelude, which may also call `selector()`
and `style()`; text inside quotes is not a call. Anything else is an accessor
that did not compile (repair of 7a683fd, guards F4, F5, F17). The list stays
fixed: `drop-shadow()` and any other function the stylesheet does not use at
`f9add57` fails until a spec line adds it (guards F17, recorded so the alarm
is understood).

**L162.** **Rulings after revision 3.5's test author (2026-10-05).**
(a) The `where-defined` form is allowed on a state selector, at the six
selected-bar selectors only, by name: `.sb-tabs__tab[aria-selected=true]`,
`.sb-pagination a[aria-current=page]`, `.sb-pagination
button[aria-current=page]`, `.sb-navbar__nav a[aria-current=page]`,
`.sb-sidebar__item[aria-current=page]`, `.sb-sidebar__item[aria-current=true]`.
That form is `box-shadow: var(--<local>, <old>)`, with `--<local>` set from
`seam-only()` in the same rule, and the element must carry no edge layer, so
that it cannot clobber one. Deciding "carries no edge layer" from the
selector's text alone exempted a descendant- or variant-qualified selector
of an element that does (`.x .sb-button[aria-pressed=true]`), whose bar then
replaced the button's edge and state layers (repair of 7a683fd, guards F2). A
seventh needs a spec line. L153 still forbids any other non-composed state
`box-shadow`.
(b) L154's fixture of e24df74 sites is the set the COMPILED check (L153)
finds at e24df74, not the source rule's set. The compiled check is the
stricter and the one that runs. That adds
`.sb-segmented__option[aria-checked=true] { box-shadow: var(--sb-shadow-sm) }`,
which the source rule missed. It is allowlisted as it stands, the same shape as
the pills tab (L157): a raised segment, not a halo.
(c) L151's parents had no padding at e24df74, so the form is exactly
`padding: var(--sb-halo-room, 0px)`, with no `calc()`. `scroll-padding` is
set the same way, and only on `.sb-carousel__viewport`, the one scroll
container. The marquee is `overflow: hidden`.
(d) `state-box-shadow-removed.json` has the allowlist's own entry shape: an
array of `{ file, selector }`. Entries are appended, never edited or removed.

**L163.** **CORRECTION 2026-10-05 to L162 (b), after the test author ran it.**
L162 (b) said "8 sites". The compiled check at e24df74 finds 22: 15 field
focus and invalid glows, plus the two button states, the fab, the
interactive card, the marquee toggle, the pills tab and the segmented option.
The fixture is the compiled set, all 22. The removed list therefore carries
the 15 glows, which step 2.4 moved into `--state-layer`, and the two button
sites. `.sb-calendar__day[data-today]` is not a state under L153: `today` is
a fact about a date, not something the user does. It leaves the allowlist.
The source stylelint rule shares L153's definition of a state (one module), so
it flags exactly what the compiled check does: `[data-today]` and the other
named facts are not states; every other `[data-*]` attribute is (CORRECTION,
repair of 7a683fd, guards F6). The
marquee keeps `padding: var(--sb-halo-room, 0px)` (L151's table); only
`scroll-padding` is the viewport's alone (L162 (c)).

**L164.** **The selected pill stays milk, as built (DECISIONS row 32,
2026-10-05), and L157's description of its label is corrected.** The owner
first chose a cream segment (`#fef4dc`) with a semi-bold label in the strong
ink, then, shown it rendered beside the milk one, kept milk: "oh this is
different than what i was picturing. lets go with milk". Nothing in the
stylesheet changes. The cream design was specified, tested and built on a
local branch, and is parked there unmerged (`parked/cream-segment`), should
it be wanted later.

CORRECTION 2026-10-05 to L157 and §15 item 18: both said the selected label
is "the strong ink at weight 600". The code at `856606b` paints it
`clr(text)` (sorbet light `#693800`) at the tab's `fw(medium)` (500), against
the unselected tabs' `text-muted` `#844d16` at 500: separation 8.11 typical,
7.90 protan (the worst view). That is what the owner kept. §15 item 18's dark
figure, `#463425` on `#140903` 18.49, is sorbet dark after step 2.6; until
then the segment paints the built `surface-raised` `#4b463f` on `#38342f`,
6.89.

**L165.** **The repair of 7a683fd: the owner's answers and three small rulings
(2026-10-05; DECISIONS rows 33 to 35).** The repair's two audit lenses
(frozen lens F3, guards lens) and its write-up of options
(`repair-of-7a683fd-owner-options.md` beside this file) left four questions
that change how sorbet looks. The owner chose from a rendered sheet.

(a) **How L152 compares a state with rest (row 33).** When a state recolours
the element's own fill, the state and rest are both scored against what the
element sits on, not against the element's fill: the edge pixels are what
draw the edge, and a fill change is not a weaker edge. Under that reading the
outline button reads 11.47 at rest and on hover on the page (the same edge
pixel `#e2cba8` in every state; only the fill moves, milk `#fffbf1` to
`#f7ecd1`), and the checked checkbox reads 24.95 against 24.95 (its ring
`#b096d7` is the same in every state). Both stay as built. This reading is for
the comparison between states only: step 2.4's rendered bar keeps L159's
fill-credited reading for rest.

(b) **The raised card takes the container edge (row 35).**
`.sb-card--raised { box-shadow: edge(container, shadow(md)); }`, a new L70
row: on the page 11.81, in a card 10.26 (it was 2.64 and 0.28, under the card
bar of 11.7). In sorbet light a raised card now looks like a plain card; the
floating edge was the other choice, distinct but 12px wide, past the halo
room. Frozen: `var(--sb-edge-container, var(--sb-shadow-md))` resolves to
`shadow-md` at the same selector, e24df74's value.

(c) **The sunken interactive card keeps its own edge on hover** (decided by
the spec author; it changes no look). The allowlisted hover reads a local the
variant sets: `.sb-card--sunken { --card-hover-edge: edge(sunken, shadow(lg)); }`
and `.sb-card--interactive:hover { box-shadow: var(--card-hover-edge,
edge(container, shadow(lg))); }`. In a card: 11.21 at rest and on hover (it
was 10.26 on hover). Frozen: `shadow-lg` on hover either way, e24df74's value.
L152's "with this value" now names this one.

(d) **Recorded, not changed.** The pagination's current-page bar now appears
at once instead of fading, because `box-shadow` left `color-transition`
(L148); and a hovered filled button in a compact table cell loses 1px of its
halo, at most 3 levels, to the cell's 8px padding (L151's table).

### 12.5 Revision 3.6: step 2.5 settled (2026-10-05)

A spec adversary attacked step 2.5's text before any test was written
(`sa25-report.md` in the session scratchpad; its probes in `sa25/`): 3
critical, 11 major and 6 minor findings. The owner answered the four design
questions they raised on 2026-10-05, choosing from a rendered sheet
(`drop/sorbet-pastel-2026-10-05-status-icons/`; DECISIONS rows 36 to 39), and
the orchestrator ruled on the rest (row 40); the spec author's own calls are
S35 to S51 (§16). These statements close every finding. Where they and earlier
text disagree, these win, and each earlier statement they change carries a
dated pointer here. Measurements: `sa25-author/m1.mts` (appendix C's
instruments, `src/tokens/color.ts`).

| Id | Closed where, and how |
|---|---|
| C-1 | L166 (owner, row 36: "Every theme"): the icon and word are component markup in all five presets; L4 and L148's cascade still hold, and a frozen preset's rendered content changes only by the icon inside the components L168 names. L167: from step 2.5 the L155 compare masks the status icons on both sides and must then be pixel-identical; the icons themselves are looked at, unmasked, on a sheet of all five presets. L185 and §17 item 21: buylist, `apps/admin` and `apps/meal-kit` change, superseding proposal §12's "nothing changes" for them |
| C-2 | L170: the icon is `currentColor` with the symbol knocked out, so it has one colour pair. On a full-strength fill it is the label's ink (R153 to R159, exactly); elsewhere sorbet paints `text-strong` (R091 to R093 exactly on surfaces; the status washes are R128 to R134's hexes in dark, and in light one is R128's and three are in §13 with their figures), and a frozen preset paints the component's own text colour, held wherever `wcag-aa` holds that text |
| C-3 | L179: `.sb-icon--X` reads `seam(X-mark)`; a frozen preset is unchanged (the fallback is `X`); sorbet light goes from 6.47 to 13.10 on a card to 24.45 to 30.38 (R196, R198, R200, R202). L70 gains the row; §13 records the page and the dark figures |
| M-1 | L171: the four words, hidden (owner, row 38), a colon and a space, overridable by `statusLabel`; L181: a test holds their presence, since their absence shows nothing |
| M-2 | L172: Alert's `icon` prop is removed (row 40) |
| M-3 | L175 (the danger button's rim, folded into its three shadows, so it is in every state and no state rule changes) and L178 (the danger status box's rim, with its edge, through `where-absent`); the danger menu item has no rim (L176, row 40) |
| M-4 | L169: a filled silhouette with the symbol knocked out (owner, row 37), one even-odd path, the four names, exported through `atoms/index.ts` and listed in the catalog (whose "nine icons" is corrected), the tone-to-shape map (L168) and one size rule |
| M-5 | L182: C10 reads the compiled stylesheet. Measured there at `9b83e50`, every name is read but `info-mark` and the four `--sb-edge-status-*`, which step 2.5 adds |
| M-6 | Step 2.5's acceptance #6: at least the floor of 126 render; 131 at `9b83e50`, 135 with the four glyphs |
| M-7 | Step 2.5's acceptance #5: each tone's status box on a card, light, at least 9.9 (sheet 2's 10.9 less 1.0), the danger box with its rim |
| M-8 | L183: three existing tests change, each named with its new expectation (#49 narrows "2.4 #3", #50 lifts C11's status exemption, #51 reads L178's one new fallback form) |
| M-9 | L177: the field's error message takes the octagon (owner, row 39). L168: brand and neutral tones take none (row 40). §13: toned progress bars (11 of the 15 pairs of bar colours under 10 apart at the worst view, the least 4.02) and Token Studio's failure list (0.00 from body text), with their figures (owner, row 39), and, beyond the finding, the dropzone's error line and the rating's stars |
| M-10 | L175 (Button: `variant="danger"` only; no hidden word; none on `iconOnly`; hidden with the label under `loading`; a consumer's glyph stays) and L176 (MenuItem: the octagon first, replacing a consumer's leading glyph; no word; no rim) |
| M-11 | L180: role, accessible name and reading order per component and tone, the review's oracle. A danger alert keeps `role="status"` (S39) |
| m-1 | L70's status-mark row: the app sites change at their own sync, not in step 2.5 |
| m-2 | C11's row: "after step 2.4" for 22 selectors, the five status selectors from step 2.5 |
| m-3 | Step 2.5's acceptance #2: C10 is first enforced at step 2.5; C11's status half is; its fill half and 22 edge reads have been since step 2.4 |
| m-4 | L184: "cannot render without them" is the React components' property; the HTML API's comments show the new markup |
| m-5 | L184: no glyph is drawn by the stylesheet, so L161's function list is unchanged |
| m-6 | L184: step 2.5 does not fix the React Menu's ARIA |
| Owner 1 to 4 | Rows 36 to 39: L166 and L167; L169 and L170; L171 and L181; L177 and §13 |

**Revision 3.6, after its verifier (2026-10-05).** An independent agent read
revision 3.6 against the code (`sa36-report.md` in the session scratchpad;
scratch evidence in `sa36/`, among it the step-2.5 Sass of L170 to L179
applied, compiled and run). It found 18 of the 20 findings closed and C-1 and
M-7 partly closed, raised three silent majors (N1 to N3), six minors (N4 to
N9) and three nits (N10 to N12), and listed thirteen values a test author
would have had to invent. The orchestrator ruled on each (2026-10-05). The
statements above are amended in place, and L186 to L191 are new. This
revision changes the header's revision number, so the commit that carries it
re-runs the transcriber (`node --input-type=module - <repo root> <
packages/design-system/tools/fixtures/contracts/transcribe-legibility-spec.mjs.txt`):
`tools/test-contracts.ts:2582` ("2.1 #2 (fixture)") checks the two
transcribed fixtures' `transcribedFrom`, which still says "revision 3.5", and
the re-transcription differs from them in that line only (verifier N4; the
orchestrator runs it at the commit).

| Id | Closed where, and how |
|---|---|
| C-1 (rest) | L187: the markup, with the slot removed, equals `9b83e50`'s for 39 recorded cases and three toast cases given here, so a markup change the masked compare cannot see fails a test |
| M-7 (rest) | L191: the measurer stages the warning, info and danger boxes by cloning the success box and swapping its tone class, each filed under sheet 2's "Status box" on "card" |
| N1 | L186: the glyph and the word sit in one `span.sb-status`, `position: relative`, so the word's containing block is inside the component; a compiled-CSS test (L190 (a)) and a hand probe (a status badge in an overflowing `.sb-table-wrap` at 390px: the page does not scroll sideways, every preset, both modes). L167's mask, L169's sizes, L170's colour rules and L172 to L177's markup now name the slot |
| N2 | L187 (the fixture, its recorder, the 39 cases, the removal pattern, the three toast strings) and L181 case 9 |
| N3 | L188 (the provider's source form and four textual checks) and L173 (`ToastItem`'s exact props) |
| N4 | This addendum's preamble: the commit re-runs the transcriber |
| N5 | L169: line 704's slash list gains the four exported names |
| N6 | L191; `<root>/tools/measure-edges.ts` added to step 2.5's files |
| N7 | L190: the placeholder in either spelling `PLACEHOLDER` accepts; L175 quotes the falloff, textually `.sb-button--secondary`'s |
| N8 | L169: the knock-out is the spec author's call (S36, DECISIONS row 41), what it shows on a fill and on a wash, and that the owner sees it on the look sheet; DECISIONS row 37 corrected |
| N9 | L189: the test fails, naming `pnpm build`, when the build is missing or older than its source |
| N10 | L183: #50 stays true at step 2.5 and is widened, not made false |
| N11 | §16's preamble and DECISIONS row 41 now list S36 and S49 |
| N12 | L170: the slot's two rules are the only colour declarations that reach it; the menu's `> svg` rules match only direct children |
| Values 1 to 13 | 1: L189 (imports). 2: L175 (sizes, variants). 3: L187 (every component's props and strings, the field's child, the toast's `message`, `leaving`, `onDismiss`). 4: L181 ("first" defined). 5: L189 (failure text, exit code 1). 6: L171 (a non-empty `statusLabel` is trimmed). 7: L189 (the script bodies, the CI step, CLAUDE.md's line). 8: L169 and L189 (`StatusMark`, `STATUS_GLYPHS`, `STATUS_WORDS`; tested only as absent from the barrel). 9: L169, L190 (`inline-size`, `block-size`). 10: L175. 11: L190. 12: L167 (the success line's words and place; `baseline.json` records the mask). 13: L191 |

**L166.** **The status icon and word render in every theme (DECISIONS row
36).** The owner: "Every theme". The icon and the word are markup the React
components write from their status (L168), so from step 2.5 they appear in
all five presets, the four frozen ones included. That is a change of
content, not of colour, and it is confined to the components L168 names and
to what composes them (the alert dialog's danger confirm button,
`organisms/alert-dialog.tsx:112`; Token Studio's report badge; a table cell
holding a status badge). What still holds for the frozen four:

- **L4**: their theme files and golden files, byte for byte. Step 2.5 adds
  no token, so no preset's theme file changes.
- **L148's cascade**: `box-shadow` and every `transition` property,
  selector by selector, as e24df74 had them, and no new rendered layer. The
  two rims (L175, L178), the status boxes' edges (L178) and the icon's ink
  (L170) all come from tokens the frozen four do not define, so a frozen
  preset computes from them a placeholder `0 0 #0000`, `revert-layer`, or
  its own text colour.
- **Every colour a frozen preset painted, it still paints**: the two
  re-points of L179 fall back to exactly the value they replace.

What changes in a frozen preset, and only inside the named components: the
icon is drawn and takes room. A status badge is wider by the icon and its
gap; an alert and a toast lead with a 1.25rem slot; the danger button and the
danger menu item lead with the octagon; the field's error message starts with
it; a status badge given `dot` shows the icon in the dot's place (L174); and
a glyph a consumer passes as a direct child of a danger menu item is hidden,
the octagon taking its place (L176).
L148's first sentence reads L4 as a promise about pixels. For these
components that reading is superseded by this statement, and L167 says how
the rest of the promise is still checked. L185 says which apps show it.

**L167.** **How the frozen promise is checked from step 2.5.** Both sides of
L155's compare render this tree's markup (only the library stylesheet
differs between them), so the icons are on both sides. From step 2.5 the
tool masks them. `<root>/tools/shots.ts` gains a constant `MASK`, exactly
`.sb-status{display:none!important}`, which `fresh()` writes into the same
`<style>` element as `FREEZE`, after it, on both sides and in every shot.
Every status icon and word sits inside one `.sb-status` slot (L186), so the
mask removes the glyph, the word and the slot's room together, and the word,
which paints nothing anyway (`u-visually-hidden`, `base/_utilities.scss:5-7`),
goes with them. With the icons masked, the four frozen presets must be
**pixel-identical** in both modes, as L155 states. The success line then
reads `✓ The frozen presets are pixel-identical to <commit>'s library
stylesheet in both modes, in <variants>, with the status icons masked (<n>
shots, control stable).`: the words "with the status icons masked" go
after the variants and before the parenthesis (`<root>/tools/shots.ts:814`
today). `baseline.json` records the mask as `"mask":
".sb-status{display:none!important}"`, and `compare` refuses, with a
non-zero exit, a baseline whose `mask` is missing or is not its own, as it
refuses one from another Chromium (L155). A difference in the masked run is
a finding. Two things make that achievable, and step 2.5 keeps to both.
Every rule it adds styles the slot or its glyph, reads a colour or a shadow
from a token the frozen four do not define (L170, L175, L178), or hides a
consumer's glyph in a danger menu item (L176, which no playground item has);
nothing else of the named components moves. And it edits no playground
demo, since a demo that grew a row would differ in every masked shot below
it. Masking was chosen over judging each differing shot by eye (S46): a
full-page shot of a page whose alert grew a slot differs everywhere below
the alert, so "confined to the icon" cannot be read off it. The mask cannot
see a change to the markup itself, since both sides render the same tree;
the markup fixture of L187 holds that. Unmasked, the icons are looked at: a
rendered sheet of each component and status of L168 in all five presets and
both modes, put in a dated folder under `~/homelab/drop/` (the lab's rule for
anything to be looked at) and checked in the audit. The frozen four's icon is
content nobody has yet seen in those themes, and the owner sees the
knocked-out symbol there for the first time (L169). (L155 wrote the tool's
path as `tools/shots.ts`; it is `<root>/tools/shots.ts`.)

**L168.** **Where the icon and word render, and where they do not.** Each is
derived inside the React component from its status. A consumer cannot leave
either out; the override of L171 changes the word's text and never removes
it.

| Component | What makes it a status | Icon | Word |
|---|---|---|---|
| `Alert` (`molecules/alert.tsx`) | `tone`, default `info` | the tone's, in a leading slot (L172) | yes |
| A toast (`molecules/toast.tsx`) | `toast(…, { tone })` | the tone's, in a leading slot (L173); none without a tone | yes; none without a tone |
| `Badge` (`atoms/badge.tsx`) | `tone` of `success`, `warning`, `danger` or `info`, soft or `solid` | the tone's, first (L174) | yes |
| `Badge` | `tone` of `primary`, `secondary` or `accent`, or none | none | none |
| `Button` (`atoms/button.tsx`) | `variant="danger"` | the octagon, first; none when `iconOnly` (L175) | none: its label is its word |
| `Button` | any other variant | none | none |
| `MenuItem` (`molecules/menu.tsx`) | `danger` | the octagon, first (L176) | none: its label is its word |
| `Field`'s error message (`molecules/field.tsx`) | `error` given | the octagon, first (L177) | `Error: ` |

Tone to shape: `success` the tick in a circle, `warning` the exclamation mark
in a triangle, `danger` the cross in an octagon, `info` the i in a square
(rows 23 and 37). No icon and no word: the brand and neutral tones above,
which are not statuses (row 40); the `Icon` atom, which is a box for the
consumer's own glyph and only colours it (its status tones are re-pointed,
L179; row 40); toned progress bars and Token Studio's failure list (row 39);
and, not put to the owner, the dropzone's error line and the rating's stars
(S49). §13 gives each its figures. In sorbet three brand fills share a
status's hex (`secondary` and `danger` `#f9c3c6`, `accent` and `warning`
`#f5e3a2`, `primary` and `info` `#dac5fc`), so on a badge the icon is the
only thing that tells a status from a brand tone, which is its job.

**L169.** **The four glyphs (DECISIONS row 37).** The owner: "A. Filled, dark
ink (as sheet 2)", section A of the status-icons sheet. `atoms/icons.tsx`
gains `SuccessIcon`, `WarningIcon`, `DangerIcon` and `InfoIcon`. They are
exported through `atoms/index.ts` beside the nine house glyphs (`:11-23`)
and listed in `<root>/README.md`'s Component catalog. There, line 704's
slash list gains `/SuccessIcon/WarningIcon/DangerIcon/InfoIcon` after
`MinusIcon`, and its "the nine icons" becomes "the thirteen icons"; line
705's list gains "Success, Warning, Danger, Info" after "Minus".
`<root>/tools/check-catalog.ts:35-47` needs each exported name verbatim (or
a line whose first word prefixes it), so the short names of line 705 alone
would fail it (verifier N5).

- **Shape.** A silhouette filled in the ink, with the symbol knocked out, so
  the surface under the icon shows through the symbol. The geometry is the
  sheet's, on a 24-unit grid. The silhouette is the sheet's shape with its
  2-unit round-joined stroke included: a disc of radius 11 at (12, 12); the
  triangle `M12 2.8 22.2 20.6H1.8Z`, the octagon `M8.1 1.8h7.8l6.3
  6.3v7.8l-6.3 6.3H8.1l-6.3-6.3V8.1Z` and the square from 2 to 22 with
  corner radius 4.5, each grown by 1 unit with round corners. The symbol is
  the sheet's 2.6-unit round-capped strokes: the tick `M7.5 12.5l3 3
  6-6.5`; the bar `M12 9.3v4.6` and a dot of radius 1.61 at (12, 17.2); the
  cross `M8.8 8.8l6.4 6.4M15.2 8.8l-6.4 6.4`; a dot of radius 1.61 at (12,
  7.6) and the bar `M12 11v6`. Both are written as outlines.
- **The knock-out is the spec author's call, not the owner's** (S36;
  DECISIONS row 41, not yet seen by the owner; verifier N8). The sheet the
  owner chose from drew the symbol in a fixed milk `#fffbf1` (as sheet 2
  did, `build-edges.mjs:143-144`). Knocked out, the symbol shows whatever is
  under the icon instead: on the solid danger button the blush fill
  `#f9c3c6`, on a wash the wash's own hex (the danger wash `#fcdfdc` in
  light, `#5b443a` in dark), on a surface the surface. A fixed milk symbol
  would vanish in dark mode, where the silhouette is the cream `#f3e7ce`:
  `#fffbf1` on it is Lc 9.80 and 5.79 apart (both tritan), where the
  knocked-out dark danger wash reads Lc 76.98 (deutan). The owner sees the
  knock-out on the step's look sheet (L167; acceptance #7).
- **The knock-out is one path.** Each glyph is `<svg viewBox="0 0 24 24"
  aria-hidden="true" focusable="false" class="sb-status-icon
  sb-status-icon--<tone>">` holding one `<path fill="currentColor"
  fill-rule="evenodd" d="…">`, whose first subpath is the silhouette and
  whose others are the symbol. Under the even-odd rule a subpath inside the
  silhouette is a hole, so the symbol's subpaths must not overlap one
  another: the cross is one outline, the union of its two strokes (two
  overlapping subpaths would fill the centre again). No colour is written
  anywhere in a glyph (no hex, no `rgb()`, no second `fill`, no `stroke`),
  and nothing is referenced by id (no `<mask>`, no `clip-path`). A mask needs
  an id unique in the document, and generating one needs a hook, which would
  make `icons.tsx` a client module
  (`packages/component-library/tools/check-client-directives.ts`) (S36). So a
  glyph is whatever colour its `color` resolves to, on every surface and in
  every preset, and its symbol is always the surface itself.
- **No intrinsic size,** like the house glyphs (`atoms/icons.tsx:3-17`). One
  size rule (S43), set with `inline-size` and `block-size` (never `width` or
  `height`): `.sb-status-icon` is 1.1em square, the size the button already
  gives a glyph (`atoms/_button.scss:276-280`); 1em in a menu item, the
  menu's glyph size (`molecules/_menu.scss:28-32`), by a rule
  `.sb-menu__item .sb-status-icon`; and 100% of the 1.25rem slot leading an
  alert or a toast (`molecules/_alert.scss:27-32`, which the toast's slot
  copies, L173), by `.sb-alert__icon > .sb-status-icon` and
  `.sb-toast__icon > .sb-status-icon`. At a badge's or an error message's
  12px, 1.1em is 13.2px (sheet A drew 14px beside 12px text). The glyph sits
  inside its slot (L186), so the button's and the menu's `> svg` rules no
  longer reach it; the menu's rule above restates the menu's size.
- **For the components,** `icons.tsx` also exports three internal names: the
  map from tone to glyph, `STATUS_GLYPHS`; the default words of L171,
  `STATUS_WORDS`; and the slot of L186, `StatusMark` (props `tone`,
  `statusLabel?`, `wordless?`, `className?`), which every status component
  renders. The six
  status components import them (from `./icons.tsx` in `atoms/`, from
  `../atoms/icons.tsx` in `molecules/`). They are not exported through
  `atoms/index.ts`, so they are not public, and L189 holds that the package's
  barrel does not export them. A consumer's `className` is added to a
  glyph's class list, and its other props pass to the `svg`, as for the
  house glyphs.

**L170.** **The icon's ink.** The glyph paints `currentColor`, so its ink is
whatever its `color` resolves to, and because the symbol is a hole the icon
has one colour pair: that ink against what is under it. The glyph sits in
the status slot (L186) and sets no colour of its own, so the slot's colour
is the ink. Two rules decide it.

- **On a full-strength fill** (a solid badge, the danger button) the icon
  takes the label's ink: the slot inherits `on-X`. In sorbet that is
  `#472400` in both modes (L12; DECISIONS rows 5 and 8). Under `loading` the
  button's label is transparent (`atoms/_button.scss:259`), so the icon is
  too, and it hides with the label.
- **Anywhere else** (on a wash, on a surface) the icon takes the strong ink
  where the theme defines it, and the component's own text colour where it
  does not: the slot's `color` reads the optional token `text-strong`
  through `where-defined` (L149), falling back to `revert-layer`, so that a
  theme without the token computes the colour the slot inherits. In sorbet:
  `#472400` in light and `#f3e7ce` in dark, as sheet A drew it in light and
  sheet 2 in dark (`build-edges.mjs:144`, the ink `--ink`). In a frozen
  preset, and in sorbet dark until step 2.6 (where L55 resets
  `text-strong`): the component's own text colour, inherited. This is the
  orchestrator's portability rule (`seam(text-strong)` falling back to the
  component's text colour), chosen over a bare `currentColor` because that
  would paint the icon on sorbet's light washes and surfaces in `#693800`,
  not the `#472400` the owner chose (S35).

The rules, two in all (amended after the verifier: five per-component sites
became one rule on the slot, since the slot holds nothing else that a colour
could reach):

| Rule | Selector | Declaration | A frozen preset computes |
|---|---|---|---|
| Every status slot | `.sb-status` (`atoms/_icon.scss`, new) | `@include where-defined(color, status-ink, seam-only(text-strong), revert-layer)`, so it is written in the atoms layer's `where-defined` sublayer: `--status-ink: var(--sb-text-strong); color: var(--status-ink, revert-layer);` | `revert-layer`: the colour the slot inherits from its component |
| On a fill | `.sb-badge--solid > .sb-status` (`atoms/_badge.scss`) and `.sb-button > .sb-status` (`atoms/_button.scss`), new | `color: inherit;`, in the atoms layer itself, which outranks its sublayer | `inherit`, the same |

These are the only colour declarations that reach a status slot or its
glyph, and no rule declares `fill` on either. The menu's `> svg` colour rules
(`molecules/_menu.scss:28-32, 45-47`) and the button's `> svg` size rule
(`atoms/_button.scss:276-280`) match only direct `svg` children, which the
glyph is not; they now reach only a consumer's own glyph (verifier N12).
Where each component's icon sits, in sorbet: an alert's on `X-subtle`; a
toast's on `surface-raised`; a soft badge's on `X-subtle`; a solid badge's on
`X`; the danger button's on `danger`; the danger menu item's on
`surface-raised`, and hovered on `danger-subtle`; a field error's on whatever
the field sits on, `surface` or `bg`.

What holds each pair. **In a frozen preset** the icon is the same pair as the
text beside it, so it is held exactly where `wcag-aa` holds that text:
`X-text` on `X-subtle`, `on-X` on `X`, `text` on `surface-raised` and
`danger-text` on `bg` are among its 86 rules
(`tools/fixtures/contracts/rules.order.json`); `danger-text` on `surface`
and on `surface-raised` (the field's error on a card, the danger menu item)
are not, and there the icon is held no less than its own words. **In
sorbet**: on a fill, the `label` tier, R153 to R159, exactly (the danger
button is R158, `#472400` on `#f9c3c6`, 70.92 protan). On a surface, the
`body` tier, exactly: R093 for the toast and the menu item (97.14 tritan /
85.24 protan), R092 for an error on a card (97.14 / 88.77), R091 on the page
(92.90 / 90.87). On a status wash in dark, the pairs of R128 to R134
exactly, since `text-strong` and every `X-text` are `#f3e7ce` there (78.22 to
79.93, protan). On a status wash in light: `#472400` on the info wash
`#ede0f7` has R128's hexes, 84.18 (deutan); on the success, warning and danger
washes, `#d3f4f0`, `#faefca` and `#fcdfdc` (the last also the hovered danger
menu item), it measures 87.74 (deutan), 89.70 (tritan) and 84.21 (tritan).
No rule names `text-strong` on a status wash, so §13 lists those three. Each
is above the `on-wash` floor of 73.3 by 10.8 or more, and above the `X-text`
the floor holds on the same wash by 8.0 or more, the ink being the darker.

So in sorbet light the icon (`#472400`) is darker than the alert's title,
which stays `X-text`, `#693800` (8.69 apart, protan). Sheet A drew both in
`#472400`; this step changes no title (S35). Inside a scrim layer's content
`text-strong` is `on-scrim` (L110), so a status component placed there paints
its icon in it, as a field label there does.

**L171.** **The word (DECISIONS row 38).** The owner: "Hidden, for screen
readers". The word is text in a `<span class="u-visually-hidden">`
(`base/_utilities.scss:5-7`; the library already uses it,
`molecules/calendar.tsx:259`), placed immediately after the icon, inside the status slot (L186), so a
screen reader meets it before the consumer's words. It is never visible: the
consumer's title or text stays the visible words. Its text is the word, a
colon and one space:

| Tone | Text |
|---|---|
| `success` | `Success: ` |
| `warning` | `Warning: ` |
| `danger` | `Error: ` |
| `info` | `Information: ` |

"Error", not "Danger": the tone is named for the colour's job, the word for
what a listener needs, and these mark failures, not hazards; GOV.UK's error
message prefixes the same hidden "Error:". "Information", not "Info": a word
a reader says, not an abbreviation it may spell out (S37). The colon and
space end the word so the reader pauses before the consumer's words; the
space is inside the span so the text reads "Error: Overdue" whether what
follows is inline (a badge) or a block (an alert's title). **Override, for
another language:** a `statusLabel` prop on `Alert`, `Badge` and `Field`, and
a `statusLabel` option of `toast()`, replaces the word; the component adds
the colon and the space. A `statusLabel` is trimmed: an empty or
whitespace-only one gives the default word, so a status never renders
without one (S38), and `" Fehler "` gives `Fehler: `. That is the
library's existing pattern for its own words (`Alert`'s `dismissLabel`,
`molecules/alert.tsx:11`). The danger button and the danger menu item take no
word (L175, L176). A missing hidden word changes nothing on screen, so its
presence is held by a test (L181).

**L172.** **`Alert` (orchestrator ruling, row 40).** Its `icon` prop
(`molecules/alert.tsx:8, 21-25`) is removed: a status cannot render without
its derived icon, and a prop that replaced it would be a hole in that. It is
a breaking change, allowed before 1.0 (every consumer is the owner's own
app); `pnpm typecheck` fails for a caller that passes one, and none does
(checked: the playground's two alerts, `apps/admin/src/sections/kitchen.tsx:26`,
buylist's seven). The alert always renders, as the root's first element
child, the status slot with the tone's glyph and word (L186), carrying the
slot's box class too: `<span class="sb-status sb-alert__icon">`. The slot
no longer carries `aria-hidden`: the glyph carries its own, and the word must
be read. `molecules/_alert.scss:27-32` sizes the slot, and a new
`.sb-alert__icon > .sb-status-icon { inline-size: 100%; block-size: 100%; }`
makes the glyph fill it. The root keeps `role="status"` for every tone, and a
consumer's `role` still wins (`{...rest}` follows it): a danger tone does not
derive `role="alert"` (S39). The library's note says to use `role="alert"`
*only* for urgent interruptions (`molecules/_alert.scss:8`), which is a
limit, not a default. Urgency is the consumer's to declare, and a tone is not
urgency: buylist's danger alerts are a page's standing state, rendered with
the page, and an assertive role would interrupt the reader with each. The
comment's example markup (`molecules/_alert.scss:3-7`) is updated to the
slot.

**L173.** **The toast.** A toast with a tone renders, as the toast's first
element child, the status slot with the glyph and the word, carrying the
toast's slot class: `<span class="sb-status sb-toast__icon">` (L186). A new
`.sb-toast__icon` rule in `molecules/_toast.scss` copies `.sb-alert__icon`'s
box (`flex-shrink: 0`, `inline-size` and `block-size` 1.25rem,
`margin-block-start: 0.05em`), with the same `> .sb-status-icon` rule. A
toast without a tone renders no slot. `ToastOptions` gains `statusLabel`
(L171). So that L181's test can render a toast without a browser (the
provider renders toasts only after mount, `molecules/toast.tsx:84`), the
markup of one toast moves into a component, `ToastItem`, with exactly these
props: `title?: ReactNode`, `message: ReactNode`, `tone?: Tone`,
`statusLabel?: string`, `leaving?: boolean`, `onDismiss: () => void`. It
renders no attribute it is not given a prop for, and everything but the slot
is the markup `molecules/toast.tsx:93-108` renders today (L187 gives it
exactly). `ToastProvider` renders one `ToastItem` per record, in the form
L188 pins. `molecules/toast.tsx` exports `ToastItem` and `molecules/index.ts`
does not, so it is not public API, not in the catalog and not counted by
`check:consumable` (S42). The region (`role="region"`, `aria-live="polite"`,
`aria-label="Notifications"`, `:91`) is unchanged. The stripe is L179.

**L174.** **`Badge`.** With a status tone, soft or `solid`, it renders the
status slot (glyph and word) as its first element child, then its children:
`<span class="sb-badge sb-badge--danger"><span class="sb-status">…</span>Overdue</span>`.
With a brand tone or none it renders as today. Its `dot` (a leading dot in
`currentColor`, `atoms/_badge.scss:30-36`) is a status sign drawn in colour
alone, so with a status tone the icon takes its place and the dot is not
rendered (S40); with a brand tone or none the dot renders as today. `Badge`
gains `statusLabel` (L171). The badge's `gap` (`space(1)`, `:6`) spaces the
slot from the text. On a solid badge the slot is `on-X`, on a soft one the
strong ink (L170). The comment example (`:30`) shows the new markup.

**L175.** **The danger button, and its rim (orchestrator rulings, row 40).**

- Only `variant="danger"` carries a status. The status slot with
  `DangerIcon` and no word, `<span class="sb-status"><svg …></svg></span>`,
  is rendered as the button's first child, before the children, with the
  glyph at 1.1em (L169), in the label's ink (L170). The visible label is its
  word, so no hidden word is added and its accessible name is the label
  alone. An `iconOnly` danger button gets no slot: its one glyph is the
  consumer's, named by `aria-label`. Under `loading` the slot stays in the
  DOM and is painted transparent with the label (L170). A glyph the
  consumer passes among the children stays where it is, after the slot
  (S41). `Button` destructures `children` to do this; `as` is unchanged, so
  a danger button rendered as a link carries it too, as does the alert
  dialog's danger confirm (`organisms/alert-dialog.tsx:112`), with no change
  to that file. The sizes are `sm`, `md` (the default, no `size` prop) and
  `lg`; the other variants, which carry nothing, are `primary` (the default,
  no `variant` prop), `secondary`, `accent`, `soft`, `outline`, `ghost` and
  `link` (`atoms/button.tsx:5`).
- **The rim** (decision 13; sheet 2, `build-edges.mjs:109`) is drawn on the
  danger button in both modes, 2px, inset, above the halo, from `danger-mark`
  (L116). Its form obeys L148, L149, L152 and L153: `filled-edge`
  (`atoms/_button.scss:24-28`) gains an optional `$rim`, which the danger
  variant passes as `inset 0 0 0 2px seam-only(danger-mark)`. With a rim, the
  mixin writes a local and puts it ahead of the edge in each of the three
  shadows. Compiled, `.sb-button--danger` reads exactly these four lines (L190
  says how a test compares them):

  ```
  --danger-rim: inset 0 0 0 2px var(--sb-danger-mark);
  --shadow-rest: var(--danger-rim, 0 0 #0000), var(--sb-edge-filled-danger, 0 1px 2px color-mix(in oklab, var(--edge) 22%, transparent), 0 2px 6px color-mix(in oklab, var(--edge) 12%, transparent));
  --shadow-hover: var(--danger-rim, 0 0 #0000), var(--sb-edge-filled-danger-hover, 0 2px 4px color-mix(in oklab, var(--edge) 26%, transparent), 0 6px 14px color-mix(in oklab, var(--edge) 14%, transparent));
  --shadow-press: var(--danger-rim, 0 0 #0000), var(--sb-edge-filled-danger-press, 0 1px 1px color-mix(in oklab, var(--edge) 26%, transparent), 0 1px 2px color-mix(in oklab, var(--edge) 14%, transparent));
  ```

  The falloff inside each edge read is today's, textually the same as
  `.sb-button--secondary`'s for the same state (`$shadow-rest`, `-hover`,
  `-press`, `atoms/_button.scss:6-17`). `soft-edge`'s rest, hover and active
  rules already put `--shadow-rest`, `-hover` and `-press` into
  `--edge-layer` (`abstracts/_mixins.scss:128-148`), so the rim is in all
  three states and never vanishes on hover or press (L152). This is the
  orchestrator's "set at rest and in the hover and active rules", reached
  through the three shadows rather than through new declarations in the
  state rules (S45), so no state rule gains a declaration and `box-shadow`
  stays the composed two-item form (L153). The local is declared on the
  element that reads it, and every read has the placeholder as its fallback
  (L149's test, `tools/test-contracts.ts:4946`). In a frozen preset
  `danger-mark` is undefined, so the local is invalid at computed-value time,
  and each shadow computes the placeholder followed by exactly its old
  falloff: no new rendered layer (L148). The rim is inset, so it adds nothing
  to the halo room (L151). The other filled variants pass no `$rim` and
  compile as today.

**L176.** **The danger menu item.** `MenuItem` with `danger` renders the
status slot with `DangerIcon` and no word as its first child, before its
children, with the glyph at the menu's 1em (L169). Its label is its word, so
it takes no hidden word. It has no rim (row 40): a menu item is a row of a
list, not a bounded control, and sheet 2 drew no rim on a row. A glyph the
consumer passes as a direct child (an `svg`, or an `.sb-icon`) is hidden in a
danger item, so the octagon replaces it rather than standing beside it
(S41): `_menu.scss` adds `.sb-menu__item[data-danger] > svg,
.sb-menu__item[data-danger] > .sb-icon { display: none; }` (CORRECTION 2026-10-05: each
selector gains `:has(> .sb-status)`, L194 (e)), which cannot
reach the octagon, inside its slot. A menu lines its glyphs up in one
column, and a second leading glyph would push the danger item's label out of
it. No in-repo or buylist danger item passes a glyph (checked: the
playground's menu demo, `apps/admin/src/sections/orders.tsx:92`). The
octagon's colour is the slot's (L170); `_menu.scss:45-47` is not edited.
`data-danger` is one of L153's named facts, so neither rule is a state rule.

**L177.** **The field's error message (DECISIONS row 39).** The owner: "Form
field error message", as sheet 2 drew it (`build-edges.mjs:195`). When
`Field` is given `error`, its `<p class="sb-field__error">` holds the status
slot (the `danger` glyph and the word `Error: `, overridden by `Field`'s
`statusLabel`) as its first element child, then the message. The message is
the control's description through `aria-describedby` when the field is
invalid (`molecules/field.tsx:45-46`), so a reader hears "Error: …" as the
description. `molecules/_field.scss` adds `.sb-field__error > .sb-status {
margin-inline-end: space(1); }`. The paragraph keeps `display: none` until
the field is invalid (`:27-37`), and the slot is hidden with it.

**L178.** **The status box's edge, and the danger box's rim.** The five
selectors of C11's status row read their edge through `where-absent`,
falling back to `revert-layer`, as the progress track does
(`atoms/_progress.scss:17-19`), because none of them declared a `box-shadow`
at e24df74 (L148).

- `.sb-alert` and `.sb-alert--info`: `box-shadow: edge(status-info,
  revert-layer)` (L147 (c)). `.sb-alert--success` and `--warning`:
  `edge(status-<tone>, revert-layer)`.
- `.sb-alert--danger` adds the rose rim sheet 2 drew on the danger box
  (`build-edges.mjs:142`: `inset 0 0 0 2px`, above the edge). A rim and an
  edge are two layers, and `revert-layer` can only be a whole value, never an
  item of a list, so the pair is one local:

  ```
  @include where-absent {
    --danger-box: inset 0 0 0 2px #{seam-only(danger-mark)}, #{edge(status-danger, 0 0 #0000)};
    box-shadow: var(--danger-box, #{edge(status-danger, revert-layer)});
  }
  ```

  Compiled, `#{edge(status-danger, 0 0 #0000)}` reads
  `var(--sb-edge-status-danger, 0 0 rgba(0, 0, 0, 0))`: Sass evaluates the
  placeholder inside `#{}`, and either spelling is the placeholder (L190).
  In sorbet the box draws the rim over its edge. A theme with the edge and no
  `danger-mark` draws the edge alone (the local is invalid, and the fallback
  reads the edge); one with `danger-mark` and no edge, the rim alone; one
  with neither, a frozen preset among them, computes `revert-layer`, so the
  box keeps whatever reached it before (S44). In sorbet dark until step 2.6
  both are reset (L55), so it computes `revert-layer` there too. The read's
  fallback is itself an edge read whose own fallback is `revert-layer`; that
  is the one new form in this step, and L183 #51 says how the existing test
  reads it.

R276 to R279 measure the status edges without the rim (understating the
danger box, as L116 says of the button); the rim on the danger box's own wash
is R201 (`#d77784` on `#fcdfdc`, 24.31 deutan; 23.23 protan in dark). The
rendered bar is step 2.5's
acceptance #5.

**L179.** **Two colours re-pointed to the marks.** Each is a colour seam
whose fallback is the value it replaces, so a frozen preset computes exactly
what it did (L148, fourth bullet).

- **The toast's stripe** (`molecules/_toast.scss:65-69`): `border-inline-start:
  3px solid clr($tone)` becomes `seam(#{$tone}-mark)`, as L70 scheduled. In
  sorbet it is held by R280 to R283 on the toast's raised surface: light
  24.45 / 29.05 / 30.38 / 27.03, dark 35.94 / 36.41 / 29.81 / 37.65. It and
  the `Icon` atom's info tone below are the two sites that read `info-mark`,
  which C10 needs.
- **The `Icon` atom's four status tones** (`atoms/_icon.scss:58-72`;
  orchestrator ruling, row 40; adversary C-3): `.sb-icon--X { color: clr(X) }`
  becomes `seam(X-mark)` for X in `success`, `warning`, `danger` and `info`,
  as `--primary` already reads `primary-solid` (`:54-56`). In sorbet light
  the pastel it painted is 6.47 (protan), 7.99 (tritan), 12.02 (deutan) and
  13.10 (tritan) from a card, under the `mark-line` floor of 19.5; the marks
  are 24.45, 29.05, 30.38 and 27.03 there (R196, R198, R200, R202; on the
  washes R197 to R203, on a raised surface R280 to R283). In sorbet dark the
  marks are weaker than the pastels they replace (42.30, 42.93, 36.22 and
  44.13 on a card, against 61.98, 63.88, 57.60 and 58.06) and still clear the
  dark floor of 22.0. An icon on the bare page is held by no rule (§13). The
  atom gains no glyph and no word (L168).

**L180.** **What a reader meets: the ARIA review's oracle (adversary M-11).**
Every status glyph is `aria-hidden="true"` and `focusable="false"`, with no
role and no title, so it adds nothing to a name or to what is read; its slot
(L186) has no role either, and adds only the word. "Read
text" is what a screen reader meets in order, with every `aria-hidden`
subtree left out.

| Component and status | Role | Accessible name | Read text, in order |
|---|---|---|---|
| `Alert`, each tone (default `info`) | `status` for every tone; a consumer's `role="alert"` is kept, never derived (S39) | none (a status takes no name from its content) | the word (`Information: `), the title, the children, then the dismiss button, named "Dismiss" (or `dismissLabel`) |
| A toast with a tone | none on the toast; the region is `role="region"`, named "Notifications", `aria-live="polite"` (unchanged) | — | the word, the title, the message, the dismiss button ("Dismiss notification") |
| A toast without a tone | as today | — | the title, the message, the dismiss button |
| `Badge`, a status tone, soft or solid | none (a `span`) | none of its own; inside a link or a button it is part of that control's name, e.g. "Error: Overdue" | the word, then the children |
| `Badge`, a brand tone or none | as today | as today | the children |
| `Button`, `variant="danger"` | `button` (or the `as` element's own) | its label, unchanged ("Delete account"); no word | the label |
| `Button`, `variant="danger"`, `iconOnly` | `button` | the consumer's `aria-label`, unchanged | — |
| `MenuItem`, `danger` | `button`, as today (not `menuitem`: L184) | its label, unchanged | the label, then the shortcut |
| `Field` with `error`, invalid | the control's own | the control's label, unchanged | its description: "Error: " and the message |

The review is made in a browser's accessibility tree (Chromium's), row by
row, on the playground and the look sheet of L167, and its result is quoted
in the step's commit. The presence test of L181, a server render, holds the
DOM side of the same table; the tree is the check that the separating space and the order survive
layout.

**L181.** **The test that the icon and word are there.** A hidden word's
absence shows nothing on screen, so its presence is a test (the owner's
answer, row 38). The file, its scripts, what it imports and how it refuses a
missing or stale build are L189; the props of each case are L187's table,
by case id. Definitions: *the slot* is an element whose class list holds
`sb-status`; *the icon of tone T* is an `svg` whose class list holds
`sb-status-icon` and `sb-status-icon--T`; *the word W* is an element whose
class list holds `u-visually-hidden` and whose text is exactly `W: `; *the
read text* is the markup's text with every element carrying
`aria-hidden="true"` removed with its contents, runs of whitespace collapsed
to one space, and trimmed; *first* means the root's first element child (for
the field, `p.sb-field__error`'s). Counts are exact: "one icon" means one, and
no second icon of any tone. The cases:

1. **Each glyph alone** (`SuccessIcon`, `WarningIcon`, `DangerIcon`,
   `InfoIcon`, no props; and each with `className="x"`): one `svg`, the icon
   of its tone, `aria-hidden="true"`, `focusable="false"`,
   `viewBox="0 0 24 24"`, holding exactly one `path` with
   `fill="currentColor"` and `fill-rule="evenodd"`; no other `fill` or
   `stroke` attribute anywhere, no colour literal (`#`, `rgb(`, `hsl(`,
   `oklch(`), no `id`, `url(`, `mask`, `clip-path` or `style`, and no slot.
   With `className="x"` the class list is `sb-status-icon
   sb-status-icon--<tone> x`.
2. **`Alert`**, cases A1 to A5: the slot is first, its class list is exactly
   `sb-status sb-alert__icon`, and it holds one icon (of the case's tone, of
   `info` for A5) and then one word; the read text starts with the word
   followed by the title (A1, A2, A4) or the children (A3, A5); the root's
   `role` is `status`, and `alert` for A2.
3. **`ToastItem`**, cases F1 and F2: the slot is first, its class list is
   exactly `sb-status sb-toast__icon`, with one icon and one word. F3 (no
   tone): no slot, no icon, no word.
4. **`Badge`**, cases B1 to B8: the slot is first, its class list exactly
   `sb-status`, with one icon and one word, then the children. Cases B14 to
   B21 (a status tone with `dot`, soft and solid): the same, and no
   `.sb-badge__dot`. Cases B9 to B13: no slot, no icon, no word; the dot
   exactly in B9, B11 and B13.
5. **`Button`**, cases C1 to C4 and C6: the slot is first, its class list
   exactly `sb-status`, holding one icon of `danger` and no word; the read
   text is the label. C5 (`iconOnly`): no slot. C6 (`loading`): the slot is
   there. C7 to C14: no slot.
6. **`MenuItem`**, cases D1 and D2: the slot is first, holding one icon of
   `danger` and no word. D3 and D4: no slot.
7. **`Field`**, cases E1 and E3: in `p.sb-field__error`, the slot is first,
   with one icon of `danger` and then the word `Error: `, then the message;
   the read text of the paragraph is `Error: That is more rice than the
   pantry holds.` E2: no slot and no word anywhere in the field.
8. **Overrides**, cases G1 to G7: `statusLabel` `"Fehler"` on `Alert`,
   `Badge`, `Field` and `ToastItem` gives the word `Fehler: `; `" Fehler "`
   gives `Fehler: ` (it is trimmed, L171); `""` and `"  "` give the default
   word.
9. **The markup is otherwise unchanged** (L187), and **the provider passes
   the tone and the word through** (L188).
10. **Internal names stay internal** (L189): the barrel exports none of
    `StatusMark`, `STATUS_GLYPHS`, `STATUS_WORDS`, `ToastItem`.

Each case is shown red with its icon, its word or its slot removed from the
component.

**L182.** **C10 reads the compiled stylesheet (CORRECTION 2026-10-05 to
C10; adversary M-5).** C10 said "read by at least one `seam(…)` or `edge(…)`
call under `src/styles`". Read off the Sass source it could never pass: 17
names are read only through `seam-only(…)` (`switch-ring`, `selected-bar`), a
loop's interpolated name (`seam(#{$tone}-mark)`: four marks now, and
`info-mark` after step 2.5) or `filled-edge`'s `edge($element, …)` (the three
filled variants' edges and all eight hover and press edges), and
`--sb-halo-room` only through `halo-room()`.
So C10 reads the same compiled stylesheet C11 reads (`src/styles/index.scss`
compiled as `build:css` compiles it, `--style=expanded`; the test may compile
it in memory). It is true when every name in `SEAMS`, every edge property
sorbet emits (each `--sb-edge-X`, and each `-hover` and `-press`, L53),
`--sb-halo-room` (L151) and the two label sizes `--sb-button-font-size` and
`--sb-button-font-size-sm` (L19) appears as a whole name (the next character
is not a letter, a digit or `-`) in a `var(--sb-<name>` inside the value of
some declaration. A `seam-only` read counts; a comment does not, and neither
does a custom property's own name on the left of a declaration. Measured on
the compiled stylesheet at `9b83e50`: every such name is read but
`info-mark` and the four `--sb-edge-status-*`, which step 2.5 adds (L179,
L178). C10 is written by step 2.5's test author before the step is built,
and is red until it is.

**L183.** **The tests step 2.5 changes (adversary M-8).** L10 and L105 cover
PR 1's assertions. These three were written for step 2.4 and its repair. Step
2.5 makes #49 and #51 false; #50 stays true and is widened, so that it holds
what step 2.5 adds (verifier N10). Step 2.5's test author edits them, in the step, and
no other existing assertion; one more found is a defect of this spec,
reported as L10 says.

| # | File:line (at `9b83e50`) | What it asserts today | New expectation | Required by |
|---|---|---|---|---|
| 49 | `tools/test-contracts.ts:4823` ("2.4 #3") | no file under `packages/component-library/src` or `packages/design-system/src/behaviors` differs from `e6fd3d5` (fixture `step-2.4-untouched.json`), none added, none removed | narrowed, not retired (S47): the same, less the eight files step 2.5 names under `packages/component-library/src` (`atoms/badge.tsx`, `atoms/button.tsx`, `atoms/icons.tsx`, `atoms/index.ts`, `molecules/alert.tsx`, `molecules/field.tsx`, `molecules/menu.tsx`, `molecules/toast.tsx`), which may change; still none added and none removed. The fixture is not re-recorded. Step 2.7 removes `organisms/token-studio.tsx` from the comparison the same way (#49 again). (CORRECTION 2026-10-05: and `src/behaviors/toast.ts` and `src/behaviors/table-sort.ts` may change, L194 (b), (l)) | step 2.5's file list |
| 50 | `tools/test-contracts.ts:4718` (C11's edge reads) | the 22 non-status selectors each read their element's `--sb-edge-<element>`; the five status selectors are exempt (it stays true after step 2.5) | widened: all 27 do, the exemption is lifted, and `.sb-alert` and `.sb-alert--info` read `--sb-edge-status-info` | C11, L178 |
| 51 | `tools/test-contracts.ts:5452` (L148's read fallback) | a `where-defined` read in the sublayer falls back to exactly `revert-layer` | to `revert-layer`, or to an edge read whose own fallback is `revert-layer` (`var(--sb-edge-<element>, revert-layer)`, the element one of the thirteen), which a frozen preset also computes as `revert-layer`. The one such read is `.sb-alert--danger`'s (L178) | L178 |

One document changes with them: the row for `step-2.4-untouched.json` in
`packages/design-system/tools/fixtures/contracts/README.md` says "Retired
when step 2.5 edits the component library"; step 2.5's test author changes
it to say the fixture is narrowed by L183 #49, not retired.

Unaffected, checked against each form step 2.5 adds (L170, L175, L176,
L178): L148's cascade and sublayer tests (`:5434`, `:5442`), L149's
(`:4946`), L150's, L153's and L161's. Each local is declared where it is read
and read with a fallback; each new `box-shadow` is in the sublayer and
computes `revert-layer` in a frozen preset; the danger button's shadows gain
only placeholders there; no state rule writes `box-shadow`; no new function
is called.

**L184.** **What step 2.5 does not do.**

- It does not fix the React `Menu`'s ARIA: `MenuItem` stays a `button`, not
  a `menuitem` (the proposal's step 2.5: "Does not: fix the React Menu ARIA
  defect in the same file (§9, item 12)"). It is deferred with the other
  existing defects (decision 16).
- "A status cannot render without its icon and word" is true of the React
  components. The HTML API (`molecules/_alert.scss:3-7`,
  `atoms/_badge.scss:30`) and a consumer that uses only the stylesheet get
  them only by writing the markup, which the updated comments show; nothing
  checks hand-written markup (adversary m-4). A glyph drawn by the stylesheet
  (`glyph()`, `abstracts/_glyphs.scss:20`) would reach them, but a test
  rendering the markup could not see it, and the ruling placed the glyphs in
  `atoms/icons.tsx` (row 40).
- No glyph is drawn by the stylesheet, so L161's list of CSS functions is
  unchanged (adversary m-5: `circle()`, `ellipse()` and `path()` would fail
  it).
- No token is added, so no theme file and no golden changes (L4).

**L185.** **Who sees the icons, and when (§17 item 21).** Every React
consumer of `@sorbet/component-library` renders the icon and word once it has
step 2.5's build, in its own theme and colours (L166). `apps/admin` (ocean)
and `apps/meal-kit` (forest) build from the workspace (`workspace:*`), so they
change with step 2.5 itself. buylist (ocean) changes at its next re-pack
(proposal §12's `pnpm pack:vendor`), in its alerts and its status badges (its
`dot` badge shows the icon instead, L174). linecook changes at its sync (row
24). A consumer that vendors only the stylesheet (pantry, wallpaper-admin and
the musicdisco admin, all noir) changes in nothing: none of its markup
changes, and every Sass change of step 2.5 computes its old values there
(L167).

**L186.** **The status slot: the glyph and the word in one positioned element
(verifier N1).** The word is `u-visually-hidden`, which is `position:
absolute` (`abstracts/_mixins.scss:45-55`). Placed bare inside a component,
its containing block is the nearest positioned ancestor, which can lie
outside a scrolling container: measured at 390px under ocean, a status badge
in a `.sb-table-wrap` (`molecules/table.tsx:61`, not positioned) made the
document 595px wide where today it is 390, breaking `_table.scss:3-4` ("The
wrapper owns horizontal overflow so the page never scrolls sideways") in
every preset, and neither the masked compare nor a server render can see it.
So every status icon, with its word where it has one, sits in one slot that
is its own containing block:

- **Markup.** `<span class="sb-status">` holding the glyph and then, where
  the component has a word, `<span class="u-visually-hidden">W: </span>`:
  `<span class="sb-status"><svg class="sb-status-icon sb-status-icon--danger" …></svg><span class="u-visually-hidden">Error: </span></span>`.
  The alert's and the toast's slot also carries its box class, after
  `sb-status`: `class="sb-status sb-alert__icon"`, `class="sb-status
  sb-toast__icon"`. The button's and the menu item's slot holds the glyph
  alone. The slot has no other attribute; it is rendered by `StatusMark`
  (L169), which is the only place the slot's markup is written.
- **Sass,** in `atoms/_icon.scss` (CORRECTION 2026-10-05: replaced by L194 (a); the slot is
  `inline-block` and the glyph `inline-block`, `vertical-align: middle`):

  ```
  .sb-status {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    vertical-align: -0.125em;

    @include where-defined(color, status-ink, seam-only(text-strong), revert-layer);
  }

  .sb-status-icon {
    inline-size: 1.1em;
    block-size: 1.1em;
  }
  ```

  `position: relative` with no offset moves nothing; it makes the slot the
  word's containing block, so the word stays inside the component and inside
  any scroller round it. `vertical-align` is `.sb-icon`'s optical alignment
  (`atoms/_icon.scss:18`), which a flex line ignores; in an alert or a toast
  the slot is a flex item, so `display` is blockified and the slot class's
  box (1.25rem) sizes it.
- **Test, on the compiled stylesheet, in `pnpm test`** (step 2.5's tests
  first): among the rules whose selector list holds `.sb-status` as a whole
  item, outside every conditional at-rule and outside the `where-defined`
  sublayer, the last `position` is `relative` and the last `display` is
  `inline-flex` (L190 (a)). It is shown red with `position: relative`
  removed.
- **Probe, run by hand in the review** (Playwright's Chromium, as
  `<root>/tools/shots.ts` uses), quoted in the step's commit: a page of the
  compiled library stylesheet and one preset's theme file, viewport 390 by
  700, whose body is `<div class="sb-table-wrap"><table
  class="sb-table"><tbody><tr>` + six cells `<td>Customer name N here</td>`
  (N from 0 to 5) + `<td>` holding the markup of case B3 (L187),
  `<Badge tone="danger">Overdue</Badge>`, rendered by this tree's built
  library + `</td></tr></tbody></table></div>`. In each of the five presets
  and both modes, `document.documentElement.scrollWidth` equals
  `innerWidth`. (The verifier's probe, `sa36/overflow2.mjs`, is the
  reference.)

**L187.** **The markup is otherwise unchanged (verifier N2).** The masked
compare cannot see a change to the components' markup, since both of its
sides render this tree (L167). So the presence test (L181 case 9) holds the
markup itself: for each case, the markup this tree's build renders, with
every slot removed, equals what `9b83e50`'s build rendered for the same
props.

- **The cases** (props as data; `"noop"` for `onDismiss` is a function that
  does nothing; a child `{ "element": "input", "props": { "className":
  "sb-input" } }` is one host element; every string is plain ASCII):

| Ids | Component | Props |
|---|---|---|
| A1 | `Alert` | `tone: "success", title: "Deployed", children: "Build 214 is live in production."` |
| A2 | `Alert` | `tone: "danger", title: "Payment failed", role: "alert", children: "We could not charge your card."` |
| A3 | `Alert` | `tone: "warning", children: "Two items run out before Thursday."` |
| A4 | `Alert` | `tone: "info", title: "Note", onDismiss: "noop", children: "The Thursday shop covers the rest of the week."` |
| A5 | `Alert` | `children: "No tone was given."` |
| B1 to B4 | `Badge` | `tone: T, children: "Overdue"`, T in `success`, `warning`, `danger`, `info` |
| B5 to B8 | `Badge` | `tone: T, solid: true, children: "7"`, the same four T |
| B9 | `Badge` | `tone: "primary", dot: true, children: "New"` |
| B10 | `Badge` | `tone: "secondary", children: "Draft"` |
| B11 | `Badge` | `tone: "accent", dot: true, children: "Beta"` |
| B12 | `Badge` | `children: "Neutral"` |
| B13 | `Badge` | `dot: true, children: "Neutral"` |
| B14 to B17 | `Badge` | `tone: T, dot: true, children: "Active"`, the four T (presence only: the dot is replaced) |
| B18 to B21 | `Badge` | `tone: T, solid: true, dot: true, children: "7"`, the four T (presence only) |
| C1 | `Button` | `variant: "danger", children: "Delete account"` |
| C2, C3 | `Button` | `variant: "danger", size: "sm"` and `size: "lg"`, `children: "Delete"` |
| C4 | `Button` | `variant: "danger", as: "a", href: "#delete", children: "Delete"` |
| C5 | `Button` | `variant: "danger", iconOnly: true, "aria-label": "Delete", children: "x"` |
| C6 | `Button` | `variant: "danger", loading: true, children: "Deleting"` |
| C7 | `Button` | `children: "Save"` |
| C8 to C14 | `Button` | `variant: V, children: "Save"`, V in `primary`, `secondary`, `accent`, `soft`, `outline`, `ghost`, `link` |
| D1 | `MenuItem` | `danger: true, children: "Delete project"` |
| D2 | `MenuItem` | `danger: true, shortcut: "Del", children: "Delete"` |
| D3 | `MenuItem` | `children: "Rename"` |
| D4 | `MenuItem` | `shortcut: "R", children: "Rename"` |
| E1 | `Field` | `label: "Rice", error: "That is more rice than the pantry holds.", invalid: true`, child `input.sb-input` |
| E2 | `Field` | `label: "Rice", hint: "Cups, cooked."`, child `input.sb-input` |
| E3 | `Field` | `label: "Rice", error: "That is more rice than the pantry holds."`, child `input.sb-input` |
| F1 | `ToastItem` | `tone: "success", title: "Sticky", message: "I stay until dismissed.", onDismiss: "noop"` |
| F2 | `ToastItem` | `tone: "danger", message: "Account deleted.", leaving: true, onDismiss: "noop"` |
| F3 | `ToastItem` | `message: "All changes saved.", onDismiss: "noop"` |
| G1 | `Alert` | `tone: "danger", statusLabel: "Fehler", children: "x"` (presence only) |
| G2 | `Badge` | `tone: "danger", statusLabel: "Fehler", children: "x"` (presence only) |
| G3 | `Field` | `label: "Rice", error: "x", invalid: true, statusLabel: "Fehler"`, child `input.sb-input` (presence only) |
| G4 | `ToastItem` | `tone: "danger", statusLabel: "Fehler", message: "x", onDismiss: "noop"` (presence only) |
| G5 to G7 | `Alert` | `tone: "danger", children: "x"` with `statusLabel` `" Fehler "`, `""` and `"  "` (presence only) |

- **The fixture.** `packages/component-library/tools/fixtures/status-markup.at-9b83e50.json`,
  `{ "recordedFrom": "9b83e50", "cases": [{ "id", "component", "props", "html" }] }`,
  holds the 39 cases A1 to A5, B1 to B13, C1 to C14, D1 to D4 and E1 to E3,
  each `html` the `renderToStaticMarkup` of `9b83e50`'s build. A committed
  recorder, `packages/component-library/tools/fixtures/record-status-markup.mts.txt`
  (a `.txt`, like `record-e24df74-styles.mts.txt`, so nothing runs or lints
  it by accident), holds the case list and, run against a checkout of
  `9b83e50` whose component library is built (`git worktree add` or `git
  archive`, `pnpm install`, `pnpm --filter @sorbet/component-library
  build`), writes the fixture. The test author records it before the
  components change, and it is never re-recorded. The test reads the cases
  from the fixture, renders each with this tree's build, and pins the
  fixture's sha256 (as L154's fixtures are pinned). The cases left out are
  the ones `9b83e50` cannot render the same way: a status tone with `dot`
  (the dot is now replaced, L174), `statusLabel` (new) and `ToastItem`
  (new).
- **The removal.** (CORRECTION 2026-10-05: the pattern is L194 (g)'s exact one, and a second
  fixture adds cases.) Each slot is removed with its contents. A slot's markup
  is exactly `<span class="sb-status…">`, one `<svg…>…</svg>`, at most one
  `<span class="u-visually-hidden">…</span>`, then `</span>`, so the pattern
  `<span class="sb-status[^"]*"><svg[^>]*>[\s\S]*?</svg>(?:<span class="u-visually-hidden">[^<]*</span>)?</span>`
  matches it whole. After removal each case's markup equals its fixture
  `html` exactly, character for character. (At `9b83e50`, `Alert` with no
  `icon` rendered no slot, so its removed `icon` prop needs no account.)
- **The toast** has no server-renderable form at `9b83e50`, so its expected
  markup after removal is given here, as `molecules/toast.tsx:93-108` renders
  it at `9b83e50` for the same record (rendered with `react-dom/server` while
  writing this):
  - F1: `<div class="sb-toast sb-toast--success"><div><p class="sb-toast__title">Sticky</p><p class="sb-toast__body">I stay until dismissed.</p></div><button type="button" class="sb-toast__dismiss sb-close" aria-label="Dismiss notification"></button></div>`
  - F2: `<div class="sb-toast sb-toast--danger" data-leaving="true"><div><p class="sb-toast__body">Account deleted.</p></div><button type="button" class="sb-toast__dismiss sb-close" aria-label="Dismiss notification"></button></div>`
  - F3: `<div class="sb-toast"><div><p class="sb-toast__body">All changes saved.</p></div><button type="button" class="sb-toast__dismiss sb-close" aria-label="Dismiss notification"></button></div>`

**L188.** **The provider passes the tone and the word through (verifier
N3).** Consumers reach a toast only through `toast()` and `ToastProvider` (CORRECTION
2026-10-05: and through the vanilla `toast()`, which L194 (b) covers; the checks below are
tightened by L194 (h)),
which renders after mount and so cannot be server-rendered; if it stopped
using `ToastItem`, or dropped `tone` or `statusLabel`, every real toast would
lose its word in silence. So the source is pinned, and the presence test (L181
case 9) reads `packages/component-library/src/molecules/toast.tsx`:

- `ToastOptions` declares `statusLabel?: string`.
- `toast`'s options are destructured as `{ title, tone, statusLabel, duration
  = 5000 }`, and the record it adds holds `statusLabel` beside `title` and
  `tone`.
- Inside `toasts.map((t) => …)` the provider renders exactly one element,
  `<ToastItem key={t.id} title={t.title} message={t.message} tone={t.tone}
  statusLabel={t.statusLabel} leaving={t.leaving} onDismiss={() =>
  dismiss(t.id)} />`, and the file renders no other element with the class
  `sb-toast` outside `ToastItem`.

The test collapses the source's whitespace runs to one space and asserts:
`<ToastItem ` occurs exactly once; the text from it to the next `/>` contains
`tone={t.tone}` and `statusLabel={t.statusLabel}`; the text between
`(message: ReactNode, {` and `}: ToastOptions` contains `statusLabel`; and
the text between `[...all, {` and the next `}` contains `statusLabel`. Each
is shown red by deleting the one attribute or name it reads.

**L189.** **The presence test's harness, pinned (verifier N9; values 1, 5, 7
and 8).**

- **File and scripts.** `packages/component-library/tools/test-status.ts`,
  run as `node tools/test-status.ts` (Node 24 runs TypeScript directly, as
  `packages/component-library/tools/check-client-directives.ts` is run). `packages/component-library/package.json`
  gains `"test:status": "node tools/test-status.ts"`; `<root>/package.json`
  gains `"test:status": "pnpm --filter @sorbet/component-library
  test:status"`, and its `"test"` ends `… && pnpm run test:contracts && pnpm
  run test:status`. `.github/workflows/build.yml` gains, after the step that
  runs `pnpm run test:contracts` and before `check:consumable`, a step
  `- name: Verify every status carries its icon and word` with `run: pnpm
  run test:status`, and a comment in the file's style saying why: a hidden
  word's absence shows nothing. `<root>/CLAUDE.md`'s `pnpm test` line becomes
  `# check:contrast + check:client + test:golden + test:contrast +
  test:contracts + test:status`. It asserts with `node:assert/strict`,
  prints one line per case, and exits 1 if any case fails.
- **What it imports.** `react` and `react-dom/server` resolved from
  `packages/component-library` (its peer dependencies, installed there);
  `Alert`, `Badge`, `Button`, `MenuItem`, `Field` and the four glyphs from the
  built barrel `packages/component-library/dist/index.js`, which is what a
  consumer gets; `ToastItem` from `packages/component-library/dist/molecules/toast.js`;
  the fixture of L187; and, for L188, the source file. It does not import
  `StatusMark`, `STATUS_GLYPHS` or `STATUS_WORDS`: the words are checked
  through what renders. It asserts the barrel exports the four glyphs and
  none of `StatusMark`, `STATUS_GLYPHS`, `STATUS_WORDS` and `ToastItem`.
- **A missing or stale build fails before any case.** The root `test` chain
  does not build, so a local `pnpm test` after a source edit would otherwise
  test the previous build in silence. For each `.ts` and `.tsx` file under
  `packages/component-library/src` (not `.d.ts`), in sorted order of its
  path, its counterpart is the same path under
  `packages/component-library/dist` with the extension `.js`. The first
  counterpart that does not exist prints `✗ test:status reads the built
  component library: <dist path> does not exist. Run pnpm build first.`; the
  first one older than its source (`mtimeMs`) prints `✗ test:status reads the
  built component library: <src path> is newer than <dist path>. Run pnpm
  build first.` Paths are relative to the repo root. Either exits with code
  1. CI builds first, so there it never fires.

**L190.** **The compiled forms, pinned (verifier N7; values 9 to 11).** The
checks of step 2.5's acceptance #3 read the compiled stylesheet as C11 does
(the last declaration among the rules whose selector list holds the selector
as a whole item, outside conditional at-rules), compare values with
whitespace runs collapsed to one space, and accept the placeholder in either
spelling `PLACEHOLDER` accepts (`<root>/tools/stylelint/state-definition.js:102`):
Sass writes the literal `0 0 #0000` as written, but evaluates it inside `#{}`
to `0 0 rgba(0, 0, 0, 0)` (35 such spellings already compile, and L178's
`--danger-box` is one). Sizes are always `inline-size` and `block-size`. (CORRECTION 2026-10-05: rows (a), (d), (e)
and (j) read as L194 (a), (k), (a) and (e) amend them.)

| | Selector | Declarations |
|---|---|---|
| (a) | `.sb-status`, outside the sublayer | `position: relative`, `display: inline-flex`, `flex-shrink: 0`, `vertical-align: -0.125em` |
| (b) | `.sb-status`, in `sb.atoms.where-defined` | `--status-ink: var(--sb-text-strong)`, `color: var(--status-ink, revert-layer)` |
| (c) | `.sb-badge--solid > .sb-status`; `.sb-button > .sb-status` | `color: inherit` |
| (d) | any other rule whose selector list names `.sb-status` or `.sb-status-icon` | no `color` and no `fill` |
| (e) | `.sb-status-icon`; `.sb-menu__item .sb-status-icon`; `.sb-alert__icon > .sb-status-icon`, `.sb-toast__icon > .sb-status-icon`; `.sb-toast__icon` | `inline-size` and `block-size` `1.1em`; `1em`; `100%`; and `flex-shrink: 0`, `inline-size: 1.25rem`, `block-size: 1.25rem`, `margin-block-start: 0.05em` |
| (f) | `.sb-button--danger` | L175's four lines, the falloff in each textually `.sb-button--secondary`'s for the same state; no other selector declares `--danger-rim` |
| (g) | `.sb-alert`, `.sb-alert--info`, `.sb-alert--success`, `.sb-alert--warning`, in `sb.molecules.where-defined` | `box-shadow: var(--sb-edge-status-<tone>, revert-layer)` (`info` for the first two) |
| (h) | `.sb-alert--danger`, in `sb.molecules.where-defined` | `--danger-box: inset 0 0 0 2px var(--sb-danger-mark), var(--sb-edge-status-danger, <placeholder>)`, `box-shadow: var(--danger-box, var(--sb-edge-status-danger, revert-layer))` |
| (i) | `.sb-toast--X`; `.sb-icon--X`, X each status | `border-inline-start: 3px solid var(--sb-X-mark, var(--sb-X))`; `color: var(--sb-X-mark, var(--sb-X))` |
| (j) | `.sb-menu__item[data-danger] > svg`, `.sb-menu__item[data-danger] > .sb-icon` | `display: none` |
| (k) | `.sb-field__error > .sb-status` | `margin-inline-end: var(--sb-space-1)` |

**L191.** **The measurer stages all four status boxes (verifier N6; value
13).** The playground has a success and a danger alert, neither on a card
(`apps/playground/src/demos/alerts-toasts.tsx:14, 17`), and no warning or
info alert; step 2.5 adds no demo (L167). `<root>/tools/measure-edges.ts`
already stages the success box on a card by cloning it; it now stages the
other three the same way, cloning the success box and swapping its tone
class (the measurer is in step 2.5's files). Its target "Status box on a card" is relabelled
"Status box (success) on a card", and three targets follow it:

```
{ label: "Status box (warning) on a card", sheet2: { name: "Status box", on: "card" }, find: "staged('.sb-alert--success', null, (e) => { e.style.inlineSize = '100%'; e.classList.replace('sb-alert--success', 'sb-alert--warning'); })", staged: true },
{ label: "Status box (info) on a card", sheet2: { name: "Status box", on: "card" }, find: "staged('.sb-alert--success', null, (e) => { e.style.inlineSize = '100%'; e.classList.replace('sb-alert--success', 'sb-alert--info'); })", staged: true },
{ label: "Status box (danger) on a card", sheet2: { name: "Status box", on: "card" }, find: "staged('.sb-alert--success', null, (e) => { e.style.inlineSize = '100%'; e.classList.replace('sb-alert--success', 'sb-alert--danger'); })", staged: true },
```

All four are filed under sheet 2's `"Status box"` on `"card"`
(`edges-measure.json`, `Light`: 10.9; `Dark`: 22.6), so each bar is that
figure less 1.0. A clone keeps the success glyph inside; the glyph is not on
the boundary the measurer samples, so it does not move a figure, and the
danger clone gets the rim from its class (L178).

**L192.** **Rulings after step 2.5's test author (2026-10-05).**
(a) L167's mask refusal lives in `tools/shots.ts`'s `compare`, after
`baselineRefusal` (`tools/shots-provenance.ts`) has accepted the baseline, not
inside `baselineRefusal`. So that function and its existing assertions in
`tools/test-contracts.ts` (the L155 provenance tests) are unchanged, and L183's
list stays complete. A baseline whose `mask` is missing or differs from the
run's is refused with a non-zero exit, naming the mask.
(b) L189's build check walks the source files in sorted order in one pass, and
the first problem it meets wins: a missing counterpart or a stale one,
whichever comes first.
(c) L178's Sass block may carry the blank line the repo's stylelint asks for
(`declaration-empty-line-before`); formatting only, no value changes.
(d) The test author's three readings stand: the menu's and the field's slot
class is exactly `sb-status` (L186); L190 (c) is held in the layer `sb.atoms`
(L170); and #51's widened fallback is allowed on `.sb-alert--danger` only
(L183).

**L193.** **CORRECTION 2026-10-05 to L151 and L162 (c): the carousel's
`scroll-padding` falls back to `auto`, not `0px`.** `auto` is its initial
value and what every preset computed at e24df74, and L148 asks a fallback for
the element's old value exactly; it was the one computed difference left in
the frozen presets (the frozen lens of the audit of 7a683fd: `scroll-padding`
`auto` to `0px` on `.sb-carousel__viewport`, over 27,200 element-states). So
`halo-room()` takes the property's old value as its fallback,
`halo-room($fallback: 0px)`, and the viewport writes
`scroll-padding: halo-room(auto)`, compiling to `var(--sb-halo-room, auto)`;
`padding` keeps `0px`. The L151 test's expected value changes with it.

What this is not: the fix for the right-to-left carousel shots. The full L155
run of `ffddc2c` (24 runs) found `disabled-full` and `staged-all` differing in
four right-to-left runs, the carousel at the foot of the page on another slide
(up to 204 levels in a 104 by 32 box). Those shots also differ between two
shots of the same tree (`unstable`) in other right-to-left runs, appear in
some presets and not others, and still differ with this fallback in place
(ocean, rtl, re-run): the carousel settles on a slide that varies from one
page load to the next. That is noise in the tool, not a frozen change, and it
is why no full run here reaches L155's success line. Left open for the tool:
settle the carousel (wait for scroll-snap to finish, or pin its slide) before
a page-level shot.

**L194.** **The repair of step 2.5, after its audit (2026-10-05; DECISIONS rows 42 to
45).** Two read-only lenses audited `7078b76` and `6ef4b35` against `9b83e50`
(`audit-6ef4b35-frozen.md` and `audit-6ef4b35-status.md` beside this file).
`9b83e50` was never pushed. Its stand-in is `ec97a20`, the parent of `7078b76`:
`record-status-markup.mts.txt` run against `ec97a20`'s build writes
`status-markup.at-9b83e50.json` byte for byte.

**What held.**
- The React components render and read as L166 to L191 say: in all five presets,
  both modes, both directions, through the real toast provider, and at 390px.
- Acceptance #8's accessibility-tree review passes row by row (the status lens
  holds the table).
- Masked, the four frozen presets render as at `9b83e50`.

**What failed.** The owner answered four questions on 2026-10-05, taking the
recommended option each time:
- (a) the baseline, row 42;
- (b) the vanilla toast, row 43;
- (c) the apps' categorical badges, row 44;
- (d) a tone outside the four, row 45.

The orchestrator ruled on the rest, (e) to (m).

Each statement below wins over the earlier text it names, and that text carries a
dated pointer here.

(a) **The status slot keeps the text's baseline (row 42; frozen lens F1).**
- **The cause:** the slot was `inline-flex`, and its only child, the glyph, is
  `display: block` (the reset's `svg`). So the slot had no text baseline. In a
  badge or a button, both flex rows, the slot is the first item, so the component's
  baseline came from the slot's bottom edge.
- **Measured at 6ef4b35, in every frozen preset and mode:**
  - status badges rose 3.39px off the text beside them, and danger buttons
    3.19px;
  - lines and table rows grew 0.8px (2.4px at DPR 2);
  - the field error grew 0.69px.
- **Why no check saw it:** the mask removes the slot and the shift with it.

L186's Sass is replaced:

```
.sb-status {
  position: relative;
  display: inline-block;
  flex-shrink: 0;
  vertical-align: baseline;

  @include where-defined(color, status-ink, seam-only(text-strong), revert-layer);
}

.sb-status-icon {
  display: inline-block;
  vertical-align: middle;
  inline-size: 1.1em;
  block-size: 1.1em;
}
```

The alert's and the toast's `> .sb-status-icon` rules gain `display: block`
beside their `100%` sizes, so a glyph fills its 1.25rem box as before.

**How the fix works.** The slot is now a block container whose one line holds the
glyph inline. That line's baseline is the slot's baseline, at the same place as the
label's. `middle` keeps the glyph inside the line, so it adds no height.

**Measured with it, unmasked:**
- In ocean, forest, noir and midnight, light and dark, at 1280px, 390px and 200%
  text: every badge, button, table row, field error and menu item has the old
  label position and height, to 0.01px.
- The `.sb-table-wrap` probe still leaves the page 390px wide.
- In sorbet, the glyph's centre moves 0.08 to 1.81px against the text's centre:
  for the field error, −1.09 → +0.72px.

**What still changes beyond the icon's inline room** (L166 allows the alert's and
the toast's leading box):
- an alert also classed `.sb-card`, a column, gains a row;
- an alert that wraps at 390px gains a line;
- a `.sb-fab` danger button given a text label (a misuse: a FAB holds one glyph,
  named by `aria-label`) stacks the octagon above its label.

L190 (a) becomes `position: relative`, `display: inline-block`, `flex-shrink: 0`,
`vertical-align: baseline`. (e) adds `display: inline-block; vertical-align:
middle` on `.sb-status-icon`, and `display: block` on the two `100%` rules.

**The check** is a hand-run tool, `<root>/tools/check-status-layout.ts`
(`pnpm check:status-layout`), in Playwright's Chromium as `<root>/tools/shots.ts`
uses. In each of the five presets and both modes it stages the built library's
markup:
- badges of the four tones, soft and solid, in a paragraph, an `h3` and a table
  cell;
- danger buttons `sm`, `md` and `lg` in a paragraph;
- a field's error;
- a danger menu item.

It renders them twice, masked (L167's `MASK`) and unmasked. Outside the slots,
every element's top and height must be equal to 0.01px, at 1280px, at 390px and at
200% text. Widths may differ, since the icon takes inline room. The tool also runs
L186's overflow probe and the checks of (e) and (l), prints one line per check, and
exits 1 on any failure. At `6ef4b35` it fails.

(b) **The vanilla toast carries the icon and the word (row 43; status lens F1).**
`toast()` in `src/behaviors/toast.ts` is public (`@sorbet/design-system/behaviors`),
and every `sorbet create` starter page calls it with a tone
(`packages/cli/src/templates.ts:82`). So L188's premise, that consumers reach a
toast only through `toast()` and `ToastProvider`, was false.

`ToastOptions` gains `statusLabel?: string`. With a tone, the toast's first child
is the slot, written by DOM calls:
- `<span class="sb-status sb-toast__icon">`;
- then the glyph `svg`, its attributes in the React glyph's order: `viewBox="0 0
  24 24"`, `aria-hidden="true"`, `focusable="false"`, `class="sb-status-icon
  sb-status-icon--<tone>"`;
- inside it, one `path` with `fill="currentColor"`, `fill-rule="evenodd"` and
  `d` the glyph's;
- then `<span class="u-visually-hidden">W: </span>`, with `statusLabel` trimmed
  as L171 says.

Without a tone the markup is as before.

**Where the glyph data lives.** The behaviors are dependency-free, and the design
system cannot import the component library, so `toast.ts` keeps its own copy of
the four paths and the four words. `test-status.ts` pins the two copies together.
It runs the built `dist/behaviors/toast.js` against a minimal stand-in for
`document`. For each tone, with and without a `statusLabel`, the serialized slot
must equal `ToastItem`'s slot for the same props, character for character. With
no tone, there must be no slot.

L183 #49 leaves `src/behaviors/toast.ts` and `src/behaviors/table-sort.ts` (l)
out of its comparison, as it does the eight component files. No file is added
under either tree.

(c) **The apps' categorical badges (row 44; status lens F5).** `apps/admin` and
`apps/meal-kit` use status tones for categories and counts:
- "Warning: Spicy" and "Success: Veggie";
- "Error: 84" on a stock count;
- the nav link "Orders Information: 7".

They move to brand tones (`primary`, `secondary`, `accent`) or to none. Real
statuses keep theirs. The owner sees the renders before the change lands. (2026-10-06: the owner chose the
recommended set from `row44/sheet.png`. Brand tones of the same hex where one matches; accent for Spicy and 15 min;
neutral for Packing and the nutrition tags; "Behind schedule", "Very low" and "Low" as `statusLabel` on the real
statuses. Held by `test-status.ts`: no app Badge has a literal status tone without a `statusLabel`.)

(d) **A tone outside the four renders no slot (row 45; frozen lens F4).** From
untyped JavaScript, `tone="primary"` made `StatusMark` render an undefined glyph,
and React threw, unmounting the tree. `StatusMark` now renders nothing for a tone
that is not `success`, `warning`, `danger` or `info`. So `Alert` and `ToastItem`
given one render as at `9b83e50`, as `Badge` already did.

Held by cases H1 to H3 of `test-status.ts`:
- H1 and H2: `Alert` with `tone: "primary"` and `"neutral"` render without
  throwing, and equal the more fixture of (g);
- H3: `ToastItem` with `tone: "primary"` renders without throwing, with no slot.

(e) **The danger menu item hides a consumer's glyph only beside its octagon
(frozen lens F2).** L176's rule hid the direct-child glyph of every
`.sb-menu__item[data-danger]`. So a danger item written by hand, with no slot (the
HTML API, `demo/index.html:409`; a stylesheet-only consumer, L185), lost its glyph,
and its label left the column. The rule becomes `.sb-menu__item[data-danger]:has(>
.sb-status) > svg, .sb-menu__item[data-danger]:has(> .sb-status) > .sb-icon {
display: none; }`, and L190 (j) names those selectors. `check-status-layout.ts`
holds that a hand-written danger item keeps its glyph and that its label lines up
with a plain item's.

(f) **The report surfaces end with `process.exitCode`, not `process.exit()` (status
lens F9).** `process.exit()` drops what is still queued for a pipe. So a failing
report read through one (every test of L88 to L91 reads it through `spawnSync`)
lost its tail at random: "2.1 #9" failed 2 runs in 6 at `6ef4b35`, and 4 in 6 at
`ec97a20`. The fix covers:
- `tools/check-contrast.ts` and `tools/build-tokens.ts`;
- their scaffold copies;
- `sorbet contrast`.

A static test fails while any of them calls `process.exit()`. Ten runs in a row
then pass.

(g) **L187, tightened (frozen lens F3).** The removal pattern matched any class
that starts with `sb-status`, so a visible `<span class="sb-status-pad">` (which
the mask does not hide) was removed unseen. It becomes the slot's exact markup:

```
<span class="sb-status(?: sb-alert__icon| sb-toast__icon)?"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="sb-status-icon sb-status-icon--(?:success|warning|danger|info)"><path fill="currentColor" fill-rule="evenodd" d="[^"]*"></path></svg>(?:<span class="u-visually-hidden">[^<]*</span>)?</span>
```

A second fixture covers the cases the 39 missed:
- **Its file:** `packages/component-library/tools/fixtures/status-markup-more.at-ec97a20.json`.
- **Its recorder:** `record-status-markup-more.mts.txt` beside it, run against
  `ec97a20` (recorded once, and pinned by sha256).
- **Its cases:**
  - A6: a danger alert with a title and no `role`;
  - A7: an alert with `onDismiss` and `dismissLabel`;
  - C15 to C19: a danger button with `pill`, `full`, `disabled` and a
    `className`, and a danger link button with `pill`;
  - D5 and D6: a danger menu item, disabled, and with a `className` and a
    shortcut;
  - E4 to E6: a field with a hint and an error, invalid; required, with an
    error; optional, with a hint and an error, not invalid;
  - B22 and B23: a solid danger badge with a `className`, and a success badge
    whose child is an element;
  - H1 and H2 of (d).

Each must equal its recorded markup with every slot removed.

(h) **L188, tightened (status lens F2).**
- **Comments are stripped first:** block and line comments are removed from
  `toast.tsx` before the four textual checks. A JSX comment holding the
  `<ToastItem …/>` text no longer satisfies them.
- **No second toast:** outside `ToastItem`'s own body, the file holds no
  `sb-toast` class except `"sb-toast-region"`.
- **The record keeps `statusLabel` as itself:** the record `toast()` adds holds
  `statusLabel` as a shorthand property. So `statusLabel: undefined` fails.

(i) **S39 is held (status lens F3).** A6 of (g), a danger alert with no `role`,
renders `role="status"`.

(j) **The knock-out is held (status lens F8).** `test-status.ts` flattens each
built glyph's path and tests even-odd parity at fixed points:
- **Unfilled, inside the symbol:** the tick's elbow and both arms; the centre of
  each bar and dot; the cross's centre and two arm points.
- **Filled, in the silhouette clear of the symbol.**

A cross drawn as two overlapping strokes fails, because its centre fills again.

(k) **L190 (a) and (d), widened (status lens F4).** They read only rules naming
`.sb-status` or `.sb-status-icon`. So a `position: static` on `.sb-alert__icon`,
or a `color` on `.sb-badge > .sb-status`, escaped them, and made the page 633px
wide or recoloured the icon.

They now read every rule, outside conditional at-rules, with a selector item whose
last compound holds `.sb-status`, `.sb-status-icon`, `.sb-alert__icon` or
`.sb-toast__icon`:
- no `position` but `relative` on a slot;
- no `display` on a slot but (a)'s;
- no `color` or `fill` but in (b) and (c).

(l) **The vanilla sortable table sorts on what is shown (frozen lens F5).**
`behaviors/table-sort.ts` sorted on the cell's `textContent`, which now begins with
a status badge's hidden word ("Error: 12"). Its key now leaves out every
`.sb-status` slot, so the cells sort as at `9b83e50`. Any other text the consumer
hid stays in the key, as before. `check-status-layout.ts` sorts a table of the
built badges and requires `9b83e50`'s order.

(m) **The HTML examples carry the slot (status lens F7).**
- In `<root>/README.md`'s field example (`:570-584`), the error message carries
  the slot, and "The React `Field` produces the same markup" is true again.
- In `<root>/demo/index.html`, every status alert, status badge, field error,
  danger button and danger menu item carries the slot as its component writes it.

In both files, `test-status.ts` requires each of those elements to lead with
`<span class="sb-status`. At `6ef4b35` that fails.

Also: `halo-room()`'s superseded doc comment (`abstracts/_tokens.scss:159-161`) is
removed. Acceptance #8's table is quoted in the commit that carries (a), (e) and
(k).

### 12.6 Revision 3.7: step 2.6 settled (2026-10-06)

**Before any test was written.** A spec adversary attacked step 2.6's text (`spec-adversary-step26.md` beside this
file). It built the step in a scratch copy, from values parsed out of this document's own tables by script, and ran
every gate on it. It found:
- 1 critical, 4 major, 6 minor and 2 nits;
- no error in the dark values: they pass `legibility`, and every dark figure of L164 and L170 to L179 reproduces.

**The owner's answers, 2026-10-06, both the recommended option:**
- C-1: they chose from a rendered comparison (`step26/c1-compare.png`), DECISIONS row 46;
- M-4: they approved sorbet dark's look from the playground rendered in it, row 47.

The orchestrator ruled on the rest. These statements close every finding. Where they and earlier text disagree,
these win, and each earlier statement they change carries a dated pointer here.

| Id | Closed where, and how |
|---|---|
| C-1 | L195 (a): two dark recipes strengthened (row 46). Step 2.6's acceptance #8: the bars as written, and a failing bar is a contradiction report |
| M-1 | Step 2.6's acceptance #4 and L195 (b): `3px` in dark, and the stale "1px" lines pointed here |
| M-2 | L195 (c): every existing assertion step 2.6 changes, with its new expectation |
| M-3 | Step 2.6's acceptance #3: the light block bounded, both dark blocks, no `initial`, 116 names |
| M-4 | Step 2.6's acceptance #9 and L195 (e) (row 47) |
| m-1 | L195 (c): #27 to #29, and the current anchors |
| m-2 | Step 2.6's *Files*: the test files; `SORBET_RECIPE` goes; the header; `chartThemes.sorbet` stays |
| m-3 | Step 2.6's acceptance #8: "box in a well" has no component; the danger and menu rows are named; the run is quoted |
| m-4 | L195 (b): 42 reset lines; acceptance #5 gives each dark block's 117 lines and the file's 377 |
| m-5 | Step 2.6's acceptance #2: appendix A's dark column to 0.01, in each stated view |
| m-6 | L195 (c): #47's anchor is `tools/test-contrast.ts:226` |
| n-1 | L195 (f): the "as step 2.6 will make it" tests stay |
| n-2 | L195 (f): noted there; §13 unchanged |

**Revision 3.7, after its verifier (2026-10-06).** An independent agent built step 2.6 as revision 3.7 specifies it
and ran every gate.
- **What held:**
  - 12 of the 13 findings are closed; n-2 was partly closed (the table's wording).
  - Every figure re-derives: 15.92, 23.76, the two edge pixels, 3.77 and 10.92.
  - Rendered in dark, the sunken panel is 13.1 and the info box 23.8, and every bar holds.
  - The golden is exactly acceptance #5's.
  - The red tests are exactly L195 (c)'s, and nothing else goes red.
- **New findings:** 3 minor and 6 nits, closed as follows.
  - N-1: acceptance #6 now gives the reports' line and the gates' line separately.
  - N-2: the owner kept the dark `edge-sunken` floor at 13.3, with the pointer at L59 and S3.
  - N-3: pointers at L105's step-2.6 paragraph, L160 and L97's 2.2 row.
  - N-4: L195 (c)'s anchors are `wcagModes` `:493`, check700 `:533`, and #27 at `:1023`.
  - N-5: acceptance's preamble says which items are shown red and which are guards.
  - N-6: the playground shots the owner saw are committed (`step26/look-dark-*.png`).
  - N-7: n-2's row says what was done.
  - N-8: a test's title follows its new expectation.
  - N-9: NEXT.md is updated.

**L195.** **Step 2.6, settled (2026-10-06).**

(a) **Two dark recipes strengthened (DECISIONS row 46).**

Built as sheet 2 drew them, two dark elements rendered under step 2.6's bars (`<root>/tools/measure-edges.ts`, L159's
whole boundary, the same over two runs):
- the info status box on a card: 21.2, against 21.6;
- the sunken panel on a card: 12.7, against 12.8 (its bottom side, `#120802`).

The owner chose to strengthen each one's all-round layer in L45's dark table:

| Element | Layer | Was (sheet 2) | Now |
|---|---|---|---|
| `sunken` | `inset 0 0 0 1px #fef4dc` | `@ 0.14` | `@ 0.16` |
| `status-info` | `0 0 0 1px #dac5fc` | `@ 0.34` | `@ 0.38` |

Every other recipe is unchanged, the other three status boxes among them.

**Rendered, dark:**
- sunken panel 13.1 (bar 12.8);
- info box 23.8 (bar 21.6);
- success, warning and danger boxes 22.6, 23.8 and 36.2, unchanged.

**The gate's figures move in two rules:**

| Rule | Was | Now | Edge pixel | From backdrop | From fill |
|---|---|---|---|---|---|
| R259 `edge:sunken` on `surface`, dark | 14.06 | **15.92** (deutan) | `#352a21` → `#392f26` | 3.77 | 15.92 |
| R279 `edge:status-info` on `surface`, dark | 21.46 | **23.76** (tritan) | `#6c5b65` → `#73616e` | 23.76 | 10.92 |

Appendix A, appendix B and L61's weakest figure carry the new numbers. The well on the bare page in §13 moves from
14.06 to 15.92.

**No floor moves.** The edge-sunken dark floor stays 13.3: a floor is re-pinned only with a new sheet (L60), and the
owner's sheet changed values, not the contract. The tier now carries 2.62 of slack where it carried 0.76.
`edge-status`'s weakest is R278, 21.45, which is unchanged. So `src/tokens/contracts.ts` is not edited.

**The transcribed fixtures.** This revision changes the header's revision number, so the commit that carries it
re-runs the transcriber, `transcribe-legibility-spec.mjs.txt`.
- `legibility-values.json` changes in the two alphas and `transcribedFrom`.
- `legibility-appendix-a.json` changes in R259's and R279's dark figures, their appendix B rows and
  `transcribedFrom`.
- Every existing test passes on the re-transcription; the step-2.1 tests measure the fixture against it.

(b) **Stale numbers.**
- The dark halo room is `3px`. L151's arithmetic gives it: the rims' `0 0 0 1px`, 1, plus the card's rise, 2. L98
  and `tools/test-contracts.ts:5031` (`[9, 3]`) say so too. The "1px" of §12 step 2.6 (revision 3.6), of §12.4's
  M2 and of L151's last paragraph was written before the repair of 7a683fd counted the rise.
- The reset lines are 42 in each dark block, not 41, since L151 added `--sb-halo-room: initial`. L97's step-2.6
  row omitted the halo room's line, which L98 carries.

(c) **The tests step 2.6 changes.** L105's edits for this step, with their current anchors, and the nine step-2.2
tests no line had authorised. Step 2.6's test author edits these, in the step, and no other existing assertion (a test's title follows its
new expectation: M5's "wcag-aa in dark" and "2.2 L45 L101"'s "the dark edges wait for step 2.6" among them);
one more found is a defect of this spec, reported as L10 says.

| # | File:line (at `4a5f7f6`) | What it asserts today | New expectation |
|---|---|---|---|
| 11 again | `tools/test-contracts.ts:1351` (M6.8) | the reports' counts, `823`, `× 9, × 1` | `946`, `wcag-aa × 8, legibility × 2`; the sorbet dark line `all 193 pairings pass (tightest margin ×1.02) — legibility; 68 rules not held` |
| 25 to 31, 46 | `DECLARED` at `:485`, read through `wcagModes` (`:493`) by check700 (`:533`, run at `:774`), M6.1 `:1023` (#27, which stays green), M5 `:915`, M6.6 `:1188`, M6.9 `:1412`, M10.1 `:1688`, M10.7 `:2058`, M9 `:6067` | sorbet dark among the preset-modes that declare `wcag-aa` | sorbet dark leaves them, so check700 holds 560 measurements (8 preset-modes × 70). The one edit to `DECLARED` clears all of these, #27 to #29 among them |
| 47 | `tools/test-contrast.ts:226` | the impossible-alpha `scrim` tamper is on sorbet dark | it moves to forest dark (L105 #47) |
| 52 | `tools/test-contracts.ts:3819` ("2.2 L86 L91", ×3) | each mode line, and the last line's `823 … wcag-aa × 9, legibility × 1` | sorbet dark's line as in #11; the last line `… (946 pairings measured): wcag-aa × 8, legibility × 2` |
| 53 | `:3908` ("2.2 L87", ×2) | the gates' `wcag-aa × 9, legibility × 1` | `wcag-aa × 8, legibility × 2` |
| 54 | `:4300` ("2.2 L45 L101") | `edges.dark` is undefined | `edges.dark` is L45's dark table (acceptance #1); the light half unchanged |
| 55 | `:4325` ("2.2 L101 L3") | sorbet's dark record is buildMode's | retired, replaced by acceptance #1 |
| 56 | `:4346` ("2.2 L3 sorbet dark still passes wcag-aa") | its 70 measurements are 2d3b765's | retired, replaced by acceptance #2. The new dark record also holds `wcag-aa`, 70 of 70, but nothing declares it |
| 57 | `:4414` ("2.2 L97 L55 L151", the golden) | the 42 resets at the end of each dark block | the golden of acceptance #5: step 2.2's light block as that test states it, and each dark block as acceptance #5 gives it |

(d) **No name left to leak.** "The light block" of L160 and of step 2.6's acceptance #3 is the run of declarations
from `color-scheme: light;` to the end of `:root`. The nine names above it (three fonts, six radii) hold in both
modes, and no dark block repeats them.

(e) **The look (DECISIONS row 47).**
- **What the owner saw**, before any test was written: the playground in sorbet dark with these values, and the
  dark status boxes and the sunken panel at 2x, under both options of (a). It was the first time the library was
  seen rendered in sorbet dark. It included:
  - the cocoa page;
  - the danger rims;
  - the status icon's ink `#f3e7ce` on the dark washes;
  - the dark link `#dac5fc`;
  - the selected pill.
- **What the step owes now:** the rendered-edge run of its acceptance #8, quoted in its commit. The playground
  shots the owner saw are committed as `step26/look-dark-1.png` and `step26/look-dark-2.png`. No second sheet is
  owed: the values are the ones the owner saw.

(f) **Two notes.**
- The planted "2.1 #9 … as step 2.6 will make it" tests (`tools/test-contracts.ts:3832`, `:3914`) stay. They test
  the reports on a planted tree, which the shipped presets do not replace.
- `tools/check-cvd.ts` reads `chartThemes.sorbet`, not the `chart-*` hexes sorbet's records emit. They are equal,
  and step 2.6's acceptance #1 holds the records' half (a §13 matter, unchanged).

**L196.** **The audit of step 2.6, guards lens (2026-10-06; `audit-ea7a2a8-guards.md`).**

**What held.** The four frozen presets are byte-identical in every output. Every value-side guard bites.

**Three guards had lost their coverage.** Step 2.6 removed the last mixed or derived sorbet configuration, and the
tests had leaned on it. The repair restores each, with a check shown red by the lens's own plant.

(a) **The preset-modes count of L86 and L87.**
- With every shipped preset declaring one contract in both modes, a `declaredContracts` that counted one mode twice
  printed the same lines (plant R4).
- The planted tree "as step 2.2 left it" returns, and passes:
  - §3's light record and `edges.light`;
  - e24df74's dark record (`sorbet-as-shipped.json`);
  - `{ light: legibility, dark: wcag-aa }`.
- The three reports must end `(823 pairings measured): wcag-aa × 9, legibility × 1`, and the two gates must print
  `wcag-aa × 9, legibility × 1`.
- A unit test reads `declaredContracts` on mixed and flipped declarations.

(b) **The known-bad fixture "unchanged" (L85, step 2.6's acceptance #7).**
- The retired "2.2 L101 L3" test was its dark half's only pin.
- `sorbet-as-shipped.json`'s colour record, in both modes, must now equal e24df74's sorbet as
  `goldens.at-e24df74.json` holds it, entry for entry.

(c) **The colour-vision gate (L195 (f)).**
- `chartColors(chartThemes.sorbet, mode)` must equal `chart-1` to `chart-8` of `presets.sorbet.colors[mode]`, in
  both modes.
- `tools/check-cvd.ts` then validates the colours sorbet emits.

**Step 2.8's file list gains** what the lens found stale and no step owned:
- `.claude/skills/author-theme/SKILL.md`:
  - "Dark mode is never split";
  - "today only `wcag-aa`";
  - "A preset is a SemanticRecipe";
  - its charts step.
- `.claude/skills/debug-contrast/SKILL.md:90-91`;
- `src/tokens/semantics.ts:4-7`;
- the "823" comments of `<root>/tools/shots.ts:70` and `<root>/tools/shots-provenance.ts:16`.

**L197.** **The audit of step 2.6, render lens (2026-10-06; `audit-ea7a2a8-render.md`; DECISIONS row 48).**

**What held:**
- Everything step 2.6 names renders as specified:
  - the danger-active leak is closed;
  - the icon ink is `#f3e7ce` on the dark washes and surfaces;
  - the rims render in every state;
  - the marks are read;
  - the selected pill is as specified.
- The `[data-theme="dark"]` and `prefers-color-scheme` paths render the same.
- Sorbet light, the frozen presets and the apps are unchanged.
- No state reads below rest in dark.

**The halo room counts the glows and keeps the focus ring (row 48; render lens F1 and F2).**
- **What went wrong:**
  - The dark filled recipes add a glow, `0 0 14px -2px` at rest and `0 0 20px -1px` on hover. It has no offset, so
    it is not depth. Its spread is negative, so L47 does not call it all-round. L151 counted only all-round layers,
    so the dark room was 3px.
  - The carousel, the marquee and the accordion cut the glow flat: the hover cut line stepped 14.98, stronger than
    a card's own edge (13.2).
  - They also cut the focus ring, `focus-ring-width` 3px plus its 2px offset, by 2px.
- **The owner chose from a rendered sheet** (`step26/halo-room-dark.png`), with the rooms 3, 5, 12 and 20px: nothing
  cut.
- **L151's room becomes:**
  - the largest `blur + spread` of any **outset layer with no offset** that reaches past the box (an all-round layer
    or a glow), in the same elements and states, plus the same rises, rounded up;
  - never less than the focus ring's reach, `FOCUS_REACH` = 5 (`src/tokens/edges.ts`; a test reads the ring's width
    and default offset off `scales.ts` and `_mixins.scss`);
  - 0 when there is no such layer.
- **The figures:**
  - light stays 9px;
  - dark becomes **20px** (the hover glow's 19, plus the button's rise of 1);
  - the hover glow's cut line at a carousel's clip measures 0.43 in dark and 0.44 in light.
- Step 2.6's acceptance #4 and #5 read `20px` for `3px`, and L195 (b)'s dark figure follows. The golden changes in
  those two lines only.
- The carousel, the marquee and the accordion now inset their content by 20px in dark and 9px in light.

**The playground keeps `:dir(rtl)` (render lens F3; it predates step 2.6).** Vite 8's minifier lowered the library's
`:dir(rtl)` into a list of right-to-left languages. So a page set right to left with `dir="rtl"` in English (as
`<root>/tools/shots.ts` sets it) drew the selected bar on the left, on both sides of every compare.
`apps/playground/vite.config.ts` now targets browsers that support `:dir()`. `buildPlayground`
(`<root>/tools/playground-browser.ts`) refuses a built playground whose library stylesheet lost `:dir(rtl)`, and it
refuses the build without the fix.

**Recorded, not changed:**
- **The compact table (render lens F4).** L151's table read the compact table's cell padding as "12 or more"; it is
  8px in the block axis (`_table.scss:53`). As L165 (d) already records, a hovered filled button in an edge row of an
  overflowing compact table loses 1px of its light halo to the wrapper. In dark it loses the outer part of its glow
  there. Tables pad nothing by the halo room.
- **Dark presses (render lens N1).** L45's dark press recipes have no all-round layer, so a pressed filled button
  loses its rim. By L165 (a)'s reading (the fill credited) a press is not weaker than rest: 58.06 at both.
- **Focus-ring ratio (N2).** The ring `#8e6ac7` measures 2.04 to 2.83:1 on the dark raised surface and washes, under
  WCAG's 3:1 for non-text. It holds the contract's dark `focus-visible` floor (lowest 17.96, against 17.0).
- **N3 and N4.** Disabled controls read weaker than rest, which L152 does not cover. Under forced colours, status boxes,
  sunken panels and the pills' selection show no boundary; this predates step 2.6. Both are step 2.8's §13 rows to
  write.

## 13. Left to the eye

These are deliberately not gated. Each is stated so that nobody later reads
the gate's silence as a pass.

**L102.** Not checked by any rule or check in this spec:

| What | Why it is not gated | What stands in |
|---|---|---|
| The hue, colourfulness and harshness of an edge. A black line at 25% over the cream measures 18.37 against it and would pass every light edge floor (proposal appendix G, G11) | "No harsh black or gray outlines" is a judgement about a look, and a colourfulness floor would be a number nobody approved | The recipes are pinned by sorbet's golden, so a changed edge colour is a diff in review. C8 holds the direction |
| Whether an edge is *enough* | presence is a heuristic, neither an upper nor a lower bound (L48, L51) | rendered measurement by hand in steps 2.4 and 2.6 |
| Hover and pressed edges | they are transient, and sheet 2's hover and pressed recipes measure above rest (light, the four filled buttons: hover 20.11 to 21.98, pressed 21.42 to 23.44, against 18.73 to 20.52 at rest; revision 1's 17.54 and 16.54 were the withdrawn robin's-egg element; `rev2/states.ts`) | emitted from the same data; looked at |
| Disabled controls (L112) | the library fades a disabled control with `opacity: 0.55` (`abstracts/_mixins.scss:85`), which is not a token, and WCAG exempts inactive components too | sheet 3 drew the library's fade and the owner passed it (row 27); step 2.4 looks at the real thing |
| 12px text off cream and milk: the solid badge, the neutral badge, the soft badge, the tooltip (L111) | the checker reads no type size but the button's | row 27; sheet 3 drew them at their real size |
| Text over the default scrim's gradient (L110) | the gate measures the full-strength scrim, which the gradient reaches only at its bottom edge | an existing defect of all five presets, deferred (L110) |
| The selected wash in a dark menu: `#554445` on the menu's `#463425`, 6.38 (12.85 on a card) | the wash is stored opaque over `surface` (D7), and the menu is raised | the selected bar (R195, 31.29) and the heavier weight carry the selection; neither is colour alone |
| The slider thumb: the library paints it `primary-solid` `#b096d7` with `shadow(sm)`; sheet 2 drew a milk thumb with a lilac ring | the library's thumb is the stronger of the two (R180: 23.04 on its light track) and no rule needs changing for it | looked at in step 2.4 |
| A focus ring 2px from a fill against one that touches it: the button (offset 2px) against the selected calendar day and the current page (offset 0) | one pair of colours, two placements; R210 measures the pair (L68) | looked at in step 2.4 |
| The danger button's rose rim against its own blush fill: `#d77784` on `#f9c3c6`, 18.36 (deutan) | the rim is painted from `danger-mark`, and the button's edge rule measures its halo alone (L116), which understates what is painted | decision 13 and sheet 2; looked at in step 2.5, on the sheet of L167 (acceptance #7) |
| An edge whose all-round layer barely renders: the light card with `0 0 200px 0.01px #000000 @ 1` measures 98.63 (L138) | presence ignores blur and the size of a spread, and a minimum would be a number nobody approved | sorbet's golden shows any recipe change; rendered measurement in steps 2.4 and 2.6 |
| The selected pill: the raised fill on the list's well, light 4.47, with `shadow(sm)` and the `text` ink against the unselected `text-muted` (L157, corrected by L164); dark, from step 2.6, 18.49 | the pills variant is a segmented control and takes no bar; a halo inside the list's 4px padding would be cut (L151) | §15 item 18 |
| The input-group addon: an unframed well beside the field's inset ring (L158) | part of the field, not an element with an edge; cosmetic | looked at in step 2.4 |
| An offset falloff cut by a clipping parent (a hovered button's deep-tone layer at a table's last row, at most 12px) | L151 makes room for the all-round layer only; the falloff is depth, not the edge presence measures | looked at |
| An icon, a bold weight, a thumb's position | a token gate sees colours | status components derive the icon and word from their status (L168); the presence test of L181 holds that both are there; their look is by eye (L167) |
| The status icon's ink on three light status washes: `#472400` on `#d3f4f0` 87.74 (deutan), on `#faefca` 89.70 (tritan), on `#fcdfdc` 84.21 (tritan), the last also the hovered danger menu item (L170) | no rule names `text-strong` on a status wash; the ink is darker than the `X-text` the `on-wash` tier holds on the same washes (76.17 to 81.66), and every other pair of the icon is a rule's pair exactly | each is 10.8 or more above the `on-wash` floor; the look of L167 |
| The `Icon` atom's status tones off the surfaces the mark rules name: on the page, light 22.52 (protan) to 28.48 (deutan), dark 43.13 (protan) to 51.17 (tritan); and in dark the marks are weaker than the pastels they replace, 36.22 to 44.13 on a card against 57.60 to 63.88 (L179) | an icon can sit anywhere; R196 to R203 and R280 to R283 hold the card, the washes and the raised surface | every figure clears its mode's `mark-line` floor (19.5, 22.0) |
| Toned progress bars: the tone is colour alone. Of the 15 pairs of the six bar colours (the default `primary-solid` `#b096d7` and the five marks), 11 are under 10 apart at the worst view, the least warning and secondary 4.02 (tritan), the default and success 4.04 (deutan), danger and secondary 4.50 (deutan) | the owner chose no icon for them (DECISIONS row 39) | the bar's label and value, which the consumer writes (`aria-valuenow`); each bar against its track is held (`mark-area`) |
| Token Studio's failure list (`organisms/_token-studio.scss:126`): its lines are `danger-text`, in sorbet light the body text's own hex `#693800`, 0.00 apart | the owner chose no icon for it (DECISIONS row 39) | its summary is a danger `Badge`, which carries the octagon and `Error: ` from step 2.5 (L174); each line names the pair, its figure and its floor in words |
| The dropzone's error line (`molecules/_dropzone.scss:87-91`, `role="alert"`): `danger-text`, the body text's hex in sorbet light | not put to the owner; the field's error message, which was, takes the octagon (L177) | its words; giving it the octagon is a small change if wanted (S49) |
| The rating's stars in a tone: `clr(X)`, the pastel (warning `#f5e3a2` 7.99, tritan, from a card) | a rating is not a status; the star count and the fractional fill carry its value | the off star's ring (the row on `border-strong` lines below) |
| Font size, apart from the button label at its two sizes (C9, L115) | the checker reads no Sass | the 47-row table of L72; L111 for 12px text on fills and washes |
| "Paragraphs never sit on a full-strength fill" (the ink reads 62.47 on lilac) | a usage convention | none; stated in the docs of step 2.8 |
| Placements sheet 2 did not draw: a status box on the bare page (14.47 to 16.27 light); a well on the bare page (6.37 light, 15.92 dark; 14.06 before L195 (a)); a card inside a card (15.47 light, 14.03 dark); a divider on the page in light (9.68) and on a raised surface in dark (9.91) | a floor pinned to them would be pinned to something nobody approved; several sit under their class's floor | §15, item 13 |
| A card on a brand wash (the auth template) | the template paints a gradient of the wash toward transparent, never the full wash (`templates/_auth.scss:19-21`), so the pair measures a backdrop that is never on screen | the two ends of that gradient are the page (gated, 16.70) and the wash |
| `chart-muted`; the chart order under tritan | as today (decision A3) | `tools/check-cvd.ts`, unchanged |
| The rating's "off" star, the carousel's "off" dot, the calendar's "today" ring and five more places that paint `border-strong` as a line (proposal §7): they become the ring colour `#b096d7` | not drawn on a sheet | §15, item 6 |

**L110.** **What the scrim tier holds, and where text may sit.** The `scrim`
tier measures text against `scrim` at full strength, `rgb(0 0 0 / 0.6)`, at
its worst case over any image: 5.56:1 for `on-scrim` and 4.68:1 for
`on-scrim-muted`. The library paints that strength only where the layer is
centred (`.sb-layer--scrim.sb-layer--center`, `layout/_layer.scss:35-37`). The
default `.sb-layer--scrim` paints `linear-gradient(to top, scrim, transparent
65%)` (`:30`), so the scrim fades from 0.6 at the bottom edge to nothing 65% of
the way up, and text over a white image there reads (`rev2/rev2.ts`, which
agrees with sheet 3):

| Height above the bottom edge | Scrim strength | `on-scrim` `#fffbf1` | `on-scrim-muted` `#f3e7ce` |
|---|---|---|---|
| 0% | 0.600 | 5.56:1 | 4.68:1 |
| 5% | 0.554 | 4.66:1 | 3.92:1 |
| 10% | 0.508 | 3.93:1 | 3.31:1 |
| 15% | 0.462 | 3.39:1 | 2.85:1 |
| 30% | 0.323 | 2.17:1 | 1.83:1 |
| 45% | 0.185 | 1.49:1 | 1.26:1 |

`on-scrim` clears 4.5:1 over white only in the bottom 6.2% of the layer, and
`on-scrim-muted` in the bottom 1.1%. The content sits at the bottom
(`align-self: end`) under `space(6)` of padding, so a title's lines usually sit
above that band. This is true of all five presets today (the scrim and its
gradient are shared), not something sorbet's new values cause: the gate holds
the scrim's own colour, and nothing in this spec can hold where text sits over
an image. It is recorded as an existing defect beside the eleven of the
proposal's §9 and deferred with them (decision 16): fixing it is a shared Sass
change (a taller band, or a full-strength floor under the content), which
would move pixels in the four frozen presets. (Sheet 3 finding S3-1.)
Inside `.sb-layer--scrim .sb-layer__content`, the ink seams are re-pointed
as the roles they fall back to are: `text-strong` to `on-scrim`,
`text-caption` to `on-scrim-muted`, and `heading-ink` to `currentColor`
(which a colour property reads as `inherit`, its fallback). A theme that
defines them (sorbet's cocoa inks at `:root`) otherwise painted headings,
labels and captions in the page's ink on the dark scrim, about 1.1:1 (repair
of 7a683fd); a theme without them computes exactly what it did. A test
derives the list from the seams table, so a new ink seam fails until the
scrim re-points it.

**L111.** **12px text off cream and milk is not size-checked.** A15 asks
12px text to sit on cream or milk only; the library paints four 12px pairings
that do not, all at `fs(xs)`: on a fill, on the well, on a wash and on the
ink. (Revision 2 titled this "on a fill, a wash or the ink" and counted
three; revision 3 added the neutral badge without updating either;
verification finding N20.)

| Where | Pair | Rules | Lc at the worst view |
|---|---|---|---|
| Solid badge, `atoms/_badge.scss:9-10, 24-27` (semi-bold) | `on-X` on `X`, seven tones | R153 to R159 (`label`) | 70.92 (secondary, danger), 71.32 (primary, info), 79.10 (success), 82.57 (accent, warning); the same in both modes |
| Neutral badge, `atoms/_badge.scss:9-10, 14-15` (semi-bold; added in revision 3) | `text-muted` on `bg-subtle` | R136 (`tinted`) | light `#844d16` on `#f7ecd1` 71.60 (deutan); dark `#d7c9ae` on `#140903` 73.10 (protan). Sheet 3 drew it (§15 item 10), passed by row 27 |
| Soft badge, `atoms/_badge.scss:19-22` (semi-bold) | `X-text` on `X-subtle` | R128 to R134 (`on-wash`) | light 75.33 to 84.18; dark 78.22 to 79.93 |
| Tooltip, `atoms/_tooltip.scss:13-15` | `bg` on `text` | R100 (`body`) | light 88.39; dark 90.21 |

Each is held by its tier's floor, which was approved for that colour pair at
the size it was drawn on sheets 1 and 2 (16px, or 16px semi-bold for labels).
None is held to a type size: C9 holds the button only, and a theme has no
token for a badge's size. The owner saw all four at 12px on sheet 3 and passed
them (row 27, items 7, 9 and 10, and the solid badges sheet 3 drew), and **no
floor is pinned to them on that answer**: the floors stay the ones the 16px
pairs set. So these four are legible by the owner's eye and not by a gate,
and all four are listed in §13. A15's "12px text on cream or milk only" is
enforced for `text-subtle` sites (L72) and for nothing else. (Adversary M3;
sheet 3 finding S3-2.)

**L112.** **Disabled controls are left to the eye, with these figures.** The
library fades a disabled control to `opacity: 0.55` over what is behind it
(`abstracts/_mixins.scss:85`). Measured on sheet 3, as the library paints it
(`drop/sorbet-pastel-2026-10-04-sheet3/values.json`, item 11):

| Mode | What | Pair as painted | Figure |
|---|---|---|---|
| light | primary button, label on its faded fill | `#9a856c` on `#ebddf7` | Lc 45.18 (deutan) |
| light | the faded primary fill against the card | `#ebddf7` on `#fffbf1` | sep 7.17 (tritan) |
| light | accent button, label on its faded fill | `#9a856c` on `#faeec6` | Lc 52.21 (tritan) |
| light | quiet button label | `#ad906c` on `#fffbf1` | Lc 53.76 (deutan) |
| light | ghost button label | `#bb9b79` on `#fffbf1` | Lc 47.62 (deutan) |
| light | disabled field: subtle text on the well | `#975e2a` on `#f7ecd1` | Lc 64.17 (deutan; R176) |
| dark | primary button, label on its faded fill | `#3e240a` on `#8f7d95` | Lc 33.53 (typical) |
| dark | accent button, label on its faded fill | `#3e240a` on `#9e8d63` | Lc 38.74 (tritan) |
| dark | quiet button label | `#9d8f7c` on `#342417` | Lc 39.16 (protan) |
| dark | ghost button label | `#8e7f6a` on `#342417` | Lc 31.31 (protan) |
| dark | disabled field: subtle text on the well | `#b3a58d` on `#140903` | Lc 53.33 (protan; R176) |

The rule has two parts, matching the table's two kinds of row:

- **A faded control is held by no floor.** Every row but the "disabled
  field" rows is a control drawn through `control-reset`'s `opacity: 0.55`
  (`abstracts/_mixins.scss:83-86`). WCAG 2's 1.4.3 exempts "inactive user
  interface components". The owner passed the fade as drawn (row 27, item
  11), and no floor is pinned to these figures on that answer: a disabled
  state is meant to read as unavailable, and a floor would push it back
  toward the enabled one.
- **A disabled field is not faded, and its text is held.** The field's
  disabled state is drawn by `control-surface` with no opacity
  (`atoms/_input.scss:24-28`: `bg-subtle` behind `text-subtle`), so it is the
  pair R176, held by the `placeholder` tier at 62.1 in light and 45.0 in dark
  (64.17 and 53.33), as L99 says of disabled text. (Revision 2 said no
  disabled control was held by any floor while listing R176 in the same
  table; verification finding N6.) What would retire this: a disabled
control the owner cannot read in use. (Sheet 3 finding S3-3.)

## 14. Needs the owner

### 14.0 Decided on 2026-10-04

Revision 1's two owner decisions, sheet 3's fourteen items, and revision 2's
two questions and the small-button question are all answered (DECISIONS rows
25 to 31), and the text above is written to them.

- **Chart marks (DECISIONS row 25): option (a).** The `chart-mark` tier holds
  a regression baseline of what ships today on the new surfaces: separation
  at least 28.4 in light and 41.9 in dark (L61), pinned to `chart-3`
  `#ec5198` on the cream page, 29.98, and `chart-6` `#ff9164` on the dark
  card, 44.20. The chart colours are unchanged (decision A3). The other
  options (no chart tier; WCAG's 3:1, which `chart-6` fails on the page at
  2.99:1) are closed.
- **The hover fill (DECISIONS row 26): option (a).** Rows and quiet controls
  hover on `bg-subtle`, the well: `#f7ecd1` in light (4.47 from a card, 2.12
  from the page) and `#140903` in dark (12.04 from a card, 5.11 from the page,
  18.49 from a raised surface). No hover token is added. Row 26 also records
  a consequence: in light a hovered table row
  (`molecules/_table.scss:44`, `bg-subtle`) is the same hex as the header row
  (`:35`, `surface-sunken`) and as a striped row (`:48`), because D1 makes the
  two roles one colour. (Sheet 3 finding S3-4.)
- **Sheet 3's fourteen items (DECISIONS row 27):** "all readable and on-brand"
  as drawn, item 12's six undrawn pairings included, so the revision-1 †
  floors stand (L61). Items 9 and 11 were drawn as the library paints them
  today and passed; L111 and L112 say what holds them, and no floor is pinned
  to them on that answer.

- **The quiet (outline) button's fill (DECISIONS row 28): option (a).**
  Sorbet's outline button paints the milk slab sheet 2 drew: the optional
  token `quiet-fill`, `#fffbf1` in light and `#463425` in dark, fallback
  `transparent`, at `atoms/_button.scss:144` in step 2.4, so the four frozen
  presets keep a transparent button (L15, L70, L106). The light `edge-quiet`
  floor stays 16.0. Measured: on the cream page 18.18 with the slab (15.88
  had the page shown through), on a card 16.90 either way; dark 19.42 and
  17.18. The other option (a transparent button, with the light floor lowered
  to 15.0, L107) is closed.
- **Filled buttons on the bare page (DECISIONS row 29).** The owner passed
  the blush, danger, lilac and butter buttons on the cream page as distinct:
  R265 18.73, R273 18.73, R263 18.99, R267 18.98. So the light `edge-filled`
  floor, 17.7, pinned to R265, stands as approved; revision 2's "provisional"
  mark is removed, and its step-2.1 test is written with the rest.
- **The focus ring touching a lilac fill (DECISIONS row 30).** The selected
  calendar day and the current page draw the ring at offset 0, directly
  against the lilac fill: `#8e6ac7` on `#dac5fc`, 26.13 (tritan, R210). The
  owner judged it visible enough, so the light `focus-visible` floor, 24.8,
  pinned to R210, stands, and is pinned to a placement the owner has now seen,
  as S4 asks.
- **The small button's label (DECISIONS row 31).** Sorbet's `.sb-button--sm`
  label is 14px semi-bold, a sorbet-only setting with today's 12px as the
  four frozen presets' fallback; the default label stays 16px. Specified in
  L19 (data, token `--sb-button-font-size-sm`, accessor `button-label(sm)`,
  `atoms/_button.scss:193`, step 2.4), C9 and C10 (both sizes), and L115 (what
  holds its colours, with the measured Lc).

### 14.1 Open

None. §15 item 18, the one item revision 3.5 raised, was answered on
2026-10-05: the milk segment stays as built (DECISIONS row 32, L164). Every
question revision 2 raised was answered on 2026-10-04 (rows 28 to 31). Step
2.5's four questions were answered on 2026-10-05 (rows 36 to 39; §12.5):
"Every theme", "A. Filled, dark ink (as sheet 2)", "Hidden, for screen
readers", and "Form field error message" (not progress bars, not Token
Studio's failure list). The orchestrator's rulings for the step are row 40,
the spec author's S35 to S54; either is the owner's to overturn.

## 15. Needs the owner's eye (sheet 3)

Everything here is either a hex the owner has seen used differently, or a
pairing of approved hexes no sheet drew. None is a value from nowhere: each
is copied or derived by a stated rule (§3). **Items 1 to 14 were drawn on
sheet 3 (`drop/sorbet-pastel-2026-10-04-sheet3/`, built with the library's
compiled Sass) and answered on 2026-10-04: "all readable and on-brand" as
drawn (DECISIONS row 27).** They stay listed, with that answer, because each
records what was shown. Items 15 to 17 are new in revision 2 and are not yet
answered.

1. **Text over a photograph.** `on-scrim` `#fffbf1` and `on-scrim-muted`
   `#f3e7ce` over the scrim `rgb(0 0 0 / 0.6)`: 5.56:1 and 4.68:1 at the
   scrim's worst case. Reason: text over an image is on neither sheet.
2. **Links in dark.** `link` `#dac5fc` on the dark page / card / raised
   `#211409` / `#342417` / `#463425`: Lc 75.99 / 73.50 / 69.53. It is 13.05
   from the dark body text `#f3e7ce` in typical vision and 7.96 under tritan;
   the underline carries it. Reason: no link was drawn in dark.
3. **Two status marks as solids.** `success-mark` `#00b5b8` and
   `warning-mark` `#bb9c12`. On a card `#fffbf1`: 24.45 and 29.05; on their
   own washes `#d3f4f0` and `#faefca`: 21.24 and 25.11. Reason: on the sheets
   these hexes are only ever a glow at 60 to 70% (§8).
4. **Charts on the new surfaces** (§14.0, row 25). The eight shipped colours
   `#008289` `#9e6400` `#ec5198` `#8a6f00` `#0f70d5` `#e8672e` `#5761db`
   `#598100` on `#fffbf1` and `#fef4dc`: 29.98 to 45.27. The "other" series
   `#b8b2a9` is a colourless grey, 19.93 from the cream page, in a theme with
   no other grey.
5. **The hover fill** (§14.0, row 26). `#f7ecd1` on `#fffbf1` 4.47; on
   `#fef4dc` 2.12. Dark `#140903` on `#342417` 12.04.
6. **The ring colour as a general firm line.** `border-strong` `#b096d7`
   (27.03 from a card) is also what the stylesheet draws a dropzone's dashed
   border, the calendar's "today" ring, a carousel arrow's border, the command
   palette's field, a chart's hover crosshair, a strong divider and the
   rating's empty star with. (Revision 1 said "a chart's axis": the axis is
   `border`, `organisms/_chart.scss:57`; only the crosshair, `:62`, is
   `border-strong`. Sheet 3 finding S3-5.) Reason: the sheets show it only
   round a checkbox and a switch.
   The rating then has a lilac empty star `#b096d7` beside a butter full star
   `#f5e3a2`, which is 7.99 from a card: the empty one is the stronger.
7. **Tooltips.** The page colour on the ink: `#fef4dc` on `#693800`, Lc 88.39;
   in dark `#211409` on `#f3e7ce`, Lc 90.21. Reason: listed "not drawn" in
   proposal §7.
8. **Selected text.** `::selection` paints `primary-subtle` behind `text`:
   `#693800` on `#ede0f7`, Lc 75.33; the wash is 6.42 from a card and 4.41
   from the page. Reason: listed "not drawn".
9. **Badges.** A soft badge is 12px text in `X-text` on `X-subtle`: the ink
   `#693800` on a wash, Lc 75.33 to 81.66. Reason: the sheets set that pairing
   at 16px.
10. **The well under a hover or a neutral badge:** muted text `#844d16` on
    `#f7ecd1`, Lc 71.60. Reason: no muted text was drawn on the well.
11. **Disabled controls on real components** (§13). Reason: the library's
    fade is not the sheet's recipe.
12. **The six pairings that set a floor and were not drawn** (the † of
    L61): dark muted text on a raised surface, `#d7c9ae` on `#463425`,
    Lc 66.79; dark muted text on the robin's-egg wash, `#d7c9ae` on `#4b4c42`,
    59.77; light subtle text on the well, `#975e2a` on `#f7ecd1`, 64.17; dark
    subtle text on a raised surface, `#b3a58d` on `#463425`, 47.02; the rose
    bar on a dark track, `#d77784` on `#140903`, 48.20; the focus ring on a
    dark butter wash, `#8e6ac7` on `#5b4a33`, 17.96.
13. **The placements of §13 that are not gated,** with their numbers.
14. **Status paragraphs at 14px.** An alert is set at 14px in the library and
    was drawn at 16px on sheet 2: the ink on the lilac wash, `#693800` on
    `#ede0f7`, Lc 75.33.

Items 1 to 14: answered, row 27.

Items 15 to 17 were raised by revision 2 and answered on 2026-10-04:

15. **The blush (and danger) button on the bare page:** `#f9c3c6` with its
    halo `#e87783` at 0.70 on `#fef4dc`, presence 18.73 (deutan), floor 17.7.
    With it, the lilac (R263, 18.99) and butter (R267, 18.98) buttons on the
    page. **Answered: all pass as distinct (DECISIONS row 29).**
16. **The quiet button as a milk slab on the cream page:** fill `#fffbf1` on
    `#fef4dc` (fill step 2.36) inside a caramel halo, 18.18; on a card, 16.90;
    in dark, `#463425` on the page, 19.42, and on a card, 17.18.
    **Answered: the milk slab, `quiet-fill` (DECISIONS row 28).**
17. **A focus ring touching a lilac fill.** The selected calendar day and the
    current page draw the ring at offset 0, directly against `#dac5fc`:
    `#8e6ac7` on `#dac5fc`, 26.13 (tritan), the light `focus-visible` floor's
    pair (R210). The sheets drew it 2px away, round a button.
    **Answered: visible enough; the 24.8 floor stands (DECISIONS row 30).**

Item 18 was raised by revision 3.5 and answered on 2026-10-05 (L164):

18. **The selected pill in the pills tab variant.** The raised segment
    `#fffbf1` on the list's well `#f7ecd1`, 4.47 (tritan), with a
    caramel-tinted `shadow(sm)` and the label in the strong ink `#472400` at
    600; dark `#463425` on `#140903`, 18.49 (protan). No sheet drew pills
    tabs. Not blocking any step; if it is too faint, the remedy is a new
    recipe for the segment, which is the owner's look (L157).
    **Answered 2026-10-05: keep the milk segment as built (DECISIONS row 32).
    The label figure above was wrong: see L164.**

## 16. Decided by the spec author

Routine calls, made and named. Each has one sentence of reason and what would
overturn it. None is the owner's by the test of §14 (a new visible value, or a
floor with no approved measurement behind it). Revision 2 moved one of
revision 1's calls to the owner (S4, which was not routine) and added S26 to
S34. Revision 3.6 adds S35 to S51, for step 2.5, and S52 to S54 after its
verifier; the visible ones among them (S35, S36, S37, S39, S40, S43, S49) are
also DECISIONS row 41, so the owner sees them (S36 and S49 added after the
verifier, N11).

| # | Choice | Reason | Overturned by |
|---|---|---|---|
| S1 | Edge presence counts three boundaries, adding the edge pixel against the element's own fill (§5.3) | It is what the rendered measurement of sheet 2 does, and without it an inset line's number depends on a backdrop it never touches | a rendered edge ranking the other way round from its bound on a real component |
| S2 | "All-round" is computed: no offset and a positive spread | A flag typed by hand is one more thing that can disagree with the numbers beside it | an approved recipe whose only edge is a spreadless blur |
| S3 | Margins: 2.0 for Lc; 5% and at least 0.5 for separation and presence; rounded down to one decimal | One 8-bit step moves a measurement at most 0.593 Lc and 0.409 separation, so no single step fails a floor, and two can at the 0.5 minimum, which is what a regression baseline is for; and each margin is under half the smallest step the owner chose between (L59) | the owner asking for tighter or looser pins  (CORRECTION 2026-10-06: dark `edge-sunken` is pinned below this rule's figure, L59, L195 (a)) |
| S4 | A tier's floor is pinned to its weakest pair even when no sheet drew that exact pairing (†), and such a floor is **provisional until the owner passes the pairing** | Every member is built from approved values, and a text tier that left out today's pairs would hold less than `wcag-aa` does; but decision 20 pins floors to what the owner approved, so the pairing goes in front of the owner first (revision 1 called this routine; the adversary's M2 was right that it is not). Revision 1's † pairings were passed on sheet 3 (row 27); revision 2's (R265, and R263 beside it) on row 29; and the placement that pins the light focus floor (R210, the ring touching the fill) on row 30 | the owner finding a † pairing unacceptable: the recipe or value changes, not the floor |
| S5 | `legibility` lists only `scrim` of PR 1's seven tiers; charts get `chart-mark` | Reusing a tier name with another metric would make one tier mean two things; WCAG's chart tier fails on the new page (2.99:1 against 3) | decided: DECISIONS row 25 |
| S6 | Ratio tiers are measured in typical vision only | The published floor is defined on the colours as written | a contract that wants a simulated ratio: it adds a metric, it does not reuse this one |
| S7 | Washes are stored opaque, blended over `surface` once (D7) | One colour wherever the wash sits, so "the bar against its wash" is one number (20.63), not 20.63 or 19.70 by backdrop | washes needing to show what is under them |
| S8 | `border-strong` carries the control ring; the field frame and the switch's off-track leave it through seams | The ring is the only firm line the sheets draw, and nine ring-and-line sites then need no edit | sheet 3, item 6 |
| S9 | `link-hover` equals `link`; the dark link is the `primary` fill (D11, D12) | Hover changes no colour in this look; lilac is the lead hue and reads Lc 69.53 at worst | sheet 3, item 2 |
| S10 | `primary-text` is the strong ink; the other six `-text` roles are the ordinary ink (D8, D9) | Each is what sheet 2 draws: a selected tab in the strong ink, a status box in the ordinary one | the owner wanting brand-coloured text back |
| S11 | `bg-subtle` is the well in both modes (D1) | It is the builder's own identity in light and the sheet's track | decided: DECISIONS row 26 (hover stays on it) |
| S12 | The success and warning marks take the halo tone (§8) | The shade fails the mark-line floor on its own wash, and decision A5 sets that floor as the test | sheet 3, item 3 |
| S13 | The "card on a brand wash" edge pairs are dropped | They measure a backdrop the auth template never paints (appendix G, G19) | a template that paints a full wash behind a card |
| S14 | Edge hue and harshness are left to the eye; direction is checked (C8) | §13 | a harsh edge reaching `main` through a green gate |
| S15 | The dark `border` is see-through, as sheet 2 draws it, and measured over the rule's background | An opaque blend over the card measures 4.57 on a raised surface; see-through it is 9.91 there | a consumer that needs an opaque border colour |
| S16 | `on-scrim` and `on-scrim-muted` are the milk and the dark-mode cream (D2, D3) | Approved hexes that clear the unchanged 4.5:1; the shipped greys are the old palette | sheet 3, item 1 |
| S17 | Optional colour tokens live in `preset.colors[mode]`; edges in `preset.edges` | A caller that forgets to pass optional colours would silently measure the fallbacks; a caller that forgets edges gets 24 named failures (the 22 edge rules, and R224 and R227, which read `edge:field`; revision 2 still said 28) | — |
| S18 | New rules are appended to `RULES`; `Measurement` gains `metric` and `view` | One list and one measurement, as PR 1 set out; check 5 is untouched because it is about what `wcag-aa` measures | — |
| S19 | A dark block resets what only the light block defines, with `initial` (§5.5) | Otherwise sorbet's old dark page paints light-mode edges from step 2.3 to 2.6 | reordering PR 2 so dark lands before the Sass |
| S20 | The tooltip rule reads `bg` on `text`; `text-inverse` equals `bg` (D4) | That is what the Sass paints; `text-inverse` has no Sass use | a component starting to use `text-inverse` |
| S21 | The 12px rule (A15) is a seam, `text-caption`, and a one-line classification (L72) | 47 sites cannot be re-pointed safely by a rule that needs judgement at each | a caption that must stay faint |
| S22 | Headings and field labels get two seams, `heading-ink` and `text-strong` | Their fallbacks differ: a heading sets no colour today, a label sets `text` | — |
| S23 | Step 2.4's rendered bar is sheet 2's rendered figure less 1.0 | The same instrument on the same recipe should land within a pixel's rounding; the gate's own figure cannot stand in, because it is a heuristic that reads above or below what renders (L48) | the edge measurer disagreeing with sheet 2 on sheet 2 itself |
| S24 | Sorbet's `shadowTint` becomes the caramel | "Caramel shadows" in step 2.2 (proposal §8) need it, and it touches only sorbet's light block | — |
| S25 | The `label` tier's size condition is data on the floor (`requires`, both sizes since revision 3), checked against `preset.buttonLabel` (C9), a new field; `Preset.label`, the display name, is untouched | The floor was approved by eye for the default button at 16px semi-bold (appendix G, G20), and the small button's 14px was decided on the figure, unseen (row 31, L115); a checker that cannot see the sizes cannot say so; reusing `label` would break the manifest, the reports' headings and the four frozen goldens (adversary C1) | button labels going back to one size for every theme |
| S26 | `filled-success`, `filled-warning`, `filled-info` and their six rules are withdrawn | No Sass site paints an edge round those fills (the library has no such button), so C10 could not pass and one of them held the whole tier's floor 2 below the real buttons | a button variant in a status fill |
| S27 | Status marks are also held on `surface-raised` (R280 to R283), and the card rules stay | The toast paints its stripe on the raised surface; decision A5 names the card | a status mark painted on another surface |
| S28 | An edge recipe's fill is the token its Sass site paints, and C11 checks the stylesheet against L106 | A rule measuring an unpainted fill passes on nothing (adversary C2) | — |
| S29 | The thumb's and the slider track's rings reuse `switch-ring` rather than adding tokens | Sheet 2 draws all three in one `--ring`; one more token per ring would be three names for one colour | a ring that needs its own colour |
| S30 | The floating line is removed through `container-line` (L113) | Sheet 2's floating menu has no line, and the card already drops its line this way | the owner wanting a visible line round menus |
| S31 | The default scrim's gradient is recorded as an existing defect and deferred (L110) | It is shared by all five presets and its fix moves frozen pixels; nothing sorbet changes makes it worse | a scrim fix landing in the later defects PR |
| S32 | 12px text on fills and washes, and disabled controls, are left to the eye with their figures (L111, L112) | No theme token sets their size or their fade, and the owner passed them as drawn; a floor pinned on that answer alone would be unapproved | a badge or disabled control the owner cannot read in use |
| S33 | Structure failures are counted on their own line (L90) | PR 1's tests and the reports read "contrast failure(s)" as a count of failed measurements | — |
| S34 | The dark border stays `rgb(254 244 220 / 0.14)` though minifying it moves the divider by up to 0.25 (L109) | It is sheet 2's value; the gate measures the record, and both spellings pass | a Token Studio reading that crosses the floor |
| S35 | The status icon's ink is `text-strong` on a wash or a surface, through `where-defined` falling back to the component's own text colour, and the label ink `on-X` on a fill (L170) | It gives the `#472400` the owner chose in light and sheet 2's `#f3e7ce` in dark, and a frozen preset's icon is exactly the pair of the words beside it. A bare `currentColor` (the other way the orchestrator named) would hold every pair by an existing rule but paint `#693800` on sorbet's light washes, 8.69 (protan) lighter than the chosen ink. The alert's title stays `#693800`, so in light the icon is the darker of the two, where sheet A drew both alike | the owner preferring the icon to match its title (then `currentColor`, or the title re-pointed to `text-strong`) |
| S36 | The symbol is knocked out, not drawn in a colour, and the knock-out is one even-odd path per glyph, not a mask (L169). The knock-out itself is this author's call, not the owner's: the sheet the owner chose from drew the symbol in a fixed `#fffbf1` (verifier N8). Knocked out, the symbol shows the blush fill `#f9c3c6` on the solid danger button and a wash's own hex on a wash (`#fcdfdc` on the danger wash in light). The owner sees it on the step's look sheet | A fixed milk symbol vanishes in dark mode, on the cream silhouette `#f3e7ce` (Lc 9.80, tritan), and would be a colour written into the glyph, which the portability ruling forbids; the knocked-out dark danger wash reads Lc 76.98 (deutan). A mask is referenced by an id unique in the document; generating one needs a hook, which would make `icons.tsx`, a server module like every house glyph, a client module (`check:client`); a fixed id would repeat wherever two icons render | the owner wanting the drawn milk symbol (a fixed `#fffbf1` in light, and a dark symbol in dark); a glyph whose symbol cannot be drawn as outlines inside its silhouette |
| S37 | The words are "Success", "Warning", "Error", "Information", each followed by ": " inside the hidden span (L171) | "Error" is what a listener needs for a failure ("Danger" announces a hazard; GOV.UK prefixes "Error:"); "Information" is a word, not an abbreviation; the colon makes the pause, and the space inside the span keeps inline text from running on | the owner choosing other words |
| S38 | The words are overridden per component by a `statusLabel` prop (and a `toast()` option); empty gives the default (L171) | It is the library's existing pattern for its own words (`dismissLabel`); the library has no locale provider, and adding one is not this step; an empty override would remove the word and break the invariant | a locale provider in the library |
| S39 | A danger alert keeps `role="status"`; `role="alert"` stays the consumer's to pass (L172) | Urgency is not a tone: a danger alert rendered with the page (buylist's) would interrupt the reader if assertive, and the library's own note makes `alert` a limit, not a default | the owner wanting danger alerts announced assertively |
| S40 | With a status tone, the badge's icon replaces its `dot` (L174) | The dot is a status sign in colour alone, which is what the icon replaces; two leading marks are one too many | a badge wanting both |
| S41 | In a danger menu item the octagon replaces a consumer's leading glyph; in a danger button a consumer's glyph stays, after it (L175, L176) | A menu lines its glyphs up in one column, and a second leading glyph breaks it; a button has no column, and its glyph may trail the label | a consumer needing its own glyph in a danger menu item |
| S42 | The glyphs are named for their tone (`SuccessIcon` …), carry `sb-status-icon sb-status-icon--<tone>`; the internal names are `StatusMark` (the slot, props `tone`, `statusLabel?`, `wordless?`, `className?`), `STATUS_GLYPHS` and `STATUS_WORDS`; the alert's and toast's slot carries `sb-status` first, then its box class; the toast's markup is a `ToastItem` with six named props, exported from its module but not from the barrel (L169, L173, L186) | The components look a glyph up by tone; one component writes the slot, so its markup has one source; the classes let the stylesheet, the mask and the test find them; a toast can only be rendered without a browser if its markup is a component | — |
| S43 | One size rule: 1.1em (the button's glyph size), 1em in a menu item (the menu's), and the whole 1.25rem slot leading an alert or a toast, always as `inline-size` and `block-size` (L169, L190 (e)) | It reuses the sizes the library already gives glyphs, so a status icon is no larger or smaller than any other glyph beside it; inside the slot the components' `> svg` rules no longer reach the glyph, so the menu's size is restated | the icons reading too small at 12px |
| S44 | The danger status box draws its rim and edge from one local, falling back to the edge alone, then to `revert-layer` (L178) | `revert-layer` cannot be an item of a list, and the nested fallback is right in all four cases (both tokens, either, neither); the price is one widened test condition (L183 #51) | — |
| S45 | The button's rim reaches the hover and press states through `--shadow-rest`, `-hover` and `-press`, not new declarations in the state rules (L175) | No state rule changes (L153), and a state cannot lose the rim because each state's shadow carries it (L152) | — |
| S46 | From step 2.5 the frozen compare masks the status icons on both sides and must then be pixel-identical (L167) | Both sides render this tree's markup, so masking is exact; judging each differing shot by eye cannot separate the icon from the reflow below it | a change to the status components that is not confined to the icon |
| S47 | "2.4 #3" is narrowed to the files step 2.5 does not name, not retired (L183 #49) | It still fences each later step to its stated files at no cost | the steps ending (after 2.8) |
| S48 | The presence test lives in `packages/component-library/tools/test-status.ts`, reads the built `dist`, and runs in `pnpm test` and CI after the build (L181) | The component library has `react-dom`; the design system's tests do not import React; reading `dist` tests what consumers get, as `check:consumable` does | a test runner for the component library's sources |
| S49 | The dropzone's error line and the rating's stars get no icon in this step (L168, §13) | Neither was put to the owner, and the owner named the places that change; each is recorded with its figure | the owner wanting either |
| S50 | `check:consumable`'s floor (126) is not raised to 135 (step 2.5's acceptance #6) | The floor is that tool's ratchet against shrinking coverage; the presence test already renders the four glyphs | — |
| S51 | Step 2.5 adds no playground demo (L167) | A demo that grew a row would differ in every masked shot below it, and the look sheet shows the icons | step 2.8's docs wanting one |
| S52 | A `statusLabel` is trimmed; empty after trimming gives the default word (L171) | A stray space would read "Fehler : " or double the space before the consumer's words; trimmed, an override takes the default's exact form | a language whose word needs a space kept |
| S53 | The presence test's cases are plain ASCII, and the toast's markup at `9b83e50` is given as text (L187) | No entity escaping for a test to undo; `9b83e50`'s toast renders only after mount, so it cannot be recorded by a server render | — |
| S54 | The test refuses a stale build by comparing each source file's time with its built file's (L189) | It costs no build inside the test, and catches the case that matters, a local `pnpm test` after an edit; CI builds first | a checkout that leaves built files newer than edited sources (then the test builds, as `check:consumable` does without `--no-build`) |

## 17. Where the proposal is superseded or wrong

Each line says what the proposal's text says, what this spec does instead, and
why. Items 1 to 9 supersede §5. Items 10 to 16, and 17 to 19 of revision 2,
are things found wrong while
measuring. Items 21 and 22 (revision 3.6) supersede the proposal's §12 and
its step 2.5 where the owner's answers on step 2.5 moved them.

1. **The edge formula** (§5, "Edge presence"): `max(sep(fill, behind), sep(blend(edge, behind), behind))`.
   Superseded by L49. Two reasons. It blends an inset edge over
   what is behind the element, which is not what is on screen. And it leaves
   out the step from the edge pixel to the fill, which the rendered
   measurement counts. Consequence: the light card reads 16.70 here, not
   14.4; the dark card (16.06) and the light field on a card (11.03) are
   unchanged.
2. **§5's table, "Light: text field on the page … 10.5".** That figure blends
   the field's inset line over the page. Blended over the field's own fill
   the line is 8.80 from the page and 11.03 from the fill; presence is 11.03.
3. **Four text tiers.** There are six: `on-wash` and `tinted` are split out
   so that text on a wash keeps a floor of its own in dark (76.2), instead of
   sharing one pinned to muted text on a raised surface (64.7).
4. **"Chart marks: the mark rule, against the surface", draft floor 10.**
   Charts get their own tier with their own per-mode floors, on both grounds
   (§14.0, DECISIONS row 25). Keeping WCAG's chart tier instead is not possible: 2.99:1.
5. **The tooltip as "`text-inverse` on `text`"** (appendix G's checklist). The
   Sass paints `bg` on `text`; no Sass reads `text-inverse` at all.
6. **"The selected bar … 20.6 on a card, 19.7 on the page."** One number,
   20.63: the wash is stored opaque (S7).
7. **Check 2, "reversed in dark".** Nothing reverses: the measure is the size
   of Lc on the page (C2).
8. **"Rules name roles, never hues"** stands, and "no new role is needed"
   stays withdrawn: 20 optional colour tokens, 13 edge elements and one type
   size. The proposal's "about ten seams" (§7, mechanic 1) is an undercount.
   (Revision 1 said 19 and 18; it defined 16 elements, of which revision 2
   withdraws three.)
9. **The draft floors** (84, 76, 70, 64; 10, 20, 10, 5, 20; 14 and 16) are all
   replaced by L61.
10. **Step 2.2's proof,** "sorbet's golden diff shows its first line and its
    light block and nothing else". It also shows the reset lines of L55.
    The underlying problem is real: as ordered, sorbet's dark page would paint
    light-mode edges and a milk field from step 2.3 until step 2.6.
11. **Step 2.1's known-bad, "(fill 6.9, shadow 3.4, border 0)".** The shipped
    shadow has no all-round layer, as the proposal's own check 6 note says, so
    3.4 is not part of any measurement. The card fails at 6.90 because its
    border is its own fill's colour (§10).
12. **"The switch … in dark it is 11.4 and passes."** With a dark floor of its
    own (45.7) the shipped dark switch fails too. Only the light failure is
    required of the fixture.
13. **Decision A5 as worded** ("the mark-line floor each must clear on a card
    and on its own wash") cannot be met by the status shades the proposal
    measures bars with: the robin's-egg shade `#66c2c4` is 16.51 on its wash
    and the butter shade `#ccb563` 17.47, against 19.5. Hence the halo tones
    (§8).
14. **`focus-ring` "25.7 or more in dark"** (decision A9) is true of the three
    surfaces. On the dark washes it is 17.96 to 19.38; the dark floor is
    pinned there (17.0).
15. **`tools/build-tokens.ts` reads its list of legal names from the first
    theme only** (§11.6). Not in the proposal's defect list.
16. **`edges-values.json` is not the decided dark.** As the proposal warns, it
    was last written on the aubergine page. Every dark surface here is the
    cocoa set of decision 9, cross-checked against the `Dark` block of
    `edges-measure.json` (`backdrop` `#211409`, card `fill` `#342417`) and
    recomputed from `build-edges.mjs:20` (`basics.ts`). Its text tokens
    (`#f3e7ce`, `#d7c9ae`, `#b3a58d`) are the same on both pages and are used.
17. **A rule naming a colour that is not one is now refused** (L40). PR 1's
    `measureColors` measured it and returned `actual: null`
    (`rules.ts:249-250`, "What is NOT refused here"); now it is a
    `TypeError`, because the name is checked against roles, optional tokens
    and `edge:` names before anything is measured. A change of PR-1
    behaviour, on purpose; no PR-1 test plants such a rule.
18. **Check 5 is not "exactly 700" after step 2.2** (L3). The proposal's
    "check 5 still holds" is true of the triples; the 700 recorded ratios
    include sorbet's, which the rebuilt sorbet does not keep (L105 #25).
19. **The scrim rule holds less than its words suggest.** "Text over the
    scrim" is held at full strength; the library's default scrim is a
    gradient, and text above its bottom 6.2% meets less than 4.5:1 over a
    white image (L110). It is so for all five presets today, and deferred
    with the existing defects.
20. **The command palette's input shows no focus indicator** (found by the
    audit of steps 2.3 and 2.4, in `main` as well). An existing defect of all
    five presets, deferred with the others (decision 16).
21. **Proposal §12, buylist: "What changes: nothing, by design: its readers
    are not the owner"**, and the in-repo stand-ins `apps/admin` (ocean) and
    `apps/meal-kit` (forest), which it uses as buylist's check. Superseded for
    the status components by the owner's "Every theme" (DECISIONS row 36):
    their colours do not change, and their alerts, toasts, status badges,
    danger buttons, danger menu items and field errors gain the icon and the
    hidden word, `apps/admin` and `apps/meal-kit` with step 2.5 itself and
    buylist at its next re-pack (L166, L185). The three noir pages of
    proposal §12 vendor only the stylesheet and still change in nothing.
22. **Proposal step 2.5's proofs: "the invariant is held by construction,
    which matters in a repo with no test runner", and "`check:consumable`
    still renders its 126 components".** Construction stays (the icon and word
    are derived inside each component, L168), and a test holds it as well
    (L181), because a hidden word's absence shows nothing. 126 is
    `check:consumable`'s floor, not its count: 131 render at `9b83e50`, 135
    with the four glyphs. Its "four silhouettes" stands, and supersedes
    DECISIONS row 23's "outlined" (row 37).

## 18. Appendix G of the proposal, item by item

Every item and every checklist line is closed here or stated as left to the
eye.

| Item | Closed by |
|---|---|
| G1. Checks 1 and 4 cannot both pass | C1 is scoped to legibility modes (§9). The four WCAG presets keep 68 roles; sorbet defines 69 |
| G2. The tier table cannot re-express today's rules | Corrected in PR 1. The member's additional tiers and kinds: §4.1 (20 tiers, 2 kinds) |
| G3. The decided dark shades fail the one set of floors | Decision 21; per-mode floors, L61 |
| G4. Two edge numbers per mode | One floor per element class and mode, with stated margin: §6.2, §6.3. Decision 22 |
| G5. Most inputs are neither roles nor tokens | §3.2 (20 optional tokens), §5.2 (edge data), L70 (the token or field and the Sass site for each), L106 (the fill each edge element is measured on, and the line that paints it) |
| G6. No rule for a value that cannot be measured | L39, with what each see-through input is blended over (L38) |
| G7. The document's own wash fails the secondary floor | The `-text` and `-subtle` values are decided (D7 to D9); that pair has its own tier, `on-wash` |
| G8. No rule reads the tick; the switch fails only in light | R171 (tick), R179 (switch), R227 (focused against resting). The mode of each known-bad: §10 |
| G9. Check 3 has no map and no scope | C3: the pair list, the scope, and "compared after blending" |
| G10. Check 2 is false in dark | C2: the measure is the size of Lc on `bg`; label inks are out of the ordering |
| G11. The edge rule bounds only distance | Direction: C8. Hue, colourfulness and harshness: **left to the eye** (§13) |
| G12. The label tier's words name 21 pairs | The 19 that exist, listed literally, each marked today or new (appendix A, `label`) |
| G13. "The four fills" are hues, not roles | `palette` names `primary`, `secondary`, `accent`, `success`; the three aliases are not compared (§7) |
| G14. The bar's pass depends on what its wash sits on | The wash is stored opaque over `surface` (D7, S7): one number |
| G15. Raised elements with no pair | `edge-quiet`, `edge-filled`, `edge-status`, `edge-sunken` (§7). Decision A14: a butter button on the bare page is held to a floor (`edge-filled` on `bg`); the robin's-egg convention stays a usage rule, because the library has no robin's-egg button (L69). The disabled fill: **left to the eye** (§13, L112) |
| G16. The focus rule's backgrounds are not all listed | 20, listed literally (appendix A, `focus-visible`); every rule runs in both modes |
| G17. The all-round layer and the inset blend are undefined | L47, L48, L49; edge floors are worst-view |
| G18. Lc is signed | L29 |
| G19. The auth template does not paint the washes | The pair is dropped (S13); **left to the eye** (§13) |
| G20. The label floor holds only at 16px semi-bold; three rules have no check | The size, for the button at both its sizes: `requires` and C9 (16px default, 14px small since DECISIONS row 31; L115). The 12px solid badge paints the same pairs and is **left to the eye** (L111, row 27). "Never darken a fill": C7. "12px text on cream or milk only": `text-caption` and L72 for the `text-subtle` sites; 12px text on fills, washes and the ink (solid and soft badges, the tooltip) is **left to the eye** (L111). "No paragraph on a full fill": **left to the eye** (§13). (Revision 1 marked the 12px rule closed by L72 alone.) |
| G21, G23. Stale status line; wrong line citation | Corrected in the proposal; nothing for this spec |
| G22. The scrim rule's views, and the clamp | Ratio rules are typical-vision only (§4.2). The clamp is built and tested (mechanism spec M10.10) |
| G24. The field edge is a different colour from the caramel | The rule reads `edge:field`, the field's own inset line `#815b1f` at 24% over its fill (§5.4) |

| Checklist line | Closed by |
|---|---|
| The member's additional tiers and kinds | §4.1 |
| How a per-mode number is written | `{ light, dark }`, as PR 1's chart floor; 17 of the 21 floors are (§6.3) |
| What an unmeasurable value does for each new kind; how a see-through value is measured outside the scrim rule | §4.4 |
| That Lc floors compare size, and the order of text and background | L29 |
| The light values not yet decided | L12 |
| Which token carries the ring, the bar, the wash, the off-track, the track, the rose rim, the resting field edge, the status shades, the halo and deep tones | L70; §3.2; §8 |
| Dark values for muted and subtle text, or dark floors | Decision 21; L61 |
| The shape of shadows as data | §5.1 to §5.3 |
| Which edge number is enforced | One per class and mode (§6.3) |
| The scope of checks 1, 2 and 3 | §9 |
| Whether the mark, tell-apart and palette rules run in dark | All 191 rules run in both modes (§7) |
| Which roles are "the four fills" and "every brand fill" | §7, the summary table |
| Chart marks against `bg` as well as `surface`; `chart-muted` | Both grounds; `chart-muted` not held (§7) |
| Whether ratio rules use the contract's four views | No: typical only (§4.2) |
| The rounding rule for a regression baseline, and the margin | L59 |
| Check 6: contain or consist only of; where the fixture's shadow data comes from | Contain; a recorded fixture file (§10) |
| The shape of the record of who it was calibrated for | One sentence, `calibratedFor`, with two phrases a test checks (§6.1) |
| Whether tooltip text gets a rule | Yes: R100 |
| Whether the tab indicator is checked against `surface` as well as `bg` | Yes: R192 |

## Appendix A. The 191 rules, with what each measures

**L103.** This table is the rule list (`fg`, `bg`, tier; the order of `RULES`
is the order of the rule numbers, L67) and the expected
measurement of each rule for the new sorbet in each mode: `actual`, rounded
to two decimals, and the view it was taken in. For a text or separation rule
the cell shows the two opaque colours measured. For an edge rule the
breakdown is in appendix B. Script: `evaluate.ts new`, printed by `gen.ts`
(`out/rules.md`).

**Tier `body`** — lc; 15 rules; floor light 82.8, dark 83.2

| # | `fg` | `bg` | Light | Dark | Pair | For |
|---|---|---|---|---|---|---|
| R087 | `text` | `bg` | #693800 on #fef4dc = 84.86 (tritan) | #f3e7ce on #211409 = 90.87 (protan) | today |  |
| R088 | `text` | `surface` | #693800 on #fffbf1 = 88.78 (deutan) | #f3e7ce on #342417 = 88.77 (protan) | today |  |
| R089 | `text` | `surface-raised` | #693800 on #fffbf1 = 88.78 (deutan) | #f3e7ce on #463425 = 85.24 (protan) | today |  |
| R090 | `text` | `field-fill` | #693800 on #fffbf1 = 88.78 (deutan) | #f3e7ce on #140903 = 91.55 (protan) | new |  |
| R091 | `text-strong` | `bg` | #472400 on #fef4dc = 92.90 (tritan) | #f3e7ce on #211409 = 90.87 (protan) | new | strong text: field labels |
| R092 | `text-strong` | `surface` | #472400 on #fffbf1 = 97.14 (tritan) | #f3e7ce on #342417 = 88.77 (protan) | new | strong text: field labels |
| R093 | `text-strong` | `surface-raised` | #472400 on #fffbf1 = 97.14 (tritan) | #f3e7ce on #463425 = 85.24 (protan) | new | strong text: field labels |
| R094 | `heading-ink` | `bg` | #472400 on #fef4dc = 92.90 (tritan) | #f3e7ce on #211409 = 90.87 (protan) | new | headings |
| R095 | `heading-ink` | `surface` | #472400 on #fffbf1 = 97.14 (tritan) | #f3e7ce on #342417 = 88.77 (protan) | new | headings |
| R096 | `heading-ink` | `surface-raised` | #472400 on #fffbf1 = 97.14 (tritan) | #f3e7ce on #463425 = 85.24 (protan) | new | headings |
| R097 | `text-caption` | `bg` | #472400 on #fef4dc = 92.90 (tritan) | #f3e7ce on #211409 = 90.87 (protan) | new | 12px captions |
| R098 | `text-caption` | `surface` | #472400 on #fffbf1 = 97.14 (tritan) | #f3e7ce on #342417 = 88.77 (protan) | new | 12px captions |
| R099 | `text-caption` | `surface-raised` | #472400 on #fffbf1 = 97.14 (tritan) | #f3e7ce on #463425 = 85.24 (protan) | new | 12px captions |
| R100 | `bg` | `text` | #fef4dc on #693800 = 88.39 (tritan) | #211409 on #f3e7ce = 90.21 (protan) | new | tooltip |
| R101 | `text-inverse` | `text` | #fef4dc on #693800 = 88.39 (tritan) | #211409 on #f3e7ce = 90.21 (protan) | new |  |

**Tier `secondary`** — lc; 26 rules; floor light 74.2, dark 64.7

| # | `fg` | `bg` | Light | Dark | Pair | For |
|---|---|---|---|---|---|---|
| R102 | `text-muted` | `bg` | #844d16 on #fef4dc = 76.30 (deutan) | #d7c9ae on #211409 = 72.42 (protan) | today |  |
| R103 | `text-muted` | `surface` | #844d16 on #fffbf1 = 79.89 (deutan) | #d7c9ae on #342417 = 70.32 (protan) | today |  |
| R104 | `text-muted` | `surface-raised` | #844d16 on #fffbf1 = 79.89 (deutan) | #d7c9ae on #463425 = 66.79 (protan) | today |  |
| R105 | `text-muted` | `field-fill` | #844d16 on #fffbf1 = 79.89 (deutan) | #d7c9ae on #140903 = 73.10 (protan) | new |  |
| R106 | `text` | `bg-subtle` | #693800 on #f7ecd1 = 80.49 (deutan) | #f3e7ce on #140903 = 91.55 (protan) | today |  |
| R107 | `text` | `surface-sunken` | #693800 on #f7ecd1 = 80.49 (deutan) | #f3e7ce on #140903 = 91.55 (protan) | today |  |
| R108 | `link` | `bg` | #654199 on #fef4dc = 78.39 (tritan) | #dac5fc on #211409 = 75.99 (typical) | today |  |
| R109 | `link` | `surface` | #654199 on #fffbf1 = 82.63 (tritan) | #dac5fc on #342417 = 73.50 (deutan) | today |  |
| R110 | `link` | `surface-raised` | #654199 on #fffbf1 = 82.63 (tritan) | #dac5fc on #463425 = 69.53 (deutan) | new |  |
| R111 | `link-hover` | `bg` | #654199 on #fef4dc = 78.39 (tritan) | #dac5fc on #211409 = 75.99 (typical) | today |  |
| R112 | `link-hover` | `surface` | #654199 on #fffbf1 = 82.63 (tritan) | #dac5fc on #342417 = 73.50 (deutan) | new |  |
| R113 | `link-hover` | `surface-raised` | #654199 on #fffbf1 = 82.63 (tritan) | #dac5fc on #463425 = 69.53 (deutan) | new |  |
| R114 | `primary-text` | `bg` | #472400 on #fef4dc = 92.90 (tritan) | #f3e7ce on #211409 = 90.87 (protan) | today |  |
| R115 | `primary-text` | `surface` | #472400 on #fffbf1 = 97.14 (tritan) | #f3e7ce on #342417 = 88.77 (protan) | today |  |
| R116 | `secondary-text` | `bg` | #693800 on #fef4dc = 84.86 (tritan) | #f3e7ce on #211409 = 90.87 (protan) | today |  |
| R117 | `secondary-text` | `surface` | #693800 on #fffbf1 = 88.78 (deutan) | #f3e7ce on #342417 = 88.77 (protan) | new |  |
| R118 | `accent-text` | `bg` | #693800 on #fef4dc = 84.86 (tritan) | #f3e7ce on #211409 = 90.87 (protan) | today |  |
| R119 | `accent-text` | `surface` | #693800 on #fffbf1 = 88.78 (deutan) | #f3e7ce on #342417 = 88.77 (protan) | new |  |
| R120 | `success-text` | `bg` | #693800 on #fef4dc = 84.86 (tritan) | #f3e7ce on #211409 = 90.87 (protan) | today |  |
| R121 | `success-text` | `surface` | #693800 on #fffbf1 = 88.78 (deutan) | #f3e7ce on #342417 = 88.77 (protan) | new |  |
| R122 | `warning-text` | `bg` | #693800 on #fef4dc = 84.86 (tritan) | #f3e7ce on #211409 = 90.87 (protan) | today |  |
| R123 | `warning-text` | `surface` | #693800 on #fffbf1 = 88.78 (deutan) | #f3e7ce on #342417 = 88.77 (protan) | new |  |
| R124 | `danger-text` | `bg` | #693800 on #fef4dc = 84.86 (tritan) | #f3e7ce on #211409 = 90.87 (protan) | today |  |
| R125 | `danger-text` | `surface` | #693800 on #fffbf1 = 88.78 (deutan) | #f3e7ce on #342417 = 88.77 (protan) | new |  |
| R126 | `info-text` | `bg` | #693800 on #fef4dc = 84.86 (tritan) | #f3e7ce on #211409 = 90.87 (protan) | today |  |
| R127 | `info-text` | `surface` | #693800 on #fffbf1 = 88.78 (deutan) | #f3e7ce on #342417 = 88.77 (protan) | new |  |

**Tier `on-wash`** — lc; 8 rules; floor light 73.3, dark 76.2

| # | `fg` | `bg` | Light | Dark | Pair | For |
|---|---|---|---|---|---|---|
| R128 | `primary-text` | `primary-subtle` | #472400 on #ede0f7 = 84.18 (deutan) | #f3e7ce on #554445 = 79.90 (protan) | today |  |
| R129 | `secondary-text` | `secondary-subtle` | #693800 on #fcdfdc = 76.17 (tritan) | #f3e7ce on #5b443a = 79.93 (protan) | today |  |
| R130 | `accent-text` | `accent-subtle` | #693800 on #faefca = 81.66 (tritan) | #f3e7ce on #5b4a33 = 78.59 (protan) | today |  |
| R131 | `success-text` | `success-subtle` | #693800 on #d3f4f0 = 78.89 (deutan) | #f3e7ce on #4b4c42 = 78.22 (protan) | today |  |
| R132 | `warning-text` | `warning-subtle` | #693800 on #faefca = 81.66 (tritan) | #f3e7ce on #5b4a33 = 78.59 (protan) | today |  |
| R133 | `danger-text` | `danger-subtle` | #693800 on #fcdfdc = 76.17 (tritan) | #f3e7ce on #5b443a = 79.93 (protan) | today |  |
| R134 | `info-text` | `info-subtle` | #693800 on #ede0f7 = 75.33 (deutan) | #f3e7ce on #554445 = 79.90 (protan) | today |  |
| R135 | `primary-text` | `selected-wash` | #472400 on #ede0f7 = 84.18 (deutan) | #f3e7ce on #554445 = 79.90 (protan) | new | selected tab or row text on its wash |

**Tier `tinted`** — lc; 17 rules; floor light 64.4, dark 57.7

| # | `fg` | `bg` | Light | Dark | Pair | For |
|---|---|---|---|---|---|---|
| R136 | `text-muted` | `bg-subtle` | #844d16 on #f7ecd1 = 71.60 (deutan) | #d7c9ae on #140903 = 73.10 (protan) | today |  |
| R137 | `text-muted` | `surface-sunken` | #844d16 on #f7ecd1 = 71.60 (deutan) | #d7c9ae on #140903 = 73.10 (protan) | today |  |
| R138 | `text-muted` | `selected-wash` | #844d16 on #ede0f7 = 66.45 (deutan) | #d7c9ae on #554445 = 61.45 (protan) | new | secondary text in a selected row |
| R139 | `text-muted` | `primary-subtle` | #844d16 on #ede0f7 = 66.45 (deutan) | #d7c9ae on #554445 = 61.45 (protan) | new |  |
| R140 | `text-muted` | `secondary-subtle` | #844d16 on #fcdfdc = 67.62 (tritan) | #d7c9ae on #5b443a = 61.48 (protan) | new |  |
| R141 | `text-muted` | `accent-subtle` | #844d16 on #faefca = 73.10 (tritan) | #d7c9ae on #5b4a33 = 60.14 (protan) | new |  |
| R142 | `text-muted` | `success-subtle` | #844d16 on #d3f4f0 = 70.00 (deutan) | #d7c9ae on #4b4c42 = 59.77 (protan) | new |  |
| R143 | `text-muted` | `warning-subtle` | #844d16 on #faefca = 73.10 (tritan) | #d7c9ae on #5b4a33 = 60.14 (protan) | new |  |
| R144 | `text-muted` | `danger-subtle` | #844d16 on #fcdfdc = 67.62 (tritan) | #d7c9ae on #5b443a = 61.48 (protan) | new |  |
| R145 | `text-muted` | `info-subtle` | #844d16 on #ede0f7 = 66.45 (deutan) | #d7c9ae on #554445 = 61.45 (protan) | new |  |
| R146 | `link` | `primary-subtle` | #654199 on #ede0f7 = 69.81 (protan) | #dac5fc on #554445 = 64.30 (deutan) | new |  |
| R147 | `link` | `secondary-subtle` | #654199 on #fcdfdc = 68.61 (protan) | #dac5fc on #5b443a = 63.71 (deutan) | new |  |
| R148 | `link` | `accent-subtle` | #654199 on #faefca = 74.89 (protan) | #dac5fc on #5b4a33 = 62.55 (deutan) | new |  |
| R149 | `link` | `success-subtle` | #654199 on #d3f4f0 = 74.25 (deutan) | #dac5fc on #4b4c42 = 63.51 (typical) | new |  |
| R150 | `link` | `warning-subtle` | #654199 on #faefca = 74.89 (protan) | #dac5fc on #5b4a33 = 62.55 (deutan) | new |  |
| R151 | `link` | `danger-subtle` | #654199 on #fcdfdc = 68.61 (protan) | #dac5fc on #5b443a = 63.71 (deutan) | new |  |
| R152 | `link` | `info-subtle` | #654199 on #ede0f7 = 69.81 (protan) | #dac5fc on #554445 = 64.30 (deutan) | new |  |

**Tier `label`** — lc; 19 rules; floor light 68.9, dark 68.9

| # | `fg` | `bg` | Light | Dark | Pair | For |
|---|---|---|---|---|---|---|
| R153 | `on-primary` | `primary` | #472400 on #dac5fc = 71.32 (deutan) | #472400 on #dac5fc = 71.32 (deutan) | today |  |
| R154 | `on-secondary` | `secondary` | #472400 on #f9c3c6 = 70.92 (protan) | #472400 on #f9c3c6 = 70.92 (protan) | today |  |
| R155 | `on-accent` | `accent` | #472400 on #f5e3a2 = 82.57 (tritan) | #472400 on #f5e3a2 = 82.57 (tritan) | today |  |
| R156 | `on-success` | `success` | #472400 on #a6edee = 79.10 (deutan) | #472400 on #a6edee = 79.10 (deutan) | today |  |
| R157 | `on-warning` | `warning` | #472400 on #f5e3a2 = 82.57 (tritan) | #472400 on #f5e3a2 = 82.57 (tritan) | today |  |
| R158 | `on-danger` | `danger` | #472400 on #f9c3c6 = 70.92 (protan) | #472400 on #f9c3c6 = 70.92 (protan) | today |  |
| R159 | `on-info` | `info` | #472400 on #dac5fc = 71.32 (deutan) | #472400 on #dac5fc = 71.32 (deutan) | today |  |
| R160 | `on-primary` | `primary-hover` | #472400 on #dac5fc = 71.32 (deutan) | #472400 on #dac5fc = 71.32 (deutan) | today |  |
| R161 | `on-secondary` | `secondary-hover` | #472400 on #f9c3c6 = 70.92 (protan) | #472400 on #f9c3c6 = 70.92 (protan) | today |  |
| R162 | `on-accent` | `accent-hover` | #472400 on #f5e3a2 = 82.57 (tritan) | #472400 on #f5e3a2 = 82.57 (tritan) | today |  |
| R163 | `on-success` | `success-hover` | #472400 on #a6edee = 79.10 (deutan) | #472400 on #a6edee = 79.10 (deutan) | new |  |
| R164 | `on-warning` | `warning-hover` | #472400 on #f5e3a2 = 82.57 (tritan) | #472400 on #f5e3a2 = 82.57 (tritan) | new |  |
| R165 | `on-danger` | `danger-hover` | #472400 on #f9c3c6 = 70.92 (protan) | #472400 on #f9c3c6 = 70.92 (protan) | today |  |
| R166 | `on-info` | `info-hover` | #472400 on #dac5fc = 71.32 (deutan) | #472400 on #dac5fc = 71.32 (deutan) | new |  |
| R167 | `on-primary` | `primary-active` | #472400 on #dac5fc = 71.32 (deutan) | #472400 on #dac5fc = 71.32 (deutan) | today |  |
| R168 | `on-secondary` | `secondary-active` | #472400 on #f9c3c6 = 70.92 (protan) | #472400 on #f9c3c6 = 70.92 (protan) | today |  |
| R169 | `on-accent` | `accent-active` | #472400 on #f5e3a2 = 82.57 (tritan) | #472400 on #f5e3a2 = 82.57 (tritan) | today |  |
| R170 | `on-danger` | `danger-active` | #472400 on #f9c3c6 = 70.92 (protan) | #472400 on #f9c3c6 = 70.92 (protan) | new |  |
| R171 | `on-primary` | `control-checked` | #472400 on #dac5fc = 71.32 (deutan) | #472400 on #dac5fc = 71.32 (deutan) | new | the tick and the radio dot |

**Tier `placeholder`** — lc; 6 rules; floor light 62.1, dark 45

| # | `fg` | `bg` | Light | Dark | Pair | For |
|---|---|---|---|---|---|---|
| R172 | `text-subtle` | `bg` | #975e2a on #fef4dc = 68.87 (deutan) | #b3a58d on #211409 = 52.65 (protan) | today |  |
| R173 | `text-subtle` | `surface` | #975e2a on #fffbf1 = 72.46 (deutan) | #b3a58d on #342417 = 50.55 (protan) | today |  |
| R174 | `text-subtle` | `surface-raised` | #975e2a on #fffbf1 = 72.46 (deutan) | #b3a58d on #463425 = 47.02 (protan) | new |  |
| R175 | `text-subtle` | `field-fill` | #975e2a on #fffbf1 = 72.46 (deutan) | #b3a58d on #140903 = 53.33 (protan) | new |  |
| R176 | `text-subtle` | `bg-subtle` | #975e2a on #f7ecd1 = 64.17 (deutan) | #b3a58d on #140903 = 53.33 (protan) | new |  |
| R177 | `text-subtle` | `surface-sunken` | #975e2a on #f7ecd1 = 64.17 (deutan) | #b3a58d on #140903 = 53.33 (protan) | new |  |

**Tier `mark-area`** — sep; 9 rules; floor light 12.4, dark 45.7

| # | `fg` | `bg` | Light | Dark | Pair | For |
|---|---|---|---|---|---|---|
| R178 | `primary-solid` | `bg-subtle` | #b096d7 on #f7ecd1 = 23.04 (tritan) | #b096d7 on #140903 = 56.33 (tritan) | new | progress bar on its track |
| R179 | `primary-solid` | `switch-off` | #b096d7 on #f7ecd1 = 23.04 (tritan) | #b096d7 on #140903 = 56.33 (tritan) | new | switch on against off |
| R180 | `primary-solid` | `slider-track` | #b096d7 on #f7ecd1 = 23.04 (tritan) | #b096d7 on #140903 = 56.33 (tritan) | new | slider thumb on its track |
| R181 | `control-checked` | `field-fill` | #dac5fc on #fffbf1 = 13.10 (tritan) | #dac5fc on #140903 = 70.27 (tritan) | new | checked against unchecked |
| R182 | `success-mark` | `bg-subtle` | #00b5b8 on #f7ecd1 = 20.25 (protan) | #00b5b8 on #140903 = 54.34 (deutan) | new | toned progress bar |
| R183 | `warning-mark` | `bg-subtle` | #bb9c12 on #f7ecd1 = 24.67 (tritan) | #bb9c12 on #140903 = 55.02 (protan) | new | toned progress bar |
| R184 | `danger-mark` | `bg-subtle` | #d77784 on #f7ecd1 = 26.12 (deutan) | #d77784 on #140903 = 48.20 (protan) | new | toned progress bar |
| R185 | `secondary-mark` | `bg-subtle` | #d29397 on #f7ecd1 = 21.75 (deutan) | #d29397 on #140903 = 54.93 (protan) | new | toned progress bar |
| R186 | `accent-mark` | `bg-subtle` | #ccb563 on #f7ecd1 = 17.03 (tritan) | #ccb563 on #140903 = 62.30 (protan) | new | toned progress bar |

**Tier `mark-line`** — sep; 21 rules (R280 to R283 added in revision 2); floor light 19.5, dark 22

| # | `fg` | `bg` | Light | Dark | Pair | For |
|---|---|---|---|---|---|---|
| R187 | `border-strong` | `surface` | #b096d7 on #fffbf1 = 27.03 (tritan) | #b096d7 on #342417 = 44.13 (tritan) | today | control ring |
| R188 | `border-strong` | `bg` | #b096d7 on #fef4dc = 24.95 (tritan) | #b096d7 on #211409 = 51.17 (tritan) | today | control ring |
| R189 | `border-strong` | `surface-raised` | #b096d7 on #fffbf1 = 27.03 (tritan) | #b096d7 on #463425 = 37.65 (tritan) | new | control ring |
| R190 | `border-strong` | `field-fill` | #b096d7 on #fffbf1 = 27.03 (tritan) | #b096d7 on #140903 = 56.33 (tritan) | new | control ring |
| R191 | `switch-ring` | `switch-off` | #b096d7 on #f7ecd1 = 23.04 (tritan) | #b096d7 on #140903 = 56.33 (tritan) | new | switch ring on its off track |
| R192 | `primary-solid` | `surface` | #b096d7 on #fffbf1 = 27.03 (tritan) | #b096d7 on #342417 = 44.13 (tritan) | today | tab indicator |
| R193 | `primary-solid` | `bg` | #b096d7 on #fef4dc = 24.95 (tritan) | #b096d7 on #211409 = 51.17 (tritan) | today | tab indicator |
| R194 | `primary-solid` | `selected-wash` | #b096d7 on #ede0f7 = 20.63 (tritan) | #b096d7 on #554445 = 31.29 (tritan) | new | tab indicator on the selected tab's wash |
| R195 | `selected-bar` | `selected-wash` | #b096d7 on #ede0f7 = 20.63 (tritan) | #b096d7 on #554445 = 31.29 (tritan) | new | selected row's bar on its wash |
| R196 | `success-mark` | `surface` | #00b5b8 on #fffbf1 = 24.45 (protan) | #00b5b8 on #342417 = 42.30 (deutan) | new | status mark on a card |
| R197 | `success-mark` | `success-subtle` | #00b5b8 on #d3f4f0 = 21.24 (protan) | #00b5b8 on #4b4c42 = 28.79 (deutan) | new | status mark on its own wash |
| R198 | `warning-mark` | `surface` | #bb9c12 on #fffbf1 = 29.05 (tritan) | #bb9c12 on #342417 = 42.93 (tritan) | new | status mark on a card |
| R199 | `warning-mark` | `warning-subtle` | #bb9c12 on #faefca = 25.11 (tritan) | #bb9c12 on #5b4a33 = 28.51 (tritan) | new | status mark on its own wash |
| R200 | `danger-mark` | `surface` | #d77784 on #fffbf1 = 30.38 (deutan) | #d77784 on #342417 = 36.22 (protan) | new | status mark on a card |
| R201 | `danger-mark` | `danger-subtle` | #d77784 on #fcdfdc = 24.31 (deutan) | #d77784 on #5b443a = 23.23 (protan) | new | status mark on its own wash |
| R202 | `info-mark` | `surface` | #b096d7 on #fffbf1 = 27.03 (tritan) | #b096d7 on #342417 = 44.13 (tritan) | new | status mark on a card |
| R203 | `info-mark` | `info-subtle` | #b096d7 on #ede0f7 = 20.63 (tritan) | #b096d7 on #554445 = 31.29 (tritan) | new | status mark on its own wash |
| R280 | `success-mark` | `surface-raised` | #00b5b8 on #fffbf1 = 24.45 (protan) | #00b5b8 on #463425 = 35.94 (deutan) | new | status mark on a raised surface: the toast's stripe |
| R281 | `warning-mark` | `surface-raised` | #bb9c12 on #fffbf1 = 29.05 (tritan) | #bb9c12 on #463425 = 36.41 (tritan) | new | status mark on a raised surface: the toast's stripe |
| R282 | `danger-mark` | `surface-raised` | #d77784 on #fffbf1 = 30.38 (deutan) | #d77784 on #463425 = 29.81 (protan) | new | status mark on a raised surface: the toast's stripe |
| R283 | `info-mark` | `surface-raised` | #b096d7 on #fffbf1 = 27.03 (tritan) | #b096d7 on #463425 = 37.65 (tritan) | new | status mark on a raised surface: the toast's stripe |

**Tier `focus-visible`** — sep; 20 rules; floor light 24.8, dark 17

| # | `fg` | `bg` | Light | Dark | Pair | For |
|---|---|---|---|---|---|---|
| R204 | `focus-ring` | `bg` | #8e6ac7 on #fef4dc = 37.13 (tritan) | #8e6ac7 on #211409 = 39.15 (tritan) | today |  |
| R205 | `focus-ring` | `bg-subtle` | #8e6ac7 on #f7ecd1 = 35.21 (tritan) | #8e6ac7 on #140903 = 44.29 (tritan) | new |  |
| R206 | `focus-ring` | `surface` | #8e6ac7 on #fffbf1 = 39.21 (tritan) | #8e6ac7 on #342417 = 32.16 (tritan) | today |  |
| R207 | `focus-ring` | `surface-raised` | #8e6ac7 on #fffbf1 = 39.21 (tritan) | #8e6ac7 on #463425 = 25.74 (tritan) | new |  |
| R208 | `focus-ring` | `surface-sunken` | #8e6ac7 on #f7ecd1 = 35.21 (tritan) | #8e6ac7 on #140903 = 44.29 (tritan) | new |  |
| R209 | `focus-ring` | `field-fill` | #8e6ac7 on #fffbf1 = 39.21 (tritan) | #8e6ac7 on #140903 = 44.29 (tritan) | new |  |
| R210 | `focus-ring` | `primary` | #8e6ac7 on #dac5fc = 26.13 (tritan) | #8e6ac7 on #dac5fc = 26.13 (tritan) | new | touching: the selected calendar day and the current page (offset 0, L68) |
| R211 | `focus-ring` | `secondary` | #8e6ac7 on #f9c3c6 = 27.58 (tritan) | #8e6ac7 on #f9c3c6 = 27.58 (tritan) | new |  |
| R212 | `focus-ring` | `accent` | #8e6ac7 on #f5e3a2 = 32.42 (tritan) | #8e6ac7 on #f5e3a2 = 32.42 (tritan) | new |  |
| R213 | `focus-ring` | `success` | #8e6ac7 on #a6edee = 32.01 (deutan) | #8e6ac7 on #a6edee = 32.01 (deutan) | new |  |
| R214 | `focus-ring` | `warning` | #8e6ac7 on #f5e3a2 = 32.42 (tritan) | #8e6ac7 on #f5e3a2 = 32.42 (tritan) | new |  |
| R215 | `focus-ring` | `danger` | #8e6ac7 on #f9c3c6 = 27.58 (tritan) | #8e6ac7 on #f9c3c6 = 27.58 (tritan) | new |  |
| R216 | `focus-ring` | `info` | #8e6ac7 on #dac5fc = 26.13 (tritan) | #8e6ac7 on #dac5fc = 26.13 (tritan) | new | the same hexes as R210; no site paints the ring touching `info` |
| R217 | `focus-ring` | `primary-subtle` | #8e6ac7 on #ede0f7 = 32.81 (tritan) | #8e6ac7 on #554445 = 19.38 (tritan) | new |  |
| R218 | `focus-ring` | `secondary-subtle` | #8e6ac7 on #fcdfdc = 33.07 (tritan) | #8e6ac7 on #5b443a = 19.20 (tritan) | new |  |
| R219 | `focus-ring` | `accent-subtle` | #8e6ac7 on #faefca = 35.67 (tritan) | #8e6ac7 on #5b4a33 = 17.96 (tritan) | new |  |
| R220 | `focus-ring` | `success-subtle` | #8e6ac7 on #d3f4f0 = 35.09 (tritan) | #8e6ac7 on #4b4c42 = 18.64 (tritan) | new |  |
| R221 | `focus-ring` | `warning-subtle` | #8e6ac7 on #faefca = 35.67 (tritan) | #8e6ac7 on #5b4a33 = 17.96 (tritan) | new |  |
| R222 | `focus-ring` | `danger-subtle` | #8e6ac7 on #fcdfdc = 33.07 (tritan) | #8e6ac7 on #5b443a = 19.20 (tritan) | new |  |
| R223 | `focus-ring` | `info-subtle` | #8e6ac7 on #ede0f7 = 32.81 (tritan) | #8e6ac7 on #554445 = 19.38 (tritan) | new |  |

**Tier `tell-apart`** — sep; 4 rules; floor light 11.5, dark 11.5

| # | `fg` | `bg` | Light | Dark | Pair | For |
|---|---|---|---|---|---|---|
| R224 | `danger-mark` | `edge:field` | #d77784 on #e1d5bf = 19.30 (deutan) | #d77784 on #64594d = 16.25 (protan) | new | invalid rim against the resting field edge |
| R225 | `danger-mark` | `focus-ring` | #d77784 on #8e6ac7 = 14.13 (protan) | #d77784 on #8e6ac7 = 14.13 (protan) | new | invalid rim against the focus ring |
| R226 | `focus-ring` | `border-strong` | #8e6ac7 on #b096d7 = 12.18 (tritan) | #8e6ac7 on #b096d7 = 12.18 (tritan) | new | focus ring against the control ring |
| R227 | `focus-ring` | `edge:field` | #8e6ac7 on #e1d5bf = 28.45 (tritan) | #8e6ac7 on #64594d = 12.89 (tritan) | new | focus ring against the resting field edge |

**Tier `palette`** — sep; 6 rules; floor light 4.8, dark 4.8

| # | `fg` | `bg` | Light | Dark | Pair | For |
|---|---|---|---|---|---|---|
| R228 | `primary` | `secondary` | #dac5fc on #f9c3c6 = 6.69 (tritan) | #dac5fc on #f9c3c6 = 6.69 (tritan) | new |  |
| R229 | `primary` | `accent` | #dac5fc on #f5e3a2 = 7.25 (tritan) | #dac5fc on #f5e3a2 = 7.25 (tritan) | new |  |
| R230 | `primary` | `success` | #dac5fc on #a6edee = 5.64 (deutan) | #dac5fc on #a6edee = 5.64 (deutan) | new |  |
| R231 | `secondary` | `accent` | #f9c3c6 on #f5e3a2 = 6.43 (tritan) | #f9c3c6 on #f5e3a2 = 6.43 (tritan) | new |  |
| R232 | `secondary` | `success` | #f9c3c6 on #a6edee = 5.38 (deutan) | #f9c3c6 on #a6edee = 5.38 (deutan) | new |  |
| R233 | `accent` | `success` | #f5e3a2 on #a6edee = 9.98 (protan) | #f5e3a2 on #a6edee = 9.98 (protan) | new |  |

**Tier `divider`** — sep; 2 rules; floor light 11.3, dark 10.5

| # | `fg` | `bg` | Light | Dark | Pair | For |
|---|---|---|---|---|---|---|
| R234 | `border` | `surface` | #e3d2b0 on #fffbf1 = 11.97 (tritan) | #504133 on #342417 = 11.08 (deutan) | new |  |
| R235 | `border-subtle` | `surface` | #e3d2b0 on #fffbf1 = 11.97 (tritan) | #504133 on #342417 = 11.08 (deutan) | new |  |

**Tier `chart-mark`** — sep; 16 rules; floor light 28.4, dark 41.9

| # | `fg` | `bg` | Light | Dark | Pair | For |
|---|---|---|---|---|---|---|
| R236 | `chart-1` | `surface` | #008289 on #fffbf1 = 40.21 (protan) | #4cc7d1 on #342417 = 48.74 (deutan) | today |  |
| R237 | `chart-1` | `bg` | #008289 on #fef4dc = 38.14 (protan) | #4cc7d1 on #211409 = 55.69 (deutan) | today |  |
| R238 | `chart-2` | `surface` | #9e6400 on #fffbf1 = 43.87 (deutan) | #efa024 on #342417 = 47.12 (protan) | today |  |
| R239 | `chart-2` | `bg` | #9e6400 on #fef4dc = 41.67 (deutan) | #efa024 on #211409 = 53.90 (protan) | today |  |
| R240 | `chart-3` | `surface` | #ec5198 on #fffbf1 = 31.66 (deutan) | #ff85b6 on #342417 = 44.28 (protan) | today |  |
| R241 | `chart-3` | `bg` | #ec5198 on #fef4dc = 29.98 (deutan) | #ff85b6 on #211409 = 51.11 (protan) | today |  |
| R242 | `chart-4` | `surface` | #8a6f00 on #fffbf1 = 43.54 (tritan) | #d4b000 on #342417 = 49.65 (tritan) | today |  |
| R243 | `chart-4` | `bg` | #8a6f00 on #fef4dc = 41.31 (tritan) | #d4b000 on #211409 = 56.50 (protan) | today |  |
| R244 | `chart-5` | `surface` | #0f70d5 on #fffbf1 = 42.47 (tritan) | #7db6ff on #342417 = 49.93 (deutan) | today |  |
| R245 | `chart-5` | `bg` | #0f70d5 on #fef4dc = 40.72 (tritan) | #7db6ff on #211409 = 56.63 (deutan) | today |  |
| R246 | `chart-6` | `surface` | #e8672e on #fffbf1 = 33.03 (deutan) | #ff9164 on #342417 = 44.20 (protan) | today |  |
| R247 | `chart-6` | `bg` | #e8672e on #fef4dc = 30.68 (deutan) | #ff9164 on #211409 = 51.11 (protan) | today |  |
| R248 | `chart-7` | `surface` | #5761db on #fffbf1 = 45.27 (tritan) | #9dacff on #342417 = 49.28 (tritan) | today |  |
| R249 | `chart-7` | `bg` | #5761db on #fef4dc = 43.48 (tritan) | #9dacff on #211409 = 56.14 (tritan) | today |  |
| R250 | `chart-8` | `surface` | #598100 on #fffbf1 = 43.16 (protan) | #92c73c on #342417 = 49.75 (tritan) | today |  |
| R251 | `chart-8` | `bg` | #598100 on #fef4dc = 40.48 (protan) | #92c73c on #211409 = 56.68 (tritan) | today |  |

**Tier `edge-container`** — presence; 2 rules; floor light 15.8, dark 15.2

| # | `fg` | `bg` | Light | Dark | Pair | For |
|---|---|---|---|---|---|---|
| R252 | `edge:container` | `bg` | 16.70 (tritan) | 16.06 (deutan) | new | card on the page |
| R253 | `edge:container` | `surface-sunken` | 18.23 (tritan) | 17.62 (deutan) | new | card in a well |

**Tier `edge-floating`** — presence; 2 rules; floor light 16.8, dark 20.4

| # | `fg` | `bg` | Light | Dark | Pair | For |
|---|---|---|---|---|---|---|
| R254 | `edge:floating` | `surface` | 17.77 (deutan) | 21.58 (deutan) | new |  |
| R255 | `edge:floating` | `bg` | 19.06 (tritan) | 24.42 (deutan) | new |  |

**Tier `edge-field`** — presence; 3 rules; floor light 10.4, dark 30.1

| # | `fg` | `bg` | Light | Dark | Pair | For |
|---|---|---|---|---|---|---|
| R256 | `edge:field` | `surface` | 11.03 (tritan) | 31.71 (deutan) | new |  |
| R257 | `edge:field` | `bg` | 11.03 (tritan) | 31.71 (deutan) | new |  |
| R258 | `edge:field` | `surface-raised` | 11.03 (tritan) | 31.71 (deutan) | new |  |

**Tier `edge-sunken`** — presence; 1 rules; floor light 8.1, dark 13.3

| # | `fg` | `bg` | Light | Dark | Pair | For |
|---|---|---|---|---|---|---|
| R259 | `edge:sunken` | `surface` | 8.69 (tritan) | 15.92 (deutan) | new |  |

**Tier `edge-quiet`** — presence; 2 rules; floor light 16, dark 16.3

| # | `fg` | `bg` | Light | Dark | Pair | For |
|---|---|---|---|---|---|---|
| R260 | `edge:quiet` | `surface` | 16.90 (deutan) | 17.18 (deutan) | new |  |
| R261 | `edge:quiet` | `bg` | 18.18 (tritan) | 19.42 (deutan) | new |  |

**Tier `edge-filled`** — presence; 8 rules (six withdrawn in revision 2); floor light 17.7 (DECISIONS row 29), dark 54.7

| # | `fg` | `bg` | Light | Dark | Pair | For |
|---|---|---|---|---|---|---|
| R262 | `edge:filled-primary` | `surface` | 20.32 (tritan) | 58.06 (tritan) | new |  |
| R263 | `edge:filled-primary` | `bg` | 18.99 (tritan) | 65.10 (tritan) | new |  |
| R264 | `edge:filled-secondary` | `surface` | 20.19 (deutan) | 57.60 (protan) | new |  |
| R265 | `edge:filled-secondary` | `bg` | 18.73 (deutan) | 64.52 (protan) | new |  |
| R266 | `edge:filled-accent` | `surface` | 20.52 (tritan) | 63.88 (tritan) | new |  |
| R267 | `edge:filled-accent` | `bg` | 18.98 (tritan) | 70.95 (tritan) | new |  |
| R268 | `edge:filled-success` | `surface` | *withdrawn in revision 2* (M4) | | | |
| R269 | `edge:filled-success` | `bg` | *withdrawn in revision 2* (M4) | | | |
| R270 | `edge:filled-warning` | `surface` | *withdrawn in revision 2* (M4) | | | |
| R271 | `edge:filled-warning` | `bg` | *withdrawn in revision 2* (M4) | | | |
| R272 | `edge:filled-danger` | `surface` | 20.19 (deutan) | 57.60 (protan) | new |  |
| R273 | `edge:filled-danger` | `bg` | 18.73 (deutan) | 64.52 (protan) | new |  |
| R274 | `edge:filled-info` | `surface` | *withdrawn in revision 2* (M4) | | | |
| R275 | `edge:filled-info` | `bg` | *withdrawn in revision 2* (M4) | | | |

**Tier `edge-status`** — presence; 4 rules; floor light 14.6, dark 20.3

| # | `fg` | `bg` | Light | Dark | Pair | For |
|---|---|---|---|---|---|---|
| R276 | `edge:status-success` | `surface` | 15.46 (protan) | 22.62 (deutan) | new |  |
| R277 | `edge:status-warning` | `surface` | 17.74 (tritan) | 23.97 (tritan) | new |  |
| R278 | `edge:status-danger` | `surface` | 17.49 (deutan) | 21.45 (protan) | new |  |
| R279 | `edge:status-info` | `surface` | 17.48 (tritan) | 23.76 (tritan) | new |  |

## Appendix B. The 22 edge rules, broken down

**L104.** The 22 edge rules (28 in revision 1; the six withdrawn rows are
kept, marked, so their numbers stay findable). Each number is the worst view
of that one comparison; the last column is
presence by L49, which takes the largest of the three in each view
and then the smallest view, so it is not always the largest figure in the
row. Script: `gen.ts` (`out/edge-detail.md`).

| Rule | Mode | Fill on backdrop | Fill step | Edge pixel | Pixel from backdrop | Pixel from fill | Presence (view) |
|---|---|---|---|---|---|---|---|
| R252 `edge:container` on `bg` | light | `#fffbf1` on `#fef4dc` | 2.36 | `#dbc19b` | 14.40 | 16.70 | **16.70** (tritan) |
| R252 `edge:container` on `bg` | dark | `#342417` on `#211409` | 6.93 | `#493c2f` | 16.06 | 8.98 | **16.06** (deutan) |
| R253 `edge:container` on `surface-sunken` | light | `#fffbf1` on `#f7ecd1` | 4.47 | `#d6bc95` | 13.69 | 18.23 | **18.23** (tritan) |
| R253 `edge:container` on `surface-sunken` | dark | `#342417` on `#140903` | 12.04 | `#3e332a` | 17.62 | 5.42 | **17.62** (deutan) |
| R254 `edge:floating` on `surface` | light | `#fffbf1` on `#fffbf1` | 0.00 | `#d6bd9d` | 17.77 | 17.77 | **17.77** (deutan) |
| R254 `edge:floating` on `surface` | dark | `#463425` on `#342417` | 6.45 | `#6d5e4e` | 21.58 | 15.05 | **21.58** (deutan) |
| R255 `edge:floating` on `bg` | light | `#fffbf1` on `#fef4dc` | 2.36 | `#d5b991` | 16.76 | 19.06 | **19.06** (tritan) |
| R255 `edge:floating` on `bg` | dark | `#463425` on `#211409` | 13.38 | `#5f5344` | 24.42 | 10.81 | **24.42** (deutan) |
| R256 `edge:field` on `surface` | light | `#fffbf1` on `#fffbf1` | 0.00 | `#e1d5bf` | 11.03 | 11.03 | **11.03** (tritan) |
| R256 `edge:field` on `surface` | dark | `#140903` on `#342417` | 12.04 | `#64594d` | 19.44 | 31.71 | **31.71** (deutan) |
| R257 `edge:field` on `bg` | light | `#fffbf1` on `#fef4dc` | 2.36 | `#e1d5bf` | 8.80 | 11.03 | **11.03** (tritan) |
| R257 `edge:field` on `bg` | dark | `#140903` on `#211409` | 5.11 | `#64594d` | 26.52 | 31.71 | **31.71** (deutan) |
| R258 `edge:field` on `surface-raised` | light | `#fffbf1` on `#fffbf1` | 0.00 | `#e1d5bf` | 11.03 | 11.03 | **11.03** (tritan) |
| R258 `edge:field` on `surface-raised` | dark | `#140903` on `#463425` | 18.49 | `#64594d` | 12.93 | 31.71 | **31.71** (deutan) |
| R259 `edge:sunken` on `surface` | light | `#f7ecd1` on `#fffbf1` | 4.47 | `#edddbe` | 8.69 | 4.22 | **8.69** (tritan) |
| R259 `edge:sunken` on `surface` | dark | `#140903` on `#342417` | 12.04 | `#392f26` | 3.77 | 15.92 | **15.92** (deutan) |
| R260 `edge:quiet` on `surface` | light | `#fffbf1` on `#fffbf1` | 0.00 | `#d8c0a1` | 16.90 | 16.90 | **16.90** (deutan) |
| R260 `edge:quiet` on `surface` | dark | `#463425` on `#342417` | 6.45 | `#605242` | 17.18 | 10.65 | **17.18** (deutan) |
| R261 `edge:quiet` on `bg` | light | `#fffbf1` on `#fef4dc` | 2.36 | `#d7bc95` | 15.88 | 18.18 | **18.18** (tritan) |
| R261 `edge:quiet` on `bg` | dark | `#463425` on `#211409` | 13.38 | `#524537` | 19.42 | 5.82 | **19.42** (deutan) |
| R262 `edge:filled-primary` on `surface` | light | `#dac5fc` on `#fffbf1` | 13.10 | `#c7abe9` | 20.32 | 7.26 | **20.32** (tritan) |
| R262 `edge:filled-primary` on `surface` | dark | `#dac5fc` on `#342417` | 58.06 | `#6e5c67` | 21.94 | 36.12 | **58.06** (tritan) |
| R263 `edge:filled-primary` on `bg` | light | `#dac5fc` on `#fef4dc` | 11.07 | `#c7a8e3` | 18.99 | 7.99 | **18.99** (tritan) |
| R263 `edge:filled-primary` on `bg` | dark | `#dac5fc` on `#211409` | 65.10 | `#62525e` | 25.25 | 39.85 | **65.10** (tritan) |
| R264 `edge:filled-secondary` on `surface` | light | `#f9c3c6` on `#fffbf1` | 12.02 | `#ef9fa4` | 20.19 | 8.19 | **20.19** (deutan) |
| R264 `edge:filled-secondary` on `surface` | dark | `#f9c3c6` on `#342417` | 57.60 | `#795c54` | 22.11 | 35.49 | **57.60** (protan) |
| R265 `edge:filled-secondary` on `bg` | light | `#f9c3c6` on `#fef4dc` | 10.27 | `#ef9d9e` | 18.73 | 8.74 | **18.73** (deutan) |
| R265 `edge:filled-secondary` on `bg` | dark | `#f9c3c6` on `#211409` | 64.52 | `#6d514b` | 25.12 | 39.40 | **64.52** (protan) |
| R266 `edge:filled-accent` on `surface` | light | `#f5e3a2` on `#fffbf1` | 7.99 | `#cfb955` | 20.52 | 12.83 | **20.52** (tritan) |
| R266 `edge:filled-accent` on `surface` | dark | `#f5e3a2` on `#342417` | 63.88 | `#786748` | 24.67 | 39.21 | **63.88** (tritan) |
| R267 `edge:filled-accent` on `bg` | light | `#f5e3a2` on `#fef4dc` | 5.63 | `#cfb64f` | 18.98 | 13.57 | **18.98** (tritan) |
| R267 `edge:filled-accent` on `bg` | dark | `#f5e3a2` on `#211409` | 70.95 | `#6b5c3f` | 27.70 | 43.25 | **70.95** (tritan) |
| R268 `edge:filled-success` on `surface` | light | *withdrawn in revision 2* | | | | | |
| R268 `edge:filled-success` on `surface` | dark | *withdrawn in revision 2* | | | | | |
| R269 `edge:filled-success` on `bg` | light | *withdrawn in revision 2* | | | | | |
| R269 `edge:filled-success` on `bg` | dark | *withdrawn in revision 2* | | | | | |
| R270 `edge:filled-warning` on `surface` | light | *withdrawn in revision 2* | | | | | |
| R270 `edge:filled-warning` on `surface` | dark | *withdrawn in revision 2* | | | | | |
| R271 `edge:filled-warning` on `bg` | light | *withdrawn in revision 2* | | | | | |
| R271 `edge:filled-warning` on `bg` | dark | *withdrawn in revision 2* | | | | | |
| R272 `edge:filled-danger` on `surface` | light | `#f9c3c6` on `#fffbf1` | 12.02 | `#ef9fa4` | 20.19 | 8.19 | **20.19** (deutan) |
| R272 `edge:filled-danger` on `surface` | dark | `#f9c3c6` on `#342417` | 57.60 | `#795c54` | 22.11 | 35.49 | **57.60** (protan) |
| R273 `edge:filled-danger` on `bg` | light | `#f9c3c6` on `#fef4dc` | 10.27 | `#ef9d9e` | 18.73 | 8.74 | **18.73** (deutan) |
| R273 `edge:filled-danger` on `bg` | dark | `#f9c3c6` on `#211409` | 64.52 | `#6d514b` | 25.12 | 39.40 | **64.52** (protan) |
| R274 `edge:filled-info` on `surface` | light | *withdrawn in revision 2* | | | | | |
| R274 `edge:filled-info` on `surface` | dark | *withdrawn in revision 2* | | | | | |
| R275 `edge:filled-info` on `bg` | light | *withdrawn in revision 2* | | | | | |
| R275 `edge:filled-info` on `bg` | dark | *withdrawn in revision 2* | | | | | |
| R276 `edge:status-success` on `surface` | light | `#d3f4f0` on `#fffbf1` | 3.35 | `#66d1cf` | 15.46 | 12.25 | **15.46** (protan) |
| R276 `edge:status-success` on `surface` | dark | `#4b4c42` on `#342417` | 13.55 | `#5b6860` | 22.62 | 9.08 | **22.62** (deutan) |
| R277 `edge:status-warning` on `surface` | light | `#faefca` on `#fffbf1` | 4.06 | `#d6c26b` | 17.74 | 13.77 | **17.74** (tritan) |
| R277 `edge:status-warning` on `surface` | dark | `#5b4a33` on `#342417` | 14.49 | `#766546` | 23.97 | 9.49 | **23.97** (tritan) |
| R278 `edge:status-danger` on `surface` | light | `#fcdfdc` on `#fffbf1` | 6.08 | `#f1acaf` | 17.49 | 11.42 | **17.49** (deutan) |
| R278 `edge:status-danger` on `surface` | dark | `#5b443a` on `#342417` | 13.00 | `#775a53` | 21.45 | 8.45 | **21.45** (protan) |
| R279 `edge:status-info` on `surface` | light | `#ede0f7` on `#fffbf1` | 6.42 | `#cfb6ea` | 17.48 | 11.06 | **17.48** (tritan) |
| R279 `edge:status-info` on `surface` | dark | `#554445` on `#342417` | 12.85 | `#73616e` | 23.76 | 10.92 | **23.76** (tritan) |

## Appendix C. The scripts

All in
`/private/tmp/claude-501/-Users-homelab/06652a5c-23e2-4a00-8579-52c3b446d84b/scratchpad/spec2/`.
Run with Node 24 (`export PATH="/opt/homebrew/opt/node@24/bin:$PATH"`); each
imports `packages/design-system/src/tokens/color.ts` from the
`~/code/sorbet-pastel` worktree and re-implements no measurement.

| Script | What it produced |
|---|---|
| `kit.ts` | The helpers: four views, worst view, Lc under a simulation, the blend, the two floor rules |
| `values.ts` | §3 and §5.2 as data: the one copy every other script reads |
| `basics.ts` | The count of roles (69 named, 68 emitted); sorbet as shipped; the dark cocoa surfaces, shades, halo and deep tones, and washes recomputed from their rules |
| `evaluate.ts new` | Every rule against the new values; tier minima; the floors (`floors.json`); `evaluate.new.txt` |
| `evaluate.ts shipped` | The same rules against sorbet as shipped (§10); `evaluate.shipped.txt` |
| `gen.ts` | The tables of §3.1, §5.2 and appendices A and B (`out/`); the worked examples and the fixture's four views (`out/worked.txt`); the C2 and C8 figures |
| `roles_src.py` | The "from" column of §3.1 |
| `explore2.ts` | Candidates measured before choosing: status-mark tones, the hover fill, the see-through divider, links on washes, scrim text |
| `explore3.ts` | Presence for the placements and states the gate does not hold (§13, §15) |
| `spot.ts` | The Lc sign example; how far one 8-bit step moves a measurement (§6.2) |
| `exact.ts` | Each tier's weakest measurement to four decimals; the chart and scrim ratios |
| `measure.ts` | An earlier pass with the proposal's two-boundary edge formula, kept for comparison with §17, items 1 and 2 |
| `parts/`, `assemble.py` | Revision 1's sections and the script that numbered its statements (revision 2 was edited in place; it adds L105 to L114 and renumbers nothing) |
| `rev2/rev2.ts` | Revision 2's measurements: the rule list with the six withdrawn and R280 to R283 appended, `quiet-fill`, every tier's weakest pair and floor (only `edge-filled` light moves: 15.7 → 17.7), the quiet button with the page showing through (the option DECISIONS row 28 closed), the counts (191, 277, 261, 193, 68, 823, 946), sorbet's new records under `wcag-aa` (seven light failures, none dark), the scrim values to 1e-4, the scrim gradient (L110), the known-bad fixture's counts (L84) |
| `rev2/onestep.ts` | L59: the largest move one 8-bit step makes on any text or separation rule, both modes (0.593 Lc, 0.409 separation) |
| `rev2/scope.ts` | L80: what C1, C2 and C3 would say of the five shipped presets unscoped |
| `rev2/rev35.ts` | Revision 3.5: the halo room from edge data (8px light, 1px dark at the time; 9px and 3px since, L195 (b); L151) and the selected pill measured both ways (L157) |
| `rev2/inflate.ts` | Revision 3.3, L138: the card's presence with its all-round layer replaced by one that barely renders |
| `rev2/c11.mjs` | Revision 3.1: C11's reading run against the compiled `dist/css/sorbet.css` (postcss from the workspace's store); the layer-order check, the derived floating and field selector lists, and each selector's rule blocks and last background |
| `rev2/rev3.ts` | Revision 3's measurements: each sorbet mode's tightest margin (×1.02, L105 #11), the 14px small button's label pairs and the other small variants (L115), the danger button with and without its rose rim and the rim against its fill (L116), the neutral badge (L111) |
| `rev2/states.ts` | §13: the hover and pressed edges of the four filled buttons, against rest |
| `rev2/tamper.ts` | L105 #33: which preset can carry `tools/test-contrast.ts`'s hair-under tamper (forest light, the same page) |
| `../spec2-adversary/p9_minify.ts` | L109: the dark divider read from a minified theme (the adversary's probe, re-run and reproduced) |
| `sa25-author/m1.mts` (in `/private/tmp/claude-501/-Users-homelab/7dafc3c4-72a2-4f8b-b1c7-3c50b101249c/scratchpad/`, importing `color.ts` from the `~/code/sorbet-repair` worktree) | Revision 3.6, step 2.5: the icon's ink on each status wash and surface in both modes (L170), the two inks apart (8.69), the label ink on the fills, the `Icon` atom's pastels and marks on the card and the page in both modes (L179), every pair of the six progress-bar colours (§13), Token Studio's list against body text, the rim against its blush fill. The C10 reading of L182 is the step-2.5 adversary's `sa25/c10.mjs`, re-run on its compiled stylesheet of `9b83e50`. After the verifier, `sa25-author/m2.mts`: the fixed milk symbol on the dark cream silhouette (Lc 9.80, 5.79 apart) against the knocked-out dark danger wash (Lc 76.98) (S36); and the toast markup of L187, rendered from `9b83e50`'s `molecules/toast.tsx:93-108` with `react-dom/server` (`sa36-author/r.mjs`). The overflow of L186 is the verifier's `sa36/overflow2.mjs` |
