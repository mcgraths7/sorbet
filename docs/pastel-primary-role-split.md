# Proposal: split `primary` so the flagship theme can be a true pastel

**Status:** proposed, not implemented
**Affects:** `packages/design-system` (tokens + Sass), `packages/component-library` (none expected)

## The problem

Sorbet's flagship preset is meant to read unmistakably pastel — the tagline says
"robin's-egg blue, blossom pink, and butter yellow on warm cream." It doesn't.
`secondary` and `accent` are pastel; `primary` — the colour the theme is named
for — resolves to `aqua-600 #008289`, a deep teal.

That is not an accident, and it is not a bug in the gate. `semantics.ts`
exempts `primary` from `brandStyle: "pastel"` on purpose, because `primary`
paints **unlabelled affordances**: checkbox fills, slider tracks, tab
indicators, switches, spinners, progress. Those are non-text UI components and
WCAG 1.4.11 requires 3:1 against the page, enforced by:

```ts
{ fg: "primary", bg: "bg", min: 3 }
```

No pastel clears that against a near-white page.

## What the numbers actually say

Measured with the repo's own `contrast()` against the light-mode page
(`sand-50 #f8f7f5`):

| step | hex | vs page | vs white | vs black |
|---|---|---|---|---|
| aqua-200 | `#adedf3` | 1.21 | 1.30 | 16.18 |
| **aqua-300** | **`#82dfe7`** | **1.44** | 1.54 | **13.66** |
| aqua-400 | `#4cc7d1` | 1.89 | 2.02 | 10.40 |
| aqua-500 | `#00a8b1` | 2.71 | 2.90 | 7.24 |
| aqua-600 | `#008289` | **4.31** | 4.61 | 4.55 |

Two conclusions:

1. **The button label was never the blocker.** A true robin's-egg fill has
   13.66:1 of headroom against black. The *lightest* hue-matched text that
   still clears 4.5:1 on `aqua-300` is `#445d60` (4.58:1) — a soft slate-teal,
   not black. `#0d4247` gives 7.24:1 with room to spare. "Accessible pastel
   button" never required harsh black text; it required not assuming the only
   dark option was `#000`.
2. **The blocker is the 3:1-on-bg rule**, and that rule is correct. It is just
   being applied to a token that is doing two jobs.

## Root cause: `primary` is overloaded

One token is being asked to be both:

- **pale enough to sit under dark text** (a labelled fill — button, chip), and
- **dark enough to define a shape with no text at all** (an unlabelled
  affordance — checkbox, slider, switch).

Those requirements point in opposite directions. No single value satisfies
both, which is why every attempt at a pastel primary has collapsed back to the
deep teal. The gate was faithfully reporting a contradiction in the model; it
read as "pastel primary is impossible" because the rule had no rationale
attached to point anywhere else.

## Audit: is any other preset compromised?

No. Measured light-mode `primary` for every preset:

| preset | primary | step | intent | verdict |
|---|---|---|---|---|
| sorbet | `#008289` | aqua-600 | "light and fun… robin's-egg" | **mismatch** |
| ocean | `#0f70d5` | blue-600 | "confident blues" | on intent |
| forest | `#008944` | green-600 | "deep greens" | on intent |
| noir | `#333537` | gray-900 | "editorial monochrome" | on intent |
| midnight | `#804ed7` | violet-600 | "sleek and electric, dark-first" | on intent |

Every preset lands on the same deep step with white text. For four of them that
*is* the brand — the rule and the intent point the same way, so nothing is lost.
Sorbet is the only preset whose stated identity is pale, and therefore the only
one where the rule and the intent oppose. The system is not broadly compromised;
it has one blind spot, and it happens to sit on the flagship.

Two further findings worth recording:

- **Within sorbet, `primary` is the odd one out.** `secondary` is
  `raspberry-200` and `accent` is `lemon-200` — genuinely pastel, because both
  are exempt from the 3:1-on-bg rule. The theme is two-thirds pastel with a deep
  teal anchor, which is precisely the "doesn't read pastel" complaint.
- **Dark mode already does what light mode cannot.** Sorbet's dark `primary` is
  `aqua-400 #4cc7d1` with near-black text at 7.74:1, clearing 3:1 against the
  dark page comfortably. A pale fill under dark text is already shipping and
  already passing — in dark mode the two requirements point the *same*
  direction (pale contrasts with both a dark page and dark text), so the token
  is not overloaded there at all. **The conflict is light-mode-only.** That is
  also the proof the proposal works: the pattern is not hypothetical, it is what
  half of every existing theme already does.

