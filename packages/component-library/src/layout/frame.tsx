import { cx } from "../core/index.ts";

import type { ComponentPropsWithRef, CSSProperties } from "react";

export interface FrameProps extends ComponentPropsWithRef<"div"> {
  /** Aspect ratio, e.g. "4 / 5" or 1. Defaults to 16 / 9. */
  ratio?: string | number;
  /** Letterbox instead of cropping. */
  contain?: boolean;
  /** Round the corners (radius-lg). */
  round?: boolean;
}

/**
 * Fixed-ratio media box: the child image/video/iframe fills and crops, and
 * the box never reflows when media loads. The masonry demo's best friend,
 * but just as useful for card media and embeds.
 */
export function Frame({ ratio, contain, round, className, style, ...rest }: FrameProps) {
  return (
    <div
      className={cx("sb-frame", contain && "sb-frame--contain", round && "sb-frame--round", className)}
      style={ratio !== undefined ? ({ "--ratio": String(ratio), ...style } as CSSProperties) : style}
      {...rest}
    />
  );
}
