import { ChevronIcon, Icon } from "@sorbet/component-library";

export function Default() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        maxWidth: 280,
      }}
    >
      <span>Notification settings</span>
      <Icon size="md" tone="muted">
        <ChevronIcon />
      </Icon>
    </div>
  );
}

export function Directions() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon size="lg" tone="primary">
        <ChevronIcon direction="right" />
      </Icon>
      <Icon size="lg" tone="primary">
        <ChevronIcon direction="left" />
      </Icon>
      <Icon size="lg" tone="primary">
        <ChevronIcon direction="up" />
      </Icon>
      <Icon size="lg" tone="primary">
        <ChevronIcon direction="down" />
      </Icon>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon size="sm" tone="muted">
        <ChevronIcon />
      </Icon>
      <Icon size="md" tone="muted">
        <ChevronIcon />
      </Icon>
      <Icon size="lg" tone="muted">
        <ChevronIcon />
      </Icon>
      <Icon size="xl" tone="muted">
        <ChevronIcon />
      </Icon>
    </div>
  );
}
