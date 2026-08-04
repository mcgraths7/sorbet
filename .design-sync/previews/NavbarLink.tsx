import { Avatar, Navbar, NavbarActions, NavbarBrand, NavbarLink, NavbarNav } from "@sorbet/component-library";

/** `current` renders aria-current="page" — Sorbet styles it with the
 *  primary-subtle background/text pairing against the plain muted links. */
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

/** current moves with the route — same links, active state on "Reports"
 *  instead of the first item. */
export function ActiveReports() {
  return (
    <Navbar>
      <NavbarBrand href="#">Fizz</NavbarBrand>
      <NavbarNav>
        <NavbarLink href="#">Dashboard</NavbarLink>
        <NavbarLink href="#">Projects</NavbarLink>
        <NavbarLink href="#" current>
          Reports
        </NavbarLink>
        <NavbarLink href="#">Settings</NavbarLink>
      </NavbarNav>
      <NavbarActions>
        <Avatar size="sm">AT</Avatar>
      </NavbarActions>
    </Navbar>
  );
}

/** No `current` at all — the plain, un-visited state most links render in
 *  most of the time. */
export function NoneActive() {
  return (
    <Navbar>
      <NavbarBrand href="#">Fizz</NavbarBrand>
      <NavbarNav>
        <NavbarLink href="#">Dashboard</NavbarLink>
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
