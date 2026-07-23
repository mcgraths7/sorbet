import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from "react";

import { Select } from "../atoms/index.ts";

import { addDays, addMonths, daysInMonth, isoKey, monthGrid, monthLabels, startOfDay, weekdayLabels } from "./date-core.ts";

// Shared calendar between DatePicker and DateRange. `useCalendar` owns the
// month view, the roving-focus day, keyboard nav, and re-focusing the day after
// a move or on open; `CalendarView` renders the header + grid. Selection is
// left to the caller via `dayStatus`, so a single date and a start/end range
// both drive the same grid.

export interface UseCalendarOptions {
  /** Whether the calendar popover is open (drives focus-on-open). */
  open: boolean;
  /** The popover panel the days live in (for focus queries). */
  panelRef: RefObject<HTMLElement | null>;
  /** Reasonable bounds; days outside are disabled and months/years clamped. */
  min: Date | null;
  max: Date | null;
  weekStartsOn: 0 | 1;
  locale?: string;
  /** Enter/Space on the focused day. */
  onPick: (date: Date) => void;
  /** Escape in the grid. */
  onClose: () => void;
}

export interface CalendarApi {
  view: Date;
  focused: Date;
  focusedIso: string;
  weekdays: ReturnType<typeof weekdayLabels>;
  weeks: ReturnType<typeof monthGrid>;
  monthLabel: string;
  monthNames: string[];
  years: number[];
  /** Center the view + roving day on a date (call when opening). */
  recenter: (date: Date) => void;
  goToMonth: (delta: number) => void;
  jumpTo: (year: number, monthIndex: number) => void;
  monthOutOfRange: (year: number, monthIndex: number) => boolean;
  onGridKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
  setFocused: (date: Date) => void;
  isDisabledDay: (date: Date) => boolean;
}

export function useCalendar({ open, panelRef, min, max, weekStartsOn, locale, onPick, onClose }: UseCalendarOptions): CalendarApi {
  const today = startOfDay(new Date());
  const [view, setView] = useState(today); // any day within the shown month
  const [focused, setFocused] = useState(today); // roving-focus day
  // Set only by keyboard moves + opening, so mouse nav clicks don't yank focus
  // out of the nav button into the day grid.
  const pullFocus = useRef(false);

  const clampInRange = (d: Date): Date => (min && d < min ? min : max && d > max ? max : d);

  const recenter = (date: Date) => {
    const d = clampInRange(date);
    setView(d);
    setFocused(d);
    pullFocus.current = true;
  };

  const focusedIso = isoKey(focused);

  // Move DOM focus to the roving day after a keyboard move or on open — never on
  // a mouse nav click (pullFocus stays false there). Runs after usePopover has
  // shown the panel, as long as usePopover is called before useCalendar.
  useEffect(() => {
    if (open && pullFocus.current) {
      panelRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${focusedIso}"]`)?.focus();
      pullFocus.current = false;
    }
  }, [open, focusedIso, panelRef]);

  const moveFocus = (next: Date) => {
    const d = clampInRange(next);
    pullFocus.current = true;
    setFocused(d);
    if (d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear()) {
      setView(d);
    }
  };

  const goToMonth = (delta: number) => {
    const next = addMonths(view, delta);
    setView(next);
    setFocused(next); // keep the roving tab stop live without stealing focus
  };

  // Jump straight to a year/month from the header selects. Keeps focus on the
  // select (no pullFocus) and just re-points the view + roving tab stop.
  const jumpTo = (year: number, monthIndex: number) => {
    const day = Math.min(focused.getDate(), daysInMonth(year, monthIndex + 1));
    const target = new Date(year, monthIndex, day);
    setView(target);
    setFocused(clampInRange(target));
  };

  // A whole month sitting outside [min, max] — its option is disabled so you
  // can't land on an all-unavailable grid.
  const monthOutOfRange = (year: number, monthIndex: number) =>
    Boolean((min && new Date(year, monthIndex + 1, 0) < min) || (max && new Date(year, monthIndex, 1) > max));

  const isDisabledDay = (d: Date) => Boolean((min && d < min) || (max && d > max));

  const onGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let next: Date | null = null;
    const offset = (focused.getDay() - weekStartsOn + 7) % 7;
    switch (e.key) {
      case "ArrowLeft":
        next = addDays(focused, -1);
        break;
      case "ArrowRight":
        next = addDays(focused, 1);
        break;
      case "ArrowUp":
        next = addDays(focused, -7);
        break;
      case "ArrowDown":
        next = addDays(focused, 7);
        break;
      case "Home":
        next = addDays(focused, -offset);
        break;
      case "End":
        next = addDays(focused, 6 - offset);
        break;
      case "PageUp":
        next = addMonths(focused, e.shiftKey ? -12 : -1);
        break;
      case "PageDown":
        next = addMonths(focused, e.shiftKey ? 12 : 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        onPick(focused);
        return;
      case "Escape":
        e.preventDefault();
        onClose();
        return;
      default:
        return;
    }
    e.preventDefault();
    moveFocus(next);
  };

  const weekdays = useMemo(() => weekdayLabels(weekStartsOn, locale), [weekStartsOn, locale]);
  const weeks = useMemo(() => monthGrid(view.getFullYear(), view.getMonth(), weekStartsOn), [view, weekStartsOn]);
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(view),
    [locale, view],
  );
  const monthNames = useMemo(() => monthLabels(locale), [locale]);
  const minYear = min ? min.getFullYear() : view.getFullYear() - 100;
  const maxYear = max ? max.getFullYear() : view.getFullYear() + 100;
  const years = useMemo(() => Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i), [minYear, maxYear]);

  return {
    view,
    focused,
    focusedIso,
    weekdays,
    weeks,
    monthLabel,
    monthNames,
    years,
    recenter,
    goToMonth,
    jumpTo,
    monthOutOfRange,
    onGridKeyDown,
    setFocused,
    isDisabledDay,
  };
}

