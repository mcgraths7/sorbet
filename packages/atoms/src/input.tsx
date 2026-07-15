import { cx, type Size } from "@sorbet/core";
import type { ComponentPropsWithRef } from "react";

export interface InputProps extends Omit<ComponentPropsWithRef<"input">, "size"> {
  size?: Size;
  /** Marks the control invalid for styling + assistive tech. */
  invalid?: boolean;
}

export function Input({ size = "md", invalid, className, ...rest }: InputProps) {
  return (
    <input
      className={cx("sb-input", size !== "md" && `sb-input--${size}`, className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

export interface TextareaProps extends ComponentPropsWithRef<"textarea"> {
  /** Grows with content via CSS field-sizing — no JS autosize. */
  autoResize?: boolean;
  invalid?: boolean;
}

export function Textarea({ autoResize, invalid, className, ...rest }: TextareaProps) {
  return (
    <textarea
      className={cx("sb-textarea", autoResize && "sb-textarea--auto", className)}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}
