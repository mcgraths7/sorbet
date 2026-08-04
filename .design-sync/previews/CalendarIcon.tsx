import { CalendarIcon, Icon } from "@sorbet/component-library";

export function Default() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Icon size="lg" tone="primary">
        <CalendarIcon />
      </Icon>
      <span>Pickup scheduled — Aug 12, 2026</span>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon size="sm" tone="muted">
        <CalendarIcon />
      </Icon>
      <Icon size="md" tone="muted">
        <CalendarIcon />
      </Icon>
      <Icon size="lg" tone="muted">
        <CalendarIcon />
      </Icon>
      <Icon size="xl" tone="muted">
        <CalendarIcon />
      </Icon>
    </div>
  );
}

export function Tones() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon size="lg" tone="primary">
        <CalendarIcon />
      </Icon>
      <Icon size="lg" tone="muted">
        <CalendarIcon />
      </Icon>
      <Icon size="lg" tone="success">
        <CalendarIcon />
      </Icon>
      <Icon size="lg" tone="danger">
        <CalendarIcon />
      </Icon>
    </div>
  );
}
