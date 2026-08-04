import { Choice, Radio } from "@sorbet/component-library";

export function Default() {
  return (
    <Choice>
      <Radio name="delivery-day" defaultChecked />
      Tuesday
    </Choice>
  );
}

export function Group() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }} role="radiogroup" aria-label="Delivery day">
      <Choice>
        <Radio name="delivery-day-group" defaultChecked />
        Tuesday
      </Choice>
      <Choice>
        <Radio name="delivery-day-group" />
        Thursday
      </Choice>
      <Choice>
        <Radio name="delivery-day-group" />
        Saturday
      </Choice>
    </div>
  );
}

export function Disabled() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Choice>
        <Radio name="delivery-day-disabled" disabled />
        Sunday (unavailable in your area)
      </Choice>
      <Choice>
        <Radio name="delivery-day-disabled" disabled defaultChecked />
        Monday (unavailable in your area)
      </Choice>
    </div>
  );
}
