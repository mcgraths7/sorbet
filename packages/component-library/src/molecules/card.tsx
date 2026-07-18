import { cx, type PolymorphicProps } from "../core/index.ts";

import type { ComponentPropsWithRef, ElementType } from "react";

export interface CardOwnProps {
  variant?: "default" | "raised" | "flat" | "sunken" | "interactive";
  className?: string;
}

export function Card<E extends ElementType = "div">(props: PolymorphicProps<E, CardOwnProps>) {
  const { as, variant = "default", className, ...rest } = props;
  const Tag: ElementType = as ?? "div";
  return <Tag className={cx("sb-card", variant !== "default" && `sb-card--${variant}`, className)} {...rest} />;
}

export function CardHeader({ className, ...rest }: ComponentPropsWithRef<"div">) {
  return <div className={cx("sb-card__header", className)} {...rest} />;
}

export function CardBody({ className, ...rest }: ComponentPropsWithRef<"div">) {
  return <div className={cx("sb-card__body", className)} {...rest} />;
}

export interface CardFooterProps extends ComponentPropsWithRef<"div"> {
  /** Space content between the edges instead of end-aligned. */
  split?: boolean;
}

export function CardFooter({ split, className, ...rest }: CardFooterProps) {
  return <div className={cx("sb-card__footer", split && "sb-card__footer--split", className)} {...rest} />;
}

export function CardMedia({ className, ...rest }: ComponentPropsWithRef<"div">) {
  return <div className={cx("sb-card__media", className)} {...rest} />;
}

export function CardTitle({ className, ...rest }: ComponentPropsWithRef<"h3">) {
  return <h3 className={cx("sb-card__title", className)} {...rest} />;
}
