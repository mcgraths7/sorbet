import { cx, type PolymorphicProps } from "../core/index.ts";

import type { ComponentPropsWithRef, CSSProperties, ElementType } from "react";

export interface LayerOwnProps {
  /** Where the content sits over the media (default "end" — a bottom band). */
  place?: "start" | "center" | "end";
  /**
   * Dark wash behind the content so text stays legible over any image: a
   * bottom gradient normally, an even wash when centered. Content color
   * switches to the on-scrim token, which is light in both modes.
   */
  scrim?: boolean;
  /** Round the corners (radius-lg) and clip the stack to them. */
  round?: boolean;
  className?: string;
}

/**
 * Z-axis stacking: media behind, content in front. Grid stacking rather than
 * absolute positioning, so the box takes the media's size and stays in flow.
 * Put the ratio on a Frame inside; put the overlaid content in LayerContent.
 *
 *   <Layer scrim round>
 *     <Frame ratio="21 / 9"><img … /></Frame>
 *     <LayerContent>…</LayerContent>
 *   </Layer>
 *
 * The contrast contract cannot measure text over an arbitrary image — no
 * build gate can. The scrim is the honest answer: with it on, the text sits
 * on a known dark wash rather than on whatever the photo happens to be.
 */
export function Layer<E extends ElementType = "div">(props: PolymorphicProps<E, LayerOwnProps>) {
  const { as, place, scrim, round, className, ...rest } = props;
  const Tag: ElementType = as ?? "div";
  return (
    <Tag
      className={cx(
        "sb-layer",
        place && place !== "end" && `sb-layer--${place}`,
        scrim && "sb-layer--scrim",
        round && "sb-layer--round",
        className,
      )}
      {...rest}
    />
  );
}

export interface LayerContentProps extends ComponentPropsWithRef<"div"> {
  /** Padding override (a length); defaults to space-6. */
  pad?: string;
}

/** The overlaid content. One per Layer, after the media child. */
export function LayerContent({ pad, className, style, ...rest }: LayerContentProps) {
  return (
    <div
      className={cx("sb-layer__content", className)}
      style={pad ? ({ "--pad": pad, ...style } as CSSProperties) : style}
      {...rest}
    />
  );
}
