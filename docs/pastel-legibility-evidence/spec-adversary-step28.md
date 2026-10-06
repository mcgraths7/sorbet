SPEC ADVERSARY: step 2.8 "Docs and stale numbers" (`/home/user/sorbet` at 1ec81a9; read-only, with runs in a `git archive` copy)

## Takeaways
- **The acceptance cannot fail.** `check:catalog` and `check:cli` pass at 1ec81a9 with no edit from step 2.8. The
  literal "WCAG AA verified" appears only in a CLI string (`packages/cli/src/index.ts:90`). These all pass it:
  - "AA verified" (the demo);
  - "WCAG AA — enforced at build time";
  - "Provably accessible";
  - "a palette that fails WCAG AA fails the build";
  - "today only `wcag-aa`";
  - "Dark mode is never split".
- **"As proposal §8" is out of date in both directions.** Its line numbers have drifted: README 607, 616-623 and 721
  are now 636, 645-652 and 750, and demo 366 is now 370. Some of it is already done. About 20 stale statements are
  missing.
- **Most counts are derived already.** The README's contract paragraph is held by `test-contrast.ts:818-847`, and the
  playground prints `CONTRAST_CHECKS` from `measurePreset`. 946 does not come from the rule list: it is the sum over
  the 5 presets × 2 modes of `measurePreset(p, m).length`, which is 8 × 70 + 2 × 193.
- **Two fences constrain the edits:**
  - the "2.4 #3" test fences `packages/component-library/src` and `behaviors`, so `token-studio.tsx:377` cannot be
    fixed (and the Studio is withdrawn, DECISIONS row 49);
  - CLAUDE.md's `pnpm test` line is held byte for byte by `test-status.ts:969`.
- **The §13 rows are spec edits** and belong in a spec revision. L197's N2 understates the focus ring: it is under
  WCAG's 3:1 on the fills in both modes too.

**Figures, from running the code:**

| Figure | Value |
|---|---|
| `RULES` | 277 |
| Rules applying per mode | 261 (245 in both modes, 16 light-only, 16 dark-only) |
| Pairs measured, per mode | `wcag-aa` 70 (191 rules left unheld); `legibility` 193 (68 unheld) |
| Pairs measured, in all | 946 |
| `declaredContracts` | `wcag-aa × 8, legibility × 2` |
| Roles and optional tokens | 69 roles, 20 optional tokens (seams) |
| Glyphs | 13 |

- **Sorbet light under `wcag-aa` fails 7 pairs:**
  - `border-strong` on bg 2.34, and on surface 2.48;
  - `primary-solid` on bg 2.34, and on surface 2.48;
  - `secondary-solid` on bg 2.30;
  - `accent-solid` on bg 1.85;
  - `chart-6` on bg 2.99.
- **Sorbet dark under `wcag-aa`** fails none of its 70.

## Work list (line numbers at 1ec81a9)

