import { Button, Stack, StackPush, Text } from "@sorbet/component-library";

const panel = {
  background: "var(--sb-bg-subtle)",
  border: "1px solid var(--sb-border)",
  borderRadius: "var(--sb-radius-md)",
  padding: 12,
  height: 220,
} as const;

const navItem = {
  background: "var(--sb-surface-raised)",
  border: "1px solid var(--sb-border)",
  borderRadius: "var(--sb-radius-sm)",
  padding: "8px 12px",
} as const;

/** A sidebar panel: nav items on top, a footer action pushed to the bottom. */
export function Default() {
  return (
    <Stack gap={2} style={{ ...panel, width: 200 }}>
      <div style={navItem}>
        <Text size="sm">Overview</Text>
      </div>
      <div style={navItem}>
        <Text size="sm">Projects</Text>
      </div>
      <div style={navItem}>
        <Text size="sm">Settings</Text>
      </div>
      <StackPush>
        <Button size="sm" variant="outline" full>
          Log out
        </Button>
      </StackPush>
    </Stack>
  );
}

/** Even with a single item before it, StackPush still lands at the far end. */
export function SingleItemAbove() {
  return (
    <Stack gap={2} style={{ ...panel, width: 200, height: 160 }}>
      <div style={navItem}>
        <Text size="sm">Dashboard</Text>
      </div>
      <StackPush>
        <Text size="xs" tone="subtle">
          v2.4.1
        </Text>
      </StackPush>
    </Stack>
  );
}
