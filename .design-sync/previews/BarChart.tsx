import { BarChart } from "@sorbet/component-library";

const quarters = ["Q1", "Q2", "Q3", "Q4"];

/** Grouped columns: revenue by region across quarters. */
export function Grouped() {
  return (
    <BarChart
      title="Revenue by region"
      subtitle="FY2026, in USD"
      labels={quarters}
      series={[
        { label: "Americas", data: [182000, 201000, 219000, 248000] },
        { label: "EMEA", data: [96000, 108000, 121000, 134000] },
        { label: "APAC", data: [54000, 61000, 73000, 89000] },
      ]}
    />
  );
}

/** Stacked columns: part-to-whole over time — new signups by channel. */
export function Stacked() {
  const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  return (
    <BarChart
      title="New signups by channel"
      subtitle="Last 6 months"
      stacked
      labels={months}
      series={[
        { label: "Organic", data: [420, 468, 512, 540, 587, 623] },
        { label: "Paid search", data: [180, 205, 198, 234, 260, 291] },
        { label: "Referral", data: [95, 102, 118, 129, 140, 152] },
      ]}
    />
  );
}

/** Single series: no legend needed, the title carries identity. */
export function SingleSeries() {
  return (
    <BarChart
      title="Support tickets closed"
      subtitle="This week"
      labels={["Mon", "Tue", "Wed", "Thu", "Fri"]}
      series={[{ label: "Tickets", data: [38, 45, 41, 52, 47] }]}
    />
  );
}
