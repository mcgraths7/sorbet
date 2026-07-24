import {
  useEffect,
  useId,
  useRef,
  useState,
  type AriaAttributes,
  type ChangeEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type Ref,
} from "react";

import { composeRefs, cx, useControllableState, type Size } from "../core/index.ts";

export interface NumberInputProps {
  /** Current value (controlled); `null` is the empty field. */
  value?: number | null;
  defaultValue?: number | null;
  /** Fires with the parsed number, or `null` when the field is cleared. */
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  /** Increment for the steppers and Arrow keys (default 1). */
  step?: number;
  size?: Size;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  name?: string;
  id?: string;
  className?: string;
  /** Accessible name when there's no associated <Field>/<label>. */
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
  decrementLabel?: string;
  incrementLabel?: string;
  ref?: Ref<HTMLInputElement>;
}

const MinusIcon = (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <line x1="3.5" y1="8" x2="12.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const PlusIcon = (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <line x1="3.5" y1="8" x2="12.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="8" y1="3.5" x2="8" y2="12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * A numeric field with ± steppers over a bare input. Free typing lives in a
 * draft string (so `-`, `1.`, and empty are all typeable); the numeric value
 * commits when the text parses and clamps to [min, max] on blur. Steppers
 * hold-to-repeat; Arrow keys step, Page keys step ×10, Home/End jump to the
 * bounds. The input is an editable `spinbutton`, so AT announces the range.
 */
export function NumberInput({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step = 1,
  size = "md",
  disabled,
  required,
  placeholder,
  name,
  id,
  className,
  decrementLabel = "Decrease",
  incrementLabel = "Increase",
  ref,
  ...aria
}: NumberInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputRef = useRef<HTMLInputElement>(null);

  const [current, setValue] = useControllableState<number | null>(value, defaultValue ?? null, onValueChange);
  /** In-progress text that isn't a clean number yet; null = mirror the value. */
  const [draft, setDraft] = useState<string | null>(null);
  // Mirrors the committed number so a hold-repeat burst reads the fresh value
  // between renders (useControllableState's setter isn't functional).
  const latest = useRef(current);
  latest.current = current;

  const decimals = (String(step).split(".")[1] ?? "").length;
  const clampValue = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
  const roundStep = (n: number) => {
    const p = 10 ** decimals;
    return Math.round(n * p) / p;
  };

  const commit = (next: number | null) => {
    latest.current = next;
    setDraft(null);
    setValue(next);
  };
  const setClamped = (n: number) => commit(clampValue(roundStep(n)));
  const stepBy = (steps: number) => {
    if (disabled) {
      return;
    }
    setClamped((latest.current ?? min ?? 0) + steps * step);
  };

  const display = draft ?? (current == null ? "" : String(current));
  const atMin = current != null && min != null && current <= min;
  const atMax = current != null && max != null && current >= max;

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDraft(raw); // keep the exact text on screen — no reformat mid-type
    const trimmed = raw.trim();
    if (trimmed === "") {
      latest.current = null;
      setValue(null);
      return;
    }
    const n = Number(trimmed);
    if (Number.isFinite(n)) {
      latest.current = n;
      setValue(n); // commit unclamped while typing; blur clamps
    }
    // else: hold the partial text in the draft; value unchanged
  };

  const onBlur = () => {
    if (current == null) {
      setDraft(null);
    } else {
      setClamped(current); // normalize + clamp the shown value
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        stepBy(1);
        break;
      case "ArrowDown":
        e.preventDefault();
        stepBy(-1);
        break;
      case "PageUp":
        e.preventDefault();
        stepBy(10);
        break;
      case "PageDown":
        e.preventDefault();
        stepBy(-10);
        break;
      case "Home":
        if (min != null) {
          e.preventDefault();
          setClamped(min);
        }
        break;
      case "End":
        if (max != null) {
          e.preventDefault();
          setClamped(max);
        }
        break;
      default:
    }
  };

  // ---- hold-to-repeat ------------------------------------------------------
  const holdTimeout = useRef<number>(undefined);
  const holdInterval = useRef<number>(undefined);
  const stopHold = () => {
    window.clearTimeout(holdTimeout.current);
    window.clearInterval(holdInterval.current);
    holdTimeout.current = undefined;
    holdInterval.current = undefined;
  };
  const startHold = (e: ReactPointerEvent<HTMLButtonElement>, steps: number) => {
    e.preventDefault(); // keep focus on the input; suppress text selection
    if (disabled) {
      return;
    }
    inputRef.current?.focus();
    stepBy(steps);
    holdTimeout.current = window.setTimeout(() => {
      holdInterval.current = window.setInterval(() => stepBy(steps), 60);
    }, 350);
  };
  useEffect(() => stopHold, []);

  return (
    <div
      className={cx("sb-number-input", size !== "md" && `sb-number-input--${size}`, className)}
      data-disabled={disabled || undefined}
    >
      <button
        type="button"
        className="sb-number-input__step sb-number-input__step--dec"
        aria-label={decrementLabel}
        tabIndex={-1}
        disabled={disabled || atMin}
        onPointerDown={(e) => startHold(e, -1)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
      >
        {MinusIcon}
      </button>
      <input
        ref={composeRefs(inputRef, ref)}
        id={inputId}
        name={name}
        className="sb-number-input__field"
        type="text"
        inputMode="decimal"
        role="spinbutton"
        autoComplete="off"
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        value={display}
        aria-label={aria["aria-label"]}
        aria-describedby={aria["aria-describedby"]}
        aria-invalid={aria["aria-invalid"]}
        aria-valuenow={current ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      <button
        type="button"
        className="sb-number-input__step sb-number-input__step--inc"
        aria-label={incrementLabel}
        tabIndex={-1}
        disabled={disabled || atMax}
        onPointerDown={(e) => startHold(e, 1)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
      >
        {PlusIcon}
      </button>
    </div>
  );
}
