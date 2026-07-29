// The shell only: chrome (navbar, sidebar, hero, footer), the preset/theme
// plumbing, and the Token Studio. Every component showcase lives in its own file
// under ./demos and is picked up automatically — see demos/index.ts.
import { Avatar, Badge, Button, Fab } from "@sorbet/component-library/atoms";
import { useTheme, type ThemeMode } from "@sorbet/component-library/core";
import { Cluster, Container, Grid, Stack } from "@sorbet/component-library/layout";
import {
  Card,
  CardBody,
  CardTitle,
  Segment,
  SegmentedControl,
  useToast,
} from "@sorbet/component-library/molecules";
import {
  Footer,
  FooterCol,
  FooterCols,
  FooterMeta,
  Navbar,
  NavbarActions,
  NavbarBrand,
  NavbarLink,
  NavbarNav,
  Sidebar,
  SidebarFooter,
  SidebarHeading,
  SidebarItem,
  TokenStudio,
} from "@sorbet/component-library/organisms";
import { AppShell, AppShellHeader, AppShellMain, AppShellSidebar } from "@sorbet/component-library/templates";
import forestTheme from "@sorbet/design-system/themes/forest.css?url";
import midnightTheme from "@sorbet/design-system/themes/midnight.css?url";
import noirTheme from "@sorbet/design-system/themes/noir.css?url";
import oceanTheme from "@sorbet/design-system/themes/ocean.css?url";
import sorbetTheme from "@sorbet/design-system/themes/sorbet.css?url";
import { Fragment, useEffect, useState } from "react";

import { demosFor, type DemoLayer } from "./demos/index.ts";

const THEMES = [
  { name: "sorbet", label: "Sorbet — light and fun", url: sorbetTheme },
  { name: "ocean", label: "Ocean — corporate SaaS", url: oceanTheme },
  { name: "forest", label: "Forest — organic", url: forestTheme },
  { name: "noir", label: "Noir — monochrome", url: noirTheme },
  { name: "midnight", label: "Midnight — electric", url: midnightTheme },
];

