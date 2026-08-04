import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  AppShellSidebar,
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardTitle,
  Cluster,
  Container,
  Grid,
  Navbar,
  NavbarActions,
  NavbarBrand,
  Section,
  Sidebar,
  SidebarFooter,
  SidebarHeading,
  SidebarItem,
  Stack,
  Stat,
  Text,
} from "@sorbet/component-library";

/**
 * `AppShellHeader` only makes sense as the top band of a full shell — shown
 * here inside a real AppShell (header + sidebar + main) so the navbar row
 * reads in context rather than as an empty strip.
 */
export function Default() {
  return (
    <AppShell>
      <AppShellHeader>
        <Navbar>
          <NavbarBrand href="#">📈&nbsp;Meridian</NavbarBrand>
          <NavbarActions>
            <Button variant="outline" size="sm">
              Invite teammate
            </Button>
            <Avatar size="sm">JT</Avatar>
          </NavbarActions>
        </Navbar>
      </AppShellHeader>

      <AppShellSidebar>
        <Sidebar aria-label="Workspace">
          <SidebarHeading>Workspace</SidebarHeading>
          <SidebarItem href="#" current>
            Overview
          </SidebarItem>
          <SidebarItem href="#">
            Projects <Badge tone="info">12</Badge>
          </SidebarItem>
          <SidebarItem href="#">Team</SidebarItem>
          <SidebarItem href="#">Reports</SidebarItem>
          <SidebarItem href="#">Settings</SidebarItem>
          <SidebarFooter>
            <Cluster gap={2}>
              <Avatar size="sm">JT</Avatar>
              <Stack gap={0}>
                <Text size="sm" weight="medium">
                  Jordan Tran
                </Text>
                <Text size="xs" tone="subtle">
                  Product lead
                </Text>
              </Stack>
            </Cluster>
          </SidebarFooter>
        </Sidebar>
      </AppShellSidebar>

      <AppShellMain>
        <Container>
          <Stack gap={8}>
            <Section title="Overview" description="Your workspace at a glance — week of Aug 3." gap={4}>
              <Grid cols={4} gap={4}>
                <Card>
                  <CardBody>
                    <Stat label="Active projects" value="24" delta="+3 this month" trend="up" />
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <Stat label="Tasks completed" value="182" delta="+18 vs last week" trend="up" />
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <Stat label="Team velocity" value="94%" delta="+2 pts" trend="up" />
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <Stat label="Open issues" value="7" delta="-4 this week" trend="down" />
                  </CardBody>
                </Card>
              </Grid>
            </Section>

            <Section title="Recent projects" description="Updated in the last 7 days." gap={4}>
              <Grid cols={3} gap={4}>
                <Card>
                  <CardBody>
                    <CardTitle>Atlas redesign</CardTitle>
                    <Text tone="muted" size="sm">
                      Design system rollout for the marketing site.
                    </Text>
                    <Badge tone="info">In progress</Badge>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <CardTitle>Q3 billing migration</CardTitle>
                    <Text tone="muted" size="sm">
                      Moving invoicing off the legacy gateway.
                    </Text>
                    <Badge tone="danger">Blocked</Badge>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <CardTitle>Onboarding revamp</CardTitle>
                    <Text tone="muted" size="sm">
                      New-hire checklist and welcome flow.
                    </Text>
                    <Badge tone="success">Done</Badge>
                  </CardBody>
                </Card>
              </Grid>
            </Section>
          </Stack>
        </Container>
      </AppShellMain>
    </AppShell>
  );
}
