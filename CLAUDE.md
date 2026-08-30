# CLAUDE.md — Sorbet

Sorbet is a fun, themeable, accessibility-first design system: a Sass + TS core
with React bindings, in a pnpm-workspaces monorepo. The prefix everywhere is
`sb-` (`.sb-*`, `--sb-*`, `data-sb*`, `@layer sb.*`, the `sb:theme` event, the
`sb-theme` localStorage key).

**This file is an index, not a manual.** It says where things live and which
skill owns which job. The procedures live in `.claude/skills/` and load only
when the task needs them — see `.claude/README.md` for why it is built this way.

## Task router

| Task | Skill |
| --- | --- |
| Apply `.sb-*` classes to markup; port a page off another framework | **sorbet-classes** |
| Add a component, or promote an app-local one into the library | **add-component** |
| Add or change a spacing/type/radius/shadow/duration/z token | **add-token** |
| Add a preset, change a theme's colours, work on the `-solid` split | **author-theme** |
| A contrast gate is failing the build | **debug-contrast** |
| Commit, split the work, run the gates, open the PR | **ship-change** |
| Audit a diff against the structural contracts | `contract-auditor` subagent |

Reach for the skill before reading source. Each one names the files it touches,
so it replaces a tree scan rather than adding to it.

## Where things live

- `packages/design-system` (`@sorbet/design-system`) — framework-agnostic core.
  - `src/tokens/` — TS source of truth. `color.ts` (OKLCH→sRGB + WCAG maths),
    `ramps.ts`, `scales.ts` (dimensions, incl. the `misc` map), `semantics.ts`
    (the contrast-driven semantic colour builder), `presets.ts`
    (sorbet|ocean|forest|noir|midnight), `charts.ts` (8-slot CVD-validated
    palettes), `rules.ts` (**the accessibility contract**).
  - `src/styles/` — Sass, atomic layers loaded into CSS cascade layers via
    `meta.load-css` in `index.scss`. Shared mixins in `abstracts/_mixins.scss`;
    validated token accessors in `abstracts/_tokens.scss`.
  - `src/behaviors/` — vanilla TS; `init()` wires `[data-sb=…]`. Zero deps.
  - `tools/` — `build-tokens.ts` (emits `dist/themes/`, `manifest.json`,
    `_generated.scss`; **fails the build on contrast violations**),
    `check-contrast.ts`, `check-cvd.ts`.
  - Exports: `.` & `./tokens`, `./behaviors`, `./css`, `./themes/*`, `./scss/*`.
- `packages/component-library` (`@sorbet/component-library`) — React 19, one
  subpath per atomic layer: `/core /layout /atoms /molecules /organisms
  /templates /charts`; root barrel re-exports everything; `sideEffects: false`.
  `ThemeProvider`/`useTheme` in `/core` (framework service), `ToastProvider` in
  `/molecules` (a provider ships with its UI) — both placements deliberate.
- `packages/cli` (`@sorbet/cli`) — bin `sorbet` (create/theme/component/presets/
  contrast). `create` copies design-system sources + `scaffold/` templates;
  scaffold files reuse `emit.ts`/`scales.ts`, so token changes propagate.
- `apps/playground` — Vite React kitchen sink (port 5183, strict). `demo/` —
  vanilla kitchen sink from repo root (expects :4181).
- `.claude/` — skills, subagents, and the pattern's own README.
  `.claude/launch.json` and `settings.local.json` are gitignored; the rest is
  version-controlled team config.

## Non-negotiables

These hold on every task, which is why they are here and not in a skill:

- **`main` is protected.** PRs only, required `build` check, strict up-to-date,
  no force-push. Branch → commit → push → `gh pr create`. Never commit to `main`.
- **Each area of a change is its own commit.** Merges can be robust; the reader
  opening the PR should be able to audit one concern at a time.
- **`_generated.scss` is build output.** Edit `scales.ts` and rebuild.
- **Library Sass uses the accessors, never raw `var(--sb-…)`.** They validate at
  compile time. App code and the playground are the opposite: raw is correct there.
- **`rules.ts` is a legal requirement, not a preference.** Never lower a `min`
  to get a green build.
- **Layout owns spacing between components.** Atoms and molecules have no outer
  margins.
- **Never inline a new `<svg>`** — glyphs live in `atoms/icons.tsx`. Charts are exempt.
- Commit footer: `Co-Authored-By: Claude <noreply@anthropic.com>` — no model
  name; pinning one dates the convention and makes the history a record of which
  model was current rather than of what changed.

## Commands

Package manager is **pnpm**, pinned by the root `packageManager` field
(`corepack enable`). Node is keg-only on this machine — a non-login shell needs
`export PATH="/opt/homebrew/opt/node@24/bin:$PATH"`.

```
pnpm build          # topological; includes the WCAG gate
pnpm test           # check:contrast + check:client
pnpm check:catalog  # README roster must list every export
pnpm check:cli
pnpm lint           # --max-warnings 0
pnpm typecheck
pnpm check:contrast # full per-preset/mode report
pnpm playground     # port 5183
```

`gh` CLI at `/opt/homebrew/bin/gh` (authed as mcgraths7).

## Environment gotchas

- **Never switch branches while the playground is running** — it swaps the tree
  under Vite and yields a white screen that reads like a code bug. Use
  `git worktree add` for parallel work.
- Screenshots are BLANK whenever `scrollY > 0` → verify with DOM geometry or a
  `translateY` shift on `.sb-app-shell`.
- rAF / ResizeObserver / scroll events starve between tool calls → take a
  screenshot to pump a frame, then read state.
- Each `javascript_tool` call implicitly clicks the page (light-dismissing
  popovers); React commits for untrusted events are deferred → act in one call,
  read results in the next.
