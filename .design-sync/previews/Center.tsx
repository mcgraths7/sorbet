import { Center, Text } from "@sorbet/component-library";

const page = {
  background: "var(--sb-bg-subtle)",
  border: "1px dashed var(--sb-border)",
  padding: 16,
} as const;

const card = {
  background: "var(--sb-primary-subtle)",
  border: "1px solid var(--sb-border)",
  borderRadius: "var(--sb-radius-md)",
  padding: "12px 16px",
} as const;

/** Default measure (65ch) centered in a wider page. */
export function Default() {
  return (
    <div style={page}>
      <Center>
        <div style={card}>
          <Text>
            A readable column, centered in whatever space it's given. The default measure caps this at a comfortable
            line length for body copy even though the outer page is much wider.
          </Text>
        </div>
      </Center>
    </div>
  );
}

/** Custom, much narrower measure. */
export function NarrowMeasure() {
  return (
    <div style={page}>
      <Center measure="14rem">
        <div style={{ ...card, background: "var(--sb-accent-subtle)" }}>
          <Text size="sm">measure=&quot;14rem&quot;</Text>
        </div>
      </Center>
    </div>
  );
}

/** Intrinsic centering: the children themselves are centered as a column. */
export function Intrinsic() {
  return (
    <div style={page}>
      <Center intrinsic text>
        <div style={{ ...card, width: 220 }}>
          <Text weight="semibold">Widest child</Text>
        </div>
        <div style={{ ...card, width: 120, marginTop: 8, background: "var(--sb-accent-subtle)" }}>
          <Text size="sm" tone="muted">
            Narrow child
          </Text>
        </div>
      </Center>
    </div>
  );
}
