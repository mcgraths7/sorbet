---
name: add-token
description: Add or change a design token — spacing, type, radius, shadow, duration, easing, z-index, or a one-off dimension — and regenerate the Sass accessors. Use when a partial needs a value that no existing token provides.
---

# Adding a token

## First: does it need to be a token?

A token is a value used across components that should change together. A value
used once, by one component, is a **knob** — an un-prefixed custom property on
that component (`--gap`, `--min`, `--aside`) that falls back to a token. Adding
a token for a single consumer inflates every theme's emitted CSS forever.

## Where they live

`packages/design-system/src/tokens/scales.ts` is the source of truth for every
non-colour dimension. The `misc` map inside it holds the one-offs that don't
belong to a numbered scale — `border-width`, `control-height-{sm,md,lg}`,
`sidebar-width`, `avatar-size-*`, `tile-min`, `focus-ring-width`.

Colour is different: ramps live in `ramps.ts`, and the semantic roles that
consume them are built contrast-first in `semantics.ts`. For anything colour
related use the **author-theme** or **debug-contrast** skill instead.

## The loop

1. Edit `scales.ts` — add to the right scale, or to `misc` for a one-off.
2. `pnpm build:design-system`. `tools/build-tokens.ts` regenerates
   `styles/abstracts/_generated.scss`, `dist/themes/`, and `manifest.json`.
3. Use it through the accessor: `space(7)`, `radius(xl)`, `token(tile-min)`.

**Never hand-edit `_generated.scss`.** It is build output. An edit there passes
review, works locally, and vanishes on the next build.

## Why the accessors exist

`clr() space() fs() lh() fw() ls() font() radius() shadow() dur() ease() z()`
and `token()` each validate their argument against the generated lists at
compile time. `space(99)` is a build error; `var(--sb-space-99)` is a silent
blank. That compile-time check is the entire reason a raw `var(--sb-…)` in a
library partial is a smell — it opts out of the guarantee.

In app code and the playground, raw `var(--sb-*)` is correct: those consume the
published custom-property API and never run Sass.

## Naming

Match the existing scale's shape. Numbered scales stay numbered (`space(6)`),
t-shirt scales stay t-shirt (`radius(lg)`). A new naming convention inside an
existing scale is a change to the public API, not a token addition — raise it
before building.

## Verify

`pnpm build && pnpm lint:styles` — then grep `dist/themes/sorbet.css` for the
emitted custom property to confirm it actually shipped.
