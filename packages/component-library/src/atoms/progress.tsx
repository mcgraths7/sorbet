import { cx, type BrandTone, type Tone } from "../core/index.ts";

import type { ComponentPropsWithRef } from "react";

export interface ProgressProps extends ComponentPropsWithRef<"div"> {
  /** 0–max. Omit together with indeterminate for an unknown duration. */
  value?: number;
  max?: number;
  tone?: Exclude<BrandTone, "primary"> | Tone;
  size?: "sm" | "md" | "lg";
  indeterminate?: boolean;
  /** Accessible name for the bar. */
  label?: string;
}

export function Progress({ value, max = 100, tone, size = "md", indeterminate, label, className, ...rest }: ProgressProps) {
  const pct = indeterminate || value === undefined ? undefined : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={indeterminate ? undefined : value}
      className={cx(
        "sb-progress",
        size !== "md" && `sb-progress--${size}`,
        tone && `sb-progress--${tone}`,
        indeterminate && "sb-progress--indeterminate",
        className,
      )}
      {...rest}
    >
      <div className="sb-progress__bar" style={pct === undefined ? undefined : { inlineSize: `${pct}%` }} />
    </div>
  );
}
