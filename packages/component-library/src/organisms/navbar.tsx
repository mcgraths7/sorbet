import { cx } from "../core/index.ts";

import type { ComponentPropsWithRef } from "react";

/** Sticky, glassy app header. Compose Brand / Nav / Actions inside. */
export function Navbar({ className, children, ...rest }: ComponentPropsWithRef<"header">) {
  return (
    <header className={cx("sb-navbar", className)} {...rest}>
      <div className="sb-navbar__inner sb-container sb-container--full">{children}</div>
    </header>
  );
}

export function NavbarBrand({ className, ...rest }: ComponentPropsWithRef<"a">) {
  return <a className={cx("sb-navbar__brand", className)} {...rest} />;
}

/** Hidden below md — pair with a Drawer for the mobile menu. */
export function NavbarNav({ className, "aria-label": ariaLabel = "Main", ...rest }: ComponentPropsWithRef<"nav">) {
  return <nav className={cx("sb-navbar__nav", className)} aria-label={ariaLabel} {...rest} />;
}

export interface NavbarLinkProps extends ComponentPropsWithRef<"a"> {
  current?: boolean;
}

export function NavbarLink({ current, ...rest }: NavbarLinkProps) {
  return <a aria-current={current ? "page" : undefined} {...rest} />;
}

export function NavbarActions({ className, ...rest }: ComponentPropsWithRef<"div">) {
  return <div className={cx("sb-navbar__actions", className)} {...rest} />;
}

/** Slot for the hamburger button — visible only below md. */
export function NavbarMenuButton({ className, ...rest }: ComponentPropsWithRef<"div">) {
  return <div className={cx("sb-navbar__menu-button", className)} {...rest} />;
}
