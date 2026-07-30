import { cx } from "../core/index.ts";

import type { ComponentPropsWithRef, ReactNode } from "react";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";
export type IconTone = "muted" | "subtle" | "primary" | "success" | "warning" | "danger" | "info";

export interface IconProps extends Omit<ComponentPropsWithRef<"span">, "children"> {
  /** Any SVG: a Sorbet glyph, a Lucide/Phosphor/Heroicons icon, or your own. */
  children: ReactNode;
  /** Sizes to the type scale. Omit to match the surrounding text. */
  size?: IconSize;
  tone?: IconTone;
  /**
   * Give a label when the icon is the only thing conveying its meaning — an
   * icon-only control, say. Without one the icon is treated as decorative and
   * hidden from assistive tech, which is right when adjacent text already says
   * the same thing.
   */
  label?: string;
}

/**
 * The box an icon lives in — size, color, alignment and accessibility, applied
 * the same way whoever drew the glyph.
 *
 * Icon sets worth using (Lucide, Phosphor, Heroicons, Tabler…) all draw with
 * `currentColor` and scale to their box, so wrapping one here gives it Sorbet's
 * tokens for free:
 *
 *   <Icon size="lg" tone="danger"><LucideTrash /></Icon>
 *   <Icon label="Search"><PhosphorSearch /></Icon>
 *   <Icon><CheckIcon /></Icon>
 *
 * With no `size` it inherits the surrounding font size, so an icon beside text
 * tracks that text automatically — including when a parent changes the scale.
 * It sits on the text baseline rather than hanging off the descender line.
 */
export function Icon({ size, tone, label, className, ...rest }: IconProps) {
  return (
    <span
      className={cx("sb-icon", size && `sb-icon--${size}`, tone && `sb-icon--${tone}`, className)}
      // Decorative unless it's carrying the meaning itself.
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    />
  );
}
