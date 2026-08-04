import { Container, Text } from "@sorbet/component-library";

const page = {
  background: "var(--sb-bg-subtle)",
  border: "1px dashed var(--sb-border)",
} as const;

const band = {
  background: "var(--sb-primary-subtle)",
  border: "1px solid var(--sb-border)",
  borderRadius: "var(--sb-radius-md)",
  padding: "12px 16px",
} as const;

/** Default (lg, 64rem max) column with responsive gutters, on a wide page. */
export function Default() {
  return (
    <div style={page}>
      <Container>
        <div style={band}>
          <Text>Centered content column with gutters.</Text>
        </div>
      </Container>
    </div>
  );
}

/** size sweep: sm / md / xl / full, stacked so the max-width differences read. */
export function Sizes() {
  return (
    <div style={page}>
      {(["sm", "md", "xl", "full"] as const).map((size) => (
        <Container key={size} size={size} style={{ marginBottom: 8 }}>
          <div style={{ ...band, background: "var(--sb-accent-subtle)" }}>
            <Text size="sm">size=&quot;{size}&quot;</Text>
          </div>
        </Container>
      ))}
    </div>
  );
}
