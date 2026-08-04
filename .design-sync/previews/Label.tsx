import { Label } from "@sorbet/component-library";

export function Default() {
  return <Label htmlFor="email">Email address</Label>;
}

export function Required() {
  return (
    <Label htmlFor="full-name" required>
      Full name
    </Label>
  );
}

export function Optional() {
  return (
    <Label htmlFor="company" optional>
      Company
    </Label>
  );
}
