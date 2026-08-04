import { EyedropperIcon, Icon } from "@sorbet/component-library";

export function Default() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Icon size="lg" tone="primary">
        <EyedropperIcon />
      </Icon>
      <span>Sample a color from the page</span>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon size="sm" tone="muted">
        <EyedropperIcon />
      </Icon>
      <Icon size="md" tone="muted">
        <EyedropperIcon />
      </Icon>
      <Icon size="lg" tone="muted">
        <EyedropperIcon />
      </Icon>
      <Icon size="xl" tone="muted">
        <EyedropperIcon />
      </Icon>
    </div>
  );
}

export function Tones() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Icon size="lg" tone="primary">
        <EyedropperIcon />
      </Icon>
      <Icon size="lg" tone="info">
        <EyedropperIcon />
      </Icon>
      <Icon size="lg" tone="muted">
        <EyedropperIcon />
      </Icon>
    </div>
  );
}
