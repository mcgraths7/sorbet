import { DonutChart } from "@sorbet/component-library";

/** Canonical part-to-whole: a handful of categories, value legend. */
export function Default() {
  return (
    <DonutChart
      title="Marketing spend"
      subtitle="June 2026"
      centerLabel="Total spend"
      data={[
        { label: "Paid search", value: 18400 },
        { label: "Social", value: 12600 },
        { label: "Email", value: 6200 },
        { label: "Content", value: 4800 },
        { label: "Events", value: 3100 },
      ]}
    />
  );
}

/** More categories than `maxSlices` (default 6) — the smallest fold into "Other". */
export function ManySlices() {
  return (
    <DonutChart
      title="Support tickets by category"
      subtitle="Last 30 days"
      centerLabel="Tickets"
      data={[
        { label: "Billing", value: 342 },
        { label: "Bugs", value: 289 },
        { label: "Onboarding", value: 214 },
        { label: "Feature requests", value: 176 },
        { label: "Account access", value: 121 },
        { label: "Performance", value: 98 },
        { label: "Integrations", value: 64 },
        { label: "Data export", value: 41 },
        { label: "Mobile app", value: 33 },
      ]}
    />
  );
}

/** Compact legend (no value/share columns) with a custom value formatter. */
export function CompactLegend() {
  return (
    <DonutChart
      title="Storage by file type"
      subtitle="This workspace"
      centerLabel="Used"
      legendValues={false}
      formatValue={(v) => `${v} GB`}
      data={[
        { label: "Video", value: 82 },
        { label: "Images", value: 34 },
        { label: "Documents", value: 12 },
        { label: "Archives", value: 6 },
      ]}
    />
  );
}
