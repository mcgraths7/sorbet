## Audit lens: guards and frozen presets at ea7a2a8 (step 2.6), against a96bc02

Run 2026-10-06 in a cloud session. The lens was read-only and worked in its own `git archive` copies. Its plants
and runs (`audit26-guards/` in the session scratchpad) are not committed.

**Hypothesis:**
1. The four frozen presets render and behave as at a96bc02.
2. Every guard step 2.6 relies on fails when it should, and only then.

**Verdict: partly false.**
- **(1) holds.** These are byte-identical:
  - the library stylesheet;
  - the four frozen theme files and their goldens;
  - the component-library and behaviors dist;
  - the playground's frozen CSS assets.
- **(2) is false in three silent places.** Each was shown with a planted regression that keeps `pnpm test`, the
  build, lint, typecheck and `check:golden` green. Each plant is caught at a96bc02. Step 2.6 removed the coverage:
  before it, sorbet was the only preset with a mixed or derived configuration, and the tests leaned on that.
- **Every value-side guard bites.** A wrong dark hex, the reverted 0.14 recipe, a dropped optional token, a
  contract flip, a reordering, the reset path and the scrim tamper's guard are all caught.

### commands_run (main)
- **Builds:** `git archive ea7a2a8` and `git archive a96bc02`, each built in full.
- **Output comparison:** `diff -rq` of every dist, and of the playground's CSS asset hashes.
- **Gates:** all gates on head.
- **The commit's claims, checked:**
  - the test files' sha256;
  - head's test files on the parent tree give 21 failures;
  - `measure-edges --mode dark` reproduces the commit's table;
  - `check-status-layout` passes.
- **A leak probe in Chromium:** `data-theme=dark`, system dark, and system dark under `data-theme=light`. In both
  dark contexts all 116 names computed on `<html>` equal their block.
- **The scaffold:** `sorbet create`, then build. Its five themes equal the goldens.
- **Plants:** P01 to P15, R1 to R5, E2, E3, D1, S1, TF.

### Findings (silent first)

**F1. MAJOR, SILENT. Nothing tests the "preset-modes" count in the reports' and gates' last line any more.**
- `declaredContracts` (`src/tokens/rules.ts:729-736`) has no unit test.
- **Plant R4:** it counts each preset's light contract twice. Every shipped preset now declares the same contract
  in both modes, so the output is unchanged, and R4 is green at head. At a96bc02 it failed M6.8 and the 2.2 report
  and gate tests.
- No passing planted tree with a mixed declaration is left. The "2.1 #9 … as step 2.6 will make it" twin is now
  the shipped presets.
- **Fix:** keep a passing mixed tree "as step 2.2 left it", expecting `(823 pairings measured): wcag-aa × 9,
  legibility × 1`, and add a unit test of `declaredContracts` on a mixed set.

**F2. MINOR, SILENT. The known-bad fixture's "unchanged" (acceptance #7, L85) is no longer held for its dark half.**
- The retired "2.2 L101 L3" test was the only pin of `KNOWN_BAD.colors.dark`, entry for entry.
- **Plant P07b:** the dark `chart-muted` is changed. It is green at head.
- **Plant P08:** the light half is edited. It has been green since step 2.2.
- **Fix:** compare `KNOWN_BAD.colors[mode]` with the `:root` and `[data-theme="dark"]` blocks of e24df74's sorbet
  golden. 68 of 68 match in each mode today.

**F3. MINOR, SILENT. The CVD gate no longer guards any colour sorbet emits.**
- `chartThemes.sorbet` is read only by `tools/check-cvd.ts`.
- **Plant P15:** the dark lime slot is changed. The CVD report is unchanged, and every gate is green.
- **The gap:** L195 (f) says the two are equal, and nothing asserts it.
- **Fix:** a test that `chartColors(chartThemes.sorbet, mode)` equals `chart-1` to `chart-8` of
  `presets.sorbet.colors[mode]`, in both modes.

**F4. MINOR, SILENT. Stale guidance that no step owns.**
- `.claude/skills/author-theme/SKILL.md`:
  - `:52` "Dark mode is never split" (sorbet dark is split from 2.6);
  - `:61` "today only `wcag-aa`";
  - `:8` "A preset is a SemanticRecipe";
  - its charts step, which re-validates with check-cvd.
- `src/tokens/semantics.ts:4-7`: "every preset guarantee[s] WCAG AA in both modes".
- `.claude/skills/debug-contrast/SKILL.md:90-91`: "a change to the shared builder reaches every theme".

**F5. NIT.** `tools/shots.ts:70` and `tools/shots-provenance.ts:16` say "823" after step 2.1; it is 946 now.

**F6. NIT.** The kept "as step 2.6 will make it" tests now duplicate the shipped tests. Repointing them to the mixed
tree of F1 gives them a job again.

**Owned by later steps:**
- **Step 2.8:**
  - `README.md:5` and `:636`;
  - `apps/playground/src/App.tsx:120, 153`;
  - `demo/index.html:77`;
  - `packages/cli/src/index.ts:90`;
  - `packages/cli/src/templates.ts:108, 118`.
- **Step 2.7:** `token-studio.tsx:377, 381`. Sorbet dark under `wcag-aa` has 0 failures in 70, so nothing in dark
  shows false-red.

### Clean
- **The frozen presets:** only `sorbet.css`, `manifest.json` and `presets.{js,d.ts}` differ in any dist. The
  scaffold's themes equal the goldens.
- **Acceptance #1:**
  - P01 (a one-step hex change, golden regenerated) is caught by #1, #2 and #5.
  - P10 and P11 (the fixture edited) are caught by the transcriber's `--check`.
- **L59's pointer:** P02 reverts sunken to `@ 0.14`. The gate passes (14.06), and #1, #2 and #5 catch it.
- **The contract:** P06 (contract.dark back to wcag-aa) is caught by 16 tests.
- **Acceptance #3 to #5:** hold for the golden and `themeCss`.
  - The reset path (E2, E3) is caught by the L55 and L151 tests.
  - A dark-only reordering (D1) is caught by the golden gate.
- **L105 #47:** P12 is caught.
- **The commit's claims:**
  - the test diff is exactly L195 (c)'s;
  - the hashes match;
  - 21 tests are red on the parent;
  - the rendered table reproduces.
