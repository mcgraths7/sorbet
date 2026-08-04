import { Button, Input, InputGroup, InputGroupAddon, SearchIcon } from "@sorbet/component-library";

export function UrlField() {
  return (
    <InputGroup>
      <InputGroupAddon>https://</InputGroupAddon>
      <Input defaultValue="acme-kitchen" />
      <InputGroupAddon>.com</InputGroupAddon>
    </InputGroup>
  );
}

export function PriceField() {
  return (
    <InputGroup style={{ maxWidth: 160 }}>
      <InputGroupAddon>$</InputGroupAddon>
      <Input type="number" defaultValue="24.99" />
    </InputGroup>
  );
}

export function SearchWithButton() {
  return (
    <InputGroup style={{ maxWidth: 320 }}>
      <Input type="search" placeholder="Search recipes…" aria-label="Search recipes" />
      <Button iconOnly aria-label="Search">
        <SearchIcon />
      </Button>
    </InputGroup>
  );
}
