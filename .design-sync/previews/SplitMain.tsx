import { Grid, Split, SplitAside, SplitMain, Text } from "@sorbet/component-library";

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

const tile = {
  background: "var(--sb-accent-subtle)",
  border: "1px solid var(--sb-border)",
  borderRadius: "var(--sb-radius-sm)",
  padding: 12,
  textAlign: "center",
} as const;

/** SplitMain claims the remaining space and shrinks first when room is tight. */
export function Default() {
  return (
    <Split>
      <SplitAside>
        <div style={asideBox}>
          <Text weight="semibold">Sidebar</Text>
        </div>
      </SplitAside>
      <SplitMain>
        <div style={mainBox}>
          <Text weight="semibold">Article title</Text>
          <Text size="sm" tone="muted">
            SplitMain grows to fill the leftover width and its min-inline-size keeps it from collapsing
            below a readable size before the pair stacks.
          </Text>
        </div>
      </SplitMain>
    </Split>
  );
}

/** SplitMain can hold any content, e.g. a card grid, not just prose. */
export function WithGrid() {
  return (
    <Split>
      <SplitAside>
        <div style={asideBox}>
          <Text weight="semibold">Filters</Text>
        </div>
      </SplitAside>
      <SplitMain>
        <Grid cols={2} gap={2}>
          <div style={tile}>
            <Text size="sm">A</Text>
          </div>
          <div style={tile}>
            <Text size="sm">B</Text>
          </div>
          <div style={tile}>
            <Text size="sm">C</Text>
          </div>
          <div style={tile}>
            <Text size="sm">D</Text>
          </div>
        </Grid>
      </SplitMain>
    </Split>
  );
}
