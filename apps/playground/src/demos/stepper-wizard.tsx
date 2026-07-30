import { Input, Select, Text } from "@sorbet/component-library/atoms";
import { Split, SplitAside, SplitMain } from "@sorbet/component-library/layout";
import { Field, Stepper, Wizard, WizardStep, useToast } from "@sorbet/component-library/molecules";
import { useState } from "react";

import type { DemoMeta } from "./types.ts";

/** A 3-step flow: the first step gates Next until a name is typed (canAdvance),
 *  panels stay mounted so entered data survives Back/Next, Finish toasts. */
function WizardDemo() {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  return (
    <Wizard
      value={step}
      onValueChange={setStep}
      onFinish={() => {
        toast(`Account created for ${name || "you"}!`, { tone: "success" });
        setStep(0);
        setName("");
      }}
    >
      <WizardStep label="Account" description="Your details" canAdvance={name.trim().length > 0}>
        <Field label="Full name" hint="Next stays disabled until this is filled.">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" />
        </Field>
      </WizardStep>
      <WizardStep label="Workspace" description="Pick a plan">
        <Field label="Plan">
          <Select defaultValue="Pro">
            <option>Free</option>
            <option>Pro</option>
            <option>Team</option>
          </Select>
        </Field>
      </WizardStep>
      <WizardStep label="Review">
        <Text tone="muted">
          Creating an account for <strong>{name || "—"}</strong>. Press Finish to confirm.
        </Text>
      </WizardStep>
    </Wizard>
  );
}

export function StepperWizardDemo() {
  return (
    <Split>
      <SplitMain>
        <WizardDemo />
      </SplitMain>
      <SplitAside>
        <Text size="sm" tone="muted">
          Standalone Stepper (read-only, vertical):
        </Text>
        <Stepper
          orientation="vertical"
          current={1}
          steps={[
            { label: "Order placed", description: "Mar 3" },
            { label: "Shipped", description: "In transit" },
            { label: "Delivered" },
          ]}
        />
      </SplitAside>
    </Split>
  );
}

StepperWizardDemo.demo = { title: "Stepper & wizard", layer: "molecules", order: 50 } satisfies DemoMeta;
