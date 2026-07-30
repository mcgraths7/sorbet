import { BarChart, DonutChart, LineChart, Sparkline } from "@sorbet/component-library/charts";
import { Grid } from "@sorbet/component-library/layout";
import { Card, CardBody, Stat } from "@sorbet/component-library/molecules";

import type { DemoMeta } from "./types.ts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ACTIVE_USERS = [
  { label: "Web", data: [4200, 4600, 5100, 4900, 5600, 6200, 6800, 7100, 7600, 8200, 8900, 9400] },
  { label: "iOS", data: [2100, 2300, 2600, 3000, 3200, 3500, 3900, 4300, 4500, 4800, 5300, 5800] },
  { label: "Android", data: [1500, 1700, 1800, 2100, 2400, 2500, 2900, 3100, 3400, 3600, 3900, 4300] },
];

const REVENUE = [
  { label: "Subscriptions", data: [38, 42, 47, 54] },
  { label: "Services", data: [12, 14, 13, 18] },
];

const TRAFFIC = [
  { label: "Organic", data: [52, 58, 61, 64, 69, 73] },
  { label: "Referral", data: [21, 22, 25, 24, 28, 30] },
  { label: "Paid", data: [14, 12, 16, 18, 15, 19] },
];

const SPARK = [8, 10, 9, 12, 13, 12, 15, 14, 17, 19, 18, 22];

const SPENDING = [
  { label: "Rent", value: 1850 },
  { label: "Groceries", value: 640 },
  { label: "Dining out", value: 380 },
  { label: "Transport", value: 240 },
  { label: "Fun money", value: 180 },
  { label: "Subscriptions", value: 120 },
  { label: "Pets", value: 90 },
  { label: "Misc", value: 60 },
];

export function ChartsDemo() {
  return (
    <>
      <p className="u-text-muted">
        @sorbet/charts — SVG, dependency-free, themed by the validated chart tokens (8 fixed-order categorical slots per
        preset, CVD-checked). Every chart ships a legend, tooltips, and a table view.
      </p>
      <Grid cols={3}>
        <Card>
          <CardBody>
            <Stat
              label="Monthly recurring revenue"
              value="$72K"
              delta="+9.1% vs last month"
              trend="up"
              chart={<Sparkline data={SPARK} />}
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat
              label="Churn"
              value="1.9%"
              delta="−0.3 pts vs last month"
              trend="up"
              chart={<Sparkline data={[...SPARK].reverse()} />}
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat
              label="NPS"
              value="61"
              delta="steady"
              trend="flat"
              chart={<Sparkline data={[12, 12, 13, 12, 12, 13, 12, 13, 13, 12, 13, 13]} accentLast={false} />}
            />
          </CardBody>
        </Card>
      </Grid>
      <Grid cols={2}>
        <Card>
          <CardBody>
            <LineChart
              title="Weekly active users"
              subtitle="By platform, trailing 12 months"
              labels={MONTHS}
              series={ACTIVE_USERS}
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <BarChart
              title="Revenue"
              subtitle="$K by quarter"
              labels={["Q1", "Q2", "Q3", "Q4"]}
              series={REVENUE}
              formatValue={(v) => `$${v.toLocaleString()}K`}
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <BarChart
              title="Traffic by channel"
              subtitle="Sessions (K), stacked — part-to-whole without a pie"
              labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
              series={TRAFFIC}
              stacked
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <LineChart
              title="Deploy frequency"
              subtitle="Single series — the title names it, no legend box"
              labels={MONTHS}
              series={[{ label: "Deploys", data: [22, 25, 24, 31, 30, 36, 34, 41, 44, 43, 49, 54] }]}
              area
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <DonutChart
              title="Spending breakdown"
              subtitle="June, by category — smallest fold into Other (maxSlices)"
              centerLabel="Spent in June"
              data={SPENDING}
              maxSlices={5}
              formatValue={(v) => `$${v.toLocaleString()}`}
            />
          </CardBody>
        </Card>
      </Grid>
    </>
  );
}

ChartsDemo.demo = { title: "Data visualization", layer: "molecules", order: 20, anchor: "charts" } satisfies DemoMeta;
