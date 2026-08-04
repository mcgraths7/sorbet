import { Field, Input, Select, Text, Wizard, WizardStep } from "@sorbet/component-library";

export function Default() {
  return (
    <div style={{ width: 420 }}>
      <Wizard defaultValue={0}>
        <WizardStep label="Plan details" description="Household & servings">
          <Field label="Household size">
            <Select defaultValue="2">
              <option value="1">1 person</option>
              <option value="2">2 people</option>
              <option value="4">4 people</option>
            </Select>
          </Field>
          <Field label="Meals per week">
            <Select defaultValue="3">
              <option value="2">2 meals</option>
              <option value="3">3 meals</option>
              <option value="4">4 meals</option>
            </Select>
          </Field>
        </WizardStep>
        <WizardStep label="Delivery address">
          <Field label="Street address">
            <Input placeholder="123 Harvest Lane" />
          </Field>
        </WizardStep>
        <WizardStep label="Review & confirm">
          <Text tone="muted">Review your plan before confirming.</Text>
        </WizardStep>
      </Wizard>
    </div>
  );
}

export function MidStep() {
  return (
    <div style={{ width: 420 }}>
      <Wizard value={1}>
        <WizardStep label="Plan details" description="Household & servings">
          <Text tone="muted">2 people · 3 meals per week</Text>
        </WizardStep>
        <WizardStep label="Delivery address">
          <Field label="Street address">
            <Input defaultValue="481 Harvest Lane" />
          </Field>
          <Field label="City">
            <Input defaultValue="Portland" />
          </Field>
        </WizardStep>
        <WizardStep label="Review & confirm">
          <Text tone="muted">Review your plan before confirming.</Text>
        </WizardStep>
      </Wizard>
    </div>
  );
}

export function Vertical() {
  return (
    <div style={{ width: 480 }}>
      <Wizard value={0} orientation="vertical">
        <WizardStep label="Plan details" description="Household & servings">
          <Field label="Household size">
            <Select defaultValue="2">
              <option value="1">1 person</option>
              <option value="2">2 people</option>
              <option value="4">4 people</option>
            </Select>
          </Field>
        </WizardStep>
        <WizardStep label="Delivery address" description="Where meals should arrive">
          <Field label="Street address">
            <Input placeholder="123 Harvest Lane" />
          </Field>
        </WizardStep>
        <WizardStep label="Review & confirm" description="Final check before checkout">
          <Text tone="muted">Review your plan before confirming.</Text>
        </WizardStep>
      </Wizard>
    </div>
  );
}
