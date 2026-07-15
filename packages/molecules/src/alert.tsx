import { cx, type Tone } from "@sorbet/core";
import type { ComponentPropsWithRef, ReactNode } from "react";

export interface AlertProps extends Omit<ComponentPropsWithRef<"div">, "title"> {
  tone?: Tone;
  title?: ReactNode;
  icon?: ReactNode;
  /** Renders the dismiss button. */
  onDismiss?: () => void;
  dismissLabel?: string;
}

/**
 * Status banner. Uses role="status" (polite); pass role="alert" yourself for
 * urgent interruptions.
 */
export function Alert({ tone = "info", title, icon, onDismiss, dismissLabel = "Dismiss", className, children, ...rest }: AlertProps) {
  return (
    <div role="status" className={cx("sb-alert", `sb-alert--${tone}`, className)} {...rest}>
      {icon && (
        <span className="sb-alert__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <div>
        {title && <p className="sb-alert__title">{title}</p>}
        {children}
      </div>
      {onDismiss && (
        <button type="button" className="sb-alert__dismiss" aria-label={dismissLabel} onClick={onDismiss}>
          ×
        </button>
      )}
    </div>
  );
}
