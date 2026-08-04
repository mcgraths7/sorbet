import { Stepper } from "@sorbet/component-library";

const checkoutSteps = [{ label: "Cart" }, { label: "Shipping" }, { label: "Payment" }, { label: "Confirmation" }];

export function Default() {
  return <Stepper steps={checkoutSteps} current={1} />;
}

export function WithDescriptions() {
  return (
    <Stepper
      current={2}
      steps={[
        { label: "Cart", description: "3 items" },
        { label: "Shipping", description: "Standard, 3–5 days" },
        { label: "Payment", description: "Visa •••• 4242" },
        { label: "Confirmation" },
      ]}
    />
  );
}

export function Vertical() {
  return <Stepper steps={checkoutSteps} current={2} orientation="vertical" />;
}

export function Navigable() {
  return <Stepper steps={checkoutSteps} current={2} onStepClick={() => {}} />;
}
