import { Field, NumberInput } from "@sorbet/component-library";

export function Default() {
  return (
    <Field label="Servings">
      <NumberInput defaultValue={4} min={1} max={12} />
    </Field>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <NumberInput size="sm" defaultValue={2} min={0} max={20} aria-label="Quantity, small" />
      <NumberInput size="md" defaultValue={2} min={0} max={20} aria-label="Quantity, medium" />
      <NumberInput size="lg" defaultValue={2} min={0} max={20} aria-label="Quantity, large" />
    </div>
  );
}

export function StepAndBounds() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 160 }}>
      <Field label="Price adjustment">
        <NumberInput defaultValue={2.5} step={0.25} min={0} max={10} />
      </Field>
      <Field label="Discount (at max)">
        <NumberInput value={50} min={0} max={50} aria-label="Discount, at maximum" />
      </Field>
    </div>
  );
}

export function Disabled() {
  return <NumberInput defaultValue={4} disabled aria-label="Servings, disabled" />;
}
