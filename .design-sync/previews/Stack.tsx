import { Stack, Text } from "@sorbet/component-library";

const box = {
  background: "var(--sb-primary-subtle)",
  border: "1px solid var(--sb-border)",
  borderRadius: "var(--sb-radius-md)",
  padding: 12,
} as const;

/** Vertical flow: children get no margins, the stack gaps them. */
export function Default() {
  return (
    <Stack gap={4} style={{ maxWidth: 280 }}>
      <div style={box}>
        <Text size="sm">First item</Text>
      </div>
      <div style={box}>
        <Text size="sm">Second item</Text>
      </div>
      <div style={box}>
        <Text size="sm">Third item</Text>
      </div>
    </Stack>
  );
}

/** align sweep: start / center / end, boxes of different widths make it read. */
export function Align() {
  return (
    <div style={{ display: "flex", gap: 24 }}>
      {(["start", "center", "end"] as const).map((align) => (
        <div key={align}>
          <Text size="xs" tone="subtle">
            align=&quot;{align}&quot;
          </Text>
          <Stack gap={2} align={align} style={{ width: 160, marginTop: 4 }}>
            <div style={{ ...box, width: 140 }}>
              <Text size="xs">Wide</Text>
            </div>
            <div style={{ ...box, width: 70 }}>
              <Text size="xs">Mid</Text>
            </div>
            <div style={{ ...box, width: 36 }}>
              <Text size="xs">Sm</Text>
            </div>
          </Stack>
        </div>
      ))}
    </div>
  );
}

/** gap sweep: tight (1) vs loose (8). */
export function Gap() {
  return (
    <div style={{ display: "flex", gap: 32 }}>
      {([1, 8] as const).map((gap) => (
        <div key={gap}>
          <Text size="xs" tone="subtle">
            gap={gap}
          </Text>
          <Stack gap={gap} style={{ width: 140, marginTop: 4 }}>
            <div style={box}>
              <Text size="xs">One</Text>
            </div>
            <div style={box}>
              <Text size="xs">Two</Text>
            </div>
          </Stack>
        </div>
      ))}
    </div>
  );
}
