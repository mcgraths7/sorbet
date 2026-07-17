import { cx } from "../core/index.ts";
import type { ComponentPropsWithRef, MouseEventHandler } from "react";

export interface ChipProps extends Omit<ComponentPropsWithRef<"button">, "onSelect"> {
  selected?: boolean;
  /** Renders a dismiss affordance. With onRemove the chip root is a <span>. */
  onRemove?: MouseEventHandler<HTMLButtonElement>;
  removeLabel?: string;
}

/**
 * Interactive tag. Clickable chips (filters) render as <button>; removable
 * chips render as <span> with an inner remove button, so buttons never nest.
 */
export function Chip({ selected, onRemove, removeLabel = "Remove", className, children, ...rest }: ChipProps) {
  const classes = cx("sb-chip", selected && "sb-chip--selected", className);

  if (onRemove) {
    const { ref: _ref, type: _type, ...spanSafe } = rest;
    return (
      <span className={classes} {...(spanSafe as ComponentPropsWithRef<"span">)}>
        {children}
        <button type="button" className="sb-chip__remove" aria-label={removeLabel} onClick={onRemove}>
          ×
        </button>
      </span>
    );
  }

  return (
    <button type="button" className={classes} aria-pressed={selected} {...rest}>
      {children}
    </button>
  );
}
