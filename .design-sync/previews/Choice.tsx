import { Checkbox, Choice, Radio, Switch } from "@sorbet/component-library";

export function WithCheckbox() {
  return (
    <Choice>
      <Checkbox defaultChecked name="notify" />
      Email me about order updates
    </Choice>
  );
}

export function WithRadio() {
  return (
    <Choice>
      <Radio name="plan-preview" defaultChecked />
      Weekly box — 3 meals
    </Choice>
  );
}

export function WithSwitch() {
  return (
    <Choice>
      <Switch defaultChecked name="marketing" />
      Send me recipe recommendations
    </Choice>
  );
}

export function Disabled() {
  return (
    <Choice data-disabled>
      <Checkbox disabled />
      Gift wrapping (unavailable for this item)
    </Choice>
  );
}
