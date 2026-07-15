import { cx } from "@sorbet/core";
import type { ComponentPropsWithRef } from "react";

export interface AvatarProps extends ComponentPropsWithRef<"span"> {
  src?: string;
  /** Required with src; also used as the tooltip-ish title. */
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  square?: boolean;
}

/** Image avatar, or initials fallback via children: <Avatar>AL</Avatar> */
export function Avatar({ src, alt, size = "md", square, className, children, ...rest }: AvatarProps) {
  return (
    <span
      className={cx("sb-avatar", size !== "md" && `sb-avatar--${size}`, square && "sb-avatar--square", className)}
      {...rest}
    >
      {src ? <img src={src} alt={alt ?? ""} /> : children}
    </span>
  );
}

export function AvatarGroup({ className, ...rest }: ComponentPropsWithRef<"span">) {
  return <span className={cx("sb-avatar-group", className)} {...rest} />;
}
