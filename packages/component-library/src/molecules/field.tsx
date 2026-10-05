"use client";

import { cloneElement, useId, type ComponentPropsWithRef, type ReactElement, type ReactNode } from "react";

import { StatusMark } from "../atoms/icons.tsx";
import { Label } from "../atoms/index.ts";
import { cx } from "../core/index.ts";

export interface FieldProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  label: ReactNode;
  hint?: ReactNode;
  /** Error message. Rendered in the DOM; shown when `invalid` (or when the
   * control reports :user-invalid — the CSS handles that path). It leads with
   * the danger status's octagon and a hidden "Error: " for screen readers. */
  error?: ReactNode;
  /** Replaces the error message's hidden word ("Error: "), e.g. for another language. */
  statusLabel?: string;
  required?: boolean;
  optional?: boolean;
  /** Force the error visible and mark the control aria-invalid. */
  invalid?: boolean;
  /** Label beside control (settings rows) instead of stacked. */
  inline?: boolean;
  /** Exactly one form control; Field wires ids and descriptions onto it. */
  children: ReactElement<{
    id?: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean | "true" | "false";
  }>;
}

/** Label + control + hint + error, with the ARIA wiring done for you. */
export function Field({
  label,
  hint,
  error,
  required,
  optional,
  invalid,
  inline,
  statusLabel,
  className,
  children,
  ...rest
}: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy =
    [hint ? hintId : null, error && invalid ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cx("sb-field", inline && "sb-field--inline", className)} data-invalid={invalid || undefined} {...rest}>
      <Label htmlFor={id} required={required} optional={optional}>
        {label}
      </Label>
      {cloneElement(children, {
        id,
        "aria-describedby": describedBy,
        ...(invalid !== undefined ? { "aria-invalid": invalid || undefined } : {}),
      })}
      {hint && (
        <p className="sb-field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="sb-field__error" id={errorId}>
          <StatusMark tone="danger" statusLabel={statusLabel} />
          {error}
        </p>
      )}
    </div>
  );
}
