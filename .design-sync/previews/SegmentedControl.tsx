import { Segment, SegmentedControl } from "@sorbet/component-library";

export function Default() {
  return (
    <SegmentedControl defaultValue="week" aria-label="Date range">
      <Segment value="day">Day</Segment>
      <Segment value="week">Week</Segment>
      <Segment value="month">Month</Segment>
    </SegmentedControl>
  );
}

export function ViewToggle() {
  return (
    <SegmentedControl defaultValue="grid" size="sm" aria-label="View">
      <Segment value="grid">Grid</Segment>
      <Segment value="list">List</Segment>
    </SegmentedControl>
  );
}

export function WithDisabled() {
  return (
    <SegmentedControl defaultValue="grid" aria-label="Layout">
      <Segment value="grid">Grid</Segment>
      <Segment value="list">List</Segment>
      <Segment value="map" disabled>
        Map
      </Segment>
    </SegmentedControl>
  );
}
