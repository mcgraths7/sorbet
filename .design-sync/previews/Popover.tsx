import { Button, Popover, Text } from "@sorbet/component-library";

export function Default() {
  return (
    <Popover trigger={<Button variant="outline">Filters</Button>} aria-label="Filters" open>
      <div style={{ padding: 16, minWidth: 220 }}>
        <Text weight="semibold">Filter by status</Text>
        <Text size="sm" tone="muted">
          Show only orders that need attention.
        </Text>
      </div>
    </Popover>
  );
}

export function AlignEnd() {
  return (
    <Popover trigger={<Button variant="secondary">Account</Button>} aria-label="Account menu" open alignEnd>
      <div style={{ padding: 16, minWidth: 200 }}>
        <Text weight="semibold">Ava Thornton</Text>
        <Text size="sm" tone="muted">
          ava@acme.com
        </Text>
      </div>
    </Popover>
  );
}

export function Closed() {
  return <Popover trigger={<Button variant="outline">Filters</Button>} aria-label="Filters">
    <div style={{ padding: 16, minWidth: 220 }}>
      <Text>Hidden until opened.</Text>
    </div>
  </Popover>;
}
