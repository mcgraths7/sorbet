import { BarChart, DonutChart, LineChart, Sparkline } from "@sorbet/component-library/charts";
import { Grid } from "@sorbet/component-library/layout";
import { Card, CardBody, Section, Stat } from "@sorbet/component-library/molecules";

import {
  CHURN_SPARK,
  MEAL_POPULARITY,
  ORDERS_BY_DAY,
  ORDER_SPARK,
  REVENUE_BY_PLAN,
  REVENUE_SPARK,
  WEEKDAYS,
} from "../data.ts";

const money = (n: number) => `£${n.toLocaleString("en-GB")}`;

export function Overview() {
  return (
    <Section id="overview" title="Overview" description="Week to 30 July, against the seven days before it." gap={4}>
      <Grid cols={4}>
        <Card>
          <CardBody>
            <Stat
              label="Orders this week"
              value="3,350"
              delta="+7.4% vs last week"
              trend="up"
              chart={<Sparkline data={ORDER_SPARK} />}
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat
              label="Revenue"
              value="£41.8K"
              delta="+9.2% vs last week"
              trend="up"
              chart={<Sparkline data={REVENUE_SPARK} />}
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat label="Active subscriptions" value="12,904" delta="+318 net" trend="up" />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <Stat
              label="Weekly churn"
              value="1.9%"
              delta="−0.5 pts"
              trend="down"
              chart={<Sparkline data={CHURN_SPARK} accentLast={false} />}
            />
          </CardBody>
        </Card>
      </Grid>

      <Grid cols={2}>
        <Card>
          <CardBody>
            <LineChart
              title="Orders by day"
              subtitle="This week vs last"
              labels={WEEKDAYS}
              series={ORDERS_BY_DAY}
            />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <BarChart
              title="Revenue by plan"
              subtitle="£K per week, stacked"
              labels={["Wk 27", "Wk 28", "Wk 29", "Wk 30"]}
              series={REVENUE_BY_PLAN}
              stacked
              formatValue={(v) => `£${v}K`}
            />
          </CardBody>
        </Card>
      </Grid>

      <Card>
        <CardBody>
          <DonutChart
            title="Most-picked meals"
            subtitle="Portions shipped this week — the tail folds into Other"
            centerLabel="Portions"
            data={MEAL_POPULARITY}
            maxSlices={5}
            formatValue={(v) => money(v)}
          />
        </CardBody>
      </Card>
    </Section>
  );
}
