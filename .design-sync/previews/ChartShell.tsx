import { ChartShell, formatNumber, niceTicks, scaleLinear, seriesColor, type Series } from "@sorbet/component-library";

// ChartShell is the figure/header/legend/table-toggle wrapper every chart
// mounts on — it takes no plot logic of its own, so `children` here is a
// small hand-rolled bar plot (the same shape BarChart builds internally)
// to give the shell something real to frame.

const WIDTH = 640;
const HEIGHT = 240;
const TOP = 8;
const BOTTOM = 26;
const LEFT = 48;

function MiniBars({ labels, series }: { labels: string[]; series: Series[] }) {
  const max = Math.max(...series.flatMap((s) => s.data), 1);
  const ticks = niceTicks(0, max);
  const y = scaleLinear(0, ticks[ticks.length - 1] ?? max, HEIGHT - BOTTOM, TOP);
  const band = (WIDTH - LEFT - 12) / labels.length;
  const barW = Math.min(28, (band * 0.6) / series.length);
  const baseY = y(0);

  return (
    <svg width={WIDTH} height={HEIGHT} aria-hidden="true">
      {ticks.map((t) => (
        <g key={t}>
          <line className="sb-chart__grid" x1={LEFT} x2={WIDTH - 12} y1={y(t)} y2={y(t)} />
          <text className="sb-chart__tick" x={LEFT - 8} y={y(t) + 3.5} textAnchor="end">
            {formatNumber(t)}
          </text>
        </g>
      ))}
      {labels.map((label, i) => {
        const cx = LEFT + band * i + band / 2;
        return (
          <g key={label}>
            {series.map((s, si) => {
              const v = s.data[i] ?? 0;
              const x = cx - (series.length * barW) / 2 + si * barW;
              return (
                <rect key={s.label} x={x} y={y(v)} width={barW - 2} height={Math.max(baseY - y(v), 0)} rx={3} fill={seriesColor(si)} />
              );
            })}
            <text className="sb-chart__tick" x={cx} y={HEIGHT - 8} textAnchor="middle">
              {label}
            </text>
          </g>
        );
      })}
      <line className="sb-chart__axis" x1={LEFT} x2={WIDTH - 12} y1={baseY} y2={baseY} />
    </svg>
  );
}

const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const series: Series[] = [
  { label: "New", data: [120, 145, 132, 168, 175, 190] },
  { label: "Returning", data: [80, 92, 101, 98, 110, 124] },
];

/** Canonical: title/subtitle header, auto swatch legend (≥2 series), plot, table toggle. */
export function Default() {
  return (
    <ChartShell title="Customer orders" subtitle="First half 2026" labels={labels} series={series} ariaLabel="Customer orders">
      <div className="sb-chart__plot">
        <MiniBars labels={labels} series={series} />
      </div>
    </ChartShell>
  );
}

/** Custom `legend` override: a value legend in place of the default swatch list. */
export function CustomLegend() {
  return (
    <ChartShell
      title="Customer orders"
      subtitle="First half 2026"
      labels={labels}
      series={series}
      ariaLabel="Customer orders"
      legend={
        <div className="sb-chart__vlegend" role="list" aria-label="Series">
          {series.map((s, i) => (
            <div className="sb-chart__vlegend-row" role="listitem" key={s.label}>
              <i className="sb-chart__swatch" style={{ background: seriesColor(i) }} aria-hidden="true" />
              {s.label}
              <span className="sb-chart__vlegend-value">{formatNumber(s.data.reduce((a, b) => a + b, 0))}</span>
            </div>
          ))}
        </div>
      }
    >
      <div className="sb-chart__plot">
        <MiniBars labels={labels} series={series} />
      </div>
    </ChartShell>
  );
}

const singleLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const singleSeries: Series[] = [{ label: "Deploys", data: [4, 7, 5, 9, 6] }];

/** Single series: no legend row — the title alone carries identity. */
export function SingleSeries() {
  return (
    <ChartShell title="Deploys this week" labels={singleLabels} series={singleSeries} ariaLabel="Deploys this week">
      <div className="sb-chart__plot">
        <MiniBars labels={singleLabels} series={singleSeries} />
      </div>
    </ChartShell>
  );
}
