## Working with Sorbet

Sorbet is a props-driven React library, **not** a utility-class system — there is no Tailwind-style class vocabulary to memorize. Every visual choice (variant, size, tone, spacing) is a typed React prop; you never write a `className` for styling (it exists only as a passthrough escape hatch on most components).

### Wrap the app once

Every screen needs `<ThemeProvider>` at the root — it manages dark mode (`data-theme` on `<html>`) and is required context for several components (e.g. `TokenStudio`). Load the stylesheet once, globally, before anything renders:

```html
<link rel="stylesheet" href="styles.css">
<script src="_ds_bundle.js"></script>
```
```jsx
const { ThemeProvider, AppShell, Navbar, Button } = window.Sorbet;

function App() {
  return (
    <ThemeProvider>
      {/* your screen */}
    </ThemeProvider>
  );
}
```

A handful of components ship their **own** nested provider for imperative APIs — compose them where their feature is used, not at the root: `ToastProvider` (+ `useToast()`), `ConfirmProvider` (+ `useConfirm()`).

### Layout owns all spacing

Atoms and molecules carry **zero margin** by design — never rely on a component's own whitespace. Compose screens with the layout primitives, which own every gap: `Stack` (vertical), `Cluster` (horizontal, wrapping), `Grid` (`cols`, `gap` — gap is a numeric step like `4`, not a string), `Split` (two-pane, `SplitAside`+`SplitMain` children), `Center`, `Cover` (full-height hero/split), `Container`, `Frame` (fixed aspect-ratio box), `Masonry`. These take real typed props, not classes.

A few layout primitives also expose **component knobs** — plain (unprefixed) CSS custom properties as a per-instance escape hatch for values with no prop, e.g. `<Split style={{ '--aside': '20rem' }}>`, `<Drawer style={{ '--drawer-size': '28rem' }}>`. These are real, intentional API — set them via inline `style`, never hardcode the pixel value elsewhere.

### Design tokens: CSS custom properties, `--sb-*`

For the rare one-off style a prop doesn't cover, tokens are real, themeable CSS custom properties — read them from `tokens/dist/themes/sorbet.css`, never hardcode a color/space/radius. Common families, with real names from the shipped tokens:

- **Color roles** (each has `-hover`/`-active`/`-subtle`/`-text` variants): `--sb-primary`, `--sb-secondary`, `--sb-accent`, `--sb-danger`, `--sb-warning`, `--sb-success`, `--sb-info`
- **Surface / text / border**: `--sb-surface`, `--sb-surface-raised`, `--sb-surface-sunken`, `--sb-bg`, `--sb-text`, `--sb-text-muted`, `--sb-text-subtle`, `--sb-border`, `--sb-border-subtle`
- **Spacing** (4px scale): `--sb-space-0` … `--sb-space-32`
- **Radius**: `--sb-radius-xs` … `--sb-radius-xl`, `--sb-radius-full`
- **Type**: `--sb-font-sans`, `--sb-font-display`, `--sb-font-mono`, `--sb-text-xs` … `--sb-text-5xl`, `--sb-weight-regular/medium/bold/black`
- **Charts**: `--sb-chart-1` … `--sb-chart-8` (fixed slot order — never reassign by rank), `--sb-chart-muted`

### Where the truth lives

- `styles.css` — the one stylesheet to link; its `@import` chain carries all real component CSS and the "sorbet" preset's token values.
- `tokens/dist/themes/sorbet.css` — every `--sb-*` custom property, real values.
- `components/<group>/<Name>/<Name>.prompt.md` — per-component usage doc with real prop types and example JSX. Read it before using any component you haven't used yet.

### A real composition

`AppShell` is children-based, not prop-based — compose `AppShellHeader`/`AppShellSidebar`/`AppShellMain` directly inside it:

```jsx
<ThemeProvider>
  <AppShell>
    <AppShellHeader>
      <Navbar>
        <NavbarBrand href="/">Acme</NavbarBrand>
      </Navbar>
    </AppShellHeader>
    <AppShellSidebar>
      <Sidebar aria-label="Workspace">
        <SidebarItem href="/" current>Overview</SidebarItem>
      </Sidebar>
    </AppShellSidebar>
    <AppShellMain>
      <Stack gap={6}>
        <Heading level={1}>Overview</Heading>
        <Grid cols={3} gap={4}>
          <Card><CardBody><Stat label="Revenue" value="$24.1k" /></CardBody></Card>
        </Grid>
      </Stack>
    </AppShellMain>
  </AppShell>
</ThemeProvider>
```
