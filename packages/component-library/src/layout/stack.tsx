import { cx, type PolymorphicProps } from "../core/index.ts";
import type { ComponentPropsWithRef, ElementType } from "react";

export type StackGap = 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16;

export interface StackOwnProps {
  /** Spacing step between children (space scale). */
  gap?: StackGap;
  align?: "stretch" | "center" | "start" | "end";
  className?: string;
}

/** Vertical flow. Children get no margins; the stack gaps them. */
export function Stack<E extends ElementType = "div">(props: PolymorphicProps<E, StackOwnProps>) {
  const { as, gap, align, className, ...rest } = props;
  const Tag: ElementType = as ?? "div";
  return (
    <Tag
      className={cx(
        "sb-stack",
        gap !== undefined && `sb-stack--gap-${gap}`,
        align && align !== "stretch" && `sb-stack--${align}`,
        className,
      )}
      {...rest}
    />
  );
}

/** Pushes itself (and everything after) to the far end of the stack. */
export function StackPush({ className, ...rest }: ComponentPropsWithRef<"div">) {
  return <div className={cx("sb-stack__push", className)} {...rest} />;
}
