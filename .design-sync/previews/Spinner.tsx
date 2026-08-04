import { Spinner } from "@sorbet/component-library";

export function Sizes() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  );
}

export function Muted() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Spinner muted label="Refreshing" />
      <Spinner size="lg" muted label="Refreshing" />
    </div>
  );
}
