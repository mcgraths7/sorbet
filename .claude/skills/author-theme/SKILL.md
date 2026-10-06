---
name: author-theme
description: Author or modify a Sorbet preset — mapping ramps onto semantic roles, choosing vivid vs pastel brand style, using overrides, and understanding the -solid shape-maker split. Use when adding a theme or changing an existing preset's colours.
---

# Authoring a theme

A preset in `packages/design-system/src/tokens/presets.ts` is one of two kinds:

- **Built** (ocean, forest, noir, midnight): a `SemanticRecipe` — eight ramps
  (neutral, primary, secondary, accent, success, warning, danger, info), a chart
  theme and a few flags — that `semantics.ts` (`buildMode`) turns into the
  semantic roles components use (`SEMANTIC_COLOR_NAMES`). They declare
  `wcag-aa`, and their theme files are frozen: any byte of change is a finding.
- **Typed** (sorbet): its light and dark records are written out whole — the
  roles plus the optional colour tokens (`SEAMS`, `seams.ts`) — beside its edge
  data (`edges`, `edges.ts`) and `buttonLabel`, as the owner approved them on
  sample sheets. It declares `legibility`, and its golden file is pinned.

## Shade selection is contrast-driven, not hardcoded (built presets)

For a built preset you do not pick "primary = 600". You supply a ramp and a candidate walk, and
`pick()` returns the first step that measures well enough against the things it
must contrast with. That is what lets every preset meet the contract it
declares in both modes instead of hoping.

Consequence: **changing a ramp changes which step gets chosen.** A ramp edit is
never cosmetic — re-run the contrast report and read it.

A typed preset's values are picked by eye, then checked: a value its contract
refuses is a report to the owner, never a quiet edit to make the build green.

## The flags

- `pureSurfaces: true` → pure-white page and surfaces; `false` → a softly
  tinted `neutral-50` page.
- `brandStyle: "vivid"` (default) → light-mode brand fills are saturated
  mid-ramp solids carrying white text.
- `brandStyle: "pastel"` → fills rest at the ramp's light end with near-black
  text and DEEPEN on hover. The pale shade is the identity; the saturated one
  is the response.
- `overrides` → per-mode hand-picked values applied last, after the builder.

## The `-solid` split — read this before touching a pastel theme

`primary` was once doing two contradictory jobs: the fill BEHIND a label (free
to be pale, since `on-primary ≥ 4.5` covers legibility) and the fill that IS an
unlabelled shape — checkbox tick, slider track, tab indicator — which owes 3:1
to the page under WCAG 1.4.11. No single value satisfies both, so the 3:1 rule
silently forced every pastel brand deep.

So the roles are split:

- `primary` / `secondary` / `accent` — the fill under a label.
- `primary-solid` / `secondary-solid` / `accent-solid` — the shape-maker, which
  carries the 3:1 rule and paints unlabelled affordances and button edges.

**Every `-solid` defaults to whatever its fill finally resolves to, overrides
included.** That default is applied after the override merge, which is why a
preset that hand-picks its primary (noir does) doesn't silently get a different
colour on its checkboxes. A vivid theme therefore emits identical values for
both halves and needs to know nothing about the split.

The builder never splits dark mode: a pale fill there contrasts with both the
dark page and dark text, so the two requirements already agree. Sorbet's typed
dark record does split (`primary` `#dac5fc`, `primary-solid` `#b096d7`).

## Authoring checklist

0. Decide which contract the preset declares, per mode (`contract: { light,
   dark }`, required): a key of `contracts` in `src/tokens/contracts.ts`,
   `wcag-aa` or `legibility`. Which one is the owner's decision. The build
   throws on a preset with no valid declaration.
1. Add the recipe (built) or the records (typed) to `presets.ts`, and its
   golden file: `pnpm --filter @sorbet/design-system update:golden <name>`.
2. Ramps: 50→950, perceptually even. OKLCH helpers live in `color.ts`.
3. Charts: an 8-slot CVD-validated palette in `charts.ts`. **Slot ORDER is
   CVD-load-bearing and must stay identical across modes** — re-validate with
   `check-cvd.ts` if you touch it. A typed preset's `chart-1` to `chart-8` must
   equal `chartColors(chartThemes[name], mode)`, which `check-cvd.ts` validates
   (a test holds the two equal), so change `charts.ts` and the record together.
4. `pnpm build` — the contrast gate runs inside the build, against the
   contract the preset declares. A palette that fails its declared contract
   fails it; see the **debug-contrast** skill for reading the failure.
5. `pnpm check:contrast` for the full per-preset, per-mode report.

## Don't

- A preset's declared contract is binding. Never lower a floor, drop a rule,
  or change which contract a preset declares to get a green build. Those are
  the owner's decisions and each needs a PR that says so. The theme files of
  the WCAG presets (ocean, forest, noir, midnight) are frozen: any byte of
  change in them is a finding. The palette is the thing that is wrong. If a role genuinely
  has two conflicting jobs, split the role — that is what `-solid` is.
- Don't set `-solid` in overrides unless the theme truly needs a different
  shape-maker from its fill. The default is almost always right.
- Don't reorder chart slots to taste.
