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
  Heading,
  Lead,
  Navbar,
  NavbarActions,
  NavbarBrand,
  NavbarLink,
  NavbarNav,
  Section,
  Sidebar,
  SidebarFooter,
  SidebarHeading,
  SidebarItem,
  Stack,
  Stat,
  Text,
} from "@sorbet/component-library";

/** A real analytics dashboard: navbar, sidebar rail, scrolling main. */
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

/**
 * No sidebar — the header + main branch of the layout (marketing/content
 * pages, docs). Confirms the rail isn't reserved when `AppShellSidebar`
 * isn't rendered.
 */
export function WithoutSidebar() {
  return (
    <AppShell>
      <AppShellHeader>
        <Navbar>
          <NavbarBrand href="#">📝&nbsp;Fieldnote</NavbarBrand>
          <NavbarNav>
            <NavbarLink href="#" current>
              Product
            </NavbarLink>
            <NavbarLink href="#">Pricing</NavbarLink>
            <NavbarLink href="#">Docs</NavbarLink>
          </NavbarNav>
          <NavbarActions>
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
            <Button size="sm">Start free trial</Button>
          </NavbarActions>
        </Navbar>
      </AppShellHeader>

      <AppShellMain>
        <Container>
          <Stack gap={12}>
            <Stack gap={4} align="center">
              <Heading level={1} align="center">
                Notes that turn into tasks on their own
              </Heading>
              <Lead align="center">
                Fieldnote listens for "todo", "follow up" and deadlines while you write, then files them where your
                team already works.
              </Lead>
              <Cluster gap={3}>
                <Button size="lg">Start free trial</Button>
                <Button size="lg" variant="ghost">
                  Watch the 2-minute demo
                </Button>
              </Cluster>
            </Stack>

            <Grid cols={3} gap={4}>
              <Card>
                <CardBody>
                  <CardTitle>Auto-extracted tasks</CardTitle>
                  <Text tone="muted" size="sm">
                    Every "I'll send this by Friday" becomes a tracked task with a due date, no extra click.
                  </Text>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <CardTitle>Synced to your tools</CardTitle>
                  <Text tone="muted" size="sm">
                    Two-way sync with Linear, Asana and plain calendar invites.
                  </Text>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <CardTitle>Meeting recaps</CardTitle>
                  <Text tone="muted" size="sm">
                    Drop in raw notes; get a clean summary with owners and next steps.
                  </Text>
                </CardBody>
              </Card>
            </Grid>
          </Stack>
        </Container>
      </AppShellMain>
    </AppShell>
  );
}
