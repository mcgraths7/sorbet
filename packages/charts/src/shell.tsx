import { Button } from "@sorbet/atoms";
import { cx } from "@sorbet/core";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { formatNumber } from "./scale.ts";

export interface Series {
  label: string;
  /** One value per entry in `labels`, aligned by index. */
  data: number[];
}

/** Categorical slot color: fixed order, assigned in sequence, never cycled. */
export function seriesColor(index: number): string {
  return `var(--sb-chart-${Math.min(index + 1, 8)})`;
}

export interface ChartShellProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  labels: string[];
  series: Series[];
  formatValue?: (v: number) => string;
  /** Accessible description of the figure. */
  ariaLabel?: string;
  /** Replace the default swatch-list legend (e.g. a value legend). */
  legend?: ReactNode;
  /** Replace the default table view (shown by the toggle). */
  table?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * The figure every chart mounts on: title/subtitle, a legend whenever there
 * are ≥2 series (a single series is named by the title), the plot, and the
 * accessibility twin — a "View as table" toggle rendering the same data as a
 * real table. Identity is never color-alone.
 */
export function ChartShell({
  title,
  subtitle,
  labels,
  series,
  formatValue = formatNumber,
  ariaLabel,
  legend,
  table,
  className,
  children,
}: ChartShellProps) {
  const [showTable, setShowTable] = useState(false);

  return (
    <figure className={cx("sb-chart", className)} role="group" aria-label={ariaLabel}>
      {(title || subtitle) && (
        <div className="sb-chart__header">
          <div>
            {title && <div className="sb-chart__title">{title}</div>}
            {subtitle && <div className="sb-chart__subtitle">{subtitle}</div>}
          </div>
          <Button variant="ghost" size="sm" aria-pressed={showTable} onClick={() => setShowTable((s) => !s)}>
            {showTable ? "View as chart" : "View as table"}
          </Button>
        </div>
      )}
      {legend ??
        (series.length >= 2 && (
          <div className="sb-chart__legend" role="list" aria-label="Series">
            {series.map((s, i) => (
              <span className="sb-chart__legend-item" role="listitem" key={s.label}>
                <i className="sb-chart__swatch" style={{ background: seriesColor(i) }} aria-hidden="true" />
                {s.label}
              </span>
            ))}
          </div>
        ))}
      {showTable && table ? (
        table
      ) : showTable ? (
        <div className="sb-table-wrap sb-chart__table">
          <table className="sb-table sb-table--compact">
            <thead>
              <tr>
                <th scope="col"></th>
                {series.map((s) => (
                  <th scope="col" key={s.label} data-numeric>
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((label, row) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  {series.map((s) => (
                    <td key={s.label} data-numeric>
                      {formatValue(s.data[row] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </figure>
  );
}

/** Measured container width (falls back to `initial` before first measure). */
export function useMeasuredWidth(initial = 640): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(initial);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setWidth(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width];
}

export interface TooltipState {
  x: number;
  y: number;
  title: string;
  rows: Array<{ label: string; value: string; color: string }>;
}

/** The hover tooltip panel, positioned inside the plot wrapper. */
export function ChartTooltip({ state }: { state: TooltipState | null }) {
  if (!state) return null;
  return (
    <div
      className="sb-chart__tooltip"
      style={{ left: state.x, top: state.y, translate: state.x > 220 ? "-100% 0" : "12px 0" }}
    >
      <div className="sb-chart__tooltip-title">{state.title}</div>
      {state.rows.map((row) => (
        <div className="sb-chart__tooltip-row" key={row.label}>
          <i className="sb-chart__swatch" style={{ background: row.color }} aria-hidden="true" />
          {row.label}
          <span className="sb-chart__tooltip-value">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
