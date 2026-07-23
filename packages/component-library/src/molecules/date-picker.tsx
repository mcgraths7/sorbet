import {
  useId,
  useMemo,
  useRef,
  useState,
  type AriaAttributes,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type Ref,
} from "react";

import { composeRefs, cx, useControllableState, usePopover, type Size } from "../core/index.ts";

import { CalendarView, useCalendar } from "./calendar.tsx";
import {
  formatDate,
  formatDateInput,
  isoKey,
  parseFormat,
  resolveBounds,
  startOfDay,
  validate,
  type DateValidation,
} from "./date-core.ts";

export type { DateValidation };

export interface DatePickerProps
  extends Omit<ComponentPropsWithRef<"input">, "value" | "defaultValue" | "onChange" | "size" | "min" | "max"> {
  /** Segment order + separators, e.g. "yyyy-mm-dd", "mm/dd/yyyy", "dd.mm.yyyy". */
  format?: string;
  /** Controlled formatted value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Reasonable lower bound (ISO "yyyy-mm-dd" or Date). Default 1900-01-01. */
  min?: string | Date;
  /** Reasonable upper bound (ISO "yyyy-mm-dd" or Date). Default 2100-12-31. */
  max?: string | Date;
  /** Disallow dates after today — a shortcut that caps `max` at today. */
  disableFuture?: boolean;
  /** Disallow dates before today — a shortcut that raises `min` to today. */
  disablePast?: boolean;
  size?: Size;
  /** Force the control invalid regardless of the built-in checks. */
  invalid?: boolean;
  disabled?: boolean;
  /** Drop the calendar trigger, leaving typed entry only. */
  hidePicker?: boolean;
  /** 0 = Sunday (default), 1 = Monday. */
  weekStartsOn?: 0 | 1;
  /** BCP-47 locale for month + weekday names; defaults to the runtime locale. */
  locale?: string;
  name?: string;
  id?: string;
  /** Fires on every typed or picked change with the text + the simple checks. */
  onValueChange?: (value: string, result: DateValidation) => void;
  ref?: Ref<HTMLInputElement>;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
  "aria-label"?: string;
}

/**
 * A date field that masks typed input to a format and runs two simple checks —
 * is it a real calendar date, and is it reasonable (within [min, max]) — plus a
 * calendar popover for pointer/keyboard picking. The typed value is the source
 * of truth; the calendar just writes into it. Composes with Field, which wires
 * the label and descriptions onto the input.
 */
export function DatePicker({
  format = "yyyy-mm-dd",
  value,
  defaultValue = "",
  min = "1900-01-01",
  max = "2100-12-31",
  disableFuture,
  disablePast,
  size = "md",
  invalid,
  disabled,
  hidePicker,
  weekStartsOn = 0,
  locale,
  name,
  id,
  placeholder,
  onValueChange,
  className,
  ref,
  ...rest
}: DatePickerProps) {
  const spec = useMemo(() => parseFormat(format), [format]);
  // `disablePast`/`disableFuture` are shortcuts that clamp the bounds to today,
  // so they flow through validation, disabled days, and the year dropdown alike.
  const { min: minDate, max: maxDate } = useMemo(
    () => resolveBounds(min, max, spec, { disablePast, disableFuture }),
    [min, max, spec, disablePast, disableFuture],
  );

  const autoId = useId();
  const inputId = id ?? `${autoId}-input`;
  const dialogId = `${autoId}-calendar`;
  const titleId = `${autoId}-title`;

  const [current, setCurrent] = useControllableState(value, defaultValue);
  const prevValue = useRef(current);

  const result = useMemo(() => validate(current, spec, minDate, maxDate), [current, spec, minDate, maxDate]);
  // Only flag once the whole date is typed — not mid-entry.
  const badWhenComplete = result.complete && (!result.valid || !result.inRange);
  const ariaInvalid = rest["aria-invalid"] ?? invalid ?? (badWhenComplete || undefined);

  const commit = (next: string) => {
    setCurrent(next);
    prevValue.current = next;
    onValueChange?.(next, validate(next, spec, minDate, maxDate));
  };

  const onInput = (raw: string) => {
    // Deleting shrinks the string; only then let a backspace cross a separator.
    const growing = raw.length >= prevValue.current.length;
    commit(formatDateInput(raw, spec, growing));
  };

  // ---- Calendar popover ----------------------------------------------------
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const today = startOfDay(new Date());

  const closeCalendar = (refocus = true) => {
    setOpen(false);
    if (refocus) {
      inputRef.current?.focus();
    }
  };

  const pick = (d: Date) => {
    if ((minDate && d < minDate) || (maxDate && d > maxDate)) {
      return;
    }
    commit(formatDate(d, spec));
    closeCalendar();
  };

  const { anchorRef: controlRef, panelRef, popoverProps } = usePopover({
    open,
    onDismiss: () => closeCalendar(false),
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
    onPick: pick,
    onClose: closeCalendar,
  });

  const openCalendar = () => {
    if (disabled) {
      return;
    }
    cal.recenter(result.date ?? today);
    setOpen(true);
  };

  const todayIso = isoKey(today);
  const selectedIso = result.date ? isoKey(result.date) : null;

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && !open && !hidePicker) {
      e.preventDefault();
      openCalendar();
    }
  };

  return (
    <div className={cx("sb-date-picker", className)}>
      <div className="sb-date-picker__control" ref={controlRef}>
        <input
          {...rest}
          id={inputId}
          ref={composeRefs(ref, inputRef)}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          className={cx("sb-input", size !== "md" && `sb-input--${size}`, !hidePicker && "sb-date-picker__input")}
          placeholder={placeholder ?? spec.format}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          value={current}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={onInputKeyDown}
        />
        {!hidePicker && (
          <button
            type="button"
            className="sb-date-picker__trigger"
            aria-label={open ? "Close calendar" : "Choose date"}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={dialogId}
            disabled={disabled}
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => (open ? closeCalendar() : openCalendar())}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <rect x="2" y="3" width="12" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path
                d="M2 6h12M5 1.5v3M11 1.5v3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {!hidePicker && (
        <div id={dialogId} ref={panelRef} role="dialog" aria-label="Choose date" className="sb-calendar" {...popoverProps}>
          <CalendarView
            calendar={cal}
            titleId={titleId}
            todayIso={todayIso}
            onPick={pick}
            dayStatus={(iso) => ({ selected: iso === selectedIso })}
          />
        </div>
      )}

      {name && <input type="hidden" name={name} value={current} />}
    </div>
  );
}
