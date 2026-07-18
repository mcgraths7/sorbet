import { cx } from "../core/index.ts";

import type { ComponentPropsWithRef, ReactNode } from "react";

export interface DividerProps extends ComponentPropsWithRef<"hr"> {
  strong?: boolean;
  /** Renders a labeled separator ("or") instead of a bare rule. */
  label?: ReactNode;
}

export function Divider({ strong, label, className, ...rest }: DividerProps) {
  const classes = cx("sb-divider", strong && "sb-divider--strong", className);
  if (label !== undefined) {
    const { ref: _ref, ...divSafe } = rest;
    return (
      <div role="separator" className={classes} {...(divSafe as ComponentPropsWithRef<"div">)}>
        <span>{label}</span>
      </div>
    );
  }
  return <hr className={classes} {...rest} />;
}
