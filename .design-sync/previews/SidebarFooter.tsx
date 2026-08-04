import { Avatar, Button, Cluster, Sidebar, SidebarFooter, SidebarHeading, SidebarItem, Text } from "@sorbet/component-library";

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

const rail = {
  width: "var(--sb-sidebar-width)",
  borderInlineEnd: "1px solid var(--sb-border-subtle)",
  background: "var(--sb-surface)",
} as const;

/** The common shape: avatar + name, pinned to the rail's bottom edge by
 *  `margin-block-start: auto` with a top divider. */
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

/** Account row plus an action — name/role on one side, a sign-out button
 *  pushed to the other by Cluster's `justify="between"`. */
export function WithAction() {
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
        <SidebarFooter>
          <Cluster gap={2} justify="between" align="center">
            <Cluster gap={2}>
              <Avatar size="sm">MC</Avatar>
              <Text size="sm" tone="muted">
                Mateo Cruz
              </Text>
            </Cluster>
            <Button size="sm" variant="ghost">
              Sign out
            </Button>
          </Cluster>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}
