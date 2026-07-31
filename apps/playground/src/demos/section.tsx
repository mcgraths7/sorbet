import { Button, Text } from "@sorbet/component-library/atoms";
import { Grid, Stack } from "@sorbet/component-library/layout";
import { Card, CardBody, Section } from "@sorbet/component-library/molecules";

import type { DemoMeta } from "./types.ts";

/** The titled-section shape a landing page repeats: heading, supporting line,
 *  optional trailing control, then the body. */
export function SectionDemo() {
  return (
    <Stack gap={8}>
      <Card variant="flat">
        <CardBody>
          <Section
            title="This week's menu"
            description="Heading, description and a trailing action — the header wraps rather than squashing the title."
            action={<Button variant="outline">See all 12</Button>}
          >
            <Grid cols={3}>
              {["Ramen", "Tacos", "Dal"].map((dish) => (
                <Card key={dish} variant="sunken">
                  <CardBody>
                    <Text size="sm">{dish}</Text>
                  </CardBody>
                </Card>
              ))}
            </Grid>
          </Section>
        </CardBody>
      </Card>

      <Card variant="flat">
        <CardBody>
          <Section title="Title only" level={3} gap={3}>
            <Text tone="muted" size="sm">
              No description, no action — and <code>level</code> sets the tag without changing the look, so the
              heading order stays correct wherever the section sits.
            </Text>
          </Section>
        </CardBody>
      </Card>
    </Stack>
  );
}

SectionDemo.demo = { title: "Section", layer: "molecules", order: 5 } satisfies DemoMeta;
