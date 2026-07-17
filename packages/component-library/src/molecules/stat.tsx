import { cx } from "../core/index.ts";
import type { ComponentPropsWithRef, ReactNode } from "react";

export interface StatProps extends ComponentPropsWithRef<"div"> {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  trend?: "up" | "down" | "flat";
  /** Optional trend visual, e.g. a Sparkline from @sorbet/charts. */
  chart?: ReactNode;
}

/** KPI tile. Compose inside a Card or a Grid. */
export function Stat({ label, value, delta, trend, chart, className, ...rest }: StatProps) {
  return (
    <div className={cx("sb-stat", className)} {...rest}>
      <p className="sb-stat__label">{label}</p>
      <p className="sb-stat__value">{value}</p>
      {delta && (
        <p className="sb-stat__delta" data-trend={trend}>
          {delta}
        </p>
      )}
      {chart}
    </div>
  );
}
