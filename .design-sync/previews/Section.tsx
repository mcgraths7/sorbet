import { Button, Card, CardBody, CardTitle, Grid, Section, Stat, Text } from "@sorbet/component-library";

export function WithGrid() {
  return (
    <Section
      title="This week's menu"
      description="Rotating every Monday — order by Thursday for weekend delivery."
      action={
        <Button size="sm" variant="outline">
          See all
        </Button>
      }
    >
      <Grid cols={3} gap={4}>
        <Card>
          <CardBody>
            <CardTitle>Miso-glazed salmon</CardTitle>
            <Text tone="muted" size="sm">
              With charred bok choy and jasmine rice.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <CardTitle>Weeknight chicken tikka</CardTitle>
            <Text tone="muted" size="sm">
              Smoky tomato sauce, basmati rice, cucumber raita.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <CardTitle>Mushroom risotto</CardTitle>
            <Text tone="muted" size="sm">
              Arborio rice, parmesan, crispy sage.
            </Text>
          </CardBody>
        </Card>
      </Grid>
    </Section>
  );
}

export function WithStats() {
  return (
    <Section title="Fulfillment overview" description="Live numbers for today's delivery window.">
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <Stat label="Boxes packed" value="1,204" delta="+6.8%" trend="up" />
        <Stat label="On-time rate" value="98.2%" delta="+0.4%" trend="up" />
        <Stat label="Delayed routes" value="3" delta="-2" trend="down" />
      </div>
    </Section>
  );
}

export function Unlabelled() {
  return (
    <Section gap={3}>
      <Text>
        Sections don't require a title — omit it for an unlabelled block that still gets the shared gap
        rhythm.
      </Text>
      <Text tone="muted" size="sm">
        Useful for grouping content inside a card, or on a page that already has its own heading.
      </Text>
    </Section>
  );
}
