import { cx } from "../core/index.ts";

import type { ComponentPropsWithRef } from "react";

export function Kbd({ className, ...rest }: ComponentPropsWithRef<"kbd">) {
  return <kbd className={cx("sb-kbd", className)} {...rest} />;
}