/** Section order down the page; each id doubles as the nav/sidebar anchor. */
const LAYERS: DemoLayer[] = ["layout", "atoms", "molecules", "organisms"];

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
  const theme = useTheme();
  const [preset, setPreset] = useState(() => localStorage.getItem("playground-preset") ?? "sorbet");
  const [studioOpen, setStudioOpen] = useState(false);

  useEffect(() => {
    const link = document.getElementById("preset-css") as HTMLLinkElement;
    link.href = THEMES.find((t) => t.name === preset)?.url ?? THEMES[0]!.url;
    localStorage.setItem("playground-preset", preset);
  }, [preset]);

  return (
    <AppShell>
      <AppShellHeader>
        <Navbar>
          <NavbarBrand href="#top">Sorbet&nbsp;🍧&nbsp;</NavbarBrand>
          <NavbarNav>
            <NavbarLink href="#atoms" current>
              Atoms
            </NavbarLink>
            <NavbarLink href="#molecules">Molecules</NavbarLink>
            <NavbarLink href="#organisms">Organisms</NavbarLink>
          </NavbarNav>
          <NavbarActions>
            <ModeSwitch />
          </NavbarActions>
        </Navbar>
      </AppShellHeader>

      <AppShellSidebar>
        <Sidebar aria-label="Sections">
          <SidebarHeading>Layers</SidebarHeading>
          <SidebarItem href="#layout">Layout</SidebarItem>
          <SidebarItem href="#atoms" current>
            Atoms <Badge tone="accent">18</Badge>
          </SidebarItem>
          <SidebarItem href="#molecules">Molecules</SidebarItem>
          <SidebarItem href="#organisms">Organisms</SidebarItem>
          <SidebarFooter>
            <Cluster gap={2}>
              <Avatar size="sm">SM</Avatar>
              <small className="u-text-muted">Fresh Baked Software</small>
            </Cluster>
          </SidebarFooter>
        </Sidebar>
      </AppShellSidebar>

      <AppShellMain id="top">
        <Container>
          <Stack gap={16}>
            <Stack gap={6} as="section">
              <Stack gap={4}>
                <Cluster gap={2}>
                  <Badge tone="primary">@sorbet/component-library</Badge>
                  <Badge tone="success" dot>
                    WCAG AA — enforced at build time
                  </Badge>
                </Cluster>
                <h1>
                  Delightfully themeable.
                  <br />
                  Provably accessible.
                </h1>
                <p className="sb-lead" style={{ maxInlineSize: "58ch" }}>
                  Sorbet is a modern, token-based component library built on an accessible design system — layout
                  primitives, forms, overlays, tables, and charts in five swappable personalities, each with
                  first-class dark mode. Built on the native platform, with zero runtime dependencies.
                </p>
                <Cluster>
                  <Button size="lg" as="a" href="#layout">
                    Explore the components
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => toast("Fresh out of the churner.", { title: "Hello from Sorbet", tone: "success" })}
                  >
                    Try a toast
                  </Button>
                </Cluster>
              </Stack>
              <Grid cols={3}>
                <Card variant="sunken">
                  <CardBody>
                    <Stack gap={2}>
                      <CardTitle>Accessible by construction</CardTitle>
                      <p className="u-text-sm u-text-muted">
                        Every semantic color pairing is contrast-verified on every build — 790 checks across 5
                        presets × 2 modes. A theme that fails WCAG AA fails to compile.
                      </p>
                    </Stack>
                  </CardBody>
                </Card>
                <Card variant="sunken">
                  <CardBody>
                    <Stack gap={2}>
                      <CardTitle>Rebrand in one file</CardTitle>
                      <p className="u-text-sm u-text-muted">
                        A preset is one small CSS file of tokens. Swap it and everything re-themes — buttons to
                        charts, light and dark included. Try it in the Token Studio (🎨, bottom right).
                      </p>
                    </Stack>
                  </CardBody>
                </Card>
                <Card variant="sunken">
                  <CardBody>
                    <Stack gap={2}>
                      <CardTitle>Platform-first, zero deps</CardTitle>
                      <p className="u-text-sm u-text-muted">
                        Native dialogs, the Popover API, CSS-powered animation and masonry. The React layer is a
                        thin typed wrapper; the vanilla behaviors are optional.
                      </p>
                    </Stack>
                  </CardBody>
                </Card>
              </Grid>
            </Stack>

            {LAYERS.map((layer) => (
              <Stack as="section" id={layer} key={layer}>
                {demosFor(layer).map(({ title, anchor, Component }) => (
                  <Fragment key={title}>
                    <h2 id={anchor}>{title}</h2>
                    <Component />
                  </Fragment>
                ))}
              </Stack>
            ))}
          </Stack>
        </Container>

        <Footer style={{ marginBlockStart: "var(--sb-space-24)" }}>
          <FooterCols>
            <FooterCol heading="Product">
              <li>
                <a href="#top">Features</a>
              </li>
              <li>
                <a href="#top">Pricing</a>
              </li>
            </FooterCol>
            <FooterCol heading="Resources">
              <li>
                <a href="#top">Docs</a>
              </li>
            </FooterCol>
          </FooterCols>
          <FooterMeta>
            <span>© 2026 Sorbet. Scooped with care.</span>
            <a href="#top">Back to top ↑</a>
          </FooterMeta>
        </Footer>
      </AppShellMain>

      <Fab aria-label="Open Token Studio" title="Token Studio" onClick={() => setStudioOpen((v) => !v)}>
        🎨
      </Fab>
      <TokenStudio
        open={studioOpen}
        onClose={() => setStudioOpen(false)}
        preset={preset}
        onPresetChange={setPreset}
        themeMode={theme.mode}
        onThemeModeChange={theme.set}
      />
    </AppShell>
  );
}
