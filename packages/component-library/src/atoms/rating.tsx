import { cx, type BrandTone, type Tone } from "../core/index.ts";

import type { ComponentPropsWithRef, CSSProperties } from "react";

export type RatingTone = BrandTone | Tone;

export interface RatingProps extends Omit<ComponentPropsWithRef<"span">, "children"> {
  /** The rating. Fractions are shown as a partial star, not rounded. */
  value: number;
  /** Top of the scale (default 5). */
  max?: number;
  size?: "sm" | "md" | "lg";
  /** Fill color. Defaults to `warning` — the familiar gold — but ratings
   *  aren't always gold, so any semantic tone works. */
  tone?: RatingTone;
  /** Show the numeric value beside the stars. */
  showValue?: boolean;
  /** How the value reads to assistive tech. Defaults to "4.3 out of 5". */
  label?: string;
}

/**
 * A read-only star rating with a true fractional fill: 4.3 of 5 paints 86% of
 * the row, so the fourth star is genuinely a third full rather than snapped to
 * a half. Two stacked rows do it — an empty track and a filled copy clipped to
 * the percentage — which keeps it pure CSS, resolution-independent, and correct
 * at any value.
 *
 * The stars sit in uniform cells with no flex gap (the spacing is inside each
 * cell), so the percentage maps exactly onto the value; a gap between them
 * would make the fill drift from the number it claims to show.
 *
 * This is a display, not an input — one `role="img"` announcing "4.3 out of 5",
 * rather than five things to tab through.
 */
export function Rating({
  value,
  max = 5,
  size = "md",
  tone = "warning",
  showValue,
  label,
  className,
  style,
  ...rest
}: RatingProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  // Rounded off the float noise — (2.1 / 5) * 100 is 42.00000000000001, and
  // that lands verbatim in the inline style otherwise.
  const pct = max === 0 ? 0 : Math.round((clamped / max) * 1e6) / 1e4;
  // Trim a trailing ".0" so a whole rating reads "5", not "5.0".
  const display = Number.isInteger(clamped) ? String(clamped) : clamped.toFixed(1);
  const stars = Array.from({ length: max });

  return (
    <span
      className={cx("sb-rating", size !== "md" && `sb-rating--${size}`, `sb-rating--${tone}`, className)}
      role="img"
      aria-label={label ?? `${display} out of ${max}`}
      style={{ "--rating-fill": `${pct}%`, ...style } as CSSProperties}
      {...rest}
    >
      <span className="sb-rating__stars" aria-hidden="true">
        <span className="sb-rating__row">
          {stars.map((_, i) => (
            <i className="sb-rating__star" key={i} />
          ))}
        </span>
        <span className="sb-rating__row sb-rating__row--fill">
          {stars.map((_, i) => (
            <i className="sb-rating__star" key={i} />
          ))}
        </span>
      </span>
      {showValue && (
        <span className="sb-rating__value" aria-hidden="true">
          {display}
        </span>
      )}
    </span>
  );
}
