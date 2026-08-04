# Sorbet design-sync notes

## Repo shape

- No Storybook anywhere in the repo (confirmed with the user on first sync) —
  this is the package shape, converting `packages/component-library`.
- `@sorbet/component-library` ships **zero CSS of its own**. All styling
  (reset/layout/atoms/molecules/organisms/templates layers, plus the token
  values themselves) lives in the sibling `@sorbet/design-system` package:
  - `dist/css/sorbet.css` — the compiled Sass output (all `@layer sb.*`
    component rules, referencing `var(--sb-*)`).
  - `dist/themes/sorbet.css` — the "sorbet" preset's token values (the
    `:root` custom-property definitions + dark-mode overrides). Of the 5
    presets (sorbet/ocean/forest/noir/midnight), "sorbet" was picked as the
    default since it's the flagship/first-listed preset and matches the repo
    name.
- `cfg.cssEntry` is sandboxed to the component-library package directory
  (security bound in `package-build.mjs`), so it CANNOT reach the
  design-system package's CSS directly. Used `cfg.tokensPkg: "@sorbet/design-system"`
  + `cfg.tokensGlob: "**/sorbet.css"` instead — the sanctioned route for CSS
  that lives in a sibling npm dependency. The `**/sorbet.css` deep glob
  happens to match exactly the two files above (verified: no other file in
  the design-system package tree is named `sorbet.css`) and copies both into
  `tokens/dist/css/sorbet.css` + `tokens/dist/themes/sorbet.css`, imported
  into `styles.css` before `_ds_bundle.css`.
- **Re-sync risk**: this relies on both files coincidentally sharing the
  basename `sorbet.css`. If design-system's build ever renames
  `dist/css/sorbet.css` (the compiled Sass entry) to something else, the
  glob will stop matching it and previews will render unstyled (only the
  theme tokens would still be picked up). If that happens, tighten
  `tokensGlob` to two explicit non-conflicting patterns or introduce a
  small `packages/component-library`-local CSS file that re-exports the
  design-system CSS at build time (so `cfg.cssEntry` can reach it directly).
- The "sorbet" preset's font stack (`--sb-font-sans`/`--sb-font-display`:
  `ui-rounded, "SF Pro Rounded", "Nunito", "Comfortaa", system-ui, …`;
  `--sb-font-mono`: `ui-monospace, "SF Mono", "Cascadia Code", …`) names
  brand-preferred webfonts but the repo ships no `@font-face` for any of
  them — `[FONT_MISSING]` on first validate. `ui-rounded`/`SF Pro Rounded`
  are Apple's native rounded system font (free on Apple platforms, and
  `ui-rounded` alone already gets it — no font file needed, and SF Pro
  Rounded couldn't be bundled anyway, it's Apple-proprietary). Nunito,
  Comfortaa, and Cascadia Code ARE free/open (SIL Open Font License) and
  were sourced from Google Fonts (variable-font woff2, latin subset only)
  with the user's explicit OK — see `.design-sync/fonts/` (committed) and
  `cfg.extraFonts`. Re-fetch command if these ever need updating:
  `curl "https://fonts.googleapis.com/css2?family=<Family>:wght@400;700" -A "<modern UA>"`
  then take the block commented `/* latin */` (not `latin-ext`) and download
  its `url()`.
- No per-component docs directory (`packages/component-library` has no
  `docs/`) — `.prompt.md` files are synthesized from `.d.ts` props + JSDoc +
  authored previews. `README.md`'s "Component catalog" section was used only
  as an orientation checklist, not as `docsMap` source.
- Provider: `ThemeProvider` (from `core/theme.tsx`) manages `data-theme` on
  `<html>`; wired via `cfg.provider`. Its `storageKey` prop defaults to
  `"sb-theme"` — left as default.
- Build: `pnpm -F "@sorbet/component-library..." build` builds design-system
  (deps) then component-library via `tsc`. Both packages' `dist/` are
  gitignored and regenerated on every sync.
