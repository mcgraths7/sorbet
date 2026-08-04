import { Avatar, Navbar, NavbarActions, NavbarBrand, NavbarLink, NavbarNav } from "@sorbet/component-library";

/** Typical primary nav: four links, one current. Hidden below the md
 *  breakpoint (pair with a Drawer behind NavbarMenuButton for mobile) — the
 *  default ~900px capture width is comfortably above md, so it renders. */
export function Default() {
  return (
    <Navbar>
      <NavbarBrand href="#">Fizz</NavbarBrand>
      <NavbarNav>
        <NavbarLink href="#" current>
          Dashboard
        </NavbarLink>
        <NavbarLink href="#">Projects</NavbarLink>
        <NavbarLink href="#">Reports</NavbarLink>
        <NavbarLink href="#">Settings</NavbarLink>
      </NavbarNav>
      <NavbarActions>
        <Avatar size="sm">AT</Avatar>
      </NavbarActions>
    </Navbar>
  );
}

/** A longer link set — NavbarNav keeps the row aligned and evenly spaced as
 *  more sections get added, with a custom aria-label for the landmark. */
export function Extended() {
  return (
    <Navbar>
      <NavbarBrand href="#">Fizz</NavbarBrand>
      <NavbarNav aria-label="Primary">
        <NavbarLink href="#">Dashboard</NavbarLink>
        <NavbarLink href="#">Projects</NavbarLink>
        <NavbarLink href="#" current>
          Reports
        </NavbarLink>
        <NavbarLink href="#">Team</NavbarLink>
        <NavbarLink href="#">Billing</NavbarLink>
        <NavbarLink href="#">Settings</NavbarLink>
      </NavbarNav>
      <NavbarActions>
        <Avatar size="sm">MC</Avatar>
      </NavbarActions>
    </Navbar>
  );
}
