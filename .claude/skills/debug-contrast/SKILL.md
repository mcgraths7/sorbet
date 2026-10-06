---
name: debug-contrast
description: Diagnose a failing contrast gate — reading the build failure, finding which ramp step was chosen and why (a built preset) or reporting a typed value to the owner (sorbet), and fixing it without weakening the contract the preset declares. Use when pnpm build fails on contrast or check:contrast reports a violation.
---

# Debugging a contrast failure

The build fails on inaccessible colour by design. `tools/build-tokens.ts` runs
`checkPreset()` over every preset in both modes, and writes nothing if any
check fails.

## First: which contract does the failing preset declare?

Each preset declares a contract per mode (`contract` in `presets.ts`). The
contract (`src/tokens/contracts.ts`) gives each tier its floor; a rule in
`rules.ts` names a pair and its tier, and carries no number. The four built
presets declare `wcag-aa`; sorbet declares `legibility` (read `presets.ts` for
today's declarations). Read the declaration before reading the failure: the
floor a pair owes comes from there. A `TypeError` naming a preset or a contract
is a bad declaration, not a contrast failure; fix the declaration.

## Read the failure

Each `Failure` names: `preset`, `mode`, `fg`, `bg`, `tier`, `metric`, `min`,
`actual` and `view`. That is "in THIS preset and mode, `fg` measured `actual`
against `bg`, by the tier's metric (a ratio, Lc, a separation, or an edge's
presence) in the worst of the contract's views, and owed `min`" (the floor of
the rule's tier under the declared contract). A side may be a role, an optional
token (`seams.ts`) or an element's edge (`edge:<element>`, `edges.ts`).
`actual` is `null` for a pair that could not be measured (a missing or
unreadable colour), which is a failure too. A structure failure (one of the six
checks of `checkStructure`) is the other kind: it names the check and what it
found. The gate prints each failing tier's `why` and `retire` once. Get the full
picture with `pnpm check:contrast`.

## The `wcag-aa` floors, and what they mean

| Min | Applies to | Why |
| --- | --- | --- |
| 4.5 | Normal text | WCAG AA |
| 3 | Large text, and **non-text UI** (WCAG 1.4.11) | Borders, focus rings, and any shape a user must locate without a label |
| 2.25 | Chart marks, dark mode only | The usable dark lightness band can't always reach 3; every Chart ships a legend, tooltips and a table view as relief |

The `legibility` floors are per tier and per mode, and so are its views: read
them from `contracts.legibility.tiers[tier]` (`min`, `metric`, `views`) rather
than from a copy here.

## A failure in sorbet (a typed preset)

Sorbet's values are written, not chosen: the owner approved them on sample
sheets, and the tests hold every one to the spec. A failure there is a
contradiction to report to the owner — the value, the rule, the number — never a
value edit, a floor change or a new rule to make the build green.

## Find the cause before changing anything (a built preset)

In a built preset the failing value was *chosen*, not written. `pick(ramp, candidates, against, min)`
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

**A preset's declared contract is binding. Never lower a floor, drop a rule,
or change which contract a preset declares to get a green build. Those are the
owner's decisions and each needs a PR that says so. The theme files of the WCAG
presets are frozen: any byte of change in them is a finding.** ("The WCAG
presets": ocean, forest, noir, midnight, the `FROZEN_PRESETS` line of
`tools/check-golden.ts`.) Lowering 3 to 2.5 does not make
the checkbox visible; it makes the build stop mentioning that it isn't.

Legitimate fixes for a built preset: adjust the ramp, widen the candidate walk,
or split the role. A per-mode `Rule.mode` distinction changes `RULES`, which the
tests pin, so it is a spec change with the owner, not a fix. For sorbet, see
above: a report to the owner.

## Verify

`pnpm build && pnpm check:contrast && pnpm check:golden`. A fix that changes a
frozen theme's CSS by one byte fails the golden gate; that is the gate working,
not an obstacle to update around. When a fix touches `semantics.ts`, check the
four built presets (ocean, forest, noir, midnight) in both modes — a change to
the shared builder reaches each of them, any byte of their output is a golden
failure, and noir applies overrides after the builder runs, which is exactly
where regressions hide. Sorbet's records do not pass through the builder.
