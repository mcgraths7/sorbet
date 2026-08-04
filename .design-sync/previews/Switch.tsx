import { Choice, Switch } from "@sorbet/component-library";

export function Default() {
  return (
    <Choice>
      <Switch defaultChecked name="auto-renew" />
      Auto-renew my subscription
    </Choice>
  );
}

export function Sizes() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Choice>
        <Switch size="sm" defaultChecked aria-label="Small switch" />
        Small
      </Choice>
      <Choice>
        <Switch size="md" defaultChecked aria-label="Medium switch" />
        Medium
      </Choice>
    </div>
  );
}

export function States() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Choice>
        <Switch aria-label="Off" />
        Off
      </Choice>
      <Choice>
        <Switch defaultChecked aria-label="On" />
        On
      </Choice>
      <Choice>
        <Switch disabled aria-label="Disabled, off" />
        Disabled
      </Choice>
      <Choice>
        <Switch disabled defaultChecked aria-label="Disabled, on" />
        Disabled + on
      </Choice>
    </div>
  );
}
