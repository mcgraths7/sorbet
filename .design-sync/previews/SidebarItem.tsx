import { Badge, Sidebar, SidebarHeading, SidebarItem } from "@sorbet/component-library";

// [RENDER_BLANK] pre-authoring: SidebarItem is a thin polymorphic <a> with no
// own content (see sidebar.tsx) — the auto-generated floor card mounted it
// bare (no children, no href) and got an empty anchor. It needs real
// icon+label(+badge) content and a real Sidebar parent to mean anything, so
// every story below is deliberately content-rich: a leading svg icon (see
// Sidebar.tsx for the "bring your own SVG"/unwrapped-svg rationale), a text
// label, and — where relevant — a trailing Badge and the aria-current state.
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

const rail = {
  width: "var(--sb-sidebar-width)",
  borderInlineEnd: "1px solid var(--sb-border-subtle)",
  background: "var(--sb-surface)",
} as const;

/** Icon-led items — the current one gets the primary-subtle highlight, the
 *  rest sit in the plain muted state. */
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
      </Sidebar>
    </div>
  );
}

/** Trailing Badge counts — `.sb-badge` gets `margin-inline-start: auto`
 *  inside a sidebar item, so it pins to the item's end. */
export function WithBadges() {
  return (
    <div style={rail}>
      <Sidebar aria-label="Primary">
        <SidebarHeading>Workspace</SidebarHeading>
        <SidebarItem href="#">
          <GridIcon /> Dashboard
        </SidebarItem>
        <SidebarItem href="#" current>
          <FolderIcon /> Projects <Badge tone="primary">12</Badge>
        </SidebarItem>
        <SidebarItem href="#">
          <ChartIcon /> Reports <Badge tone="accent">3</Badge>
        </SidebarItem>
      </Sidebar>
    </div>
  );
}

/** No icons — plain text label plus a badge, the exact shape the README's
 *  own recipe and the playground kitchen-sink use. */
export function TextOnly() {
  return (
    <div style={rail}>
      <Sidebar aria-label="Primary">
        <SidebarHeading>Workspace</SidebarHeading>
        <SidebarItem href="#">Layout</SidebarItem>
        <SidebarItem href="#" current>
          Atoms <Badge tone="accent">18</Badge>
        </SidebarItem>
        <SidebarItem href="#">Molecules</SidebarItem>
        <SidebarItem href="#">Organisms</SidebarItem>
      </Sidebar>
    </div>
  );
}