- **`.design-sync/overrides/dts.mjs` + `source-kit.mjs` forks** (committed,
  see `cfg.libOverrides` for the one-line reasons): `@sorbet/component-library`
  declares its types only via the modern `exports["."].types` field (no
  legacy top-level `types`/`typings`) — upstream `dts.mjs`'s entry-resolution
  falls back to a hardcoded, nonexistent `index.d.ts` guess and silently
  finds zero exports (`[ZERO_MATCH]`). Patched `dts.mjs` to also check
  `exports["."].types`. `source-kit.mjs` had to be forked too purely to make
  ITS static `import ... from './dts.mjs'` resolve to the fixed sibling fork
  instead of the original bundled one (loadLib()'s override resolution only
  covers top-level loads, not lib-to-lib imports) — its own logic is
  untouched, only the `./dts.mjs`/`./common.mjs`/`./bundle.mjs` import
  targets were repointed. **Re-sync risk**: if a future design-sync skill
  version restructures `dts.mjs`'s exports or `findTypesRoot`/`projectFor`
  signatures, or if `@sorbet/component-library` ever gains a legacy
  top-level `types` field, re-diff these forks against the bundled
  originals and consider dropping them.
- **`cfg.componentSrcMap`** (76 entries) exists because Sorbet's source
  convention groups closely-related components into one file per "family"
  (e.g. `atoms/text.tsx` has Text+Heading+Prose+Lead+Overline;
  `atoms/choice.tsx` has Choice+Checkbox+Radio+Switch; `atoms/icons.tsx` has
  every icon glyph; `templates/index.tsx` has all 5 template exports) —
  the converter's default `<Name>.tsx`/`<name>.tsx` discovery only matches
  a component sharing its file's name, so every secondary export in a
  shared file fell into the `general` group until pinned. **Re-sync risk**:
  a NEW component added to one of these shared files needs a matching
  `componentSrcMap` entry too, or it'll land in `general`.

## More preview-authoring techniques (Wave 2)

- **Fixed another real product gap found while authoring**: `mutedSeriesColor`
  (the muted "Other"/aggregated-remainder chart color, `var(--sb-chart-muted)`)
  was defined and used internally in `charts/shell.tsx`/`donut-chart.tsx`, and
  is even documented in this file's own architecture section alongside
  `seriesColor` — but `charts/index.ts`'s barrel only re-exported
  `seriesColor`, so `import { mutedSeriesColor } from "@sorbet/component-library"`
  didn't resolve. Added it to the barrel — see PR #65 (bundled with the Chip
  fix, same PR since both are small isolated bugs found during this sync).
- **Overlay/anchored-panel components vary in how they open** — don't assume
  every one takes an `open` prop like `Popover` does. `Menu` (native
  Popover-API `popovertarget` invoker, not a portal) has no `open`/`defaultOpen`
  prop at all; the working technique there is a ref-based
  `useEffect(() => ref.current?.click(), [])` on the trigger, which fires the
  same native activation a real click would. Menu is also NOT a portal (unlike
  `Tooltip`'s `createPortal`), so it renders inline and never escapes the card
  grid — no `cardMode` override needed for it. Check this per-component
  (Combobox/Select/DatePicker/MultiCombobox in later batches may differ again)
  rather than assuming one pattern fits every overlay.

## Responsive breakpoint gates need explicit `viewport` overrides (Wave 3)

Two components have real CSS that only shows at a NON-default viewport —
grid-mode cards capture at a fixed 900px, so any component gated by a
breakpoint above or below that width needs `cfg.overrides.<Name>` with an
explicit `cardMode` ("single" or "column" — required for `viewport` to take
effect at all) AND `viewport`:
- **`AppShell`/`AppShellSidebar`/`AppShellHeader`/`AppShellMain`**:
  `.sb-app-shell__sidebar` is `display: none` below the `lg` breakpoint
  (1024px) — mobile pattern reuses the same markup in a Drawer. Fixed with
  `{"cardMode": "column", "viewport": "1280x800"}`.
- **`NavbarMenuButton`**: `.sb-navbar__menu-button` is the OPPOSITE — only
  visible BELOW the `md` breakpoint (768px), real mobile chrome. Fixed with
  `{"cardMode": "column", "viewport": "375x700"}` (a real mobile width, not
  just "narrower").
- **`AuthLayout`**: `{"cardMode": "column"}` (no viewport override) —
  min-block-size:100dvh full-page layout, renders correctly at default width
  but reads better full-card-width.

**Re-sync risk**: any future component gated by a breakpoint (check
`@include respond(...)` in its `.scss` partial) needs the same treatment —
grep the responsive mixin usage across `packages/design-system/src/styles/`
before assuming a floor-card or authored-but-empty render is a preview bug;
it might be a viewport mismatch instead.

## Nav/Sidebar/Footer family (Wave 3)

- `NavbarMenuButton` needed the `viewport` override above (it's the mirror
  image of `AppShell`'s sidebar — hidden ABOVE md=768px instead of below a
  breakpoint). `Navbar`/`Footer`/`Sidebar` themselves did NOT need any
  `cardMode` override despite being "page-chrome-shaped" — they compose
  fine at the default grid-mode width. `Sidebar` specifically has no width
  of its own (real usage gets it from the parent `.sb-app-shell` grid
  column) — its previews wrap it in a plain div sized to
  `var(--sb-sidebar-width)` with a hairline border, which is legitimate
  consumer-code raw-`var()` usage (not a library Sass file), consistent
  with CLAUDE.md's accessor-function rule applying only to the library's
  own Sass.
- **No general icon set exists** — `atoms/icons.tsx` ships exactly the 9
  glyphs Sorbet's own components need (Check/Chevron/Close/Search/Calendar/
  Upload/Eyedropper/Plus/Minus), not general-purpose nav icons (Dashboard/
  Settings/Bell/etc). `Icon`'s own docs invite bringing your own SVG for
  exactly this reason. When a preview needs a concept the shipped set
  doesn't cover, hand-draw a small local glyph matching the house style
  (16 viewBox, `fill="none" stroke="currentColor" strokeWidth={1.5}`,
  round caps/joins) directly in that preview file — each preview file
  compiles standalone, so duplication across files is expected, not a
  DRY violation to fix.
