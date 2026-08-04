import { Badge, Cluster, Text } from "@sorbet/component-library";

const tags = ["Design", "Frontend", "Accessibility", "Tokens", "React", "Sass"];

/** Toolbar/tag-list wrapping: a narrow container forces the wrap to show. */
export function Default() {
  return (
    <div style={{ maxWidth: 340 }}>
      <Cluster>
        {tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </Cluster>
    </div>
  );
}

const row = {
  background: "var(--sb-bg-subtle)",
  border: "1px dashed var(--sb-border)",
  padding: 8,
  marginTop: 8,
} as const;

const chip = {
  background: "var(--sb-accent-subtle)",
  border: "1px solid var(--sb-border)",
  borderRadius: "var(--sb-radius-sm)",
  padding: "4px 10px",
} as const;

/** justify sweep: start (default) / between / center / end. */
export function Justify() {
  return (
    <div>
      {(["start", "between", "center", "end"] as const).map((justify) => (
        <div key={justify} style={row}>
          <Text size="xs" tone="subtle">
            justify=&quot;{justify}&quot;
          </Text>
          <Cluster justify={justify} gap={2}>
            <div style={chip}>One</div>
            <div style={chip}>Two</div>
            <div style={chip}>Three</div>
          </Cluster>
        </div>
      ))}
    </div>
  );
}

/** gap sweep: tight (1) vs loose (8). */
export function Gap() {
  return (
    <div>
      {([1, 8] as const).map((gap) => (
        <div key={gap} style={row}>
          <Text size="xs" tone="subtle">
            gap={gap}
          </Text>
          <Cluster gap={gap}>
            <div style={chip}>One</div>
            <div style={chip}>Two</div>
            <div style={chip}>Three</div>
          </Cluster>
        </div>
      ))}
    </div>
  );
}
