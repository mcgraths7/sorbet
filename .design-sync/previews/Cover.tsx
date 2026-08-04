import { Button, Cover, Heading, Text } from "@sorbet/component-library";

const frame = {
  border: "1px solid var(--sb-border)",
  borderRadius: "var(--sb-radius-md)",
  background: "var(--sb-surface)",
} as const;

/** Full-height centering, height capped for the preview frame. */
export function Default() {
  return (
    <Cover style={{ ...frame, minBlockSize: "22rem" }}>
      <div style={{ textAlign: "center" }}>
        <Heading level={2}>Welcome back</Heading>
        <Text tone="muted">Sign in to pick up where you left off.</Text>
        <div style={{ marginTop: 16 }}>
          <Button>Sign in</Button>
        </div>
      </div>
    </Cover>
  );
}

/** The `partial` (60vh) variant: a smaller empty-state well, not a full page. */
export function Partial() {
  return (
    <Cover partial style={{ ...frame, minBlockSize: "12rem" }}>
      <div style={{ textAlign: "center" }}>
        <Heading level={3} size="lg">
          No results found
        </Heading>
        <Text size="sm" tone="muted">
          Try a different search term.
        </Text>
      </div>
    </Cover>
  );
}
