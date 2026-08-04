import { Avatar, Button, Navbar, NavbarActions, NavbarBrand, NavbarLink, NavbarNav } from "@sorbet/component-library";

/** Wordmark-only brand — the plain, most common case. */
export function Default() {
  return (
    <Navbar>
      <NavbarBrand href="#">Fizz</NavbarBrand>
      <NavbarNav>
        <NavbarLink href="#" current>
          Dashboard
        </NavbarLink>
        <NavbarLink href="#">Projects</NavbarLink>
        <NavbarLink href="#">Settings</NavbarLink>
      </NavbarNav>
      <NavbarActions>
        <Avatar size="sm">AT</Avatar>
      </NavbarActions>
    </Navbar>
  );
}

/** Brand with a small logomark ahead of the wordmark — NavbarBrand is a
 *  single <a>, so the mark and the word both live inside its children. The
 *  square Avatar (not a hand-drawn SVG) doubles as the mark here, the same
 *  low-effort logomark treatment a lot of real product headers use. */
export function WithMark() {
  return (
    <Navbar>
      <NavbarBrand href="#" style={{ display: "inline-flex", alignItems: "center", gap: "var(--sb-space-2)" }}>
        <Avatar square size="sm">
          F
        </Avatar>
        Fizz
      </NavbarBrand>
      <NavbarNav>
        <NavbarLink href="#">Dashboard</NavbarLink>
        <NavbarLink href="#" current>
          Projects
        </NavbarLink>
      </NavbarNav>
      <NavbarActions>
        <Button size="sm" variant="outline">
          Invite teammate
        </Button>
      </NavbarActions>
    </Navbar>
  );
}
