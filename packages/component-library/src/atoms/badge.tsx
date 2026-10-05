import { cx, type BrandTone, type Tone } from "../core/index.ts";

import { StatusMark } from "./icons.tsx";

import type { ComponentPropsWithRef } from "react";

const isStatus = (tone: BrandTone | Tone | undefined): tone is Tone =>
  tone === "success" || tone === "warning" || tone === "danger" || tone === "info";

export interface BadgeProps extends ComponentPropsWithRef<"span"> {
  tone?: BrandTone | Tone;
  /** Solid fill instead of the subtle tint. */
  solid?: boolean;
  /**
   * Leading status dot. With a status tone the badge leads with the status's
   * icon instead, which says the same thing by shape rather than by colour.
   */
  dot?: boolean;
  /** With a status tone: replaces the hidden word a screen reader says first ("Error: "), e.g. for another language. */
  statusLabel?: string;
}

/**
 * A short label. A status tone (`success`, `warning`, `danger`, `info`) leads
 * with that status's icon and a word for screen readers ("Error: Overdue"), so
 * the status never rests on colour alone; a brand tone or none is a plain
 * label.
 */
export function Badge({ tone, solid, dot, statusLabel, className, children, ...rest }: BadgeProps) {
  return (
    <span className={cx("sb-badge", tone && `sb-badge--${tone}`, solid && "sb-badge--solid", className)} {...rest}>
      {isStatus(tone) ? (
        <StatusMark tone={tone} statusLabel={statusLabel} />
      ) : (
        dot && <i className="sb-badge__dot" aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
