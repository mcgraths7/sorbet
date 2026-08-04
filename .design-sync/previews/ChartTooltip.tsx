import { ChartTooltip, seriesColor, type TooltipState } from "@sorbet/component-library";

// ChartTooltip is normally an absolutely-positioned hover overlay inside a
// chart's plot wrapper. Here it's given a static `state` and rendered inside
// a relative-positioned box so it's visible without a hover interaction.

function Frame({ children, width = 320, height = 160 }: { children: React.ReactNode; width?: number; height?: number }) {
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        background: "var(--sb-surface)",
        border: "1px solid var(--sb-border)",
        borderRadius: "var(--sb-radius-md)",
      }}
    >
      {children}
    </div>
  );
}

const lineState: TooltipState = {
  x: 24,
  y: 16,
  title: "March",
  rows: [
    { label: "Revenue", value: "$48.2K", color: seriesColor(0) },
    { label: "Costs", value: "$31.6K", color: seriesColor(1) },
  ],
};

/** Multi-row tooltip, as shown on hover in LineChart/BarChart. */
export function Default() {
  return (
    <Frame>
      <ChartTooltip state={lineState} />
    </Frame>
  );
}

const donutState: TooltipState = {
  x: 260,
  y: 40,
  title: "Paid search",
  rows: [{ label: "$18,400", value: "38%", color: seriesColor(0) }],
};

/** Single-row tooltip (DonutChart's shape) positioned past x=220, where the panel flips to the left of the cursor. */
export function SingleValueFlipped() {
  return (
    <Frame>
      <ChartTooltip state={donutState} />
    </Frame>
  );
}

const manyState: TooltipState = {
  x: 40,
  y: 12,
  title: "Q4",
  rows: [
    { label: "Americas", value: "$248K", color: seriesColor(0) },
    { label: "EMEA", value: "$134K", color: seriesColor(1) },
    { label: "APAC", value: "$89K", color: seriesColor(2) },
    { label: "LATAM", value: "$42K", color: seriesColor(3) },
  ],
};

/** Four-series tooltip, e.g. a regional bar/line chart. */
export function ManySeries() {
  return (
    <Frame>
      <ChartTooltip state={manyState} />
    </Frame>
  );
}
