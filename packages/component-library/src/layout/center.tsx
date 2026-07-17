import { cx, type PolymorphicProps } from "../core/index.ts";
import type { CSSProperties, ElementType } from "react";

export interface CenterOwnProps {
  /** Max inline size, defaults to the readable measure token. */
  measure?: string;
  intrinsic?: boolean;
  text?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** A readable column (or lone element) centered in the available space. */
export function Center<E extends ElementType = "div">(props: PolymorphicProps<E, CenterOwnProps>) {
  const { as, measure, intrinsic, text, className, style, ...rest } = props;
  const Tag: ElementType = as ?? "div";
  return (
    <Tag
      className={cx("sb-center", intrinsic && "sb-center--intrinsic", text && "sb-center--text", className)}
      style={measure ? ({ "--measure": measure, ...style } as CSSProperties) : style}
      {...rest}
    />
  );
}

export interface CoverOwnProps {
  /** 60vh instead of the full viewport. */
  partial?: boolean;
  className?: string;
}

/** Full-viewport centering: auth pages, empty states, splash screens. */
export function Cover<E extends ElementType = "div">(props: PolymorphicProps<E, CoverOwnProps>) {
  const { as, partial, className, ...rest } = props;
  const Tag: ElementType = as ?? "div";
  return <Tag className={cx("sb-cover", partial && "sb-cover--partial", className)} {...rest} />;
}
