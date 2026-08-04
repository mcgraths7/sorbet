import { Avatar, Button, Icon, Navbar, NavbarActions, NavbarBrand, NavbarLink, NavbarNav, SearchIcon } from "@sorbet/component-library";

// Bell glyph isn't in the shipped set — see Navbar.tsx for the same note.
function BellIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2.5c-2 0-3.3 1.6-3.3 3.8v2c0 .8-.3 1.5-.9 2.1l-.5.5h9.4l-.5-.5c-.6-.6-.9-1.3-.9-2.1v-2c0-2.2-1.3-3.8-3.3-3.8Z" />
      <path d="M6.5 13a1.5 1.5 0 0 0 3 0" />
    </svg>
  );
}

/** Icon actions (search, notifications) plus the signed-in avatar — pushed
 *  to the row's end automatically by NavbarActions' margin-inline-start:auto. */
export function Default() {
  return (
    <Navbar>
      <NavbarBrand href="#">Fizz</NavbarBrand>
      <NavbarNav>
        <NavbarLink href="#" current>
          Dashboard
        </NavbarLink>
        <NavbarLink href="#">Projects</NavbarLink>
      </NavbarNav>
      <NavbarActions>
        <Button iconOnly variant="ghost" size="sm" aria-label="Search">
          <Icon size="sm" tone="muted">
            <SearchIcon />
          </Icon>
        </Button>
        <Button iconOnly variant="ghost" size="sm" aria-label="Notifications">
          <Icon size="sm" tone="muted">
            <BellIcon />
          </Icon>
        </Button>
        <Avatar size="sm">AT</Avatar>
      </NavbarActions>
    </Navbar>
  );
}

/** A signed-out pair: ghost "Sign in" + primary "Get started" — the
 *  marketing-header shape for NavbarActions. */
export function SignedOut() {
  return (
    <Navbar>
      <NavbarBrand href="#">Fizz</NavbarBrand>
      <NavbarNav>
        <NavbarLink href="#">Product</NavbarLink>
        <NavbarLink href="#">Pricing</NavbarLink>
      </NavbarNav>
      <NavbarActions>
        <Button variant="ghost">Sign in</Button>
        <Button>Get started</Button>
      </NavbarActions>
    </Navbar>
  );
}
