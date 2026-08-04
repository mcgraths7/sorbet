import { Avatar, Badge, Cluster, Sidebar, SidebarFooter, SidebarHeading, SidebarItem, Text } from "@sorbet/component-library";

// Sidebar nav glyphs aren't in the shipped set (atoms/icons.tsx draws only
// the glyphs Sorbet's own components need) — Icon/SidebarItem's own docs
// invite bringing your own SVG, so a small house-style set (16 viewBox, 1.5
// stroke, round caps/joins, currentColor) lives locally. `.sb-sidebar__item
// > svg` sizes a bare direct-child svg itself, so these render unwrapped
// (no <Icon>), matching the documented BEM markup in _sidebar.scss.
function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  );
}
function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 4.5a1 1 0 0 1 1-1h3.1l1.3 1.5H13a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7.5Z" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 14V9M6 14V5M10 14V7M14 14V2" />
    </svg>
  );
}
function SlidersIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 5h7M11 5h3M2 11h3M7 11h7" />
      <circle cx="9" cy="5" r="1.5" />
      <circle cx="5" cy="11" r="1.5" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    </svg>
  );
}
function CardIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1.5" y="4" width="13" height="9" rx="1.5" />
      <path d="M1.5 7h13" />
    </svg>
  );
}

// Sidebar is a navigation rail, not a full-bleed block — real usage sizes it
// via .sb-app-shell's `grid-template-columns: token(sidebar-width) 1fr`
// (AppShell is a different batch's territory). This wrapper mirrors that
// same token/border/surface treatment standalone, a "reasonably constrained
// width" composition per the assignment rather than letting a bare <nav>
// stretch to the full card width.
const rail = {
  width: "var(--sb-sidebar-width)",
  borderInlineEnd: "1px solid var(--sb-border-subtle)",
  background: "var(--sb-surface)",
} as const;

/** One section: heading, four items (one current), a signed-in footer row. */
export function Default() {
  return (
    <div style={rail}>
      <Sidebar aria-label="Primary">
        <SidebarHeading>Workspace</SidebarHeading>
        <SidebarItem href="#" current>
          <GridIcon /> Dashboard
        </SidebarItem>
        <SidebarItem href="#">
          <FolderIcon /> Projects
        </SidebarItem>
        <SidebarItem href="#">
          <ChartIcon /> Reports
        </SidebarItem>
        <SidebarItem href="#">
          <SlidersIcon /> Settings
        </SidebarItem>
        <SidebarFooter>
          <Cluster gap={2}>
            <Avatar size="sm">AT</Avatar>
            <Text size="sm" tone="muted">
              Ava Thornton
            </Text>
          </Cluster>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}

/** Grouped sections via two SidebarHeadings — a "Workspace" IA plus an
 *  "Admin" group, with a badge count on one item. */
export function Grouped() {
  return (
    <div style={rail}>
      <Sidebar aria-label="Primary">
        <SidebarHeading>Workspace</SidebarHeading>
        <SidebarItem href="#" current>
          <GridIcon /> Dashboard
        </SidebarItem>
        <SidebarItem href="#">
          <FolderIcon /> Projects
        </SidebarItem>
        <SidebarItem href="#">
          <ChartIcon /> Reports <Badge tone="primary">3</Badge>
        </SidebarItem>
        <SidebarHeading>Admin</SidebarHeading>
        <SidebarItem href="#">
          <UserIcon /> Members
        </SidebarItem>
        <SidebarItem href="#">
          <CardIcon /> Billing
        </SidebarItem>
        <SidebarItem href="#">
          <SlidersIcon /> Settings
        </SidebarItem>
        <SidebarFooter>
          <Cluster gap={2}>
            <Avatar size="sm">AT</Avatar>
            <Text size="sm" tone="muted">
              Ava Thornton
            </Text>
          </Cluster>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
