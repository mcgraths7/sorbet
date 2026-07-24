import { cx, type PolymorphicProps } from "../core/index.ts";

import type { ComponentPropsWithRef, ElementType } from "react";

// Typed text primitives, the typographic peers of the layout primitives. These
// are class-emitting wrappers over tokenized styles (styling stays in Sass) for
// CONSUMER content — component internals keep their own BEM parts.

export type TextSize = "xs" | "sm" | "md" | "lg" | "xl";
export type TextTone = "default" | "muted" | "subtle";
export type TextWeight = "regular" | "medium" | "semibold" | "bold";

export interface TextOwnProps {
  /** Font size (token scale); defaults to md (body). */
  size?: TextSize;
  /** Color role; defaults to the ambient text color. */
  tone?: TextTone;
  /** Font weight; defaults to the element's own. */
  weight?: TextWeight;
  className?: string;
}

/** Body / inline text. `<Text>` is a paragraph; `<Text as="span" tone="muted">`
 *  for inline hints, etc. */
export function Text<E extends ElementType = "p">(props: PolymorphicProps<E, TextOwnProps>) {
  const { as, size, tone, weight, className, ...rest } = props;
  const Tag: ElementType = as ?? "p";
  return (
    <Tag
      className={cx(
        "sb-text",
        size && size !== "md" && `sb-text--${size}`,
        tone && tone !== "default" && `sb-text--${tone}`,
        weight && `sb-text--${weight}`,
        className,
      )}
      {...rest}
    />
  );
}

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingSize = "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";

// The visual size each level renders at by default — overridable via `size`.
const LEVEL_SIZE: Record<HeadingLevel, HeadingSize> = { 1: "4xl", 2: "3xl", 3: "2xl", 4: "xl", 5: "lg", 6: "md" };

export interface HeadingProps extends Omit<ComponentPropsWithRef<"h2">, "color"> {
  /** Semantic level → the `<hN>` tag. Default 2. */
  level?: HeadingLevel;
  /** Visual size, decoupled from the level (default: the level's natural size).
   *  Lets an `<h2>` look like an `<h1>` without breaking the outline. */
  size?: HeadingSize;
  className?: string;
}

/** A semantic heading whose look is consistent across levels; pick the tag with
 *  `level` and the appearance with `size`. */
export function Heading({ level = 2, size, className, ...rest }: HeadingProps) {
  const Tag = `h${level}` as `h${HeadingLevel}`;
  return <Tag className={cx("sb-heading", `sb-heading--${size ?? LEVEL_SIZE[level]}`, className)} {...rest} />;
}

/** Long-form content — the one place elements get flow margins (see `.sb-prose`). */
export function Prose<E extends ElementType = "div">(props: PolymorphicProps<E, { className?: string }>) {
  const { as, className, ...rest } = props;
  const Tag: ElementType = as ?? "div";
  return <Tag className={cx("sb-prose", className)} {...rest} />;
}

/** Larger muted intro paragraph. */
export function Lead({ className, ...rest }: ComponentPropsWithRef<"p">) {
  return <p className={cx("sb-lead", className)} {...rest} />;
}

/** Small uppercase eyebrow/kicker above a heading. */
export function Overline<E extends ElementType = "span">(props: PolymorphicProps<E, { className?: string }>) {
  const { as, className, ...rest } = props;
  const Tag: ElementType = as ?? "span";
  return <Tag className={cx("sb-overline", className)} {...rest} />;
}
