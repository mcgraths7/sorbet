import { CloseIcon, Icon } from "@sorbet/component-library";

export function Default() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        maxWidth: 280,
        padding: 12,
        border: "1px solid var(--sb-border)",
        borderRadius: 8,
      }}
    >
      <span>Your changes were saved</span>
      <Icon size="sm" tone="muted">
        <CloseIcon />
      </Icon>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon size="sm" tone="muted">
        <CloseIcon />
      </Icon>
      <Icon size="md" tone="muted">
        <CloseIcon />
      </Icon>
      <Icon size="lg" tone="muted">
        <CloseIcon />
      </Icon>
      <Icon size="xl" tone="muted">
        <CloseIcon />
      </Icon>
    </div>
  );
}

export function Tones() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon size="lg" tone="muted">
        <CloseIcon />
      </Icon>
      <Icon size="lg" tone="subtle">
        <CloseIcon />
      </Icon>
      <Icon size="lg" tone="danger">
        <CloseIcon />
      </Icon>
    </div>
  );
}
