import { cx, type PolymorphicProps } from "../core/index.ts";
import type { ElementType } from "react";

export interface ContainerOwnProps {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
}

/** Centered page column with responsive gutters. */
export function Container<E extends ElementType = "div">(props: PolymorphicProps<E, ContainerOwnProps>) {
  const { as, size, className, ...rest } = props;
  const Tag: ElementType = as ?? "div";
  return <Tag className={cx("sb-container", size && size !== "lg" && `sb-container--${size}`, className)} {...rest} />;
}
