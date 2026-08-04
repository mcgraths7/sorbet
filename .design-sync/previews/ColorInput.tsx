import { ColorInput, Field } from "@sorbet/component-library";

export function Default() {
  return (
    <Field label="Accent color">
      <ColorInput defaultValue="#e11d48" />
    </Field>
  );
}

export function WithAlpha() {
  return (
    <Field label="Overlay tint" hint="Supports transparency.">
      <ColorInput defaultValue="#3b82f680" alpha />
    </Field>
  );
}

export function CustomSwatches() {
  return (
    <ColorInput
      defaultValue="#22c55e"
      swatches={["#e11d48", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6"]}
      aria-label="Brand color"
    />
  );
}

export function Disabled() {
  return <ColorInput defaultValue="#6366f1" disabled aria-label="Accent color, disabled" />;
}
