import { Avatar, Cluster, Sidebar, SidebarFooter, SidebarHeading, SidebarItem, Text } from "@sorbet/component-library";

// Same local icon set as Sidebar.tsx — see that file for the "bring your own
// SVG" rationale and the unwrapped-svg (no <Icon>) reasoning.
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

const rail = {
  width: "var(--sb-sidebar-width)",
  borderInlineEnd: "1px solid var(--sb-border-subtle)",
  background: "var(--sb-surface)",
} as const;

/** Two headings group the rail into "Workspace" and "Admin" sections — the
 *  IA-grouping job SidebarHeading exists to do. */
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
        <SidebarHeading>Admin</SidebarHeading>
        <SidebarItem href="#">
          <UserIcon /> Members
        </SidebarItem>
        <SidebarItem href="#">
          <CardIcon /> Billing
        </SidebarItem>
      </Sidebar>
    </div>
  );
}

/** A single group — one heading above a short item list, the minimal case
 *  (`:first-child` gets tighter top padding in `_sidebar.scss`). */
export function SingleGroup() {
  return (
    <div style={rail}>
      <Sidebar aria-label="Sections">
        <SidebarHeading>Shortcuts</SidebarHeading>
        <SidebarItem href="#" current>
          <GridIcon /> Overview
        </SidebarItem>
        <SidebarItem href="#">
          <FolderIcon /> My files
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
