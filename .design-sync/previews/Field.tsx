import { Field, Input, Select } from "@sorbet/component-library";

export function Default() {
  return (
    <Field label="Email address" hint="We'll only use this to send order updates.">
      <Input type="email" placeholder="you@example.com" />
    </Field>
  );
}

export function Invalid() {
  return (
    <Field label="Promo code" error="This code has expired." invalid required>
      <Input defaultValue="SUMMER23" />
    </Field>
  );
}

export function InlineSelect() {
  return (
    <Field label="Delivery frequency" inline>
      <Select defaultValue="weekly">
        <option value="weekly">Every week</option>
        <option value="biweekly">Every 2 weeks</option>
        <option value="monthly">Every month</option>
      </Select>
    </Field>
  );
}