- `SidebarItem` icons render as a **bare `<svg>` direct child** (no `<Icon>`
  wrapper) — `_sidebar.scss` has a `.sb-sidebar__item > svg` rule sized for
  exactly that markup shape. `NavbarActions`/`NavbarMenuButton` icons DO use
  the `<Icon>` wrapper (no equivalent direct-child CSS there). Check each
  component's own `.scss` for which shape it expects — don't assume one
  icon-composition pattern fits every component.

## TokenStudio, DataTable — no surprises

`TokenStudio` (`open`/`preset`/`themeMode` props, real `Drawer`+`Tabs`+
`Accordion` internals sourced from `@sorbet/design-system/tokens`) needed
almost no manual composition — pass `open` for real (same "real code path"
technique as Popover/Menu/Drawer) and it renders its own populated UI,
including a genuine WCAG contrast report. Note: its `preset` prop is
presentational-label-only — it does NOT swap the loaded stylesheet (the
harness always loads "sorbet"), so set `preset="sorbet"` or the dropdown
label will disagree with the swatches shown. `DataTable` (organisms/table.tsx
— NOT the same file as molecules/table.tsx) composes cleanly with `Column<T>`
+ `initialSort`, sort indicators render correctly.

## Overlay/portal components consistently need `cardMode: "single"` (final tally)

Every top-layer or portal-rendered component in this sync needed a
`cardMode: "single"` override — packed grid cards clip/collide with
top-layer content (it isn't bounded by an ancestor's `overflow:hidden`),
even when an isolated single-component capture looks fine. Full list so a
re-sync (or new similar component) doesn't have to rediscover this:
`Fab`, `Popover`, `Tooltip`, `Menu`, `MenuHeading`, `MenuItem`,
`MenuSeparator`, `TokenStudio`, `Modal`, `Drawer`, `AlertDialog`,
`ConfirmProvider`, `CommandPalette`, `Combobox`, `MultiCombobox`,
`DatePicker`, `DateRange`, `ToastProvider`. **Rule of thumb for any NEW
component**: if it's built on `usePopover` (native `popover` attribute) or
`createPortal`, or shows a native `<dialog>`, assume it needs
`cardMode: "single"` and add the override proactively rather than waiting
for `[GRID_OVERFLOW]` to catch it.

**Static-open techniques by mechanism** (all "real code path", never faked):
- Explicit `open`/controlled prop (Popover, Modal, Drawer, AlertDialog,
  TokenStudio, CommandPalette): pass `open` statically, no interaction
  needed — the component's own mount effect calls the real
  `showModal()`/`showPopover()`.
- No open prop, ref forwards to the actual trigger/input (Menu, Combobox,
  MultiCombobox): `ref.current?.click()` in a mount `useEffect`.