## Proposal

**Split the role.**

| token | value | governed by | paints |
|---|---|---|---|
| `primary` | pastel (≈ `aqua-300`) | `on-primary ≥ 4.5` | labelled fills: button, chip, badge |
| `primary-solid` | `aqua-600` | `≥ 3:1 on bg` | unlabelled affordances: checkbox, slider, switch, progress, spinner |

Both come from the same ramp, so they remain visibly one family: the pastel is
the brand, the deeper shade is the shape-maker.

## What has to change

1. **`src/tokens/semantics.ts`** — add `primary-solid` to
   `SEMANTIC_COLOR_NAMES`; stop exempting `primary` from `pastel` in `brand()`;
   derive `primary-solid` from the same ramp at the vivid step. Hover must
   **deepen, not lighten** — `solid()` already supports this via `hoverDir`,
   which the pastel `secondary`/`accent` already use. A pale base has nowhere
   lighter to go.
2. **`src/tokens/rules.ts`** — move `{ fg: "primary", bg: "bg", min: 3 }` to
   `primary-solid`. Add a rule that the pastel `primary` stays *distinguishable*
   from the page (≈1.3:1) even though it cannot reach 3:1.
3. **`src/styles/`** — audit the ~12 partials using `clr(primary)` and route
   each to the right token. Expected split:
   - stay `primary` (labelled): `atoms/_button.scss`, `atoms/_chip.scss`
   - become `primary-solid` (unlabelled): `atoms/_choice.scss`,
     `atoms/_slider.scss`, `atoms/_switch.scss`, `atoms/_progress.scss`,
     `atoms/_spinner.scss`
   - inspect case by case: `atoms/_fab.scss`, `atoms/_icon.scss`,
     `molecules/_calendar.scss`, `base/_typography.scss`
4. **Pale fills need a defined edge.** A pastel button on a near-white page has
   an ambiguous boundary. Require a border on pale fills whose colour *does*
   clear 3:1 against the page — the shape is then carried by the border, which
   is the honest reading of 1.4.11 for this design.
5. **Re-derive `primary-subtle` and the hover/active chain** for a base that now
   starts pale.
6. **Dark mode is unaffected** — its fills are already pastel-adjacent by
   construction.

## Risks

- `primary-solid` is a new public token; consumers reading `--sb-primary` for an
  affordance would silently get the pastel. Pre-1.0, so acceptable, but it is a
  real API change and should be called out.
- The playground and `apps/meal-kit` will shift visually; both need a look.
- The 1.3:1 floor is a judgement, not a standard. It exists to stop `primary`
  drifting invisibly pale, and the mandatory border is what actually satisfies
  the accessibility requirement.

## Documentation owed to theme authors

This trap is currently invisible to anyone authoring a preset. `README.md`
§"Extending the system" says:

> **Change brand colors** — edit a preset… (swap which ramps map to
> `primary`/`secondary`/`accent`…). Rebuild; the contrast contract re-verifies.

That is true and incomplete. It presents the gate as a *checker*, when for
`primary` it is also a *chooser*: it walks the ramp and takes the first step
that satisfies every rule. An author who picks a pale ramp expecting a pale
brand will get a deep one, with no failure and no warning — the build passes,
and the intent is silently discarded. That is exactly how this went unnoticed.

Three sections need updating alongside the code change:

- **§"Extending the system"** — say plainly that `primary` is selected, not
  merely validated, and that its floor is set by the unlabelled-affordance rule.
  Point pale-brand authors at `primary` vs `primary-solid` and note that hover
  must deepen rather than lighten for a pale base.
- **§"Theming: presets & dark mode"** — document the light/dark asymmetry: in
  dark mode a pale fill satisfies both requirements at once, in light mode it
  cannot, which is why the two modes resolve so differently from the same ramp.
- **§"The accessibility contract"** — name the figure/ground distinction, since
  it is the concept that makes the token split make sense: the same colour is a
  *background* under a button label (needs 4.5 against the text) and a
  *foreground* as a checkbox fill (needs 3:1 against the page).

A worked example belongs here too — "authoring a pastel preset" — because the
correct answer is non-obvious and currently undiscoverable.

## Also worth doing

Rules are bare `{ fg, bg, min }` tuples, so a failure reports a number and not a
reason. Adding a `why` string, surfaced in the gate output, would have made this
diagnosable in minutes: *"primary must clear 3:1 on bg because it paints
unlabelled affordances."* The gate should teach, not only refuse.
