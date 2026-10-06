import { StatusMark } from "../atoms/icons.tsx";
import { cx, type Tone } from "../core/index.ts";

import type { ComponentPropsWithRef, ReactNode } from "react";

export interface AlertProps extends Omit<ComponentPropsWithRef<"div">, "title"> {
  tone?: Tone;
  title?: ReactNode;
  /** Replaces the hidden word a screen reader says first ("Error: "), e.g. for another language. */
  statusLabel?: string;
  /** Renders the dismiss button. */
  onDismiss?: () => void;
  dismissLabel?: string;
}

/**
 * Status banner. It always leads with its tone's icon and a word for screen
 * readers ("Error: "), so a status never rests on colour alone; neither can be
 * left out, and `statusLabel` only changes the word.
 *
 * Uses role="status" (polite) for every tone; pass role="alert" yourself for
 * urgent interruptions. A danger tone is not urgency.
 */
export function Alert({ tone = "info", title, statusLabel, onDismiss, dismissLabel = "Dismiss", className, children, ...rest }: AlertProps) {
  return (
    <div role="status" className={cx("sb-alert", `sb-alert--${tone}`, className)} {...rest}>
      <StatusMark tone={tone} statusLabel={statusLabel} className="sb-alert__icon" />
      <div>
        {title && <p className="sb-alert__title">{title}</p>}
        {children}
      </div>
      {onDismiss && (
        <button
          type="button"
          className="sb-alert__dismiss sb-close"
          aria-label={dismissLabel}
          onClick={onDismiss}
        />
      )}
    </div>
  );
}
