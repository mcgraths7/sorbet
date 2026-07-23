import { useId, useMemo, useRef, useState, type AriaAttributes, type KeyboardEvent, type Ref } from "react";

import { cx, useControllableState, usePopover, type Size } from "../core/index.ts";

import { CalendarView, useCalendar } from "./calendar.tsx";
import {
  formatDate,
  formatDateInput,
  isoKey,
  parseFormat,
  resolveBounds,
  startOfDay,
  validateRange,
  type DateRangeValidation,
} from "./date-core.ts";

export type { DateRangeValidation };

export interface DateRangeValue {
  start: string;
  end: string;
}

export interface DateRangeProps {
  /** Segment order + separators, e.g. "yyyy-mm-dd", "mm/dd/yyyy". */
  format?: string;
  /** Controlled value. */
  value?: DateRangeValue;
  /** Uncontrolled initial value. */
  defaultValue?: DateRangeValue;
  /** Reasonable lower bound (ISO "yyyy-mm-dd" or Date). Default 1900-01-01. */
  min?: string | Date;
  /** Reasonable upper bound (ISO "yyyy-mm-dd" or Date). Default 2100-12-31. */
  max?: string | Date;
  /** Disallow dates after today — caps `max` at today. */
  disableFuture?: boolean;
  /** Disallow dates before today — raises `min` to today. */
  disablePast?: boolean;
  /** Fewest nights the range may span (end − start). */
  minNights?: number;
  /** Most nights the range may span. */
  maxNights?: number;
  size?: Size;
  /** Force the control invalid regardless of the built-in checks. */
  invalid?: boolean;
  disabled?: boolean;
  /** 0 = Sunday (default), 1 = Monday. */
  weekStartsOn?: 0 | 1;
  /** BCP-47 locale for month + weekday names; defaults to the runtime locale. */
  locale?: string;
  /** Posts `{name}-start` and `{name}-end` hidden inputs for form submits. */
  name?: string;
  id?: string;
  startLabel?: string;
  endLabel?: string;
  /** Fires on every typed or picked change with the value + the simple checks. */
  onValueChange?: (value: DateRangeValue, result: DateRangeValidation) => void;
  ref?: Ref<HTMLInputElement>;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
}

const EMPTY: DateRangeValue = { start: "", end: "" };

/**
 * A start/end date field: two masked inputs plus a shared calendar for pointer/
 * keyboard picking. Click a day to set the start, click another to set the end
 * (the calendar previews the span on hover); typing into either input keeps the
 * value in sync. Runs the same simple checks as DatePicker per end, plus
 * ordering (start ≤ end) and an optional span in nights.
 */
