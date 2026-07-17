import { cx } from "../core/index.ts";
import type { ComponentPropsWithRef, ReactNode } from "react";

export interface BreadcrumbProps extends ComponentPropsWithRef<"nav"> {
  children: ReactNode;
}

export function Breadcrumb({ className, children, "aria-label": ariaLabel = "Breadcrumb", ...rest }: BreadcrumbProps) {
  return (
    <nav className={cx("sb-breadcrumb", className)} aria-label={ariaLabel} {...rest}>
      <ol>{children}</ol>
    </nav>
  );
}

export interface BreadcrumbItemProps extends ComponentPropsWithRef<"li"> {
  href?: string;
  current?: boolean;
}

export function BreadcrumbItem({ href, current, className, children, ...rest }: BreadcrumbItemProps) {
  return (
    <li className={className} aria-current={current ? "page" : undefined} {...rest}>
      {href && !current ? <a href={href}>{children}</a> : children}
    </li>
  );
}
