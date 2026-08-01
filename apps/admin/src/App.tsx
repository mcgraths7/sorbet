// The ops dashboard behind the marketing site. Where meal-kit exercises the
// content half of the library (hero, cards, carousel, marquee), this is the
// application half: a sidebar shell, a sortable data table, charts, a detail
// drawer, a destructive confirm and a ⌘K palette.
import { Avatar, Badge, Text } from "@sorbet/component-library/atoms";
import { useTheme, type ThemeMode } from "@sorbet/component-library/core";
import { Cluster, Container, Stack } from "@sorbet/component-library/layout";
import { Segment, SegmentedControl, useToast } from "@sorbet/component-library/molecules";
import {
  CommandPalette,
  CommandTrigger,
  Navbar,
  NavbarActions,
  NavbarBrand,
  Sidebar,
  SidebarFooter,
  SidebarHeading,
  SidebarItem,
  type CommandItem,
} from "@sorbet/component-library/organisms";
import { AppShell, AppShellHeader, AppShellMain, AppShellSidebar } from "@sorbet/component-library/templates";
import { useState } from "react";

import { Feedback, Kitchen } from "./sections/kitchen.tsx";
import { Orders } from "./sections/orders.tsx";
import { Overview } from "./sections/overview.tsx";

function ModeSwitch() {
  const { mode, set } = useTheme();
  return (
    <SegmentedControl aria-label="Color mode" size="sm" value={mode} onValueChange={(v) => set(v as ThemeMode)}>
      <Segment value="light">Light</Segment>
      <Segment value="system">Auto</Segment>
      <Segment value="dark">Dark</Segment>
    </SegmentedControl>
  );
}

export function App() {
  const toast = useToast();
  const [paletteOpen, setPaletteOpen] = useState(false);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const commands: CommandItem[] = [
    { id: "overview", label: "Go to Overview", group: "Navigate", onSelect: () => go("overview") },
    { id: "orders", label: "Go to Orders", group: "Navigate", onSelect: () => go("orders") },
    { id: "kitchen", label: "Go to Kitchen", group: "Navigate", onSelect: () => go("kitchen") },
    { id: "feedback", label: "Go to Feedback", group: "Navigate", onSelect: () => go("feedback") },
    {
      id: "export",
      label: "Export today's orders",
      description: "CSV of everything placed since midnight",
      group: "Actions",
      onSelect: () => toast("Exported 7 orders as CSV."),
    },
    { id: "po", label: "Draft purchase order", group: "Actions", onSelect: () => toast("Purchase order drafted.") },
    {
      id: "freeze",
      label: "Freeze next week's menu",
      description: "Requires ops lead",
      group: "Actions",
      disabled: true,
      onSelect: () => {},
    },
  ];

  return (
    <AppShell>
      <AppShellHeader>
        <Navbar>
          <NavbarBrand href="#overview">🌿&nbsp;Sprig Ops</NavbarBrand>
          <NavbarActions>
            <CommandTrigger onClick={() => setPaletteOpen(true)} label="Search orders…" />
            <ModeSwitch />
          </NavbarActions>
        </Navbar>
      </AppShellHeader>

      <AppShellSidebar>
        <Sidebar aria-label="Sections">
          <SidebarHeading>Operations</SidebarHeading>
          <SidebarItem href="#overview" current>
            Overview
          </SidebarItem>
          <SidebarItem href="#orders">
            Orders <Badge tone="info">7</Badge>
          </SidebarItem>
          <SidebarItem href="#kitchen">
            Kitchen <Badge tone="warning">2</Badge>
          </SidebarItem>
          <SidebarItem href="#feedback">Feedback</SidebarItem>
          <SidebarFooter>
            <Cluster gap={2}>
              <Avatar size="sm">SM</Avatar>
              <Stack gap={0}>
                <Text size="sm" weight="medium">
                  S. McGrath
                </Text>
                <Text size="xs" tone="subtle">
                  Ops lead
                </Text>
              </Stack>
            </Cluster>
          </SidebarFooter>
        </Sidebar>
      </AppShellSidebar>

      <AppShellMain>
        <Container>
          <Stack gap={12}>
            <Overview />
            <Orders />
            <Kitchen />
            <Feedback />
          </Stack>
        </Container>
      </AppShellMain>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} commands={commands} />
    </AppShell>
  );
}
