# Sorbet 🍧

A fun, themeable, **accessibility-first design system**. A Sass + TypeScript core
with typed React bindings for every atomic-design layer, shipped as scoped
packages. Five presets, light + dark for each, and a WCAG AA contrast contract
that is *enforced at build time* — an inaccessible theme literally fails the build.

```sh
npm install
npm run build            # tokens → themes, Sass → css, tsc → every package
npm run playground       # React kitchen sink (Vite, port 5183)
```

---

## Table of contents

1. [Packages](#packages)
2. [Philosophy](#philosophy)
3. [Monorepo at a glance](#monorepo-at-a-glance)
4. [Using Sorbet in a React app](#using-sorbet-in-a-react-app)
5. [Using Sorbet without a framework](#using-sorbet-without-a-framework)
6. [Design tokens](#design-tokens)
7. [Theming: presets & dark mode](#theming-presets--dark-mode)
8. [The accessibility contract](#the-accessibility-contract)
9. [Atomic design: how to put components together](#atomic-design-how-to-put-components-together)
10. [Recipes](#recipes)
11. [The CLI](#the-cli)
12. [Extending the system](#extending-the-system)
13. [Component catalog](#component-catalog)

---

## Packages

| Package | What's inside |
| --- | --- |
| `@sorbet/tokens` | The source of truth: OKLCH ramps, contrast-driven semantics, presets, scales, WCAG rules, emitters |
| `@sorbet/styles` | The compiled stylesheet (`/css`), per-preset theme files (`/themes/*`), and the Sass source (`/scss/*`) |
| `@sorbet/behaviors` | Framework-agnostic progressive enhancement (theme, tabs, dialogs, menus, toasts) — zero dependencies |
| `@sorbet/core` | React plumbing shared by the layers: `cx`, tones, polymorphic prop types, `composeRefs` |
| `@sorbet/layout` | React layout primitives: `Container`, `Stack`, `Cluster`, `Grid`, `Split`, `Center`, `Cover` |
| `@sorbet/atoms` | React atoms: `Button`, `Input`, `Select`, `Checkbox`, `Switch`, `Badge`, `Avatar`, `Progress`, `Tooltip`, … |
| `@sorbet/molecules` | React molecules: `Field`, `Card`, `Alert`, `Tabs`, `Menu`, `Accordion`, `Pagination`, `ToastProvider`, … |
| `@sorbet/organisms` | React organisms: `Navbar`, `Sidebar`, `Modal`, `Drawer`, `DataTable`, `Footer` |
| `@sorbet/templates` | React page frames: `AppShell`, `AuthLayout` |
| `@sorbet/react` | The umbrella: re-exports every layer + `ThemeProvider`/`useTheme` |
| `@sorbet/cli` | The `sorbet` CLI: scaffold a standalone design system, emit themes, generate component stubs |

Install the umbrella, or cherry-pick layers — every React package peer-depends
on `react@^19` and pulls only the layers beneath it.

## Philosophy

Four rules, ruthlessly applied:

1. **Every value is a token.** Components never contain a raw hex color, pixel
   value, or font stack. Sass goes through validated accessor functions
   (`clr(primary)`, `space(4)`); React components emit the same `sb-` classes.
   A typo'd token is a build error, not a silently broken UI.

2. **Layout owns spacing.** Atoms and molecules have **zero margins**. A button
   never knows how far it sits from its neighbor — a layout primitive (`Stack`,
   `Cluster`, `Grid`, `Split`) places and spaces it. This is what makes any
   component composable anywhere without spacing fights.

3. **Accessibility is a contract, not a hope.** Semantic color pairings are
   chosen *by measured contrast* and re-verified on every build across every
   preset × mode. Focus rings, `:user-invalid`, reduced-motion, and ARIA
   patterns are built into the components — both flavors.

4. **The platform first.** Modals are native `<dialog>`. Menus and tooltips ride
   the Popover API. Accordions are `<details name>`. Entry/exit animations use
   `@starting-style` + `allow-discrete`. Textareas autosize with `field-sizing`.
   The React components are thin state wrappers over those primitives, not
   re-implementations.

## Monorepo at a glance

```
packages/
├── tokens/       TS token engine (color math, ramps, semantics, presets, rules)
├── styles/       Sass source + build (themes CSS + sorbet.css) — depends on tokens
├── behaviors/    vanilla TS behaviors (no dependencies)
├── core/         React shared plumbing
├── layout/       React ── the atomic layers, one package each,
├── atoms/        React ──   all thin typed wrappers over the same
├── molecules/    React ──   sb- classes compiled from styles
├── organisms/    React ──
├── templates/    React ──
├── react/        umbrella re-export + ThemeProvider
└── cli/          the `sorbet` binary + scaffold templates
apps/
└── playground/   Vite React kitchen sink (npm run playground)
demo/             no-framework kitchen sink (python3 -m http.server, /demo/)
```

Build order is dependency order; the root `npm run build` handles it. The key
property: **the stylesheet compiles once and is shared by both worlds** — the
vanilla demo and the React playground load the same `sorbet.css` and theme
files, so the two flavors can never drift apart visually.

## Using Sorbet in a React app

```tsx
import "@sorbet/styles/css";                 // the system, once
import "@sorbet/styles/themes/sorbet.css";   // a preset (or swap at runtime)
import { ThemeProvider, ToastProvider, Button, Field, Input, Stack, useToast } from "@sorbet/react";

function Signup() {
  const toast = useToast();
  return (
    <Stack gap={4} as="form">
      <Field label="Email" hint="We'll never share it." required>
        <Input type="email" required />
      </Field>
      <Button type="submit" onClick={() => toast("Welcome!", { tone: "success" })}>
        Create account
      </Button>
    </Stack>
  );
}

createRoot(root).render(
  <ThemeProvider>
    <ToastProvider>
      <Signup />
    </ToastProvider>
  </ThemeProvider>,
);
```

Highlights of the React API:

- **React 19 native**: `ref` is a normal prop everywhere — no `forwardRef` noise.
- **Polymorphic where it matters**: `<Button as="a" href>`, `<Stack as="section">`,
  `<SidebarItem as={Link} to>` for router integration.
- **Controlled or uncontrolled**: `Tabs` takes `value`/`onValueChange` or
  `defaultValue`; form atoms are plain native inputs underneath.
- **`Field` does the ARIA plumbing**: it generates ids, wires
  `aria-describedby` to the hint/error, and toggles `aria-invalid`.
- **`Modal`/`Drawer` are native dialogs**: `open`/`onClose` props over
  `showModal()`, so focus trapping, Escape and the backdrop come from the
  platform; light dismiss is on by default (`static` opts out).
- **`Menu`** rides the Popover API: `trigger={<Button…>}` gets `popoverTarget`
  cloned on; arrow keys, shortcuts and danger items included.
- **`DataTable`** is data-driven: typed `columns`, `sortValue`, custom cell
  renderers, `aria-sort` handled.
- **`useTheme()`**: `{ mode, resolved, set, toggle }`, persisted, live-tracking
  the OS in `system` mode.

## Using Sorbet without a framework

Everything works with plain HTML classes plus the optional behavior layer:

```html
<link rel="stylesheet" href="node_modules/@sorbet/styles/dist/themes/ocean.css">
<link rel="stylesheet" href="node_modules/@sorbet/styles/dist/css/sorbet.css">
<script type="module">
  import { init } from "@sorbet/behaviors";
  init(); // wires [data-sb] tabs, modals, menus, tooltips, sortable tables, masonry
</script>

<button class="sb-button sb-button--soft">It's just classes</button>
```

The class-level markup contracts are documented in the Sass partials and
showcased in [demo/index.html](demo/index.html).

## Design tokens

Tokens are defined once in TypeScript (`@sorbet/tokens`) and emitted as CSS
custom properties with the `--sb-` prefix. In Sass, accessor functions validate
every token name at compile time:

| Sass | Emits | Examples |
| --- | --- | --- |
| `clr(primary)` | `var(--sb-primary)` | `bg`, `surface`, `text-muted`, `danger-subtle`, `on-primary` |
| `space(4)` | `var(--sb-space-4)` | `0, px, 1…32` (4 px base scale, rem units) |
| `fs(2xl)` | `var(--sb-text-2xl)` | `xs…5xl` — the display end is fluid via `clamp()` |
| `fw(semibold)` / `lh(tight)` / `ls(wide)` | weights / line-heights / tracking |
| `font(display)` | `var(--sb-font-display)` | `sans`, `display`, `mono` |
| `radius(md)` | `var(--sb-radius-md)` | `xs…xl, full` — scaled per preset personality |
| `shadow(lg)` | `var(--sb-shadow-lg)` | `xs…xl`, tinted per preset, retuned in dark |
| `dur(fast)` / `ease(spring)` | motion | `fast/base/slow/slower`, `out/in-out/spring` |
| `z(modal)` | `var(--sb-z-modal)` | `dropdown < sticky < overlay < modal < popover < toast < tooltip` |
| `respond(md) { … }` | `@media (min-width: 48em)` | `sm 40em · md 48em · lg 64em · xl 80em · 2xl 96em` |

Semantic color roles (the only colors components may use):

- **Surfaces** — `bg`, `bg-subtle`, `surface`, `surface-raised`, `surface-sunken`, `scrim`
- **Content** — `text`, `text-muted`, `text-subtle`, `text-inverse`, `link`, `link-hover`
- **Lines** — `border`, `border-subtle`, `border-strong` (≥3:1, safe for inputs), `focus-ring`
- **Brand** — `primary` (+ `-hover`, `-active`, `-subtle`, `-text`, `on-primary`), same for `secondary` and `accent`
- **Status** — `success`, `warning`, `danger`, `info` (+ `-hover`, `-subtle`, `-text`, `on-*`)

## Theming: presets & dark mode

Five presets ship out of the box:

| Preset | Personality | Radius | Default mode |
| --- | --- | --- | --- |
| **sorbet** *(default)* | Light & fun — raspberry, mint, grape on a warm page | round | light |
| **ocean** | Clean corporate SaaS — confident blues on white | soft | system |
| **forest** | Organic — deep greens, terracotta, serif display | soft | light |
| **noir** | Minimal editorial monochrome + one lemon accent | sharp | system |
| **midnight** | Sleek & electric — violet and cyan, dark-first | soft | dark |

**Switching presets** = swapping one small CSS file
(`@sorbet/styles/themes/<name>.css`). Nothing else changes — components are
preset-agnostic.

**Dark mode** is dual-path in every theme file: explicit `data-theme="dark"` on
`<html>`, otherwise `prefers-color-scheme` decides. In React, `ThemeProvider`
owns the attribute + persistence and `useTheme()` exposes
`{ mode, resolved, set, toggle }`; without a framework, `@sorbet/behaviors`
ships the equivalent `getTheme()` manager.

## The accessibility contract

`@sorbet/tokens` declares 47 contrast pairings — text on every surface, `on-*`
on every solid (including hover/active), `-text` on page + subtle fills, links,
strong borders, focus rings. Every build measures all of them for **every
preset in both modes** and fails on any regression:

```sh
npm run check:contrast    # per-preset, per-mode report with tightest margins
```

Beyond color: visible `:focus-visible` rings everywhere, `prefers-reduced-motion`
collapses all animation, form errors use `:user-invalid` (only after
interaction), inputs keep ≥3:1 borders, tables get `aria-sort`, toasts announce
via a polite live region, and dialogs/menus ride native focus management.

## Atomic design: how to put components together

```
tokens → layout primitives → atoms → molecules → organisms → templates → pages
```

The composition algorithm, in practice — identical in both flavors:

1. Start from a template (`AppShell`, `AuthLayout`) or a `Container`.
2. Establish vertical rhythm with `Stack` (choose a gap per zone).
3. Lay out rows with `Cluster` (toolbars, button rows) and card grids with `Grid`.
4. Drop molecules/atoms into the slots. Never add margins to them — if two
   things are too close, the *container's* gap is wrong.
5. React: wrap the app in `ThemeProvider` + `ToastProvider`.
   Vanilla: call `init()` once.

## Recipes

### An app shell (React)

```tsx
<AppShell>
  <AppShellHeader>
    <Navbar>
      <NavbarBrand href="/">Fizz</NavbarBrand>
      <NavbarNav>
        <NavbarLink href="/projects" current>Projects</NavbarLink>
        <NavbarLink href="/reports">Reports</NavbarLink>
      </NavbarNav>
      <NavbarActions>
        <Avatar size="sm">SM</Avatar>
      </NavbarActions>
    </Navbar>
  </AppShellHeader>

  <AppShellSidebar>
    <Sidebar>
      <SidebarHeading>Workspace</SidebarHeading>
      <SidebarItem href="/projects" current>
        Projects <Badge tone="primary">12</Badge>
      </SidebarItem>
    </Sidebar>
  </AppShellSidebar>

  <AppShellMain>
    <Container>
      <Stack gap={8}>
        <Cluster justify="between">
          <h1>Projects</h1>
          <Button>New project</Button>
        </Cluster>
        <Grid>{/* cards */}</Grid>
      </Stack>
    </Container>
  </AppShellMain>
</AppShell>
```

The sidebar column exists at `lg+`; below that, put the same `<Sidebar>` inside
a `<Drawer side="start">` behind a `NavbarMenuButton`.

### A confirm dialog (React)

```tsx
const [open, setOpen] = useState(false);

<Button variant="danger" onClick={() => setOpen(true)}>Delete…</Button>

<Modal open={open} onClose={() => setOpen(false)} size="sm">
  <ModalHeader onClose={() => setOpen(false)}><h2>Delete project?</h2></ModalHeader>
  <ModalBody><p>This cannot be undone.</p></ModalBody>
  <ModalFooter>
    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
    <Button variant="danger" onClick={confirmDelete}>Delete</Button>
  </ModalFooter>
</Modal>
```

### A data table (React)

```tsx
const columns: Column<Invoice>[] = [
  { key: "id", header: "Invoice", sortable: true },
  { key: "status", header: "Status", render: (r) => <Badge tone={TONE[r.status]}>{r.status}</Badge> },
  { key: "amount", header: "Amount", numeric: true, sortable: true,
    render: (r) => currency(r.amount) },
];

<DataTable columns={columns} data={invoices} rowKey={(r) => r.id} hover
           initialSort={{ key: "amount", direction: "descending" }} />
```

### A photo wall (React)

```tsx
<Masonry min="12rem" gap={3}>
  {photos.map((p) => (
    <Card key={p.id} variant="flat">
      <Frame ratio={p.ratio}>
        <img src={p.src} alt={p.alt} loading="lazy" />
      </Frame>
    </Card>
  ))}
</Masonry>
```

Masonry is progressive: CSS multi-columns with zero JS, native CSS masonry
where the browser has it, and everywhere else a balanced grid that preserves
DOM order (so tab order matches what you see) while `ResizeObserver` tracks
image loads and resizes. `Frame` is the aspect-ratio box that keeps tiles from
reflowing as media arrives — handy well beyond masonry. Vanilla flavor:
`<div class="sb-masonry" data-sb="masonry">…</div>`.

### A self-validating form (no framework)

```html
<form class="sb-card">
  <div class="sb-card__body sb-grid sb-grid--cols-2">
    <div class="sb-field">
      <label class="sb-label" for="name" data-required>Full name</label>
      <input class="sb-input" id="name" required>
      <p class="sb-field__hint">As it appears on your profile.</p>
      <p class="sb-field__error">Name is required.</p>
    </div>
  </div>
  <div class="sb-card__footer">
    <button class="sb-button" type="submit">Save</button>
  </div>
</form>
```

No JS: the error reveals via `:has(:user-invalid)` after interaction, and the
hint hides while the error shows. The React `Field` produces the same markup.

## The CLI

```
sorbet create <dir> [--preset <name>] [--name <brand>]   scaffold a standalone project
sorbet theme <preset> [--out <file>]                     emit one preset's theme CSS
sorbet component <Name> [--level atom|molecule|organism] [--behavior]
sorbet presets                                           list presets w/ swatches
sorbet contrast                                          run the WCAG AA report
```

Run it from the monorepo with `node packages/cli/dist/index.js …` (or via the
`sorbet` bin once installed). `sorbet create` is shadcn-style: it copies the
token engine, Sass, and behaviors **into** the target as a standalone,
buildable project with your chosen preset baked in — the code is yours to
evolve, no dependency on this repo.

## Extending the system

**Change brand colors** — edit a preset in `packages/tokens/src/presets.ts`
(swap which ramps map to `primary`/`secondary`/`accent`, or add a ramp with a
hue + chroma). Rebuild; the contrast contract re-verifies.

**Add a preset** — one entry in `presets.ts` buys you light + dark modes, a
theme file, manifest + CLI support, and contract enforcement.

**Add a component** — Sass partial first (tokens only, registered in the right
`@layer` block of `packages/styles/src/index.scss`), then a thin React wrapper
in the matching layer package. `sorbet component` stubs the Sass side.

**Override styles** — just write CSS. Sorbet lives in cascade layers
(`sb.reset` → … → `sb.utilities`), so any unlayered rule you write wins.

## Component catalog

**Layout** Container · Stack(+Push) · Cluster(+Push) · Grid(+Span2) · Split(+Aside/Main) · Center · Cover · Masonry · Frame
**Atoms** Button (8 variants × 3 sizes, loading, icon, polymorphic) · Input · Textarea (autosize) · Select · Checkbox (indeterminate) · Radio · Switch · Choice · Label · Badge · Chip · Avatar(+Group) · Spinner · Progress (+indeterminate) · Skeleton · Divider · Kbd · Tooltip
**Molecules** Field · InputGroup(+Addon) · Card (header/body/footer/media/title, 5 variants) · Alert · Tabs/TabList/Tab/TabPanel · Menu (heading/item/separator) · Accordion(+Item) · Breadcrumb(+Item) · Pagination · ToastProvider/useToast · Stat · EmptyState
**Organisms** Navbar (brand/nav/link/actions/menu-button) · Sidebar (heading/item/footer) · Modal · Drawer · DataTable · Footer (cols/col/meta)
**Templates** AppShell (header/sidebar/main) · AuthLayout
**Providers** ThemeProvider/useTheme · ToastProvider/useToast

---

*Sorbet — scooped with care. MIT.*
