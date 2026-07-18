import { useMemo, useRef, useState, type PointerEvent } from "react";

import { formatNumber } from "./scale.ts";
import { ChartShell, ChartTooltip, mutedSeriesColor, seriesColor, type TooltipState } from "./shell.tsx";

export interface DonutDatum {
  label: string;
  value: number;
}

export interface DonutChartProps {
  /** Part-to-whole data. Keep the category order stable across renders —
   * colors follow the entity via slot order, never its rank. */
  data: DonutDatum[];
  title?: string;
  subtitle?: string;
  /** Outer diameter in px. */
  size?: number;
  /** Ring thickness in px. */
  thickness?: number;
  /** Caption under the center total, e.g. "Spent in June". */
  centerLabel?: string;
  formatValue?: (v: number) => string;
  /** Max visible slices including "Other" — the smallest categories fold. */
  maxSlices?: number;
  otherLabel?: string;
  /** YNAB-style legend rows with value + share (default). */
  legendValues?: boolean;
  className?: string;
}

const TAU = Math.PI * 2;
const GAP = 2; // the surface gap, as arc length at mid-radius

const polar = (cx: number, cy: number, r: number, a: number) => `${cx + r * Math.sin(a)} ${cy - r * Math.cos(a)}`;

/** Annular sector from angle a0→a1 (clockwise from 12 o'clock). */
function ringPath(cx: number, cy: number, rOuter: number, rInner: number, a0: number, a1: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return [
    `M ${polar(cx, cy, rOuter, a0)}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${polar(cx, cy, rOuter, a1)}`,
    `L ${polar(cx, cy, rInner, a1)}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${polar(cx, cy, rInner, a0)}`,
    "Z",
  ].join(" ");
}

interface Arc extends DonutDatum {
  frac: number;
  a0: number;
  a1: number;
  color: string;
}

/**
 * Donut (part-to-whole with a headline). The hole carries the total — the
 * one number a pie can't show — segments are separated by 2px surface gaps,
 * and everything beyond `maxSlices` folds into a muted "Other". Identity
 * rides the legend (with values) and the table view, never color alone.
 * For part-to-whole *over time*, use the stacked BarChart instead.
 */
export function DonutChart({
  data,
  title,
  subtitle,
  size = 220,
  thickness = 30,
  centerLabel = "Total",
  formatValue = formatNumber,
  maxSlices = 6,
  otherLabel = "Other",
  legendValues = true,
  className,
}: DonutChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const plotRef = useRef<HTMLDivElement | null>(null);

  const { arcs, total } = useMemo(() => {
    const positive = data.filter((d) => d.value > 0);
    const limit = Math.max(2, maxSlices); // at least one category + "Other"
    let kept: Array<DonutDatum & { isOther?: boolean }> = positive;
    if (positive.length > limit) {
      const keep = new Set(
        [...positive]
          .sort((a, b) => b.value - a.value)
          .slice(0, limit - 1)
          .map((d) => d.label),
      );
      const folded = positive.filter((d) => !keep.has(d.label));
      kept = [
        ...positive.filter((d) => keep.has(d.label)),
        { label: otherLabel, value: folded.reduce((s, d) => s + d.value, 0), isOther: true },
      ];
    }
    const total = kept.reduce((s, d) => s + d.value, 0) || 1;
    let cursor = 0;
    const arcs: Arc[] = kept.map((d, i) => {
      const frac = d.value / total;
      const a0 = cursor * TAU;
      cursor += frac;
      return { ...d, frac, a0, a1: cursor * TAU, color: d.isOther ? mutedSeriesColor : seriesColor(i) };
    });
    return { arcs, total };
  }, [data, maxSlices, otherLabel]);

  const c = size / 2;
  const rOuter = c;
  const rInner = c - thickness;
  const gapAngle = arcs.length > 1 ? GAP / (rOuter - thickness / 2) : 0;

  const onMove = (e: PointerEvent) => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (rect) {
      setPointer({ x: e.clientX - rect.left, y: e.clientY - rect.top - 12 });
    }
  };

  const tooltip: TooltipState | null =
    hover === null || !arcs[hover]
      ? null
      : {
        x: pointer.x,
        y: pointer.y,
        title: arcs[hover].label,
        rows: [
          {
            label: formatValue(arcs[hover].value),
            value: `${Math.round(arcs[hover].frac * 100)}%`,
            color: arcs[hover].color,
          },
        ],
      };

  const legend = legendValues ? (
    <div className="sb-chart__vlegend" role="list" aria-label="Categories">
      {arcs.map((arc) => (
        <div className="sb-chart__vlegend-row" role="listitem" key={arc.label}>
          <i className="sb-chart__swatch" style={{ background: arc.color }} aria-hidden="true" />
          {arc.label}
          <span className="sb-chart__vlegend-value">{formatValue(arc.value)}</span>
          <span className="sb-chart__vlegend-share">{Math.round(arc.frac * 100)}%</span>
        </div>
      ))}
    </div>
  ) : undefined;

  const table = (
    <div className="sb-table-wrap sb-chart__table">
      <table className="sb-table sb-table--compact">
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col" data-numeric>
              Value
            </th>
            <th scope="col" data-numeric>
              Share
            </th>
          </tr>
        </thead>
        <tbody>
          {arcs.map((arc) => (
            <tr key={arc.label}>
              <th scope="row">{arc.label}</th>
              <td data-numeric>{formatValue(arc.value)}</td>
              <td data-numeric>{Math.round(arc.frac * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <ChartShell
      title={title}
      subtitle={subtitle}
      labels={arcs.map((a) => a.label)}
      series={arcs.map((a) => ({ label: a.label, data: [a.value] }))}
      formatValue={formatValue}
      ariaLabel={title}
      legend={legend}
      table={table}
      className={className}
    >
      <div className="sb-chart__plot sb-chart__plot--center" ref={plotRef}>
        <svg width={size} height={size} onPointerMove={onMove} onPointerLeave={() => setHover(null)} aria-hidden="true">
          {arcs.map((arc, i) => {
            const half = Math.min(gapAngle / 2, (arc.a1 - arc.a0) / 4);
            return (
              <path
                key={arc.label}
                d={ringPath(c, c, rOuter, rInner, arc.a0 + half, arc.a1 - half)}
                fill={arc.color}
                opacity={hover === null || hover === i ? 1 : 0.5}
                onPointerEnter={() => setHover(i)}
              />
            );
          })}
          <text className="sb-chart__donut-value" x={c} y={c} textAnchor="middle">
            {formatValue(total)}
          </text>
          <text className="sb-chart__donut-label" x={c} y={c + 18} textAnchor="middle">
            {centerLabel}
          </text>
        </svg>
        <ChartTooltip state={tooltip} />
      </div>
    </ChartShell>
  );
}
