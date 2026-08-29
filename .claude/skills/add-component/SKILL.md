---
name: add-component
description: Add a new component to the Sorbet component library — choosing its atomic layer, wiring the Sass partial and cascade layer, exporting it, and satisfying the catalog gate. Use when creating a new .sb-* component or promoting an app-local one into the library.
---

# Adding a component

## Scan before building — this is the step most often skipped

Grep the tree for the same shape first. If the logic or CSS already exists in
~2+ places, extract the shared unit FIRST and build on it. The Popover refactor
is the template: `positionPopover` + `usePopover` moved into `core/` and now
back the menu, the pickers, and the Popover atom.

Before 1.0 nothing is frozen, so prefer reshaping an existing component over
adding a near-duplicate. When two close components can't share as-is, try
WIDENING the shared unit — a mixin parameter, a component prop, a helper
option. But don't contort: if sharing takes real gymnastics, they're distinct.

## Pick the layer

| Layer | Holds | Test |
| --- | --- | --- |
| `core/` | Hooks and utils, no markup | Would it work with no DOM? |
| `layout/` | Composition primitives | Does it only arrange children? |
| `atoms/` | One indivisible control | Does it decompose into smaller sb-* parts? If yes, not an atom |
| `molecules/` | 2+ atoms with shared behavior | |
| `organisms/` | Page-region assemblies | |
| `templates/` | Whole page skeletons | |
| `charts/` | Data viz | |

## The wiring, in order

1. **Sass partial** — `packages/design-system/src/styles/<layer>/_<name>.scss`.
   BEM: `.sb-<name>`, `.sb-<name>__part`, `&--<modifier>`.
2. **Load it** — add to the `meta.load-css` list in `styles/index.scss`, inside
   the matching `@layer sb.<layer>` block. Layer order is
   `reset, base, layout, atoms, molecules, organisms, templates, utilities`;
   putting a partial in the wrong layer changes which rules win.
3. **React wrapper** — `packages/component-library/src/<layer>/<name>.tsx`, a
   thin typed wrapper over the classes. Cross-layer imports are RELATIVE
   (`"../core/index.ts"`).
4. **Export** — add to that layer's `index.ts`. The root barrel re-exports
   automatically.
5. **Catalog** — add the component to the README "Component catalog" table.
   `pnpm check:catalog` FAILS THE BUILD on a missing entry; this is not optional
   documentation.

## Style rules that are gated or load-bearing

- Token access in library Sass goes ONLY through the validated accessors:
  `clr() space() fs() lh() fw() ls() font() radius() shadow() dur() ease() z()`
  and `token()` for one-off dimensions. A raw `var(--sb-…)` or a literal `12px`
  in a partial is a smell — the accessors validate names at compile time.
- Never hand-edit `abstracts/_generated.scss`; it comes from `scales.ts`.
- Atom/molecule internals stay BEM `<div class="sb-*__part">` styled by Sass —
  do NOT swap `.sb-card__body` for a `<Stack>`. Layout primitives are for
  composing layouts, not for building an atom's insides.
- No outer margins on atoms/molecules. Layout owns spacing between components.
- Knobs (un-prefixed custom props) are per-instance API and must be reset with
  `--knob: initial;` in layout primitives so parent values don't leak in.
- Never inline a new `<svg>`. Glyphs live in `atoms/icons.tsx`; `Icon` is the
  size/tone/a11y wrapper. Chart marks are exempt — those are inline SVG by nature.
- Prefer a real semantic element over `role`-on-`div` (`<ul>`/`<li>` for a legend).
- Platform first: native `<dialog>`, Popover API, `@starting-style`,
  `:user-invalid`, `field-sizing` before reaching for JS.

## Shared units to reuse rather than reinvent

- `core/`: `usePopover`/`positionPopover`, `useScrollDismiss`,
  `useControllableState`, `chain`, `rovingIndex`, `composeRefs`, `cx`,
  `PolymorphicProps`, `useModifierKey`, `ThemeProvider`/`useTheme`
- `molecules/combobox-core.ts` (`useComboboxCore`), `molecules/calendar.tsx`
  (`useCalendar` + `CalendarView`), `charts/shell.tsx` (`seriesColor`)
- Sass mixins in `abstracts/_mixins.scss`: `focus-ring`, `elevate`, `pressable`,
  `color-transition`, `truncate`, `control-reset`, `visually-hidden`, `respond`,
  `flyout`, `popover-surface`, `control-glow`

## Verify

`pnpm build && pnpm test && pnpm check:catalog && pnpm check:cli && pnpm lint && pnpm typecheck`
