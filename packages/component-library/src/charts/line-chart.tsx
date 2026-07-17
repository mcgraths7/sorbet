import { useMemo, useState, type PointerEvent } from "react";
import { formatNumber, niceTicks, scaleLinear } from "./scale.ts";
import { ChartShell, ChartTooltip, seriesColor, useMeasuredWidth, type Series, type TooltipState } from "./shell.tsx";

export interface LineChartProps {
  labels: string[];
  series: Series[];
  title?: string;
  subtitle?: string;
  height?: number;
  /** Soft 10%-opacity fill under each line. */
  area?: boolean;
  /** Direct labels at line ends (auto-hidden when >4 series or they collide). */
  endLabels?: boolean;
  formatValue?: (v: number) => string;
  className?: string;
}

const TOP = 8;
const BOTTOM = 26;

/**
 * Multi-series line/area chart. 2px lines, ≥8px end markers with a 2px
 * surface ring, hairline gridlines, crosshair + tooltip on hover, and an
 * always-available table view via the shell.
 */
export function LineChart({
  labels,
  series,
  title,
  subtitle,
  height = 240,
  area,
  endLabels = true,
  formatValue = formatNumber,
  className,
}: LineChartProps) {
  const [wrapRef, width] = useMeasuredWidth();
  const [hover, setHover] = useState<number | null>(null);

  const all = series.flatMap((s) => s.data);
  const { ticks, y, x, left, right } = useMemo(() => {
    const min = Math.min(0, ...all);
    const max = Math.max(...all, 1);
    const ticks = niceTicks(min, max);
    const longest = Math.max(...ticks.map((t) => formatValue(t).length));
    const left = longest * 7 + 14;
    const right = endLabels && series.length <= 4 ? 84 : 12;
    const y = scaleLinear(ticks[0]!, ticks[ticks.length - 1]!, height - BOTTOM, TOP);
    const x = scaleLinear(0, Math.max(labels.length - 1, 1), left, width - right);
    return { ticks, y, x, left, right };
  }, [all, labels.length, width, height, endLabels, series.length, formatValue]);

  // Direct end labels: only when they don't collide (else the legend carries).
  const endLabelYs = series.map((s) => y(s.data[s.data.length - 1] ?? 0)).sort((a, b) => a - b);
  const collides = endLabelYs.some((v, i) => i > 0 && v - endLabelYs[i - 1]! < 14);
  const showEndLabels = endLabels && series.length <= 4 && !collides;

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const idx = Math.round(((px - left) / Math.max(width - right - left, 1)) * (labels.length - 1));
    setHover(Math.min(Math.max(idx, 0), labels.length - 1));
  };

  const tooltip: TooltipState | null =
    hover === null
      ? null
      : {
          x: x(hover),
          y: TOP + 4,
          title: labels[hover] ?? "",
          rows: series.map((s, i) => ({
            label: s.label,
            value: formatValue(s.data[hover] ?? 0),
            color: seriesColor(i),
          })),
        };

  const points = (s: Series) => s.data.map((v, i) => `${x(i)},${y(v)}`).join(" ");

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
        <svg height={height} onPointerMove={onMove} onPointerLeave={() => setHover(null)} aria-hidden="true">
          {ticks.map((t) => (
            <g key={t}>
              <line className="sb-chart__grid" x1={left} x2={width - right} y1={y(t)} y2={y(t)} />
              <text className="sb-chart__tick" x={left - 8} y={y(t) + 3.5} textAnchor="end">
                {formatValue(t)}
              </text>
            </g>
          ))}
          {labels.map((label, i) =>
            labels.length <= 12 || i % Math.ceil(labels.length / 12) === 0 ? (
              <text key={label + i} className="sb-chart__tick" x={x(i)} y={height - 8} textAnchor="middle">
                {label}
              </text>
            ) : null,
          )}
          <line className="sb-chart__axis" x1={left} x2={width - right} y1={y(ticks[0]!)} y2={y(ticks[0]!)} />

          {hover !== null && (
            <line className="sb-chart__crosshair" x1={x(hover)} x2={x(hover)} y1={TOP} y2={height - BOTTOM} />
          )}

          {series.map((s, i) => (
            <g key={s.label}>
              {area && (
                <polygon
                  points={`${points(s)} ${x(s.data.length - 1)},${y(ticks[0]!)} ${x(0)},${y(ticks[0]!)}`}
                  fill={seriesColor(i)}
                  opacity={0.1}
                />
              )}
              <polyline
                points={points(s)}
                fill="none"
                stroke={seriesColor(i)}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* end marker: ≥8px, 2px surface ring */}
              <circle
                className="sb-chart__dot"
                cx={x(s.data.length - 1)}
                cy={y(s.data[s.data.length - 1] ?? 0)}
                r={4.5}
                fill={seriesColor(i)}
              />
              {hover !== null && (
                <circle
                  className="sb-chart__dot"
                  cx={x(hover)}
                  cy={y(s.data[hover] ?? 0)}
                  r={4}
                  fill={seriesColor(i)}
                />
              )}
              {showEndLabels && (
                <text
                  className="sb-chart__label"
                  x={x(s.data.length - 1) + 10}
                  y={y(s.data[s.data.length - 1] ?? 0) + 3.5}
                >
                  {s.label}
                </text>
              )}
            </g>
          ))}
        </svg>
        <ChartTooltip state={tooltip} />
      </div>
    </ChartShell>
  );
}
