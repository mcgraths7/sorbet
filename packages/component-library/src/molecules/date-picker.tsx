import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type AriaAttributes,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type Ref,
  type ToggleEvent,
} from "react";

import { Select } from "../atoms/index.ts";
import { composeRefs, cx, type Size } from "../core/index.ts";

import {
  addDays,
  addMonths,
  coerceDate,
  daysInMonth,
  formatDate,
  formatDateInput,
  isoKey,
  monthGrid,
  monthLabels,
  parseFormat,
  startOfDay,
  validate,
  weekdayLabels,
  type DateValidation,
} from "./date-core.ts";

export type { DateValidation };

const GAP = 6;
const EDGE = 8;

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
  const minDate = useMemo(() => coerceDate(min, spec), [min, spec]);
  const maxDate = useMemo(() => coerceDate(max, spec), [max, spec]);

  const autoId = useId();
  const inputId = id ?? `${autoId}-input`;
  const dialogId = `${autoId}-calendar`;
  const titleId = `${autoId}-title`;

  const [internal, setInternal] = useState(defaultValue);
  const current = value !== undefined ? value : internal;
  const prevValue = useRef(current);

  const result = useMemo(() => validate(current, spec, minDate, maxDate), [current, spec, minDate, maxDate]);
  // Only flag once the whole date is typed — not mid-entry.
  const badWhenComplete = result.complete && (!result.valid || !result.inRange);
  const ariaInvalid = rest["aria-invalid"] ?? invalid ?? (badWhenComplete || undefined);

  const commit = (next: string) => {
    if (value === undefined) {
      setInternal(next);
    }
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
  const controlRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  // Set only by keyboard moves + opening, so mouse nav clicks don't yank focus
  // out of the nav button into the day grid.
  const pullFocus = useRef(false);

  const clampInRange = (d: Date): Date => {
    if (minDate && d < minDate) {
      return minDate;
    }
    if (maxDate && d > maxDate) {
      return maxDate;
    }
    return d;
  };

  const today = startOfDay(new Date());
  const initialView = () => clampInRange(result.date ?? today);
  const [view, setView] = useState(initialView); // any day within the shown month
  const [focused, setFocused] = useState(initialView); // roving-focus day

  const weekdays = useMemo(() => weekdayLabels(weekStartsOn, locale), [weekStartsOn, locale]);
  const weeks = useMemo(() => monthGrid(view.getFullYear(), view.getMonth(), weekStartsOn), [view, weekStartsOn]);
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(view),
    [locale, view],
  );
  const monthNames = useMemo(() => monthLabels(locale), [locale]);
  // Year dropdown spans the reasonable range; fall back to a window around the
  // shown year when a bound is open-ended.
  const minYear = minDate ? minDate.getFullYear() : view.getFullYear() - 100;
  const maxYear = maxDate ? maxDate.getFullYear() : view.getFullYear() + 100;
  const years = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i),
    [minYear, maxYear],
  );
  const todayIso = isoKey(today);
  const selectedIso = result.date ? isoKey(result.date) : null;
  const focusedIso = isoKey(focused);

  const isDisabledDay = (d: Date) => Boolean((minDate && d < minDate) || (maxDate && d > maxDate));

  const openCalendar = () => {
    if (disabled) {
      return;
    }
    const start = clampInRange(result.date ?? today);
    setView(start);
    setFocused(start);
    pullFocus.current = true;
    setOpen(true);
  };

  const closeCalendar = (refocus = true) => {
    setOpen(false);
    if (refocus) {
      inputRef.current?.focus();
    }
  };

  const pick = (d: Date) => {
    if (isDisabledDay(d)) {
      return;
    }
    commit(formatDate(d, spec));
    closeCalendar();
  };

  const moveFocus = (next: Date) => {
    pullFocus.current = true;
    setFocused(next);
    if (next.getMonth() !== view.getMonth() || next.getFullYear() !== view.getFullYear()) {
      setView(next);
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
    Boolean(
      (minDate && new Date(year, monthIndex + 1, 0) < minDate) ||
        (maxDate && new Date(year, monthIndex, 1) > maxDate),
    );

  // Anchor the popover under the control when it opens; hide it when it closes.
  useEffect(() => {
    const panel = panelRef.current;
    const control = controlRef.current;
    if (!panel || !control) {
      return;
    }
    if (open && !panel.matches(":popover-open")) {
      panel.showPopover();
      const r = control.getBoundingClientRect();
      const left = Math.min(Math.max(r.left, EDGE), Math.max(EDGE, window.innerWidth - panel.offsetWidth - EDGE));
      let top = r.bottom + GAP;
      if (top + panel.offsetHeight > window.innerHeight - EDGE) {
        top = Math.max(r.top - panel.offsetHeight - GAP, EDGE);
      }
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    } else if (!open && panel.matches(":popover-open")) {
      panel.hidePopover();
    }
  }, [open]);

  // Move DOM focus to the roving day after a keyboard move or on open — never
  // on a mouse nav click (pullFocus stays false there).
  useEffect(() => {
    if (open && pullFocus.current) {
      panelRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${focusedIso}"]`)?.focus();
      pullFocus.current = false;
    }
  }, [open, focusedIso]);

  // Manual popovers don't light-dismiss; close on any press outside.
  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!controlRef.current?.contains(t) && !panelRef.current?.contains(t)) {
        closeCalendar(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Fixed panel can't track its anchor through page scroll — dismiss instead.
  // Scrolling inside the panel is exempt (listen in the capture phase).
  useEffect(() => {
    if (!open) {
      return;
    }
    const onScroll = (e: Event) => {
      if (!panelRef.current?.contains(e.target as Node)) {
        closeCalendar(false);
      }
    };
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true });
  }, [open]);

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && !open && !hidePicker) {
      e.preventDefault();
      openCalendar();
    }
  };

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
        pick(focused);
        return;
      case "Escape":
        e.preventDefault();
        closeCalendar();
        return;
      default:
        return;
    }
    e.preventDefault();
    moveFocus(clampInRange(next));
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
        <div
          id={dialogId}
          ref={panelRef}
          popover="manual"
          role="dialog"
          aria-label="Choose date"
          className="sb-date-picker__panel"
          onToggle={(e: ToggleEvent<HTMLDivElement>) => e.newState === "closed" && open && setOpen(false)}
        >
          <div className="sb-date-picker__header">
            <button type="button" className="sb-date-picker__nav" aria-label="Previous month" onClick={() => goToMonth(-1)}>
              <i className="sb-date-picker__arrow sb-date-picker__arrow--prev" aria-hidden="true" />
            </button>
            <div className="sb-date-picker__period">
              <Select
                size="sm"
                aria-label="Month"
                wrapperClassName="sb-date-picker__month"
                value={view.getMonth()}
                onChange={(e) => jumpTo(view.getFullYear(), Number(e.target.value))}
              >
                {monthNames.map((name, i) => (
                  <option key={name} value={i} disabled={monthOutOfRange(view.getFullYear(), i)}>
                    {name}
                  </option>
                ))}
              </Select>
              <Select
                size="sm"
                aria-label="Year"
                wrapperClassName="sb-date-picker__year"
                value={view.getFullYear()}
                onChange={(e) => jumpTo(Number(e.target.value), view.getMonth())}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
            <button type="button" className="sb-date-picker__nav" aria-label="Next month" onClick={() => goToMonth(1)}>
              <i className="sb-date-picker__arrow sb-date-picker__arrow--next" aria-hidden="true" />
            </button>
            <span id={titleId} className="u-visually-hidden" aria-live="polite">
              {monthLabel}
            </span>
          </div>

          <div className="sb-date-picker__grid" role="grid" aria-labelledby={titleId} onKeyDown={onGridKeyDown}>
            <div className="sb-date-picker__week" role="row">
              {weekdays.map((w) => (
                <abbr
                  key={w.long}
                  className="sb-date-picker__weekday"
                  role="columnheader"
                  aria-label={w.long}
                  title={w.long}
                >
                  {w.short}
                </abbr>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div className="sb-date-picker__week" role="row" key={week[0]?.iso ?? wi}>
                {week.map((d) => (
                  <button
                    key={d.iso}
                    type="button"
                    role="gridcell"
                    className="sb-date-picker__day"
                    data-iso={d.iso}
                    data-outside={!d.inMonth || undefined}
                    data-today={d.iso === todayIso || undefined}
                    aria-selected={d.iso === selectedIso}
                    aria-current={d.iso === todayIso ? "date" : undefined}
                    aria-disabled={isDisabledDay(d.date) || undefined}
                    tabIndex={d.iso === focusedIso ? 0 : -1}
                    onClick={() => pick(d.date)}
                    onFocus={() => setFocused(d.date)}
                  >
                    {d.day}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {name && <input type="hidden" name={name} value={current} />}
    </div>
  );
}
