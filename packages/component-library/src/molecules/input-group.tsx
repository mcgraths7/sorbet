import { cx } from "../core/index.ts";
import type { ComponentPropsWithRef } from "react";

/** Joined controls: addon + input + button share one border chain. */
export function InputGroup({ className, ...rest }: ComponentPropsWithRef<"div">) {
  return <div className={cx("sb-input-group", className)} {...rest} />;
}

/** Static affix like "https://" or ".com". */
export function InputGroupAddon({ className, ...rest }: ComponentPropsWithRef<"span">) {
  return <span className={cx("sb-input-group__addon", className)} {...rest} />;
}
