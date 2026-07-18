import { scaleLinear } from "./scale.ts";

export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  /** Highlight the final segment (the current period) in the accent color. */
  accentLast?: boolean;
}

/**
 * The stat-tile trend line: de-emphasis hue with the current period in the
 * accent. Purely decorative — the stat's value/delta carry the information —
 * so it is aria-hidden.
 */
export function Sparkline({ data, width = 96, height = 28, accentLast = true }: SparklineProps) {
  if (data.length < 2) {
    return null;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const x = scaleLinear(0, data.length - 1, 2, width - 2);
  const y = scaleLinear(min, max === min ? min + 1 : max, height - 3, 3);
  const points = data.map((v, i) => `${x(i)},${y(v)}`);

  return (
    <svg className="sb-sparkline" width={width} height={height} aria-hidden="true">
      <polyline
        className="sb-sparkline__base"
        points={points.join(" ")}
        fill="none"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {accentLast && (
        <polyline
          className="sb-sparkline__accent"
          points={points.slice(-2).join(" ")}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
