import { cx } from "../core/index.ts";
import type { ComponentPropsWithRef, CSSProperties } from "react";

export interface SplitProps extends ComponentPropsWithRef<"div"> {
  /** Natural width of the aside column, e.g. "16rem". */
  aside?: string;
  asideRight?: boolean;
}

/**
 * Sidebar-and-content. The pair stacks when the content would get too
 * narrow. Compose with SplitAside and SplitMain children.
 */
export function Split({ aside, asideRight, className, style, ...rest }: SplitProps) {
  return (
    <div
      className={cx("sb-split", asideRight && "sb-split--aside-right", className)}
      style={aside ? ({ "--aside": aside, ...style } as CSSProperties) : style}
      {...rest}
    />
  );
}

export function SplitAside({ className, ...rest }: ComponentPropsWithRef<"div">) {
  return <div className={cx("sb-split__aside", className)} {...rest} />;
}

export function SplitMain({ className, ...rest }: ComponentPropsWithRef<"div">) {
  return <div className={cx("sb-split__main", className)} {...rest} />;
}
