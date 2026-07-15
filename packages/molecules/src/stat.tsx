import { cx } from "@sorbet/core";
import type { ComponentPropsWithRef, ReactNode } from "react";

export interface StatProps extends ComponentPropsWithRef<"div"> {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  trend?: "up" | "down" | "flat";
}

/** KPI tile. Compose inside a Card or a Grid. */
export function Stat({ label, value, delta, trend, className, ...rest }: StatProps) {
  return (
    <div className={cx("sb-stat", className)} {...rest}>
      <p className="sb-stat__label">{label}</p>
      <p className="sb-stat__value">{value}</p>
      {delta && (
        <p className="sb-stat__delta" data-trend={trend}>
          {delta}
        </p>
      )}
    </div>
  );
}
