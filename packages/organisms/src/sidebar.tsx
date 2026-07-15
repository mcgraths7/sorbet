import { cx, type PolymorphicProps } from "@sorbet/core";
import type { ComponentPropsWithRef, ElementType } from "react";

export function Sidebar({ className, "aria-label": ariaLabel = "Primary", ...rest }: ComponentPropsWithRef<"nav">) {
  return <nav className={cx("sb-sidebar", className)} aria-label={ariaLabel} {...rest} />;
}

export function SidebarHeading({ className, ...rest }: ComponentPropsWithRef<"p">) {
  return <p className={cx("sb-sidebar__heading", className)} {...rest} />;
}

export interface SidebarItemOwnProps {
  current?: boolean;
  className?: string;
}

/** Polymorphic (<a> by default) so router links slot in via `as`. */
export function SidebarItem<E extends ElementType = "a">(props: PolymorphicProps<E, SidebarItemOwnProps>) {
  const { as, current, className, ...rest } = props;
  const Tag: ElementType = as ?? "a";
  return (
    <Tag className={cx("sb-sidebar__item", className)} aria-current={current ? "page" : undefined} {...rest} />
  );
}

export function SidebarFooter({ className, ...rest }: ComponentPropsWithRef<"div">) {
  return <div className={cx("sb-sidebar__footer", className)} {...rest} />;
}
