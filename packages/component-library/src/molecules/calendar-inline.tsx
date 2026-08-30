"use client";

import { useId, useRef } from "react";

import { cx, useControllableState } from "../core/index.ts";

import { CalendarView, useCalendar } from "./calendar.tsx";
import { isoKey, startOfDay } from "./date-core.ts";

import type { ComponentPropsWithRef } from "react";

export interface CalendarProps extends Omit<ComponentPropsWithRef<"div">, "onChange" | "defaultValue"> {
  /** Controlled selection. */
  value?: Date | null;
  /** Uncontrolled initial selection. */
  defaultValue?: Date | null;
  onChange?: (date: Date) => void;
  /** Days outside the bounds are disabled; months and years clamp to them. */
  min?: Date | null;
  max?: Date | null;
  /** 0 = Sunday, 1 = Monday. */
  weekStartsOn?: 0 | 1;
  locale?: string;
  /** Month to open on when nothing is selected. Defaults to today. */
  defaultMonth?: Date;
  /** Accessible name for the calendar group. */
  "aria-label"?: string;
}

/**
 * An always-visible month calendar — scheduling views, date summaries, a
 * booking grid. Same grid, keyboard model and bounds handling as DatePicker,
 * without the input or the popover.
 *
 * Reach for DatePicker instead when a date is one field among several in a
 * form; typed entry is faster than navigating a grid, and the popover keeps
 * the form compact.
 */
export function Calendar({
  value,
  defaultValue = null,
  onChange,
  min = null,
  max = null,
  weekStartsOn = 0,
  locale,
  defaultMonth,
  className,
  ...rest
}: CalendarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = `${useId()}-title`;
  const [selected, setSelected] = useControllableState<Date | null>(value, defaultValue, (next) => {
    if (next) {
      onChange?.(next);
    }
  });

  const cal = useCalendar({
    // Always "open": there is no popover to wait on. The focus-on-open effect
    // only fires when a keyboard move or `recenter` has raised its flag, and
    // neither happens on mount, so this does not steal focus.
    open: true,
    panelRef: ref,
    min,
    max,
    weekStartsOn,
    locale,
    onPick: (date) => setSelected(startOfDay(date)),
    // Escape has nothing to dismiss here.
    onClose: () => {},
    initialDate: selected ?? defaultMonth,
  });

  const selectedIso = selected ? isoKey(selected) : null;

  return (
    <div
      ref={ref}
      className={cx("sb-calendar", "sb-calendar--inline", className)}
      role="group"
      aria-label={rest["aria-label"] ?? "Calendar"}
      {...rest}
    >
      <CalendarView
        calendar={cal}
        titleId={titleId}
        todayIso={isoKey(startOfDay(new Date()))}
        dayStatus={(iso) => ({ selected: iso === selectedIso })}
        onPick={(date) => setSelected(startOfDay(date))}
      />
    </div>
  );
}
