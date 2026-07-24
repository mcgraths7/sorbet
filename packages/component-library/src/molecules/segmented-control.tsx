import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useRef,
  type ComponentPropsWithRef,
  type KeyboardEvent,
} from "react";

import { cx, rovingIndex, useControllableState } from "../core/index.ts";

interface SegmentedContextValue {
  value: string;
  /** The value that owns the roving tab stop — the selected segment, or the
   *  first one when nothing is selected. */
  tabbable: string;
  select: (value: string) => void;
}

const SegmentedContext = createContext<SegmentedContextValue | null>(null);

function useSegmented(component: string): SegmentedContextValue {
  const ctx = useContext(SegmentedContext);
  if (!ctx) {
    throw new Error(`<${component}> must be used inside <SegmentedControl>`);
  }
  return ctx;
}

export interface SegmentedControlProps extends Omit<ComponentPropsWithRef<"div">, "onChange" | "defaultValue"> {
  /** Controlled selected value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  size?: "sm" | "md";
}

/**
 * Single-select button group — a radiogroup styled as a segmented bar. Arrow
 * keys move + select (roving focus); the selected segment stays visually
 * distinct from the track in both light and dark. Compose with `<Segment>`.
 */
export function SegmentedControl({
  value,
  defaultValue,
  onValueChange,
  size = "md",
  className,
  children,
  ...rest
}: SegmentedControlProps) {
  const [selected, setSelected] = useControllableState(value, defaultValue ?? "", onValueChange);
  const ref = useRef<HTMLDivElement>(null);

  // Keep exactly one segment tabbable: the selected one, or the first if none.
  let firstValue = "";
  for (const child of Children.toArray(children)) {
    if (isValidElement<SegmentProps>(child) && child.props.value != null) {
      firstValue = child.props.value;
      break;
    }
  }
  const tabbable = selected || firstValue;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const opts = [...(ref.current?.querySelectorAll<HTMLElement>('[role="radio"]:not(:disabled)') ?? [])];
    const current = opts.indexOf(document.activeElement as HTMLElement);
    const next = rovingIndex(e.key, current, opts.length, "horizontal");
    if (next === null) {
      return;
    }
    e.preventDefault();
    opts[next]?.focus();
    opts[next]?.click(); // radio pattern: moving the focus also selects
  };

  return (
    <div
      ref={ref}
      role="radiogroup"
      className={cx("sb-segmented", size !== "md" && `sb-segmented--${size}`, className)}
      onKeyDown={onKeyDown}
      {...rest}
    >
      <SegmentedContext.Provider value={{ value: selected, tabbable, select: setSelected }}>
        {children}
      </SegmentedContext.Provider>
    </div>
  );
}

export interface SegmentProps extends Omit<ComponentPropsWithRef<"button">, "value"> {
  value: string;
}

export function Segment({ value, className, disabled, ...rest }: SegmentProps) {
  const ctx = useSegmented("Segment");
  const checked = ctx.value === value;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      tabIndex={ctx.tabbable === value ? 0 : -1}
      disabled={disabled}
      className={cx("sb-segmented__option", className)}
      onClick={() => ctx.select(value)}
      {...rest}
    />
  );
}
