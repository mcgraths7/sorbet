import { Progress } from "@sorbet/component-library";

export function Sizes() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 280 }}>
      <Progress value={70} size="sm" label="Upload progress" />
      <Progress value={70} size="md" label="Upload progress" />
      <Progress value={70} size="lg" label="Upload progress" />
    </div>
  );
}

export function Tones() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 280 }}>
      <Progress value={80} tone="success" label="Storage used" />
      <Progress value={55} tone="warning" label="Storage used" />
      <Progress value={92} tone="danger" label="Storage used" />
    </div>
  );
}

export function Indeterminate() {
  return (
    <div style={{ width: 280 }}>
      <Progress indeterminate label="Syncing files" />
    </div>
  );
}
