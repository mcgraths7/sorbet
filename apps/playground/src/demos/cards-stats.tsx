import { Button } from "@sorbet/component-library/atoms";
import { Grid } from "@sorbet/component-library/layout";
import { Card, CardBody, EmptyState, Stat } from "@sorbet/component-library/molecules";

import type { Demo } from "./types.ts";

export function CardsStatsDemo() {
  return (
    <Grid cols={3}>
      <Card>
        <CardBody>
          <Stat label="Monthly revenue" value="$48,210" delta="+12.4% vs last month" trend="up" />
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <Stat label="Active users" value="9,382" delta="−2.1% vs last week" trend="down" />
        </CardBody>
      </Card>
      <Card variant="sunken">
        <CardBody>
          <EmptyState icon="🗂️" title="Nothing here yet" action={<Button size="sm">New project</Button>}>
            Empty states live happily inside sunken cards.
          </EmptyState>
        </CardBody>
      </Card>
    </Grid>
  );
}

export const demo: Demo = { title: "Cards & stats", layer: "molecules", order: 10, Component: CardsStatsDemo };