/** Selection styling for one day, resolved by the caller. */
export interface DayStatus {
  selected?: boolean;
  rangeStart?: boolean;
  rangeEnd?: boolean;
  inRange?: boolean;
}

export interface CalendarViewProps {
  calendar: CalendarApi;
  /** Ties the grid to its live month label. */
  titleId: string;
  todayIso: string;
  dayStatus: (iso: string, date: Date) => DayStatus;
  onPick: (date: Date) => void;
  /** Hover a day (range preview); omit for single-date. */
  onDayHover?: (date: Date | null) => void;
}

export function CalendarView({ calendar: cal, titleId, todayIso, dayStatus, onPick, onDayHover }: CalendarViewProps) {
  return (
    <>
      <div className="sb-calendar__header">
        <button type="button" className="sb-calendar__nav" aria-label="Previous month" onClick={() => cal.goToMonth(-1)}>
          <i className="sb-calendar__arrow sb-calendar__arrow--prev" aria-hidden="true" />
        </button>
        <div className="sb-calendar__period">
          <Select
            size="sm"
            aria-label="Month"
            wrapperClassName="sb-calendar__month"
            value={cal.view.getMonth()}
            onChange={(e) => cal.jumpTo(cal.view.getFullYear(), Number(e.target.value))}
          >
            {cal.monthNames.map((name, i) => (
              <option key={name} value={i} disabled={cal.monthOutOfRange(cal.view.getFullYear(), i)}>
                {name}
              </option>
            ))}
          </Select>
          <Select
            size="sm"
            aria-label="Year"
            wrapperClassName="sb-calendar__year"
            value={cal.view.getFullYear()}
            onChange={(e) => cal.jumpTo(Number(e.target.value), cal.view.getMonth())}
          >
            {cal.years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
        <button type="button" className="sb-calendar__nav" aria-label="Next month" onClick={() => cal.goToMonth(1)}>
          <i className="sb-calendar__arrow sb-calendar__arrow--next" aria-hidden="true" />
        </button>
        <span id={titleId} className="u-visually-hidden" aria-live="polite">
          {cal.monthLabel}
        </span>
      </div>

      <div
        className="sb-calendar__grid"
        role="grid"
        aria-labelledby={titleId}
        onKeyDown={cal.onGridKeyDown}
        onMouseLeave={onDayHover ? () => onDayHover(null) : undefined}
      >
        <div className="sb-calendar__week" role="row">
          {cal.weekdays.map((w) => (
            <abbr key={w.long} className="sb-calendar__weekday" role="columnheader" aria-label={w.long} title={w.long}>
              {w.short}
            </abbr>
          ))}
        </div>
        {cal.weeks.map((week, wi) => (
          <div className="sb-calendar__week" role="row" key={week[0]?.iso ?? wi}>
            {week.map((d) => {
              const status = dayStatus(d.iso, d.date);
              return (
                <button
                  key={d.iso}
                  type="button"
                  role="gridcell"
                  className="sb-calendar__day"
                  data-iso={d.iso}
                  data-outside={!d.inMonth || undefined}
                  data-today={d.iso === todayIso || undefined}
                  data-range-start={status.rangeStart || undefined}
                  data-range-end={status.rangeEnd || undefined}
                  data-in-range={status.inRange || undefined}
                  aria-selected={status.selected ?? false}
                  aria-current={d.iso === todayIso ? "date" : undefined}
                  aria-disabled={cal.isDisabledDay(d.date) || undefined}
                  tabIndex={d.iso === cal.focusedIso ? 0 : -1}
                  onClick={() => onPick(d.date)}
                  onFocus={() => cal.setFocused(d.date)}
                  onMouseEnter={onDayHover ? () => onDayHover(d.date) : undefined}
                >
                  {d.day}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
