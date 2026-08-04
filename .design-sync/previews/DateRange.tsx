import { useEffect, useRef } from "react";
import { DateRange } from "@sorbet/component-library";

// DateRange declares a `ref` prop in its type but never wires it to anything
// in the component body (it's unused dead prop surface — not something to
// "fix" here, just a fact to work around). So, same as DatePicker, we wrap it
// in a plain div, ref that wrapper, and click the real trigger button
// (`.sb-date-range__trigger`) by selector after mount — a genuine DOM click
// on the actual button, running the real onClick → openCalendar() path.
function useOpenCalendarOnMount() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    wrapperRef.current?.querySelector<HTMLButtonElement>(".sb-date-range__trigger")?.click();
  }, []);
  return wrapperRef;
}

function FieldLabel({ children }: { children: string }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--sb-text-muted)", marginBlockEnd: 6 }}>{children}</div>
  );
}

export function Default() {
  const wrapperRef = useOpenCalendarOnMount();
  return (
    <div ref={wrapperRef} style={{ width: 320 }}>
      <FieldLabel>Reservation dates</FieldLabel>
      <DateRange minNights={1} startLabel="Check-in" endLabel="Check-out" />
    </div>
  );
}

export function Selected() {
  const wrapperRef = useOpenCalendarOnMount();
  return (
    <div ref={wrapperRef} style={{ width: 320 }}>
      <FieldLabel>Reservation dates</FieldLabel>
      <DateRange
        defaultValue={{ start: "2026-08-10", end: "2026-08-14" }}
        minNights={1}
        startLabel="Check-in"
        endLabel="Check-out"
      />
    </div>
  );
}

export function Filled() {
  return (
    <div style={{ width: 320 }}>
      <FieldLabel>Reservation dates</FieldLabel>
      <DateRange defaultValue={{ start: "2026-08-10", end: "2026-08-14" }} startLabel="Check-in" endLabel="Check-out" />
    </div>
  );
}
