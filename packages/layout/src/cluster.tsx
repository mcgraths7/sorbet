import { cx, type PolymorphicProps } from "@sorbet/core";
import type { ComponentPropsWithRef, ElementType } from "react";

export type ClusterGap = 0 | 1 | 2 | 3 | 4 | 6 | 8;

export interface ClusterOwnProps {
  gap?: ClusterGap;
  justify?: "start" | "between" | "center" | "end";
  align?: "center" | "top" | "baseline";
  nowrap?: boolean;
  className?: string;
}

/** Horizontal grouping that wraps: toolbars, tag lists, button rows. */
export function Cluster<E extends ElementType = "div">(props: PolymorphicProps<E, ClusterOwnProps>) {
  const { as, gap, justify, align, nowrap, className, ...rest } = props;
  const Tag: ElementType = as ?? "div";
  return (
    <Tag
      className={cx(
        "sb-cluster",
        gap !== undefined && `sb-cluster--gap-${gap}`,
        justify && justify !== "start" && `sb-cluster--${justify}`,
        align && align !== "center" && `sb-cluster--${align}`,
        nowrap && "sb-cluster--nowrap",
        className,
      )}
      {...rest}
    />
  );
}

/** Pushes itself (and everything after) to the inline end of the cluster. */
export function ClusterPush({ className, ...rest }: ComponentPropsWithRef<"div">) {
  return <div className={cx("sb-cluster__push", className)} {...rest} />;
}
