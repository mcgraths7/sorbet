import { cx } from "@sorbet/core";
import type { ComponentPropsWithRef } from "react";

export interface SelectProps extends Omit<ComponentPropsWithRef<"select">, "size"> {
  size?: "sm" | "md";
  invalid?: boolean;
  /** Extra classes for the wrapper (the chevron lives there). */
  wrapperClassName?: string;
}

/** Styled native select. The wrapper carries the chevron. */
export function Select({ size = "md", invalid, wrapperClassName, className, children, ...rest }: SelectProps) {
  return (
    <span className={cx("sb-select", size !== "md" && `sb-select--${size}`, wrapperClassName)}>
      <select className={className} aria-invalid={invalid || undefined} {...rest}>
        {children}
      </select>
    </span>
  );
}
