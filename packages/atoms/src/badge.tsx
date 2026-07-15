import { cx, type BrandTone, type Tone } from "@sorbet/core";
import type { ComponentPropsWithRef } from "react";

export interface BadgeProps extends ComponentPropsWithRef<"span"> {
  tone?: BrandTone | Tone;
  /** Solid fill instead of the subtle tint. */
  solid?: boolean;
  /** Leading status dot. */
  dot?: boolean;
}

export function Badge({ tone, solid, dot, className, children, ...rest }: BadgeProps) {
  return (
    <span className={cx("sb-badge", tone && `sb-badge--${tone}`, solid && "sb-badge--solid", className)} {...rest}>
      {dot && <i className="sb-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
