import { cx } from "../core/index.ts";

import type { ComponentPropsWithRef, ReactNode } from "react";

/**
 * Full application frame: navbar row, sidebar rail (lg+), scrolling main.
 * Reuse the same Sidebar markup inside a Drawer for mobile.
 */
export function AppShell({ className, ...rest }: ComponentPropsWithRef<"div">) {
  return <div className={cx("sb-app-shell", className)} {...rest} />;
}

/** Wrap the Navbar organism: <AppShellHeader><Navbar>… */
export function AppShellHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("sb-app-shell__header", className)}>{children}</div>;
}

export function AppShellSidebar({ className, ...rest }: ComponentPropsWithRef<"aside">) {
  return <aside className={cx("sb-app-shell__sidebar", className)} {...rest} />;
}

export function AppShellMain({ className, ...rest }: ComponentPropsWithRef<"main">) {
  return <main className={cx("sb-app-shell__main", className)} {...rest} />;
}

export interface AuthLayoutProps extends ComponentPropsWithRef<"main"> {
  /** Wordmark shown above the panel. */
  brand?: ReactNode;
  /** Line below the panel ("No account? Sign up"). */
  alt?: ReactNode;
}

/** Centered auth page on a theme-aware wash of brand color. */
export function AuthLayout({ brand, alt, className, children, ...rest }: AuthLayoutProps) {
  return (
    <main className={cx("sb-auth", className)} {...rest}>
      <div className="sb-auth__panel">
        {brand && <div className="sb-auth__brand">{brand}</div>}
        {children}
        {alt && <p className="sb-auth__alt">{alt}</p>}
      </div>
    </main>
  );
}
