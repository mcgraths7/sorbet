import { Combobox, Field, type ComboboxOption } from "@sorbet/component-library";
import { useEffect, useRef } from "react";

// Combobox has no `open`/`defaultOpen` prop — the listbox popover is internal
// state (useComboboxCore), opened by the input's own onClick handler. The
// component's `ref` forwards straight to that input, so a real .click() in a
// mount effect opens the panel through the exact code path a pointer click
// would, same technique as Menu's trigger-ref click.
function useOpenOnMount() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.click();
  }, []);
  return ref;
}

const agents: ComboboxOption[] = [
  { value: "priya", label: "Priya Chandra", description: "8 open tickets", group: "Billing" },
  { value: "marcus", label: "Marcus Webb", description: "3 open tickets", group: "Billing" },
  { value: "sofia", label: "Sofia Reyes", description: "5 open tickets", group: "Technical" },
  { value: "diego", label: "Diego Alvarez", description: "2 open tickets", group: "Technical" },
  { value: "helen", label: "Helen Ostrowski", description: "6 open tickets", group: "Onboarding" },
];

export function Default() {
  const ref = useOpenOnMount();
  return (
    <div style={{ width: 280 }}>
      <Field label="Assign to agent">
        <Combobox ref={ref} options={agents} placeholder="Search agents…" listLabel="Support agents" />
      </Field>
    </div>
  );
}

export function Selected() {
  const ref = useOpenOnMount();
  return (
    <div style={{ width: 280 }}>
      <Field label="Assign to agent">
        <Combobox ref={ref} options={agents} defaultValue="sofia" listLabel="Support agents" />
      </Field>
    </div>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 220 }}>
      <Combobox options={agents} size="sm" placeholder="Small" aria-label="Assign to agent, small" />
      <Combobox options={agents} size="md" placeholder="Medium" aria-label="Assign to agent, medium" />
      <Combobox options={agents} size="lg" placeholder="Large" aria-label="Assign to agent, large" />
    </div>
  );
}
