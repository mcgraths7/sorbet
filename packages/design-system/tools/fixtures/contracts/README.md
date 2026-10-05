# Fixtures for `tools/test-contracts.ts`

What the code answered BEFORE the contract mechanism existed. The test holds
the new code to these, so none of them may be regenerated from the new code:
that would compare it with itself.

| File | What it is | Made by |
| --- | --- | --- |
| `wcag-aa.triples.json` | Per mode, the ordered `[fg, bg, floor]` list `measureColors(mode, colors)` produced | commit `2d3b765`, run |
| `wcag-aa.measurements.json` | All 700 measurements of the five presets: preset, mode, fg, bg, floor, actual, holds | commit `2d3b765`, run |
| `rules.order.json` | `RULES` in order: `[fg, bg, mode or null]`, 86 entries | commit `2d3b765`, run |
| `check-cvd.report.txt` | stdout of `node tools/check-cvd.ts`, `NO_COLOR=1` | commit `2d3b765`, run |
| `check-contrast.report.txt` | stdout of `node tools/check-contrast.ts`, `NO_COLOR=1` | commit `2d3b765`, run |
| `simulate-cvd.json` | `simulateCvd` for 12 colours × 3 kinds | `simulate_cvd.py`, beside it |
| `separation-clamp.json` | `separation` with a view, for 8 pairs whose simulated channel exceeds 1 before the clamp | `simulate_cvd.py`, beside it |
| `record-fixtures.mts.txt` | The script that recorded the first five | the test author, 2026-10-04 |

## Re-recording the first five

The first five were recorded on 2026-10-04 by `record-fixtures.mts.txt`, which
imports that commit's `src/tokens/index.ts` and runs its two tools. It cannot
run on a later tree (it calls `measureColors` without a contract and reads
`min` off the measurements), which is why it is committed as a `.txt`: `pnpm
lint`, the type check and every scan the tests make of the repository's sources
read `.ts` files and pass it by. Do not rename it in place.

To re-record, give it a copy of the tree as it was at `2d3b765` and a
directory to write into. Nothing needs installing: the commit's token sources
have no dependencies.

```sh
# from the repository root
mkdir -p /tmp/sorbet-2d3b765 /tmp/sorbet-recorded
git archive 2d3b765 packages/design-system | tar -x -C /tmp/sorbet-2d3b765
cp packages/design-system/tools/fixtures/contracts/record-fixtures.mts.txt /tmp/record-fixtures.mts
node /tmp/record-fixtures.mts /tmp/sorbet-2d3b765/packages/design-system /tmp/sorbet-recorded
diff -r /tmp/sorbet-recorded packages/design-system/tools/fixtures/contracts | grep -v '^Only in'
```

The last line prints nothing when the five files on disk are what `2d3b765`
answers (checked this way on 2026-10-04). Copy a file across only when the
intent is to change what the presets are held to: a change to one of these
five in any other circumstance is exactly that, by accident.

## The two Python fixtures

`simulate-cvd.json` and `separation-clamp.json` are different: nothing computed
them before. They come from `simulate_cvd.py`, an implementation written in
Python from the specification's text alone (M7, M10.10), sharing no code with
`src/tokens/color.ts`. Before it writes anything it reproduces the
specification's own twelve `separation` check values to 1e-9, so its arithmetic
is checked against the specification and not against the code under test.
`python3 simulate_cvd.py` rewrites both files; `--check` compares both and
exits 1 if either differs. The test runs `--check` where python3 exists.

`separation-clamp.json` exists because none of the specification's twelve check
values has a channel above 1 after the simulation matrix, so a simulation that
lost its upper clamp reproduced all twelve. Each row carries the answer
(`separation`) and what an unclamped simulation would say (`unclamped`); the
script refuses a pair where the two are closer than 0.01.

## The legibility fixtures (PR 2, step 2.1)

`docs/pastel-legibility-evidence/legibility-spec.md` (revision 3.1) is the
specification; these hold `tools/test-contracts.ts`'s step-2.1 tests to it. None
was produced by the code under test.

| File | What it is | Made by |
| --- | --- | --- |
| `legibility-values.json` | §3: the 69 roles (L12) and 20 optional tokens (L15) per mode, in L14's order; L15's fallbacks; §5.2's edges per mode (L45); `buttonLabel` (L19) | transcribed from the spec by `transcribe-legibility-spec.mjs.txt` |
| `legibility-appendix-a.json` | L61's floors; appendix A's 191 rules with what each measures per mode; appendix B's breakdown of the 22 edge rules | the same |
| `sorbet-as-shipped.json` | §10's known-bad fixture (L81): sorbet's colours as `e24df74` ships them, and L81's container edge | recorded from `e24df74` by `record-legibility-fixtures.mts.txt` (the edge typed in from L81) |
| `wcag-aa.at-e24df74.json` | L1, L2: `contracts["wcag-aa"]` and the first 86 rules (fg, bg, tier, why, mode) as `e24df74` has them | recorded the same way |
| `goldens.at-e24df74.json` | L97, L98: sorbet's golden theme file as `e24df74` has it (the base of step 2.2's and 2.6's allowed diffs), and the sha256 of each frozen golden | recorded the same way |
| `step-2.4-untouched.json` | Step 2.4 acceptance #3: the sha256 of every file under `packages/component-library/src` and `packages/design-system/src/behaviors` at `e6fd3d5` (step 2.3), which step 2.4 may not change. Retired when step 2.5 edits the component library | hashed from the working tree after `git diff --quiet e6fd3d5` on both directories and no untracked file there |

**The two transcribed files follow the spec, not the code.** If the spec is
revised, re-run the transcriber (`node --input-type=module - <repo root> <
transcribe-legibility-spec.mjs.txt`); the test runs it with `--check` and fails
while the two disagree. The transcriber also checks the spec against itself
(L45's all-round marks against L47's rule, appendix A's headings against L61,
the rule numbers against L67), and holds `sorbet-as-shipped.json`'s edge to
L81's table. Every figure transcribed is then recomputed by the test's own
arithmetic, written from the spec's words.

**The three recorded files are e24df74's behaviour** and, like the five above, are
never re-recorded from a later tree: `sorbet-as-shipped.json` is not edited
after recording (L85). The recorder's header says how to run it on a checkout
of `e24df74`.

