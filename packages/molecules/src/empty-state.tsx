import { cx } from "@sorbet/core";
import type { ComponentPropsWithRef, ReactNode } from "react";

export interface EmptyStateProps extends Omit<ComponentPropsWithRef<"div">, "title"> {
  icon?: ReactNode;
  title: ReactNode;
  /** Call-to-action element(s), e.g. a Button. */
  action?: ReactNode;
}

export function EmptyState({ icon, title, action, className, children, ...rest }: EmptyStateProps) {
  return (
    <div className={cx("sb-empty-state", className)} {...rest}>
      {icon && <div className="sb-empty-state__icon">{icon}</div>}
      <h3 className="sb-empty-state__title">{title}</h3>
      {children && <p className="sb-empty-state__body">{children}</p>}
      {action}
    </div>
  );
}
