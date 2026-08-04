import { Grid, Text } from "@sorbet/component-library";

const tile = {
  background: "var(--sb-primary-subtle)",
  border: "1px solid var(--sb-border)",
  borderRadius: "var(--sb-radius-md)",
  padding: 16,
  textAlign: "center",
} as const;

const tiles = (n: number) =>
  Array.from({ length: n }, (_, i) => (
    <div key={i} style={tile}>
      <Text size="sm" weight="semibold">
        {i + 1}
      </Text>
    </div>
  ));

/** Auto-fit responsive grid: columns appear as space allows, no media queries. */
export function Default() {
  return <Grid>{tiles(6)}</Grid>;
}

/** Fixed column count: columns line up regardless of content. */
export function FixedCols() {
  return (
    <Grid cols={3} gap={3}>
      {tiles(6)}
    </Grid>
  );
}

/** A wider `min` yields fewer, larger auto-fit columns than the default. */
export function WideMin() {
  return (
    <Grid min="22rem" gap={3}>
      {tiles(4)}
    </Grid>
  );
}
