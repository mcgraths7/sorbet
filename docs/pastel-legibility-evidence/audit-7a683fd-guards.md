## Hypothesis
At 7a683fd, every guard the increment added (the L153 compiled state-shadow check, the L154 may-only-shrink allowlist and its CI base check, the L155 comparer's success line, the L161 accessor check) fails when it should and only then, and nothing outside the increment's stated scope changed meaning.

## Verdict: **fail**
The hypothesis is false. Seven silent holes were each demonstrated with a planted input that passes `pnpm test`, stylelint and (where it applies) the base check.
- Three of them let a frozen preset change pixels, and every static guard stays green. I measured the computed `box-shadow` in Chromium for each.
- Also, `pnpm test` is red at the commit itself, although the commit body says it is green.

Scratch root (written `$S` below): `/private/tmp/claude-501/-Users-homelab/7dafc3c4-72a2-4f8b-b1c7-3c50b101249c/scratchpad/audit-guards-scratch/`
- Each plant is in `$S/mods/<name>.sh`, its tree is in `$S/runs/<name>/tree`, and its logs are in `$S/runs/<name>/{tc,lint}.log`.
- The harness is `$S/plant.sh`: it extracts a fresh `git archive 7a683fd`, runs `pnpm install --offline`, applies the plant, then runs `node tools/test-contracts.ts` and stylelint.

## commands_run (main ones)
- `git show --stat 7a683fd`; `git show 7a683fd -- <each file>`; read spec L140 to L164 and `audit234.txt`.
- `git -C $WT archive 7a683fd | tar -x -C $S/planted && pnpm install --offline --frozen-lockfile`
- Gates in that copy: `pnpm run build|lint|typecheck|check:cli|check:catalog|check:golden|test` and `pnpm run check:consumable --no-build`.
- `$S/plant.sh <A|C|D|E|E1|F|G1..G5|H|M1|R1..R12|T>`, which runs `node tools/test-contracts.ts` and `npx stylelint "src/styles/**/*.scss"` on each tree.
- Base-check scenarios in `$S/runs/Gbase`, a git-init'd copy:
  - `node tools/check-allowlist-base.ts main | origin/nope | (no arg) | badbase`
  - `node /tmp/.../tools/check-allowlist-base.ts main` (symlinked path)
  - the same call from a directory whose path contains a space
- Fixture provenance: `git archive e24df74|c0504b7 packages/design-system`, then `node record.mts …`, then `cmp`.
- `git clone $WT $S/clone && git checkout 7a683fd`, then `node tools/stylelint/state-box-shadow-allowlist.ts --check` and `--write`, then `git status`.
- `pnpm --filter playground build`, then three probes in the scratch copy (deleted afterwards):
  - `zz-probe-shots.ts`: fixture rects, matchMedia, discovery counts
  - `zz-probe-overlays.ts`
  - `zz-probe-computed.ts`: computed `box-shadow` in ocean and sorbet light
- `zz-shots-stub.ts`: shots.ts with the shooting replaced by copying pre-made shot folders, run as `compare --no-build` over scenarios S1 to S10.
- `zz-png.ts`: decodePng and pixelDiff on real Chromium screenshots.

## Findings (ranked by silence first, then impact)

### F1. MAJOR, silent: the L148 "old value" test can be satisfied while a frozen preset loses its shadow
- **Location:** `packages/design-system/tools/test-contracts.ts:4905-4924`
  - `const old = lastIn(oldStylesheet(), selector, [property]) ?? "none"`
  - `sheet.rules.filter((each) => !each.conditional)`
- **Expected (L148):** "its fallback is **the element's old value exactly**".
- **Actual:** the test compares against the old declaration written on the same selector text. A modifier, descendant or new selector reads as "none", whatever the element painted before. Rules inside `@media` are skipped.
- **Plant E1** (`_card.scss`, inside `&--interactive`): `@include where-defined(box-shadow, pl-e1, inset 0 0 0 1px seam-only(switch-ring), none);`
  - Every test and lint pass.
  - Computed `box-shadow` of `.sb-card.sb-card--interactive` in **ocean light: `none`**. A plain `.sb-card` there is `rgba(32,36,42,0.09) 0 1px 3px 0, rgba(32,36,42,0.05) 0 1px 2px 0`.
  - In sorbet light the plant replaces the caramel container edge with `rgb(176,150,215) 0 0 0 1px inset`.
- **Plant E (conditional):** `@media (min-width:1px){ .sb-slider { where-defined(…, 0 0 0 9px red) } }` is green.
- **Suggested fix:**
  - Hold each where-defined fallback against the element's computed old value: render staged elements per frozen preset at c0504b7 and now, and compare.
  - Include conditional rules.

### F2. MAJOR, silent: the L162(a) exemption is decided by selector text, so a state rule can clobber an edge
- **Location:** `test-contracts.ts:5043-5063` (`elementOf`, `carriesEdge`), used by `stateShadows` at line 5066.
- **Expected (L162(a)):** where-defined is exempt "only where the element carries no edge layer, so that it cannot clobber one".
- **Actual:** "the element" means the exact selector text once its states are stripped. Descendant-qualified or variant selectors of edge-carrying elements are therefore exempt.
- **Plants (all green in tests and lint):**
  - B12: `.pl-b12 .sb-card[aria-selected=true]`
  - B13: `.pl-b13 .sb-button[aria-pressed=true]`
  - E6: `.sb-button--soft[aria-pressed=true]`
- **Measured (B13 button):**
  - Ocean (frozen): **`none`**, where an ordinary button paints `rgba(0,0,0,0) 0 0 0 0, oklab(…/0.22) 0 1px 2px 0, oklab(…/0.12) 0 2px 6px 0`.
  - Sorbet: `rgb(176,150,215) 0 0 0 2px`, so the edge layer and the state layer are both gone.
- **Measured (B12 card):** ocean `none`.
- **Suggested fix:** exempt only the six selected-bar selectors L162(a) names (allowlist them), or decide "carries an edge" from a computed style in the browser.

### F3. MAJOR, silent: the "composed form" test checks only the start of the value
- **Location:** the same regex `/^var\(--state-layer\b[\s\S]*\),\s*var\(--edge-layer\b/` appears at:
  - `test-contracts.ts:5068`
  - `tools/stylelint/no-state-box-shadow.js:33` (COMPOSED)
  - `record-e24df74-styles.mts.txt:45`
- **Plants on `:hover`** (each passes the compiled check and stylelint):
  - B7: `var(--state-layer, 0 0 #0000), var(--edge-layer, 0 0 #0000), 0 0 0 6px red` (a third layer appended)
  - B8: `var(--state-layer, 0 0 0 6px red), var(--edge-layer, 0 0 #0000)` (a visible fallback)
  - B9: `var(--state-layer-x, 0 0 0 6px red), var(--edge-layer-x, 0 0 0 6px blue)`, which passes because `\b` matches before a `-`.
- **Expected (L153):** "only with the composed form (`var(--state-layer…), var(--edge-layer…)`)".
- **Suggested fix:** split the value with `splitTop` and require exactly two items:
  1. `var(--state-layer)` or `var(--state-layer, 0 0 #0000)`
  2. `var(--edge-layer[, …])`

  End each name with `\s*[,)]`.

### F4. MAJOR, silent: L161 misses the most common Sass pass-through, the negated accessor
- **Location:** `test-contracts.ts:5157`, regex `(?:^|[^\w-])([a-zA-Z_][\w-]*)\(`.
- **Plant H:**
  - `margin-inline-start: -space(2)` compiles to the literal `-space(2)`.
  - `margin-block-start: - space(1)` compiles to `-var(--sb-space-1)`.
  - Both are invalid declarations that paint nothing. The L161 test, lint and the build all pass.
- **Also missed (plant C), although all of these are present in the compiled CSS:**
  - `seem(…)` inside `@starting-style` (C5)
  - inside `@keyframes` (C6)
  - in an `@media` prelude, `spcae(4)` (C7)
  - in an `@supports` prelude (C8)
  - `-seem(…)` (C11)
- **Caught:** a declaration value (C1), an `@include` argument (C2), interpolation (C3), a map (C4), inside `calc()` (C9), nested in a gradient (C10).
- **Expected (L161):** "every function call in a declaration value is a CSS function … anything else is an accessor that did not compile".
- **Suggested fix:**
  - Accept a leading `-` only on `-webkit-`/`-moz-` names, and flag `-<name>(` and `-var(` otherwise.
  - Read declarations inside `@starting-style` and `@keyframes`, and scan at-rule preludes.

### F5. MAJOR, silent: the compiled checks cannot see inside `@starting-style`
- **Cause:** `readCss` (`test-contracts.ts:4552-4626`) marks every at-rule other than `@media`, `@supports`, `@container` and `@layer` as opaque. The library uses `@starting-style` 11 times, inside `:popover-open` and `[open]` states.
- **Plant B6:** `.pl-b6 { &:hover { @starting-style { #{$p}: 0 0 0 6px red; } } }` passes the compiled check and stylelint. Stylelint does catch the direct-property form (B6b).
- **Scope:** the same blindness covers the L150, L161 and C2 checks.
- **Suggested fix:** treat `@starting-style` (and `@scope`) as a non-opaque container in `readCss`.

### F6. MAJOR, silent, a spec defect: L153 names an attribute the library never uses and omits the ones it does
- **The list names `[data-state]`:** 0 uses under `src/styles`.
- **It omits the library's own state attributes:**
  - `[data-invalid]`: 4 uses (combobox field, date range, field)
  - `[data-selected]`: chip
  - `[data-highlighted]`: 7 uses (option highlight)
  - `[data-disabled]`: 2 uses
  - `[data-loading]`
- **How it happened:** L163 generalised from `[data-today]` (a fact about a date) to every `[data-*]`. This commit narrowed the stylelint rule to match (`no-state-box-shadow.js:24`); before the commit it flagged every `[data-*]`.
- **Plants:** B11 `&[data-invalid] { box-shadow: 0 0 0 3px red }` and B11b `[data-highlighted]` pass both rules. `[open]` (B16) also passes; only `:open` is listed.
- **Suggested fix:** amend L153 so `[data-*]` is a state except for a named list of facts (`data-today`, `-outside`, `-in-range`, `-range-*`, `-align`, `-numeric`, `-trend`, `-status`, …). Add `[open]`.

### F7. MAJOR, silent: `tools/check-allowlist-base.ts` fails open and is untested
**Measured, each exiting 0:**
- An unknown ref (`origin/nope`) prints `✓ origin/nope has no …removed.json yet`.
- No argument in a repo with no remote prints the same.
- An unparsable base list prints the same.
- A run through a symlinked absolute path (`/tmp/...`) or a path containing a space prints **nothing**. The main guard `import.meta.url === \`file://${process.argv[1]}\`` does not match there.

**How this compares with its sibling:** `check-golden-base.ts`, which L154 says this check is "like", uses `import.meta.main` and states that an unknown ref "is a failure, never a skip".

**Untested:** plant R10 replaced `droppedFromBase`'s body with `return []` and replaced the CI step with a comment that names the file. `pnpm test` stays green. The L154(3) test only checks that the file exists and that `build.yml` matches `/check-allowlist-base\.ts/`.

**What works:** against a real base it fails correctly: `✗ 1 entry of main's … is missing here … atoms/_button.scss: .sb-button | &:hover:not(…)`.

**Suggested fix:**
- `git rev-parse --verify` the ref and fail when it is unknown; use `git ls-tree` to tell "absent at the ref" apart from an error; fail on a parse error.
- Use `import.meta.main`.
- Add a unit test of `droppedFromBase` and a CI "still bites" step.
- Match the workflow's `run:` line, not any text in the file.

### F8. MINOR/MAJOR, silent: the e24df74 fixtures are not pinned
- **Plant G5:**
  - append `.sb-chip:hover { box-shadow: 0 0 0 3px red; }` to `compiled.at-e24df74.css`
  - add that site to `state-box-shadow-sites.at-e24df74.json`
  - add the allowlist entry `.sb-chip | &:hover`, with a real site

  Test, lint and the base check are all green, so the allowlist grew.
- **Provenance today is clean:** re-recording both fixtures from `git archive e24df74` is byte-identical, and c0504b7 compiles identically.
- **Suggested fix:** pin a sha256 of both fixtures in the test, as `goldens.at-e24df74.json` already does for the goldens.

### F9. MINOR, silent: the four copies of the state definition are not shared or pinned
- **Comment vs code:** the stylelint comment at `no-state-box-shadow.js:16-21` says the definition is "the one definition, which the compiled check in test-contracts.ts shares". It is not shared. There are four literal copies: `test-contracts.ts` STATE (5025) and STATE_PART (5040), the recorder (line 43), and the rule (22-24).
- **Mutation M1:** I removed `indeterminate|enabled|invalid|open|popover-open|target` and the modifiers `--active|--current|--open|--checked|--expanded|--invalid|--disabled|--loading` from the test's STATE. The suite stays green. Only `[data-state`, `:disabled`, `--selected`, `--pressed`, `:checked`, `[aria-` and the hover and focus terms are pinned.
- **Plant B10:** `&:HOVER` passes both checks; CSS pseudo-classes are case-insensitive.
- **Suggested fix:** one exported definition imported by all of them, a checker case per listed term, and the `i` flag.

### F10. MINOR, silent: the L150 closure stops one `var()` short of what L150 says
- **Location:** `test-contracts.ts:4826-4860` (`composedClosure`, `resolvesToNone`).
- **Plant D1:** `--pl-flat: none; --edge-layer: var(--sb-edge-quiet, var(--pl-flat)); box-shadow: var(--state-layer, 0 0 #0000), var(--edge-layer)` is green.
  - In a frozen preset, `--sb-edge-quiet` is unset, so the list resolves to `none` and is invalid: M1's shape, one `var()` deeper.
- **Plant D2:** `--edge-layer: 0 0 1px red, none` is green.
- **Expected (L150):** "one with a fallback through its fallback when its property is unset, and one without a fallback through the declarations of its property".
- **Caught:** D3, a literal `none` fallback (by the older L146 test), and D4, a two-level whole-value chain.
- **Suggested fix:** follow every `var()` in a closure member's value, and split values into list items before testing for `none`.

### F11. MINOR, silent: the L156 test knows one spelling of a start bar
- **Location:** `test-contracts.ts:5136`, regex `/(^|,\s*)inset 3px 0 0 0\b/`.
- **Plant F:** these unmirrored start bars are all green:
  - `inset 3px 0px 0 0`
  - `inset 3px 0 0` (three lengths)
  - `inset 0.1875rem 0 0 0`
- **Suggested fix:** parse the layers and treat any inset layer with x > 0 and y = 0 as a start bar.

### F12. MINOR, silent: the static half of L148 holds only the C2 shape
- **Plant E2:** `.sb-card { box-shadow: edge(container, shadow(sm)), inset 0 0 0 1px seam(container-line) }` is green. Computed in ocean, the card gains `rgb(235,239,244) 0 0 0 1px inset`, a new rendered layer in a frozen preset.
- **Plant E3:** `.sb-switch { box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0) }` is the C2 mechanism without a seam. It is green.
- **Why minor:** per L148's "How it is held", the remainder belongs to L155's hand-run shots, so this is within the spec. The static test name implies more than it holds.

### F13. MINOR, silent: L155 shoots off-screen staged fixtures as the viewport, without saying so
- **Cause:** `Session.shoot` gets a `null` crop and shoots the viewport when the element is off-screen. Staged recipes never scroll.
- **Measured at 1280×900:**
  - `#fx-tx` sits at y=933-957, entirely below the fold, so its 5 shots are viewport shots.
  - In the coarse runs (ocean light; noir dark RTL), `#fx-b12` (the disabled outline button), `#fx-h2` and `#fx-lb` sit at y=886-932 and are cut at 900; `#fx-tx` is at 960-984.
  - In midnight light RTL (fine pointer), `#fx-b12` ends at 899, so its 24px margin is lost.
- **Suggested fix:** `scrollIntoView` before each staged shot, and turn a null crop with a selector into an `-error` recipe, which already fails the run.

### F14. MINOR, silent: the comparer does not check where the baseline came from
- **Stub S10:** a baseline whose manifest tree is the tree under test (`7a683fd+dirty`) produces "✓ The frozen presets are pixel-identical…" with exit 0.
- The success line does not name the baseline commit, so a quoted summary cannot show it.
- **Suggested fix:** refuse a baseline taken at HEAD or a dirty tree, and print the baseline commit in the success line.

### F15. MINOR, silent: the L149 test checks only the first read of a local in a value
- **Plant H:** `var(--pl-h2, none), var(--pl-h2)`. The L149 check passes; the plant was caught only incidentally by L146 and by L148.
- L148's regex also misparses that value: it reports the fallback as "none), var(--pl-h2", because it does not split the list.

### F16. MAJOR, loud: `pnpm test` is red at 7a683fd
- **Failure:** `✗ 2.1 #2 (fixture) the two transcribed fixtures are still what legibility-spec.md says` with `L15 has 20 rows … 21 !== 20`.
- **Cause:** 49d2cea, L164's spec (committed 11:09:49), adds the 21st optional token 6 s before 7a683fd (11:09:55).
- **Proof:** plant T restores 856606b's spec and the suite is green (285 checks, rc 0).
- **The commit body is false here:** it says "Gates, all green at this commit: … test". CI on this commit fails.
- **Suggested fix:** reorder the two commits, or correct the body.

### F17. MINOR, loud: the L161 fixed list rejects real CSS functions
- B5 `filter: drop-shadow(…)` is flagged.
- The regex also scans inside quoted strings.
- This is per the spec ("fixed list"); recorded so a future false alarm is understood.

### Notes (not defects of the code)
- The commit's L155 run is "PENDING". C2 and C3 therefore rest today on the static checks, whose limits are F1 and F12.
- `tools/measure-edges.ts` was rewritten (+127/−101, L159) but is not in the commit body's list. It has no test, and this lens did not audit it.
- **B4, a custom-property route:** `.x { box-shadow: var(--h, 0 0 #0000) } .x:hover { --h: 0 0 0 6px red }` passes both checks. It cannot be told apart from the sanctioned `--state-layer`/`--edge-layer` mechanism.
  - A state that writes a weaker `--edge-layer` is held only for the card (L152).
  - `outline` and `filter: drop-shadow` are outside L153's wording (B5).
- The allowlist is keyed by compiled selector only. Any value, from any file, at an allowlisted selector passes.

## What is CLEAN, and how I proved it
**L153 compiled check.** It catches, as L153 lists:
- `@include elevate(lg)` under `:hover`
- `-webkit-` and `-moz-` prefixes
- an interpolated property name and an interpolated selector
- `@at-root`
- `--selected`
- `:is`, `:where`, `:not` and `:has`

It also catches, beyond the list:
- `@supports` and `@container`
- a deep `:is(.x, :is(.y:where(:not(:focus-within))))`
- `popover-surface` under hover
- `flyout($prop: box-shadow)`

Proof: plant A, compiled-check output.

**L154.**
- Each of these turns the test red with a useful diff: a hand-added entry (G1), an edited removed entry (G3), a deleted removed entry (G4).
- Moving an entry back to the allowlist (G2) leaves the test green, as the spec intends, and the base check turns red.
- `--write` on a real clone reproduces the committed allowlist byte for byte. The corrected `--check` message is accurate.

**L155 verdict logic** (stub runs):
- `--only sorbet` prints "no frozen preset compared", rc 1.
- `--only ocean` and `--variant ltr` print "not every frozen preset compared", rc 1.
- An unstable shot, a differing shot, an empty baseline, a missing `baseline.json` and a crashed job each give rc 1.
- All shots identical gives the success line, rc 0.

**L155 supporting pieces:**
- `png.ts` decodes a real Chromium screenshot exactly: a solid pixel `[200,100,50,255]`, an exact round trip, and a one-level change detected in a 1×1 box.
- `hasTouch` gives `(pointer: coarse)` and `(hover: none)`.
- All 11 overlay recipes open their overlay.
- No discovery cap binds today: roving 102 of 150, hover 303 of 1000, disabled 54 of 80.

**Each fix reverted alone turns its test red:**

| Revert | Tests that go red |
|---|---|
| R1 `flat-elevation` back to `none` | L150 |
| R2 switch, R3 slider, R9 selected-mark | C2, L149, L148 (and L153 and L156 for R9) |
| R4 RTL mirror | L156 |
| R5 card hover | L152, L148 |
| R6 halo padding | L151 |
| R7 emitter | 6 tests |
| R8 wrong halo formula | golden and L151 |
| R11 old stylelint rule | lint fails |

**Gates** on a clean archive of 7a683fd:
- rc 0: build, lint, typecheck, check:cli, check:catalog, check:golden, check:consumable --no-build
- rc 1: test, caused only by F16

**Test diff:** no assertion was deleted or weakened. Each changed expectation follows L151 and L98: the halo line, 41→42 resets, 82→84 `initial` lines.

**L161 recorded extras:** the list's f9add57 extras (blur, inset, minmax, polygon, repeat, rgba, translateX, translateY) are exactly the declaration functions f9add57's compiled CSS uses beyond the spec's names.

**CLI scaffold:** it copies `src/styles` and `src/tokens` whole, and check:cli builds it for real.

## Final worktree state
```
$ git -C <worktree> status --porcelain
(empty)
$ git -C <worktree> log --oneline -3
7a683fd fix(design-system): repair steps 2.3 and 2.4 after their audit
49d2cea docs: legibility spec L164, the selected segment is cream (DECISIONS row 32)
856606b docs: legibility spec L163, the e24df74 shadow-site fixture is the compiled check's 22
```
I made no changes in `/Users/homelab/code/sorbet-pastel` or `/Users/homelab/code/sorbet-segment`. All plants, clones and probes are under `$S`. `tools/shots.ts` was only run as a browserless stub, with `SORBET_SHOTS_DIR` set under `$S/stub`.
