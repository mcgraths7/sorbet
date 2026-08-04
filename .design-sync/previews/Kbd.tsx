import { Kbd } from "@sorbet/component-library";

export function Keys() {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <Kbd>Esc</Kbd>
      <Kbd>Enter</Kbd>
      <Kbd>Tab</Kbd>
    </div>
  );
}

export function Combo() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <Kbd>⌘</Kbd>
      <span>+</span>
      <Kbd>K</Kbd>
    </div>
  );
}
