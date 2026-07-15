import { cx, type PolymorphicProps } from "@sorbet/core";
import type { ComponentPropsWithRef, CSSProperties, ElementType } from "react";

export type GridGap = 2 | 3 | 4 | 6 | 8;

export interface GridOwnProps {
  gap?: GridGap;
  /** Minimum card width for the auto-fit grid, e.g. "14rem". */
  min?: string;
  /** Fixed column count (collapses to one column below md). */
  cols?: 2 | 3 | 4;
  className?: string;
  style?: CSSProperties;
}

/** Responsive card grid: columns appear as space allows (no media queries). */
export function Grid<E extends ElementType = "div">(props: PolymorphicProps<E, GridOwnProps>) {
  const { as, gap, min, cols, className, style, ...rest } = props;
  const Tag: ElementType = as ?? "div";
  return (
    <Tag
      className={cx("sb-grid", gap !== undefined && `sb-grid--gap-${gap}`, cols && `sb-grid--cols-${cols}`, className)}
      style={min ? ({ "--min": min, ...style } as CSSProperties) : style}
      {...rest}
    />
  );
}

/** Spans two columns in a fixed-column grid (auto below md). */
export function GridSpan2({ className, ...rest }: ComponentPropsWithRef<"div">) {
  return <div className={cx("sb-grid__span-2", className)} {...rest} />;
}
