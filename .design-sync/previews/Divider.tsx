import { Divider } from "@sorbet/component-library";

export function Weights() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 320 }}>
      <Divider />
      <Divider strong />
    </div>
  );
}

export function WithLabel() {
  return (
    <div style={{ width: 320 }}>
      <Divider label="or continue with email" />
    </div>
  );
}
