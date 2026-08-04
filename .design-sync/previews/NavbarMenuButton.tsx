import { Button, Icon, Navbar, NavbarActions, NavbarBrand, NavbarMenuButton } from "@sorbet/component-library";

// Hamburger glyph isn't in the shipped set — see Navbar.tsx for the same
// "bring your own SVG" note; same house style (16 viewBox, 1.5 stroke).
function MenuIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 4.5h12M2 8h12M2 11.5h12" />
    </svg>
  );
}

// KNOWN LIMITATION (see learnings): `.sb-navbar__menu-button` is only
// visible BELOW the md breakpoint (`@include respond(md) { display: none }`
// in _navbar.scss) — real mobile chrome. This harness's capture viewport is
// fixed at 900x700 for grid-mode cards (well above md=48em/768px), and a
// narrower viewport requires a cfg.overrides single/column entry this batch
// is not permitted to add. The composition below is the correct honest
// usage (brand + hamburger, no NavbarNav) regardless of what the fixed-width
// capture shows.
export function Default() {
  return (
    <Navbar>
      <NavbarBrand href="#">Fizz</NavbarBrand>
      <NavbarMenuButton>
        <Button iconOnly variant="ghost" aria-label="Open menu">
          <Icon size="md" tone="muted">
            <MenuIcon />
          </Icon>
        </Button>
      </NavbarMenuButton>
    </Navbar>
  );
}

/** Paired with a trailing action — the shape a real mobile header takes:
 *  brand, one primary action, hamburger last. */
export function WithActions() {
  return (
    <Navbar>
      <NavbarBrand href="#">Fizz</NavbarBrand>
      <NavbarActions>
        <Button size="sm">New</Button>
      </NavbarActions>
      <NavbarMenuButton>
        <Button iconOnly variant="ghost" aria-label="Open menu">
          <Icon size="md" tone="muted">
            <MenuIcon />
          </Icon>
        </Button>
      </NavbarMenuButton>
    </Navbar>
  );
}
