import { CheckIcon, Icon } from "@sorbet/component-library";

export function Default() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Icon size="lg" tone="success">
        <CheckIcon />
      </Icon>
      <span>Payment verified</span>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon size="sm" tone="success">
        <CheckIcon />
      </Icon>
      <Icon size="md" tone="success">
        <CheckIcon />
      </Icon>
      <Icon size="lg" tone="success">
        <CheckIcon />
      </Icon>
      <Icon size="xl" tone="success">
        <CheckIcon />
      </Icon>
    </div>
  );
}

export function Tones() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon size="lg" tone="success">
        <CheckIcon />
      </Icon>
      <Icon size="lg" tone="primary">
        <CheckIcon />
      </Icon>
      <Icon size="lg" tone="info">
        <CheckIcon />
      </Icon>
      <Icon size="lg" tone="muted">
        <CheckIcon />
      </Icon>
    </div>
  );
}
