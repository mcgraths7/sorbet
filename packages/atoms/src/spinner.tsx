import { cx } from "@sorbet/core";
import type { ComponentPropsWithRef } from "react";

export interface SpinnerProps extends ComponentPropsWithRef<"span"> {
  size?: "sm" | "md" | "lg";
  muted?: boolean;
  label?: string;
}

export function Spinner({ size = "md", muted, label = "Loading", className, ...rest }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cx("sb-spinner", size !== "md" && `sb-spinner--${size}`, muted && "sb-spinner--muted", className)}
      {...rest}
    />
  );
}
