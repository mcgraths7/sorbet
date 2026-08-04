import { Icon, PlusIcon } from "@sorbet/component-library";

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
      <span>2</span>
      <Icon size="md" tone="muted">
        <PlusIcon />
      </Icon>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon size="sm" tone="muted">
        <PlusIcon />
      </Icon>
      <Icon size="md" tone="muted">
        <PlusIcon />
      </Icon>
      <Icon size="lg" tone="muted">
        <PlusIcon />
      </Icon>
      <Icon size="xl" tone="muted">
        <PlusIcon />
      </Icon>
    </div>
  );
}

export function Tones() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon size="lg" tone="primary">
        <PlusIcon />
      </Icon>
      <Icon size="lg" tone="success">
        <PlusIcon />
      </Icon>
      <Icon size="lg" tone="muted">
        <PlusIcon />
      </Icon>
    </div>
  );
}
