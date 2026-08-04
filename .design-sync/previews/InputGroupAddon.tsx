import { Input, InputGroup, InputGroupAddon } from "@sorbet/component-library";

// InputGroupAddon only makes sense inside an InputGroup — this composes the
// full parent, which is the honest render.

export function PrefixAndSuffix() {
  return (
    <InputGroup>
      <InputGroupAddon>https://</InputGroupAddon>
      <Input defaultValue="acme-kitchen" />
      <InputGroupAddon>.com</InputGroupAddon>
    </InputGroup>
  );
}

export function PrefixOnly() {
  return (
    <InputGroup style={{ maxWidth: 160 }}>
      <InputGroupAddon>$</InputGroupAddon>
      <Input type="number" defaultValue="24.99" />
    </InputGroup>
  );
}
