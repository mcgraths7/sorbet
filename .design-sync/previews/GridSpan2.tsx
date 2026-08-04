import { Grid, GridSpan2, Text } from "@sorbet/component-library";

const tile = {
  background: "var(--sb-primary-subtle)",
  border: "1px solid var(--sb-border)",
  borderRadius: "var(--sb-radius-md)",
  padding: 16,
  textAlign: "center",
} as const;

const spanTile = {
  ...tile,
  background: "var(--sb-accent-subtle)",
} as const;

/** A featured tile spans 2 of 3 columns in a fixed-column grid. */
export function Default() {
  return (
    <Grid cols={3} gap={3}>
      <div style={tile}>
        <Text size="sm">1</Text>
      </div>
      <div style={tile}>
        <Text size="sm">2</Text>
      </div>
      <GridSpan2 style={spanTile}>
        <Text size="sm" weight="semibold">
          Featured (spans 2)
        </Text>
      </GridSpan2>
      <div style={tile}>
        <Text size="sm">3</Text>
      </div>
    </Grid>
  );
}

/** In a 4-column grid, the span still takes exactly 2 columns. */
export function FourColumnGrid() {
  return (
    <Grid cols={4} gap={3}>
      <div style={tile}>
        <Text size="sm">1</Text>
      </div>
      <GridSpan2 style={spanTile}>
        <Text size="sm" weight="semibold">
          Spans 2 of 4
        </Text>
      </GridSpan2>
      <div style={tile}>
        <Text size="sm">2</Text>
      </div>
      <div style={tile}>
        <Text size="sm">3</Text>
      </div>
      <div style={tile}>
        <Text size="sm">4</Text>
      </div>
    </Grid>
  );
}
