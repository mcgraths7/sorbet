import { useEffect, useRef } from "react";
import { DatePicker, Field } from "@sorbet/component-library";

// DatePicker's own `ref` forwards to the typed-entry <input>, not to the
// calendar trigger button — clicking the input doesn't open the calendar
// (only the trigger button's onClick, or ArrowDown on the input, do). So we
// wrap the field in a plain div, ref that wrapper, and click the real
// trigger button (`.sb-date-picker__trigger`) by selector after mount. It's
// still a genuine DOM click on the actual button, running the component's
// real onClick → openCalendar() path — just reached via the DOM since the
// component doesn't expose that particular ref as a prop.
function useOpenCalendarOnMount() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    wrapperRef.current?.querySelector<HTMLButtonElement>(".sb-date-picker__trigger")?.click();
  }, []);
  return wrapperRef;
}

export function Default() {
  const wrapperRef = useOpenCalendarOnMount();
  return (
    <div ref={wrapperRef} style={{ width: 260 }}>
      <Field label="Delivery date">
        <DatePicker defaultValue="2026-08-14" />
      </Field>
    </div>
  );
}

export function DisablePast() {
  const wrapperRef = useOpenCalendarOnMount();
  return (
    <div ref={wrapperRef} style={{ width: 260 }}>
      <Field label="Check-in date" hint="Reservations start today at the earliest.">
        <DatePicker disablePast format="mm/dd/yyyy" />
      </Field>
    </div>
  );
}

export function Filled() {
  return (
    <div style={{ width: 260 }}>
      <Field label="Move-in date">
        <DatePicker defaultValue="2026-09-01" />
      </Field>
    </div>
  );
}