| File:line | Current text | Why false | Required replacement (and what derives any number) |
|---|---|---|---|
| README.md:5-6 | "a WCAG AA contrast contract that is *enforced at build time* — an inaccessible theme literally fails the build" | sorbet declares `legibility` | Each preset declares the contract it is held to (`wcag-aa`: ocean, forest, noir, midnight; `legibility`: sorbet), and a theme that fails its declared contract fails the build. From `presets[p].contract` |
| README.md:40, :79 | "/tokens (…, WCAG rules)"; "TS token engine (… WCAG rules)" | two contracts | "contrast rules and the two contracts (`wcag-aa`, `legibility`)"; the same in `packages/design-system/package.json`'s description |
| README.md:63-65 | "Semantic color pairings are chosen *by measured contrast* and re-verified on every build" | sorbet's values are typed | The built presets are chosen by measured contrast, sorbet's are picked by eye, and every preset is re-measured against its contract on every build |
| README.md:388 | "`border-strong` (≥3:1, safe for inputs)" | sorbet light 2.34:1 | "≥3:1 under `wcag-aa`"; under `legibility` a field's edge is its inset ring (`edge-field`) |
| README.md:398 | sorbet "robin's-egg blue, blossom pink, butter yellow" | the tagline changed | the words of `presets.sorbet.tagline`, and a Contract column from `presets[p].contract` |
| README.md:438-441 | Token Studio "reads the same measurement" | the Studio judges every preset by `wcag-aa` (row 49) | Add that caveat: in sorbet light it lists pairs `legibility` does not hold. No digit before rules, pairings, checks or entries (`test-contrast.ts:845`) |
| README.md:451, 453 | "visible :focus-visible rings everywhere"; "inputs keep ≥3:1 borders" | §17 #20; sorbet light 2.34 | :451 is qualified (DECISIONS row 51); :453 says "under `wcag-aa`" |
| README.md:636 | "run the WCAG AA report" | each preset's own contract | "run the contrast report (each preset against the contract it declares)" |
| README.md:647-649 | "Change brand colors — … swap which ramps … the contrast contract re-verifies" | sorbet is typed and pinned | Two paths: the built presets (swap ramps), and sorbet (edit the typed record and run `update:golden sorbet` in a PR that says so). The four frozen presets cannot be changed |
| README.md:651-652 | "Add a preset — one entry in presets.ts buys you …" | it also needs a contract, a golden, a `chartThemes` entry and a CVD floor | List the four |
| README.md (Theming) | — | L69 (A14's conventions) and §13 ("paragraphs never sit on a full-strength fill", stated "in the docs of step 2.8") | A short "Using sorbet" note: robin's egg is never a lone button on the bare page, butter is used small and on cards, and paragraphs never sit on a full fill (Lc 62.47 on lilac) |
| apps/playground/src/App.tsx:119-126, 150-153 | badge "WCAG AA — enforced at build time" (success tone); h1 "…Provably accessible."; card "…A theme that fails WCAG AA fails to compile." | false for sorbet; the success tone makes readers hear "Success:" | The owner's copy (DECISIONS row 50) |
| apps/playground/src/contrast-checks.ts:16 | `e.g. "700 checks …"` | stale | no digits |
| demo/index.html:77, 79, 82-83, 369-370 | "AA verified"; "Provably accessible."; "…stays accessible"; "How do themes stay accessible? … a failing palette fails the build" | as above | row 50's copy, with a non-status badge and no slot; "…against the contract each preset declares" |
| packages/cli/src/index.ts:90 | "every preset ships light + dark, WCAG AA verified" | sorbet is `legibility` | derived: each preset's contract, or `declaredContracts` |
| packages/cli/src/templates.ts:108, 117-118 | "WCAG rules"; "a palette that fails WCAG AA fails the build" | — | "contrast rules and contracts"; the scaffolded preset's own contract, interpolated from `presets[preset].contract` |
| .claude/skills/author-theme/SKILL.md:8-11, 13-21, 54-55, 59-61, 64-68 | "A preset is a SemanticRecipe … ~70 roles"; "Dark mode is never split"; "today only `wcag-aa`"; the charts step; "An inaccessible palette fails it" | L196 | Two kinds of preset, built and typed; cite `SEMANTIC_COLOR_NAMES` and `SEAMS`; the builder never splits dark, but sorbet's record does; `wcag-aa` or `legibility`; the chart record equals `chartThemes`; "a palette that fails its declared contract"; `update:golden sorbet` |
| .claude/skills/debug-contrast/SKILL.md:16-17, 23-28, 30-36, 40-53, 83-84, 90-93 | "Today every preset declares `wcag-aa`"; the old Failure fields; floors for `wcag-aa` only; "the failing value was chosen"; `Rule.mode`; "reaches every theme" | sorbet | both contracts; `tier`, `metric`, `view` and the structure failure; legibility's floors read from `contracts.ts`; a sorbet branch (a contradiction report to the owner); a change to the builder reaches the four built presets only |
| .claude/agents/contract-auditor.md:67-69 | "The correct fixes are adjusting the ramp …" | not for sorbet | a contradiction report to the owner for sorbet |
| .claude/skills/add-token/SKILL.md:22-23 | "semantic roles … are built contrast-first in semantics.ts" | not for sorbet | for the WCAG presets; sorbet's are typed in presets.ts |
| .claude/skills/ship-change/SKILL.md:39 | the `pnpm test` line, without test:status | stale | CLAUDE.md's held line, now held too |
| .claude/skills/sorbet-classes/SKILL.md:85-86, reference/atoms.md | "Never inline a new `<svg>`"; no `.sb-status` | L184 and L194 (m): ported statuses lead with the slot, whose glyph is inline | the status-slot rule and rows, added by hand (`refresh.py` drops `.sb-icon`'s modifiers) |
| CLAUDE.md:30-38 | the index | `seams.ts` and `edges.ts` missing; `semantics.ts` "every preset" | add them (the `pnpm test` line untouched). The "Never inline a new `<svg>`" rule gains the status-slot exemption |
| .claude/README.md:77 | "the 76-block exhaustive tables" | 79 blocks | "the exhaustive tables" |
| src/tokens/semantics.ts:4-7 | "…every preset guarantee WCAG AA in both modes" | L196 | each preset meets the contract it declares; this builder serves the four built presets; a legibility preset's values are picked, then checked |
| tools/shots.ts:69-70; tools/shots-provenance.ts:16 | "823" | stale | the tree's own count, with no digit |
| src/tokens/charts.ts:31, 40 (low) | "Retuned for the pastel brand (aqua/blossom/butter)" | sorbet leads with lilac; its charts are unchanged (A3) | optional note |
| .design-sync/NOTES.md:145-147 (low) | "exactly the 9 glyphs" | 13 | 13, with the four names |
| docs/pastel-legibility-contract.md:3-11 | "**Status:** proposed … PR 2 … is not started" | — | one dated status line |

## Do not touch (history, or held by a test)
- **`docs/pastel-legibility-evidence/**`:** every file is a record, except the living spec (through a revision), NEXT.md
  and DECISIONS.md.
- **The bodies of `docs/pastel-legibility-contract.md` and `docs/pastel-primary-role-split.md`:** dated proposals.
- **Fixtures:** `**/fixtures/**`.
- **Goldens:** `tools/golden/*.css`.
- **The history in test and tool comments:**
  - `test-contrast.ts`: "47 contrast pairings", "790 checks";
  - `test-contracts.ts`: the "823 … × 9, × 1" of the planted step-2.2 tree;
  - `check-cli.ts:47`, `rules.ts` and `contracts.ts` history notes, `contrast-checks.ts:2`.
- **Fenced by "2.4 #3":** `packages/component-library/src/**` and `packages/design-system/src/behaviors/**`.
- **CLAUDE.md's `pnpm test` line;** the presets' taglines.

## §13 rows
1. **Disabled controls** (amend the row of L112).
   - **Why:** L152 holds every state to rest but disabled; a disabled control is meant to read weaker (render lens N3).
   - **Primary label:** Lc 45.18 light and 33.53 dark, against 71.32 at rest.
   - **The faded lilac fill on a card:** separation 7.17 light, against 13.10; 33.70 dark, against 58.06.
2. **Forced colours** (new). No boundary shows on:
   - the status box (`_alert.scss` has no border, all five presets);
   - the pills' selected segment (`_tabs.scss:76`, all five);
   - the sunken panel (sorbet only: its container line is transparent).
   - **What stands in:** the status icon and word, and `aria-selected`. No contract measures a forced palette. This
     predates step 2.6.
3. **The compact table** (amend the row on cut offset falloff). It has 8px of block padding (`_table.scss:53`). A
   hovered filled button in an edge row loses 1px of its light halo (L165 (d)) and the outer part of its dark glow.
   Tables pad nothing by the halo room.
4. **Dark presses** (amend "Hover and pressed edges"). A pressed filled button in dark draws no rim, and measures
   58.06 with its fill credited (L165 (a)), as at rest.
5. **The focus ring against WCAG's 3:1** (new). `#8e6ac7` measures:

   | Behind it | Light | Dark |
   |---|---|---|
   | page | 3.81 | 4.31 |
   | card | 4.03 | 3.57 |
   | raised surface | 4.03 | 2.83 |
   | washes | 3.30-3.63 | 2.04-2.19 |
   | fills | 2.66-3.25 | 2.66-3.25 |

   - **Why:** `legibility` holds the ring by separation; the lowest is light 26.13 (against 24.8) and dark 17.96
     (against 17.0).

## The proposed check
In `test-contrast.ts`, run by `pnpm test` and CI.

**What it scans:**
- README.md, CLAUDE.md and `.claude/**/*.md` (not the sorbet-classes reference);
- `demo/index.html` as text;
- `apps/playground/src/**`;
- `packages/cli/src/*.ts` and the scaffold;
- the packages' `package.json` descriptions;
- `src/tokens/*.ts`;
- the two shots tools.

**What it skips:** `docs/**`, fixtures, goldens, the test files, and `packages/component-library/src/**`.

**A — no stale claim.** None of these may match: "AA verified"; "WCAG AA … enforced / verified / guarantee";
"provably accessible"; "accessible by construction"; "fails WCAG AA fails"; "guarantee WCAG"; "every preset … WCAG";
"today / every preset … only / declares `wcag-aa`"; "dark mode is never split"; "reaches every theme";
"inaccessible theme / palette". Positively, the README's presets table names each preset's contract.

**B — every count in prose is the code's.** Each "N pairings / pairs / checks / rules / entries / measurements" must be
a figure computed from the code, or sit in an explicit history allowlist of file and exact phrase.

**Also:**
- `check-cli.ts`: `sorbet presets` names each preset's contract and never says "WCAG AA verified".
- `test-status.ts`: holds ship-change's `pnpm test` line.

**Shown red:** with "AA verified" planted in the demo, and "823 pairings" in the README.

## Findings against the step text

| Id | Severity | Finding |
|---|---|---|
| S1 | high | The acceptance is green today. It should be replaced by checks A and B and the CLI assertion, each shown red by a plant |
| S2 | high | The file list is stale; the work list above replaces it |
| S3 | medium | 946 is not "from the rule list"; no new prose count may stand unless check B holds it |
| S4 | medium | The §13 rows belong in a spec revision before the implementer starts |
| S5 | medium | N2's range misses the fills in both modes |
| S6 | medium | The forced-colours row needs a scope (given above) |
| S7 | medium | The "2.4 #3" fence blocks the Studio's comment; the README carries the caveat instead |
| S8 | medium | Content the step must add: A14's conventions and the full-fill paragraph rule |
| S9 | low | The hero, the demo and the CLI copy are owner-visible |
| S10 | low | Nothing owns the PR-ready state: the stale PR body, NEXT's final screenshot run, `check:status-layout` |
| S11 | low | ship-change's test line; CLAUDE.md's `<svg>` rule; the sorbet-classes reference |
| S12 | low | README:451's "rings everywhere" against §17 #20 |
