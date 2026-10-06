# Next: finishing PR 2 (handoff, updated 2026-10-06)

For a session picking this work up without the conversation that built it.
Branch `feat/pastel-legibility`, draft PR #130. Push to this branch only;
`main` is protected (PRs only) and never committed to. The PR does not merge
before step 2.6 (L160).

## Where it stands

Steps 2.1 to 2.5 are built, audited and repaired. Step 2.5's audit (two
lenses, `audit-6ef4b35-frozen.md` and `audit-6ef4b35-status.md`) and its
one repair pass are done: spec L194, DECISIONS rows 42 to 45, commits
`1e6ce6f` to `318070f`. Step 2.6's spec is settled (revision 3.7, §12.6, L195,
DECISIONS rows 46 and 47), after its spec adversary, the owner's answers and a
verifier. The spec is `legibility-spec.md` (revision 3.7, L1 to L195); every owner
decision, with what would retire it, is in `DECISIONS.md` (rows 1 to 47). Read the spec's §12 (the steps), §12.4 and §12.5 (the latest
revisions, L194 last), and the repo's `CLAUDE.md` before changing anything.

`9b83e50`, which §12.5 compares against, was never pushed; `ec97a20` stands for
it (the recorder re-writes its fixture byte for byte from `ec97a20`'s build).

## What is left, in order

1. **Step 2.6, sorbet dark** (§12, "2.6", rewritten in revision 3.7): tests first
   by a separate author from the spec alone, then the implementer, then its audit.
2. **Step 2.7, Token Studio**: the resolution tests first; the panel by eye.
3. **Step 2.8, docs and stale numbers.**
4. A full screenshot run on the branch head (`pnpm shots baseline --at
   e24df74`, then `pnpm shots compare`), quoted in the PR, and
   `pnpm check:status-layout` (L194 (a): the unmasked layout round the status
   slot, which the masked compare cannot see), then mark the PR ready. Known
   noise (L193): the right-to-left carousel page shots and some overlays
   differ between two shots of the same tree, so the "identical" line is not
   reachable until the tool settles them; report the run honestly.

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
