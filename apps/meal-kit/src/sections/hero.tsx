import { Badge, Button, CheckIcon, Heading, Icon, Lead, Text } from "@sorbet/component-library/atoms";
import { Cluster, Grid, Stack } from "@sorbet/component-library/layout";
import { Card, CardBody, Marquee, Stat } from "@sorbet/component-library/molecules";

const PROMISES = ["Farm-picked produce", "Recipes in 30 minutes", "Skip any week", "Carbon-neutral delivery"];

const PRESS = [
  "“The box we actually finish.” — Weeknight Weekly",
  "★★★★★ Best value 2026 — Kitchen Report",
  "“Produce that tastes picked, not shipped.” — The Grove",
  "Editor's pick — Slow Food Digest",
  "“Genuinely 30 minutes.” — Time Poor Cook",
];

export function Hero() {
  return (
    <Stack gap={8} as="section">
      <Grid cols={2}>
        <Stack gap={4}>
          <Cluster gap={2}>
            <Badge tone="success" dot>
              Delivering in your area
            </Badge>
            <Badge tone="primary">New: 15-minute menu</Badge>
          </Cluster>
          <Heading level={1}>Dinner, already figured out.</Heading>
          <Lead>
            Pick your meals, we send the exact ingredients — pre-portioned, in season, with recipes you can cook on a
            Tuesday. No planning, no half-used bunches of parsley.
          </Lead>
          <Stack gap={2}>
            {PROMISES.map((promise) => (
              <Cluster key={promise} gap={2}>
                <Icon tone="success">
                  <CheckIcon />
                </Icon>
                <Text>{promise}</Text>
              </Cluster>
            ))}
          </Stack>
          <Cluster gap={3}>
            <Button size="lg" as="a" href="#build">
              Build my box
            </Button>
            <Button size="lg" variant="outline" as="a" href="#menu">
              See this week's menu
            </Button>
          </Cluster>
          <Text size="sm" tone="subtle">
            No commitment — skip, pause or cancel any week.
          </Text>
        </Stack>

        <Stack gap={4}>
          <Card variant="sunken">
            <CardBody>
              <Grid cols={2}>
                <Stat label="Meals delivered" value="4.2M" delta="+18% this year" trend="up" />
                <Stat label="Average rating" value="4.8/5" delta="from 61k cooks" trend="flat" />
                <Stat label="Ingredients wasted" value="0.4%" delta="−2.1 pts vs 2025" trend="down" />
                <Stat label="Recipes on file" value="1,240" delta="12 new weekly" trend="up" />
              </Grid>
            </CardBody>
          </Card>
        </Stack>
      </Grid>

      <Marquee aria-label="Press coverage" speed={30}>
        {PRESS.map((quote) => (
          <Text key={quote} tone="muted" size="sm">
            {quote}
          </Text>
        ))}
      </Marquee>
    </Stack>
  );
}
