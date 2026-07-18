import { useMemo, useState } from "react";

import { formatNumber, niceTicks, scaleLinear } from "./scale.ts";
import { ChartShell, ChartTooltip, seriesColor, useMeasuredWidth, type Series, type TooltipState } from "./shell.tsx";

export interface BarChartProps {
  labels: string[];
  series: Series[];
  title?: string;
  subtitle?: string;
  height?: number;
  /** Stack series instead of grouping them. */
  stacked?: boolean;
  formatValue?: (v: number) => string;
  className?: string;
}

const TOP = 8;
const BOTTOM = 26;
const MAX_BAR = 24;
const GAP = 2; // the surface gap between touching marks
const CAP = 4; // rounded data-end radius

/** Column path: 4px rounded data-end, square at the baseline. */
function columnPath(cx: number, w: number, yTop: number, yBase: number, rounded: boolean): string {
  const x0 = cx - w / 2;
  const h = Math.max(yBase - yTop, 0);
  if (h <= 0) {
    return "";
  }
  const r = rounded ? Math.min(CAP, w / 2, h) : 0;
  return `M ${x0} ${yBase} V ${yTop + r} Q ${x0} ${yTop} ${x0 + r} ${yTop} H ${x0 + w - r} Q ${x0 + w} ${yTop} ${x0 + w} ${yTop + r} V ${yBase} Z`;
}

/**
 * Grouped or stacked columns. ≤24px marks growing from one baseline, 2px
 * surface gaps between touching marks, hover tooltip, table view via the
 * shell. Part-to-whole is the stacked variant — no pie required.
 */
export function BarChart({
  labels,
  series,
  title,
  subtitle,
  height = 240,
  stacked,
  formatValue = formatNumber,
  className,
}: BarChartProps) {
  const [wrapRef, width] = useMeasuredWidth();
  const [hover, setHover] = useState<number | null>(null);

  const { ticks, y, band, left } = useMemo(() => {
    const totals = stacked
      ? labels.map((_, i) => series.reduce((sum, s) => sum + (s.data[i] ?? 0), 0))
      : series.flatMap((s) => s.data);
    const max = Math.max(...totals, 1);
    const ticks = niceTicks(0, max);
    const longest = Math.max(...ticks.map((t) => formatValue(t).length));
    const left = longest * 7 + 14;
    const y = scaleLinear(0, ticks[ticks.length - 1]!, height - BOTTOM, TOP);
    const band = (width - left - 12) / Math.max(labels.length, 1);
    return { ticks, y, band, left };
  }, [labels, series, stacked, width, height, formatValue]);

  const baseY = y(0);
  const groupWidth = stacked ? Math.min(MAX_BAR, band * 0.6) : 0;
  const subWidth = stacked ? 0 : Math.min(MAX_BAR, (band * 0.7 - GAP * (series.length - 1)) / series.length);

  const tooltip: TooltipState | null =
    hover === null
      ? null
      : {
        x: left + band * hover + band / 2,
        y: TOP + 4,
        title: labels[hover] ?? "",
        rows: series.map((s, i) => ({
          label: s.label,
          value: formatValue(s.data[hover] ?? 0),
          color: seriesColor(i),
        })),
      };

  return (
    <ChartShell
      title={title}
      subtitle={subtitle}
      labels={labels}
      series={series}
      formatValue={formatValue}
      ariaLabel={title}
      className={className}
    >
      <div className="sb-chart__plot" ref={wrapRef}>
        <svg height={height} onPointerLeave={() => setHover(null)} aria-hidden="true">
          {ticks.map((t) => (
            <g key={t}>
              <line className="sb-chart__grid" x1={left} x2={width - 12} y1={y(t)} y2={y(t)} />
              <text className="sb-chart__tick" x={left - 8} y={y(t) + 3.5} textAnchor="end">
                {formatValue(t)}
              </text>
            </g>
          ))}

          {labels.map((label, i) => {
            const cx = left + band * i + band / 2;
            return (
              <g key={label} onPointerEnter={() => setHover(i)}>
                {/* hover hit target: the whole band */}
                <rect x={left + band * i} y={TOP} width={band} height={height - TOP - BOTTOM} fill="transparent" />
                {stacked
                  ? (() => {
                    let cursor = baseY;
                    return series.map((s, si) => {
                      const v = s.data[i] ?? 0;
                      const h = baseY - y(v);
                      const yTop = cursor - h;
                      const isTop = si === series.length - 1;
                      const el = (
                        <path key={s.label} d={columnPath(cx, groupWidth, yTop, cursor, isTop)} fill={seriesColor(si)} />
                      );
                      cursor = yTop - GAP; // 2px surface gap to the next segment
                      return el;
                    });
                  })()
                  : series.map((s, si) => {
                    const v = s.data[i] ?? 0;
                    const total = series.length * subWidth + (series.length - 1) * GAP;
                    const x0 = cx - total / 2 + si * (subWidth + GAP) + subWidth / 2;
                    return <path key={s.label} d={columnPath(x0, subWidth, y(v), baseY, true)} fill={seriesColor(si)} />;
                  })}
                <text className="sb-chart__tick" x={cx} y={height - 8} textAnchor="middle">
                  {label}
                </text>
              </g>
            );
          })}
          <line className="sb-chart__axis" x1={left} x2={width - 12} y1={baseY} y2={baseY} />
        </svg>
        <ChartTooltip state={tooltip} />
      </div>
    </ChartShell>
  );
}
