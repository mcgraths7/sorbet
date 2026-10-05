# Next: finishing PR 2 (handoff, 2026-10-05)

For a session picking this work up without the conversation that built it.
Branch `feat/pastel-legibility`, draft PR #130. Push to this branch only;
`main` is protected (PRs only) and never committed to. The PR does not merge
before step 2.6 (L160).

## Where it stands

Steps 2.1 to 2.5 are built, each commit green on all eight gates. 2.3 and 2.4
were audited and repaired. **Step 2.5 has not been audited.** The spec is
`legibility-spec.md` (revision 3.6, L1 to L193); every owner decision, with
what would retire it, is in `DECISIONS.md` (rows 1 to 41). Read the spec's §12
(the steps), §12.4 and §12.5 (the latest revisions), and the repo's
`CLAUDE.md` before changing anything.

## What is left, in order

1. **Audit step 2.5** (commits `7078b76` and `6ef4b35`). Two independent,
   read-only lenses, each in its own worktree or copy, each trying to falsify
   one claim with inputs the spec never mentions, then ONE repair pass:
   - frozen presets: beyond the status slot (masked, L167), do ocean, forest,
     noir and midnight render and lay out exactly as at `9b83e50`? (markup
     fixture L187, the danger rim's cascade L175/L178, the scroll-padding
     fallback L193);
   - the status components: every component × tone has its glyph and hidden
     word, the toast provider path (L188), RTL, the 390px table overflow
     (L186), and acceptance #8's accessibility-tree review (L180).
   Every fix lands with a check proven to fail without it.
2. **Step 2.6, sorbet dark** (§12, "2.6"): tests first.
3. **Step 2.7, Token Studio**: the resolution tests first; the panel by eye.
4. **Step 2.8, docs and stale numbers.**
5. A full screenshot run on the branch head (`pnpm shots baseline --at
   e24df74`, then `pnpm shots compare`), quoted in the PR, then mark the PR
   ready. Known noise (L193): the right-to-left carousel page shots and some
   overlays differ between two shots of the same tree, so the "identical"
   line is not reachable until the tool settles them; report the run honestly.

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
- The screenshot and edge tools need Playwright's headless Chromium:
  `pnpm browsers:install`.
- Gates: `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`,
  `pnpm check:cli`, `pnpm check:catalog`, `pnpm check:consumable --no-build`,
  `pnpm check:golden`.
- Not on GitHub: the local branch `parked/cream-segment` (a declined cream
  pill, DECISIONS row 32). Leave it out.
