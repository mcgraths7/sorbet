import { Field, Input } from "@sorbet/component-library";

export function Default() {
  return (
    <Field label="Display name">
      <Input placeholder="Ava Thornton" defaultValue="Ava Thornton" />
    </Field>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 240 }}>
      <Input size="sm" placeholder="Small" defaultValue="Small field" />
      <Input size="md" placeholder="Medium" defaultValue="Medium field" />
      <Input size="lg" placeholder="Large" defaultValue="Large field" />
    </div>
  );
}

export function States() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 240 }}>
      <Input placeholder="you@example.com" />
      <Input defaultValue="not-an-email" invalid aria-label="Email, invalid" />
      <Input defaultValue="Cannot edit this" disabled />
    </div>
  );
}

export function WithError() {
  return (
    <Field label="Work email" error="Enter a valid email address." invalid required>
      <Input defaultValue="ava@acme" type="email" />
    </Field>
  );
}
