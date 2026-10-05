import { cx, type PolymorphicProps, type Size } from "../core/index.ts";

import { StatusMark } from "./icons.tsx";

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

/**
 * Polymorphic: renders a <button> by default, `as="a"` for link buttons.
 *
 * `variant="danger"` leads with the danger status's octagon, so a destructive
 * action never rests on colour alone; its label is its word, so no hidden word
 * is added. An icon-only danger button gets none: its one glyph is yours,
 * named by its aria-label.
 */
export function Button<E extends ElementType = "button">(props: PolymorphicProps<E, ButtonOwnProps>) {
  const { as, variant = "primary", size = "md", pill, full, iconOnly, loading, className, children, ...rest } = props;
  const Tag: ElementType = as ?? "button";
  const defaultType = Tag === "button" && !("type" in rest) ? { type: "button" as const } : {};
  const content =
    variant === "danger" && !iconOnly ? (
      <>
        <StatusMark tone="danger" wordless />
        {children}
      </>
    ) : (
      children
    );
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
    >
      {content}
    </Tag>
  );
}
