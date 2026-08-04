import { Field, Slider } from "@sorbet/component-library";

export function Default() {
  return (
    <Field label="Spice level" hint="0 = mild, 10 = extra hot">
      <Slider min={0} max={10} step={1} defaultValue={4} style={{ width: 240 }} />
    </Field>
  );
}

export function Range() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 240 }}>
      <Slider min={0} max={100} defaultValue={20} aria-label="Low value" />
      <Slider min={0} max={100} defaultValue={65} aria-label="Mid value" />
      <Slider min={0} max={100} defaultValue={95} aria-label="High value" />
    </div>
  );
}

export function Disabled() {
  return <Slider min={0} max={10} defaultValue={4} disabled aria-label="Spice level, disabled" style={{ width: 240 }} />;
}
