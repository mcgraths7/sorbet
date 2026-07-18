import { cx } from "../core/index.ts";

import type { ComponentPropsWithRef } from "react";

export interface SkeletonProps extends ComponentPropsWithRef<"span"> {
  variant?: "text" | "circle" | "rect";
  /** Convenience: number of stacked text lines. */
  lines?: number;
}

export function Skeleton({ variant = "text", lines, className, ...rest }: SkeletonProps) {
  const classes = cx("sb-skeleton", `sb-skeleton--${variant}`, className);
  if (variant === "text" && lines && lines > 1) {
    return (
      <span aria-hidden="true" className="sb-skeleton-group" {...rest}>
        {Array.from({ length: lines }, (_, i) => (
          <span key={i} className={classes} />
        ))}
      </span>
    );
  }
  return <span aria-hidden="true" className={classes} {...rest} />;
}
