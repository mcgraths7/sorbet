import { Field, Select } from "@sorbet/component-library";

export function Default() {
  return (
    <Field label="Delivery frequency">
      <Select defaultValue="weekly">
        <option value="weekly">Every week</option>
        <option value="biweekly">Every two weeks</option>
        <option value="monthly">Once a month</option>
      </Select>
    </Field>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Select size="sm" defaultValue="sm" aria-label="Size small">
        <option value="sm">Small</option>
        <option value="md">Medium</option>
      </Select>
      <Select size="md" defaultValue="md" aria-label="Size medium">
        <option value="sm">Small</option>
        <option value="md">Medium</option>
      </Select>
    </div>
  );
}

export function States() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 220 }}>
      <Select defaultValue="" invalid aria-label="Region, invalid">
        <option value="" disabled>
          Choose a region…
        </option>
        <option value="us">United States</option>
        <option value="eu">Europe</option>
      </Select>
      <Select defaultValue="us" disabled aria-label="Region, disabled">
        <option value="us">United States</option>
      </Select>
    </div>
  );
}
