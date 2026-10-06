# Next: finishing PR 2 (handoff, updated 2026-10-06)

For a session picking this work up without the conversation that built it.
Branch `feat/pastel-legibility`, draft PR #130. Push to this branch only;
`main` is protected (PRs only) and never committed to. The PR does not merge
before step 2.6 (L160).

## Where it stands

Steps 2.1 to 2.6 and 2.8 are built; step 2.7 is withdrawn (DECISIONS row 49).
- Step 2.5's audit and repair: spec L194, DECISIONS rows 42 to 45.
- Step 2.6, sorbet dark: settled in revision 3.7 (§12.6, L195, rows 46 and 47), built at `ea7a2a8` with its tests
  written first, then audited by two lenses (`audit-ea7a2a8-guards.md`, `audit-ea7a2a8-render.md`) and repaired
  (L196, L197, row 48: the dark halo room is 20px).
- Step 2.8, docs and stale numbers: settled in revision 3.8 (L198, rows 50 and 51) from
  `spec-adversary-step28.md`'s work list. Its four checks were committed first (`94de2fb`), each shown red by a
  plant; the CLI (`ae2baf9`), the docs and copy (`714d468`, with `step28/hero-*.png`) and the agents' guidance
  (`d99fd53`) followed. All eight gates are green.

The spec is `legibility-spec.md` (revision 3.8, L1 to L198). Every owner decision, with what would retire it, is in
`DECISIONS.md` (rows 1 to 51). Read the spec's §12 (the steps), §12.4 to §12.6 (the latest revisions, L194 to L198
last), and the repo's `CLAUDE.md` before changing anything.

`9b83e50`, which §12.5 compares against, was never pushed; `ec97a20` stands for it (the recorder re-writes its
fixture byte for byte from `ec97a20`'s build).

## What is left, in order

1. ~~Step 2.7, Token Studio~~: withdrawn by the owner (DECISIONS row 49); the Studio is to be sunset.
2. ~~Step 2.8, docs and stale numbers~~: done (above).
3. ~~A full screenshot run and `check:status-layout`~~: done at `792852f` (`shots-792852f.md`). No frozen change
   found; 236 of 24,912 shots differ, by at most 8 levels, and every one is shown to be noise. The "identical"
   line is not reached (L193: the tool's noisy shots are still unsettled). `check:status-layout` passes.
4. **Mark the PR ready**, once the owner has read that result: the screenshot verdict is evidence, not the tool's
   success line, and taking it is the owner's call.
5. Left open, outside this PR: the screenshot tool settling focus rings, overlays and the carousel before it
   shoots (L193), so a clean run can print its success line.

## How the work is done here (the owner's process)

- **Spec first.** A step's spec text is attacked by a *spec adversary* (reads
  the spec AND the code, writes no tests) before tests exist; its findings are
  closed in the spec, and a second adversary checks the closures.
- **Tests first, by a different agent.** Where a wrong answer would be silent,
  a *test author* writes the tests from the spec and never sees the new code.
  The *implementer* may not change an expected value: a red test is fixed in
  the code, or answered by a contradiction report (the spec sentence on each
  side) that goes back to the spec. Snapshot the test files with sha256 and
  check them after the implementer.
- **Audit before the next step builds on it** (see item 1). A green suite is
  the entry condition, never the verdict.
- **Spec corrections and look changes go to the owner before they land.**
  Corrections as quoted current text → replacement. Anything that changes how
  sorbet looks is shown rendered, as options, before it is chosen: the owner
  changed their mind on the selected pill once they saw it (DECISIONS row 32).
  From the cloud, put review images in the PR (a comment) or the session.
- Commit footer: `Co-Authored-By: Claude <noreply@anthropic.com>`. Each step
  is one commit with its tests; spec revisions are separate `docs:` commits.
  Every commit must pass the gates on its own.

## Talking to the owner

The owner is colourblind (a partial red-green, deutan, type): give colours as
hex and separations as numbers, never a colour word alone. Lead with the
takeaway, bullets over prose, explain any term the first time it appears, and
put decisions as concrete options with a labelled recommendation. End a
message with a numbered list of everything needed from them, or nothing.

## Environment

- Node **24.17 or later** (`.nvmrc`, `engines`): the test files are run as
  `.ts` directly. Install it in the environment's setup script
  (e.g. `nvm install 24.17.0 && nvm alias default 24.17.0`), then
  `corepack enable && pnpm install --frozen-lockfile && pnpm build`.
- The screenshot, edge and status-layout tools need Playwright's headless
  Chromium: `pnpm browsers:install`. In a cloud container without network for
  it, point `PLAYWRIGHT_BROWSERS_PATH` at a directory holding the installed
  Chromium under the revision name Playwright asks for; both sides of every
  comparison then use that one browser.
- Gates: `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`,
  `pnpm check:cli`, `pnpm check:catalog`, `pnpm check:consumable --no-build`,
  `pnpm check:golden`.
- Not on GitHub: the local branch `parked/cream-segment` (a declined cream
  pill, DECISIONS row 32). Leave it out.
