import { cx } from "../core/index.ts";

import type { ComponentPropsWithRef } from "react";

export type FabProps = ComponentPropsWithRef<"button">;

/** Floating action button pinned to the viewport's bottom end corner. */
export function Fab({ className, type = "button", ...rest }: FabProps) {
  return <button type={type} className={cx("sb-fab", className)} {...rest} />;
}