- No open prop, ref does NOT reach the real trigger (DatePicker, DateRange —
  `DateRange`'s declared `ref` prop is dead code, never wired up in the
  component body): wrap in a plain `<div ref={wrapperRef}>` and
  `wrapperRef.current?.querySelector('.sb-<name>__trigger')?.click()` — a
  genuine DOM click via selector instead of a component-exposed ref.
- Context/imperative-API providers with no visual output of their own
  (`ThemeProvider`, `ToastProvider`, `ConfirmProvider`): nest a SECOND
  instance of the provider around a small demo component that calls the
  real hook (`useTheme()`/`useToast()`/`useConfirm()`) in a mount effect.
- Uncontrolled state with no props at all (`Dropzone`'s file list): build
  real `File` objects (fake `size` via `Object.defineProperty` to avoid
  large allocations), assign via `DataTransfer`, dispatch a genuine
  `change` event on the ref-forwarded `<input type="file">` — runs the
  component's own real validation logic, not a mocked result.

## Known render warns (triaged, expected on every re-sync)

- `[FONT_MISSING] "SF Pro Rounded"` — Apple-proprietary, can't be bundled;
  already covered by the `ui-rounded` CSS keyword earlier in the same
  font-stack (native rounded system font on Apple, no file needed). Accept
  as-is; do not chase.
- `[CSS_RUNTIME] _ds_bundle.css is the runtime-styles stub` — expected: all
  of Sorbet's real CSS ships via `tokens/` (see tokensGlob above), not via
  `cfg.cssEntry`/the JS bundle, so `_ds_bundle.css` is always an empty
  placeholder here. Not a CSS-in-JS DS despite the message wording.

## Preview-authoring techniques (learned across the fan-out batches)

- **Fixed a real product bug found while authoring**: `Chip`'s `selected`
  state was CSS-invisible in button mode — `button.sb-chip` (specificity
  0,1,1, via `control-reset`'s unconditional `background`/`color`/`font`
  resets) beat `.sb-chip--selected` (0,1,0) on every contested property, so
  a selected clickable/filter chip rendered pixel-identical to an unselected
  one. Fixed in `_chip.scss` by restating the selected look under
  `button.sb-chip[data-selected]`/`button.sb-chip.sb-chip--selected` at
  matching specificity — see PR #65. Unaffected: span-mode (removable)
  chips, which don't go through `button.sb-chip`.
- **Icon glyphs need an explicit `tone`, not just `size`.** `IconTone`
  (`atoms/icon.tsx`) has no `"default"` value — omitting `tone` leaves the
  glyph on ambient `currentColor`, which risks near-invisible renders
  (`[RENDER_THIN]`). Always pass both `size` and an explicit `tone` when
  composing a bare icon glyph preview.
- **Hover/focus-only overlay content (Tooltip, and the same likely applies
  elsewhere) renders closed by default in static capture** — the capture
  harness doesn't simulate hover or dispatch synthetic focus. Passing the
  real DOM `autoFocus` prop to the trigger element fires the component's own
  real `onFocus` handler and opens it through its genuine code path — a
  legitimate, reusable technique, not a fake/forced-open hack.
- **Popover** (anchored panel on the native Popover API, `usePopover` in
  `core/use-popover.ts`) renders correctly anchored/positioned/styled in a
  real headless-browser capture just by passing a static `open` prop (no
  `onOpenChange` needed) — its mount effect calls the real
  `showPopover()`/`positionPopover()` path. No config override needed for
  overlay components built on this hook.
- **`preview-rebuild.mjs` (what subagents use) does NOT re-copy
  tokens/CSS/fonts** — only a full `package-build.mjs` run does. A source
  CSS fix (like the Chip one above) requires an orchestrator-run full
  rebuild before a re-`package-capture.mjs` will show it; scoped subagents
  can't see the fix on their own.

## Re-sync risks

- The `tokensGlob: "**/sorbet.css"` coincidental-basename match (see above)
  is the single biggest thing that can silently go stale on a design-system
  restructure — check it first if a re-sync's previews suddenly render
  unstyled.
- Icon glyphs (`CheckIcon`, `ChevronIcon`, etc. in `atoms/icons.tsx`) are
  individually exported PascalCase functions and so are individually
  discoverable as "components" — they were left as-is (not excluded via
  `componentSrcMap`) since the README's own catalog lists them as public
  API. If they clutter the DS pane, add `null` entries to `componentSrcMap`.
