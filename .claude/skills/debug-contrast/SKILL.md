---
name: debug-contrast
description: Diagnose a failing WCAG contrast gate — reading the build failure, finding which ramp step was chosen and why, and fixing it without weakening the accessibility contract. Use when pnpm build fails on contrast or check:contrast reports a violation.
---

# Debugging a contrast failure

The build fails on inaccessible colour by design. `tools/build-tokens.ts` runs
`checkPreset()` over every preset in both modes before emitting anything.

## Read the failure

Each `Failure` names: `preset`, `mode`, `fg`, `bg`, `min`, `actual`. That is
"in THIS preset and mode, role `fg` measured `actual` against role `bg`, and
owed `min`." Get the full picture with `pnpm check:contrast`.

## The three minimums, and what they mean

| Min | Applies to | Why |
| --- | --- | --- |
| 4.5 | Normal text | WCAG AA |
| 3 | Large text, and **non-text UI** (WCAG 1.4.11) | Borders, focus rings, and any shape a user must locate without a label |
| 2.25 | Chart marks, dark mode only | The usable dark lightness band can't always reach 3; every Chart ships a legend, tooltips and a table view as relief |

## Find the cause before changing anything

The failing value was *chosen*, not written. `pick(ramp, candidates, against, min)`
walks `candidates` in order and returns the first step clearing `min` against
every colour in `against` — **or the last candidate as a fallback if none
qualify.** That fallback is the usual source of a mystery value: the walk ran
off the end and you are looking at a last resort, not a choice.

So ask, in order:

1. **Did the walk run out?** Widen the candidate list, or extend the ramp so a
   qualifying step exists.
2. **Did a ramp edit move the steps?** Shade selection is contrast-driven; a
   ramp change silently re-picks every role built from it.
3. **Is the role being asked for two contradictory things?** This is the
   interesting case — see below.

## When a role has two jobs, split it

The precedent is `primary`. It was both the fill behind a label (wants pale) and
the fill that IS an unlabelled shape (owes 3:1 to the page, so wants deep). No
value satisfies both, and the 3:1 rule silently forced every pastel brand deep —
a preset named for robin's-egg blue shipped a deep teal.

The fix was not to relax the rule. It was `primary-solid`: a second role that
takes the 3:1 obligation, leaving `primary` free to be chosen for the label it
carries. Each `-solid` defaults to its fill's final value (after overrides), so
vivid presets emit identical values and nothing changed for them.

Signs you are in this case:

- The same role is named in one rule against `bg` and another against `on-*`.
- Both modes disagree — dark passes easily, light cannot.
- Making it pass makes it visually wrong, and making it right makes it fail.

## Never

**Do not lower a `min` or delete a rule to get green.** `rules.ts` is the
accessibility contract, not a lint preference. Lowering 3 to 2.5 does not make
the checkbox visible; it makes the build stop mentioning that it isn't.

Legitimate fixes: adjust the ramp, widen the candidate walk, add a per-mode
`Rule.mode` distinction where the modes genuinely differ, or split the role.

## Verify

`pnpm build && pnpm check:contrast`. When a fix touches `semantics.ts`, check
**all five** presets (sorbet, ocean, forest, noir, midnight) in both modes — a
change to the shared builder reaches every theme, and noir applies overrides
after the builder runs, which is exactly where regressions hide.
