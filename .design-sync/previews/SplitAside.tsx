import { Split, SplitAside, SplitMain, Text } from "@sorbet/component-library";

const asideBox = {
  background: "var(--sb-surface-raised)",
  border: "1px solid var(--sb-border)",
  borderRadius: "var(--sb-radius-md)",
  padding: 16,
} as const;

const mainBox = {
  background: "var(--sb-primary-subtle)",
  border: "1px solid var(--sb-border)",
  borderRadius: "var(--sb-radius-md)",
  padding: 16,
} as const;

const navItem = {
  padding: "6px 8px",
  borderRadius: "var(--sb-radius-sm)",
} as const;

/** SplitAside holds the sidebar's natural-width column, e.g. site navigation. */
export function Default() {
  return (
    <Split>
      <SplitAside>
        <div style={asideBox}>
          <Text weight="semibold" style={{ marginBottom: 8, display: "block" }}>
            Navigation
          </Text>
          <div style={{ ...navItem, background: "var(--sb-accent-subtle)" }}>
            <Text size="sm">Overview</Text>
          </div>
          <div style={navItem}>
            <Text size="sm" tone="muted">
              Settings
            </Text>
          </div>
        </div>
      </SplitAside>
      <SplitMain>
        <div style={mainBox}>
          <Text>Page content next to the nav.</Text>
        </div>
      </SplitMain>
    </Split>
  );
}

/** A tighter aside width, set via Split's `aside` prop. */
export function Narrow() {
  return (
    <Split aside="10rem">
      <SplitAside>
        <div style={asideBox}>
          <Text size="sm" weight="semibold">
            aside=&quot;10rem&quot;
          </Text>
        </div>
      </SplitAside>
      <SplitMain>
        <div style={mainBox}>
          <Text>Main content claims the rest.</Text>
        </div>
      </SplitMain>
    </Split>
  );
}
