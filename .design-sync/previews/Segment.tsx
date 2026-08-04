import { Segment, SegmentedControl } from "@sorbet/component-library";

export function Default() {
  return (
    <SegmentedControl defaultValue="active" aria-label="Subscription status">
      <Segment value="active">Active</Segment>
      <Segment value="paused">Paused</Segment>
      <Segment value="cancelled">Cancelled</Segment>
    </SegmentedControl>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <SegmentedControl defaultValue="list" size="sm" aria-label="View, small">
        <Segment value="grid">Grid</Segment>
        <Segment value="list">List</Segment>
      </SegmentedControl>
      <SegmentedControl defaultValue="list" size="md" aria-label="View, medium">
        <Segment value="grid">Grid</Segment>
        <Segment value="list">List</Segment>
      </SegmentedControl>
    </div>
  );
}