export function DateRange({
  format = "yyyy-mm-dd",
  value,
  defaultValue,
  min = "1900-01-01",
  max = "2100-12-31",
  disableFuture,
  disablePast,
  minNights,
  maxNights,
  size = "md",
  invalid,
  disabled,
  weekStartsOn = 0,
  locale,
  name,
  id,
  startLabel = "Start date",
  endLabel = "End date",
  onValueChange,
  className,
  "aria-describedby": describedBy,
  "aria-invalid": ariaInvalidProp,
}: DateRangeProps) {
  const spec = useMemo(() => parseFormat(format), [format]);
  const { min: minDate, max: maxDate } = useMemo(
    () => resolveBounds(min, max, spec, { disablePast, disableFuture }),
    [min, max, spec, disablePast, disableFuture],
  );

  const autoId = useId();
  const startId = id ? `${id}-start` : `${autoId}-start`;
  const endId = id ? `${id}-end` : `${autoId}-end`;
  const dialogId = `${autoId}-calendar`;
  const titleId = `${autoId}-title`;

  const [range, setRange] = useControllableState<DateRangeValue>(value, defaultValue ?? EMPTY);

  const bounds = useMemo(() => ({ minNights, maxNights }), [minNights, maxNights]);
  const result = useMemo(
    () => validateRange(range.start, range.end, spec, minDate, maxDate, bounds),
    [range.start, range.end, spec, minDate, maxDate, bounds],
  );
  // Only flag once both ends are fully typed — not mid-entry.
  const badWhenComplete = result.complete && !result.valid;
  const ariaInvalid = ariaInvalidProp ?? invalid ?? (badWhenComplete || undefined);

  const prevStart = useRef(range.start);
  const prevEnd = useRef(range.end);

  const commit = (next: DateRangeValue) => {
    setRange(next);
    prevStart.current = next.start;
    prevEnd.current = next.end;
    onValueChange?.(next, validateRange(next.start, next.end, spec, minDate, maxDate, bounds));
  };

  const onStartInput = (raw: string) => {
    const growing = raw.length >= prevStart.current.length;
    commit({ start: formatDateInput(raw, spec, growing), end: range.end });
  };
  const onEndInput = (raw: string) => {
    const growing = raw.length >= prevEnd.current.length;
    commit({ start: range.start, end: formatDateInput(raw, spec, growing) });
  };

  // ---- Calendar popover ----------------------------------------------------
  const [open, setOpen] = useState(false);
  const startRef = useRef<HTMLInputElement | null>(null);
  const today = startOfDay(new Date());

  // First-picked end of an in-progress range; null once the range is settled.
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [hover, setHover] = useState<Date | null>(null);

  const closeCalendar = (refocus = true) => {
    setOpen(false);
    setHover(null);
    if (refocus) {
      startRef.current?.focus();
    }
  };

  const isDisabledDay = (d: Date) => Boolean((minDate && d < minDate) || (maxDate && d > maxDate));

  const pickRange = (d: Date) => {
    if (isDisabledDay(d)) {
      return;
    }
    if (anchor == null) {
      // Begin a fresh selection — hold the first end until the second is picked.
      setAnchor(d);
      setHover(null);
    } else {
      const lo = d < anchor ? d : anchor;
      const hi = d < anchor ? anchor : d;
      commit({ start: formatDate(lo, spec), end: formatDate(hi, spec) });
      setAnchor(null);
      closeCalendar();
    }
  };

  const { anchorRef: controlRef, panelRef, popoverProps } = usePopover({
    open,
    onDismiss: () => {
      setAnchor(null);
      closeCalendar(false);
    },
  });

  // usePopover is called first so its show effect runs before the calendar's
  // focus effect — the day gets focused only after the panel is on screen.
  const cal = useCalendar({
    open,
    panelRef,
    min: minDate,
    max: maxDate,
    weekStartsOn,
    locale,
    onPick: pickRange,
    onClose: () => {
      setAnchor(null);
      closeCalendar();
    },
  });

  const openCalendar = () => {
    if (disabled) {
      return;
    }
    setAnchor(null);
    cal.recenter(result.start.date ?? result.end.date ?? today);
    setOpen(true);
  };

  const todayIso = isoKey(today);

  // Highlight source: an in-progress selection (anchor + hover preview) or the
  // settled range from the typed/committed values.
  const dayStatus = (iso: string, d: Date) => {
    const s = anchor ?? result.start.date;
    const e = anchor ? hover : result.end.date;
    if (!s) {
      return {};
    }
    if (!e) {
      const only = isoKey(s) === iso;
      return { selected: only, rangeStart: only, rangeEnd: only };
    }
    const lo = s <= e ? s : e;
    const hi = s <= e ? e : s;
    const isStart = iso === isoKey(lo);
    const isEnd = iso === isoKey(hi);
    return { selected: isStart || isEnd, rangeStart: isStart, rangeEnd: isEnd, inRange: d > lo && d < hi };
  };

  const onStartKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && !open) {
      e.preventDefault();
      openCalendar();
    }
  };

  return (
    <div className={cx("sb-date-range", className)}>
      <div className="sb-date-range__control" ref={controlRef} data-invalid={ariaInvalid || undefined}>
        <input
          id={startId}
          ref={startRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          className={cx("sb-date-range__input", size !== "md" && `sb-date-range__input--${size}`)}
          placeholder={spec.format}
          aria-label={startLabel}
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          value={range.start}
          onChange={(e) => onStartInput(e.target.value)}
          onKeyDown={onStartKeyDown}
        />
        <span className="sb-date-range__sep" aria-hidden="true">
          –
        </span>
        <input
          id={endId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          className={cx("sb-date-range__input", size !== "md" && `sb-date-range__input--${size}`)}
          placeholder={spec.format}
          aria-label={endLabel}
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          value={range.end}
          onChange={(e) => onEndInput(e.target.value)}
        />
        <button
          type="button"
          className="sb-date-range__trigger"
          aria-label={open ? "Close calendar" : "Choose dates"}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={dialogId}
          disabled={disabled}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => (open ? closeCalendar() : openCalendar())}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <rect x="2" y="3" width="12" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="M2 6h12M5 1.5v3M11 1.5v3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div id={dialogId} ref={panelRef} role="dialog" aria-label="Choose dates" className="sb-calendar" {...popoverProps}>
        <CalendarView
          calendar={cal}
          titleId={titleId}
          todayIso={todayIso}
          onPick={pickRange}
          dayStatus={dayStatus}
          onDayHover={setHover}
        />
      </div>

      {name && (
        <>
          <input type="hidden" name={`${name}-start`} value={range.start} />
          <input type="hidden" name={`${name}-end`} value={range.end} />
        </>
      )}
    </div>
  );
}
