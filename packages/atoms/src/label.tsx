import { cx } from "@sorbet/core";
import type { ComponentPropsWithRef } from "react";

export interface LabelProps extends ComponentPropsWithRef<"label"> {
  /** Draws the required asterisk. */
  required?: boolean;
  /** Draws "(optional)". */
  optional?: boolean;
}

export function Label({ required, optional, className, ...rest }: LabelProps) {
  return (
    <label
      className={cx("sb-label", className)}
      data-required={required || undefined}
      data-optional={optional || undefined}
      {...rest}
    />
  );
}
