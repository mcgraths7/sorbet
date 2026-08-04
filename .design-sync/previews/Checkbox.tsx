import { Checkbox, Choice } from "@sorbet/component-library";

export function Default() {
  return (
    <Choice>
      <Checkbox defaultChecked name="terms" />
      I agree to the terms of service
    </Choice>
  );
}

export function States() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Choice>
        <Checkbox aria-label="Unchecked" />
        Unchecked
      </Choice>
      <Choice>
        <Checkbox defaultChecked aria-label="Checked" />
        Checked
      </Choice>
      <Choice>
        <Checkbox indeterminate aria-label="Indeterminate" />
        Indeterminate (select all)
      </Choice>
      <Choice>
        <Checkbox disabled aria-label="Disabled" />
        Disabled
      </Choice>
      <Choice>
        <Checkbox disabled defaultChecked aria-label="Disabled, checked" />
        Disabled + checked
      </Choice>
    </div>
  );
}
