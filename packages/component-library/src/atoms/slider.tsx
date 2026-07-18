import { cx } from "../core/index.ts";
import type { ComponentPropsWithRef } from "react";

export interface SliderProps extends Omit<ComponentPropsWithRef<"input">, "type" | "size" | "children"> {}

/** Native range input, themed. Label it via aria-label or a Field. */
export function Slider({ className, ...rest }: SliderProps) {
  return <input type="range" className={cx("sb-slider", className)} {...rest} />;
}
