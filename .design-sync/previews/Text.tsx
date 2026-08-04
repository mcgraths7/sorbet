import { Text } from "@sorbet/component-library";

export function Sizes() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Text size="xs">Extra small body text</Text>
      <Text size="sm">Small body text</Text>
      <Text size="md">Medium body text (default)</Text>
      <Text size="lg">Large body text</Text>
      <Text size="xl">Extra large body text</Text>
    </div>
  );
}

export function Tones() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Text tone="default">Default tone — primary reading text.</Text>
      <Text tone="muted">Muted tone — secondary, de-emphasized text.</Text>
      <Text tone="subtle">Subtle tone — the quietest tone available.</Text>
    </div>
  );
}

export function Weights() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Text weight="regular">Regular weight</Text>
      <Text weight="medium">Medium weight</Text>
      <Text weight="semibold">Semibold weight</Text>
      <Text weight="bold">Bold weight</Text>
    </div>
  );
}

export function AsSpan() {
  return (
    <Text as="p">
      Order shipped — <Text as="span" tone="muted" size="sm">tracking updates within 24 hours.</Text>
    </Text>
  );
}
