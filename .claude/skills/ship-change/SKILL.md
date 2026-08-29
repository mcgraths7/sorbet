---
name: ship-change
description: Get a change from working tree to merged — branch naming, splitting commits so each area is auditable, the gate set, and opening the PR against protected main. Use when work is complete and needs to be committed, pushed, or turned into a pull request.
---

# Shipping a change

`main` is protected by the ruleset "Protect main": PRs only, required status
check `build`, **strict up-to-date policy**, no force-push or deletion. There is
no path that commits straight to `main`.

## Split the work before committing

**Merges can be robust, but each area of the change must be independently
auditable as a commit.** The reader is someone opening the PR for the first
time and deciding whether to trust it. Three focused commits they can read in
sequence beat one 17-file commit they have to reverse-engineer.

Split by *area of concern*, not by file count:

- a token-model change
- the call sites re-routed to it
- a component fix that depends on both
- a docs or convention change

Each commit should build on its own. Verify that — don't assume it.

Corollary: a bug you find while working on something else gets its **own**
commit, ahead of the feature. It reverts independently and it is not the
reviewer's job to untangle it from the change they were asked to look at.

## The gate set

Run all of these before pushing. CI runs `build`, but the rest catch things
locally and faster:

```
pnpm build          # includes the WCAG contrast gate — inaccessible palette = failed build
pnpm test           # check:contrast + check:client
pnpm check:catalog  # README component roster must list every export
pnpm check:cli      # scaffold templates still resolve
pnpm lint           # eslint, --max-warnings 0
pnpm typecheck
```

Node is keg-only here: `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"`.
`pnpm` comes from corepack, pinned by `packageManager` — never `brew install pnpm`.

## Commit messages

Conventional prefix and scope: `feat(design-system):`, `fix(component-library):`,
`docs:`, `chore(deps):`. Subject in the imperative.

The body carries the *why*. A reviewer can read the diff for what changed; what
they cannot recover is the reasoning, the alternative you rejected, and the
constraint that made the obvious approach wrong. Write that.

Footer: `Co-Authored-By: Claude <noreply@anthropic.com>` — deliberately without
a model name. Pinning a version dates the convention and makes the history a
record of which model was current rather than of what changed.

## Branch and PR

```
git checkout -b <type>/<short-slug> main
gh pr create --base main --head <branch> --title "…" --body "…"
```

Write the PR body for someone who has not been in the conversation. State the
problem first, then what the change does, then the decisions that deserve
scrutiny — especially any place the obvious approach would have been wrong.
Call out what you deliberately left out of scope.

## Merging

Default is **squash**, which collapses the branch to one commit on `main`. The
per-area split therefore serves the PR review, not the permanent history —
which is its purpose here. The individual messages are preserved in the squash
commit's body.

Strict up-to-date means every merge invalidates the other open PRs, so each
needs updating before it can merge. With squash, **update via the merge button**
— rebase costs a force-push and new SHAs, and squash discards that tidiness
anyway. `gh pr merge <n> --squash --auto` queues it and lets GitHub do the
updating.

## Careful with

- Never check out another branch while the playground dev server is running —
  it swaps the tree underneath Vite and produces a white screen that looks like
  a code bug. Use `git worktree add` for parallel work.
- Lockfile conflicts resolve wholesale (regenerate), never by hand.
- `@types/*` majors are pinned deliberately: they must describe the Node in
  `.nvmrc` and the React in the catalog. Running ahead type-checks green and
  fails at runtime.
