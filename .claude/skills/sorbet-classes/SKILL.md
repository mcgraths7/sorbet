---
name: sorbet-classes
description: Apply Sorbet classes to plain or foreign markup — mapping HTML elements to .sb-* blocks and modifiers, and porting a page off Tailwind/Bootstrap/inline styles. Use when markup needs the design system applied wholesale rather than one element at a time.
---

# Applying Sorbet to markup

Goal: take markup that is semantically correct but visually unstyled (or styled
by something else) and put the right `.sb-*` classes on it in one pass.

## Work in this order

1. **Fix the elements first, classes second.** Sorbet styles semantic elements.
   A `<div role="button">` gets no help from `.sb-button`; make it a `<button>`.
   Porting from a utility framework usually means deleting a div soup before
   any class is worth adding.
2. **Map outer layout, then blocks, then modifiers.** Layout classes decide the
   page skeleton and own ALL spacing between components; blocks are the
   components; modifiers are the variants. Doing it in the other order produces
   components that fight the layout for margins.
3. **Delete the old system as you go.** A half-ported page with both Tailwind
   utilities and `.sb-*` classes is worse than either alone — specificity
   collisions land outside the `@layer sb.*` cascade and win silently.

## Element → class

| Element / intent | Class | Notes |
| --- | --- | --- |
| `<button>`, `<a>` acting as a control | `.sb-button` | `--soft --outline --ghost --link` for emphasis; `--sm --lg`; `--icon` needs `aria-label` |
| `<h1>`…`<h6>` | `.sb-heading --{2xl…5xl}` | Size is chosen for VISUAL rank; the tag stays the semantic rank |
| `<p>`, `<span>` | `.sb-text` | `--sm --lg`, weight `--regular…--bold`, tone `--muted --subtle` |
| `<input>` | `.sb-input` | Wrap with `.sb-field` for label + error + hint |
| `<textarea>` | `.sb-textarea` | `--auto` uses `field-sizing`, no JS autogrow |
| `<select>` | `.sb-select` | |
| `<input type=checkbox\|radio>` | `.sb-checkbox` / `.sb-radio` | Both from `_choice.scss` |
| `<label>` | `.sb-label` | |
| `<table>` | `.sb-table` inside `.sb-table-wrap` | The wrapper owns the horizontal scroll — always both |
| `<dialog>` | `.sb-modal` | Native `<dialog>`, not a div overlay |
| `<nav>` breadcrumbs | `.sb-breadcrumb` | |
| `<ul>` of tags | `.sb-chip` per item | `--selected` for the on state |
| Status message | `.sb-alert` | Not a toast — toasts are transient and go through `ToastProvider` |
| Metric / KPI | `.sb-stat` | |
| Empty result set | `.sb-empty-state` | |
| Grouped content block | `.sb-card` | `--interactive` ONLY if the whole card is a link or button |

## Layout skeleton

| Intent | Class |
| --- | --- |
| Vertical rhythm | `.sb-stack --gap-{n}` |
| Horizontal row that wraps | `.sb-cluster --gap-{n}` (`--between --center --baseline`) |
| Column grid | `.sb-grid --cols-{n} --gap-{n}` |
| Main + sidebar | `.sb-split` (`--aside-right`) |
| Page width | `.sb-container` (`--full`) |
| Page section | `.sb-section --gap-{n}` |
| Centred block | `.sb-center` (`--text --intrinsic`) |
| Media box with ratio | `.sb-frame` (`--square --wide --portrait --round`) |
| Overlay one thing on another | `.sb-layer` (`--center --scrim`) |

Full generated tables, every block and every modifier that actually compiles:

- `reference/atoms.md`
- `reference/molecules-organisms.md`
- `reference/layout.md`

Read the one you need. Anything absent from those tables does not exist —
inventing `.sb-button--tertiary` produces an unstyled button, not an error.

## Rules that catch most mistakes

- **Spacing lives in layout, never on the component.** Atoms and molecules have
  no outer margins. If two components sit too close, fix the `--gap-` on the
  `.sb-stack`/`.sb-cluster` around them; do not add a margin to the atom.
- **Per-instance sizing goes through knobs, not overrides.** Un-prefixed custom
  props (`--gap`, `--min`, `--size`, `--aside`, `--ratio`) are public API:
  `<div class="sb-grid" style="--min: 20rem">`. Writing `.sb-grid { gap: 12px }`
  in app CSS is a smell.
- **In app code, raw `var(--sb-*)` is correct.** The `clr()`/`space()` accessor
  rule applies to the library's own Sass, which compiles. Consumers read the
  published custom properties directly.
- **React wrappers exist for nearly all of these.** If the file is `.tsx` and
  the component is exported from `@sorbet/component-library`, use the component
  instead of hand-writing the class. The class map is for HTML, foreign markup,
  and the few places the library has no wrapper.
- **Never inline a new `<svg>`.** House glyphs live in `atoms/icons.tsx`; `Icon`
  is the size/tone/a11y box around any provider's glyph.

## Verify

`pnpm build && pnpm lint` catches malformed Sass, not wrong class names — a
class that does not exist compiles fine and simply does nothing. Check the
result in the playground (`pnpm playground`, port 5183) or grep the compiled
`packages/design-system/dist/css/sorbet.css` for the class you used.
