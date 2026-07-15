import { cx } from "@sorbet/core";
import type { ComponentPropsWithRef } from "react";

export function Kbd({ className, ...rest }: ComponentPropsWithRef<"kbd">) {
  return <kbd className={cx("sb-kbd", className)} {...rest} />;
}
