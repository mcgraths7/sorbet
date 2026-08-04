import { Avatar, Button, Icon, Navbar, NavbarActions, NavbarBrand, NavbarLink, NavbarNav, SearchIcon } from "@sorbet/component-library";

// Bell glyph isn't in the shipped set (atoms/icons.tsx draws only the glyphs
// Sorbet's own components need) — Icon's own docs invite bringing your own
// SVG ("a Lucide/Phosphor/Heroicons icon, or your own"), so a small
// house-style glyph (16 viewBox, 1.5 stroke, round caps/joins) lives locally.
function BellIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2.5c-2 0-3.3 1.6-3.3 3.8v2c0 .8-.3 1.5-.9 2.1l-.5.5h9.4l-.5-.5c-.6-.6-.9-1.3-.9-2.1v-2c0-2.2-1.3-3.8-3.3-3.8Z" />
      <path d="M6.5 13a1.5 1.5 0 0 0 3 0" />
    </svg>
  );
}

/** The everyday shape: brand, primary nav with one current link, and a
 *  couple of icon actions plus the signed-in avatar. */
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

/** No NavbarNav at all — a marketing/landing header: brand plus a
 *  sign-in/get-started pair pushed to the row's end by NavbarActions. */
export function Marketing() {
  return (
    <Navbar>
      <NavbarBrand href="#">Fizz</NavbarBrand>
      <NavbarActions>
        <Button variant="ghost">Sign in</Button>
        <Button>Get started</Button>
      </NavbarActions>
    </Navbar>
  );
}

/** A tighter internal-tool shape: three links, a single trailing avatar. */
export function Compact() {
  return (
    <Navbar>
      <NavbarBrand href="#">Fizz</NavbarBrand>
      <NavbarNav>
        <NavbarLink href="#">Overview</NavbarLink>
        <NavbarLink href="#" current>
          Projects
        </NavbarLink>
        <NavbarLink href="#">Team</NavbarLink>
      </NavbarNav>
      <NavbarActions>
        <Avatar size="sm">MC</Avatar>
      </NavbarActions>
    </Navbar>
  );
}
