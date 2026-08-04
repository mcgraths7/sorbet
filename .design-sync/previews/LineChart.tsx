import { LineChart } from "@sorbet/component-library";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Canonical multi-series line with direct end labels. */
export function Default() {
  return (
    <LineChart
      title="Monthly active users"
      subtitle="2025, by plan"
      labels={months}
      series={[
        { label: "Pro", data: [12400, 12900, 13500, 14100, 14800, 15600, 16200, 16900, 17500, 18300, 19100, 20200] },
        { label: "Free", data: [8200, 8600, 9100, 9400, 9800, 10200, 10500, 10900, 11300, 11700, 12100, 12600] },
      ]}
    />
  );
}

/** Soft area fill under a single trend line. */
export function Area() {
  return (
    <LineChart
      title="Cumulative revenue"
      subtitle="Q1–Q2 2026, in USD"
      area
      labels={["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7", "Wk 8"]}
      series={[{ label: "Revenue", data: [12000, 26500, 39800, 55200, 71000, 88500, 104200, 121800] }]}
    />
  );
}

/** Five series: end labels explicitly suppressed, legend carries identity. */
export function NoEndLabels() {
  return (
    <LineChart
      title="Daily active sessions by platform"
      subtitle="Last 12 months"
      endLabels={false}
      labels={months}
      series={[
        { label: "Web", data: [4200, 4350, 4500, 4700, 4600, 4800, 5100, 5300, 5200, 5450, 5600, 5900] },
        { label: "iOS", data: [3100, 3200, 3350, 3500, 3600, 3750, 3900, 4050, 4200, 4350, 4500, 4700] },
        { label: "Android", data: [2800, 2950, 3050, 3200, 3350, 3500, 3650, 3800, 3950, 4100, 4250, 4400] },
        { label: "Desktop", data: [1200, 1250, 1300, 1280, 1350, 1400, 1420, 1450, 1500, 1520, 1560, 1600] },
        { label: "Tablet", data: [900, 920, 950, 940, 960, 980, 1000, 1020, 1010, 1040, 1060, 1080] },
      ]}
    />
  );
}
