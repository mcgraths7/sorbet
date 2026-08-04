import { Field, Input, Text, Wizard, WizardStep } from "@sorbet/component-library";

// WizardStep renders nothing on its own (it's a declarative data-only child
// Wizard reads props off of) — so every story here composes a full Wizard,
// varying the WizardStep props (`description`, `canAdvance`) that are the
// actual subject of this file.

export function Default() {
  return (
    <div style={{ width: 420 }}>
      <Wizard value={0}>
        <WizardStep label="Origin" description="Where the shipment ships from">
          <Field label="Warehouse">
            <Input defaultValue="Portland — Warehouse 3" />
          </Field>
        </WizardStep>
        <WizardStep label="Package details">
          <Field label="Weight (lb)">
            <Input type="number" defaultValue="12" />
          </Field>
        </WizardStep>
        <WizardStep label="Confirm">
          <Text tone="muted">Review shipment details before booking pickup.</Text>
        </WizardStep>
      </Wizard>
    </div>
  );
}

export function Blocked() {
  return (
    <div style={{ width: 420 }}>
      <Wizard value={1}>
        <WizardStep label="Origin" description="Where the shipment ships from">
          <Text tone="muted">Portland — Warehouse 3</Text>
        </WizardStep>
        <WizardStep label="Package details" description="Weight & dimensions" canAdvance={false}>
          <Field label="Weight (lb)" error="Weight is required to continue." invalid>
            <Input type="number" placeholder="0" />
          </Field>
        </WizardStep>
        <WizardStep label="Confirm">
          <Text tone="muted">Review shipment details before booking pickup.</Text>
        </WizardStep>
      </Wizard>
    </div>
  );
}
