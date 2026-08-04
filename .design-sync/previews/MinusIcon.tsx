import { Icon, MinusIcon } from "@sorbet/component-library";

export function Default() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        border: "1px solid var(--sb-border)",
        borderRadius: 8,
        padding: "6px 12px",
        width: "fit-content",
      }}
    >
      <Icon size="md" tone="muted">
        <MinusIcon />
      </Icon>
      <span>2</span>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon size="sm" tone="muted">
        <MinusIcon />
      </Icon>
      <Icon size="md" tone="muted">
        <MinusIcon />
      </Icon>
      <Icon size="lg" tone="muted">
        <MinusIcon />
      </Icon>
      <Icon size="xl" tone="muted">
        <MinusIcon />
      </Icon>
    </div>
  );
}

export function Tones() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon size="lg" tone="muted">
        <MinusIcon />
      </Icon>
      <Icon size="lg" tone="primary">
        <MinusIcon />
      </Icon>
      <Icon size="lg" tone="danger">
        <MinusIcon />
      </Icon>
    </div>
  );
}
