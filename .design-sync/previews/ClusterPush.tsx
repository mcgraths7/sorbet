import { Badge, Button, Cluster, ClusterPush, Text } from "@sorbet/component-library";

const bar = {
  background: "var(--sb-surface-raised)",
  border: "1px solid var(--sb-border)",
  borderRadius: "var(--sb-radius-md)",
  padding: 12,
} as const;

/** A toolbar: title + status pinned left, action pushed to the far end. */
export function Default() {
  return (
    <Cluster style={bar}>
      <Text weight="semibold">Inbox</Text>
      <Badge tone="info">24 new</Badge>
      <ClusterPush>
        <Button size="sm" variant="outline">
          Mark all read
        </Button>
      </ClusterPush>
    </Cluster>
  );
}

/** A filter row: several tags before the push, a single clear action after. */
export function FilterRow() {
  return (
    <Cluster style={{ ...bar, maxWidth: 420 }}>
      <Badge tone="primary">In stock</Badge>
      <Badge tone="primary">Under $50</Badge>
      <Badge tone="primary">Free shipping</Badge>
      <ClusterPush>
        <Button size="sm" variant="ghost">
          Clear filters
        </Button>
      </ClusterPush>
    </Cluster>
  );
}
