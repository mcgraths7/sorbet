// A worked example rather than a component catalog: one real marketing page,
// composed only from Sorbet components and layout primitives. Nothing here
// reaches for a raw <div> with custom CSS — if a section needed one, that's a
// gap in the library worth filling.
import { Button, Heading, Lead } from "@sorbet/component-library/atoms";
import { Cluster, Container, Stack } from "@sorbet/component-library/layout";
import { Card, CardBody } from "@sorbet/component-library/molecules";
import { AppShell, AppShellHeader, AppShellMain } from "@sorbet/component-library/templates";

import { SiteFooter, SiteNav } from "./sections/chrome.tsx";
import { Hero } from "./sections/hero.tsx";
import { HowItWorks, WeeklyMenu } from "./sections/menu.tsx";
import { PlanBuilder } from "./sections/plan-builder.tsx";
import { Faq, Plans, Testimonials } from "./sections/social.tsx";

function ClosingCta() {
  return (
    <Card variant="sunken" as="section">
      <CardBody>
        <Stack gap={4} align="center">
          <Heading level={2} align="center">
            Your first box, £20 off
          </Heading>
          <Lead align="center">Pick three meals and see whether it sticks. Skip the week after if it doesn't.</Lead>
          <Cluster gap={3}>
            <Button size="lg" as="a" href="#build">
              Build my box
            </Button>
            <Button size="lg" variant="ghost" as="a" href="#menu">
              Browse the menu first
            </Button>
          </Cluster>
        </Stack>
      </CardBody>
    </Card>
  );
}

export function App() {
  return (
    <AppShell>
      <AppShellHeader>
        <SiteNav />
      </AppShellHeader>

      <AppShellMain id="top">
        <Container>
          <Stack gap={16}>
            <Hero />
            <HowItWorks />
            <WeeklyMenu />
            <PlanBuilder />
            <Testimonials />
            <Plans />
            <Faq />
            <ClosingCta />
          </Stack>
        </Container>
        <SiteFooter />
      </AppShellMain>
    </AppShell>
  );
}
