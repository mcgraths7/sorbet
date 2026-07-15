import { cx, type PolymorphicProps, type Size } from "@sorbet/core";
import type { ElementType } from "react";

export type ButtonVariant = "primary" | "secondary" | "accent" | "danger" | "soft" | "outline" | "ghost" | "link";

export interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: Size;
  pill?: boolean;
  /** Stretch to the container's full width. */
  full?: boolean;
  /** Square icon-only button — pair with aria-label. */
  iconOnly?: boolean;
  /** Shows the busy spinner and blocks pointer events. */
  loading?: boolean;
  className?: string;
}

/** Polymorphic: renders a <button> by default, `as="a"` for link buttons. */
export function Button<E extends ElementType = "button">(props: PolymorphicProps<E, ButtonOwnProps>) {
  const { as, variant = "primary", size = "md", pill, full, iconOnly, loading, className, ...rest } = props;
  const Tag: ElementType = as ?? "button";
  const defaultType = Tag === "button" && !("type" in rest) ? { type: "button" as const } : {};
  return (
    <Tag
      className={cx(
        "sb-button",
        variant !== "primary" && `sb-button--${variant}`,
        size !== "md" && `sb-button--${size}`,
        pill && "sb-button--pill",
        full && "sb-button--full",
        iconOnly && "sb-button--icon",
        className,
      )}
      data-loading={loading || undefined}
      {...defaultType}
      {...rest}
    />
  );
}
