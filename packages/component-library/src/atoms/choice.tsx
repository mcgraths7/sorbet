import { composeRefs, cx } from "../core/index.ts";

import type { ComponentPropsWithRef } from "react";

export interface CheckboxProps extends Omit<ComponentPropsWithRef<"input">, "type"> {
  /** The mixed state (parent of a part-checked group). */
  indeterminate?: boolean;
}

export function Checkbox({ indeterminate, className, ref, ...rest }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cx("sb-checkbox", className)}
      ref={composeRefs<HTMLInputElement>(ref, (node) => {
        if (node) {
          node.indeterminate = Boolean(indeterminate);
        }
      })}
      {...rest}
    />
  );
}

export function Radio({ className, ...rest }: Omit<ComponentPropsWithRef<"input">, "type">) {
  return <input type="radio" className={cx("sb-radio", className)} {...rest} />;
}

export interface SwitchProps extends Omit<ComponentPropsWithRef<"input">, "type" | "size"> {
  size?: "sm" | "md";
}

export function Switch({ size = "md", className, ...rest }: SwitchProps) {
  return (
    <input
      type="checkbox"
      role="switch"
      className={cx("sb-switch", size === "sm" && "sb-switch--sm", className)}
      {...rest}
    />
  );
}

/** Label wrapper for a checkbox/radio/switch plus its text. */
export function Choice({ className, ...rest }: ComponentPropsWithRef<"label">) {
  return <label className={cx("sb-choice", className)} {...rest} />;
}
