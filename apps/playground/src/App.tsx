// Components are imported from their atomic-design layer subpaths so it's
// obvious which tier each piece belongs to. The package root re-exports
// everything for the one-import option.
import {
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Checkbox,
  Chip,
  Choice,
  ColorInput,
  Divider,
  Fab,
  Heading,
  Input,
  Kbd,
  Lead,
  Overline,
  Popover,
  Progress,
  Radio,
  Select,
  Skeleton,
  Spinner,
  Switch,
  Text,
  Textarea,
  Tooltip,
} from "@sorbet/component-library/atoms";
import { BarChart, DonutChart, LineChart, Sparkline } from "@sorbet/component-library/charts";
import { useTheme, type ThemeMode } from "@sorbet/component-library/core";
import {
  Cluster,
  Container,
  Frame,
  Grid,
  GridSpan2,
  Masonry,
  Split,
  SplitAside,
  SplitMain,
  Stack,
} from "@sorbet/component-library/layout";
import {
  Accordion,
  AccordionItem,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Combobox,
  DatePicker,
  DateRange,
  type DateRangeValidation,
  type DateValidation,
  Dropzone,
  EmptyState,
  Field,
  InputGroup,
  InputGroupAddon,
  Menu,
  MenuHeading,
  MenuItem,
  MenuSeparator,
  MultiCombobox,
  Pagination,
  Segment,
  SegmentedControl,
  Stat,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  useToast,
} from "@sorbet/component-library/molecules";
import {
  DataTable,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  Footer,
  FooterCol,
  FooterCols,
  FooterMeta,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
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
  type Column,
} from "@sorbet/component-library/organisms";
import { AppShell, AppShellHeader, AppShellMain, AppShellSidebar } from "@sorbet/component-library/templates";
import forestTheme from "@sorbet/design-system/themes/forest.css?url";
import midnightTheme from "@sorbet/design-system/themes/midnight.css?url";
import noirTheme from "@sorbet/design-system/themes/noir.css?url";
import oceanTheme from "@sorbet/design-system/themes/ocean.css?url";
import sorbetTheme from "@sorbet/design-system/themes/sorbet.css?url";
import { useEffect, useState } from "react";

const THEMES = [
  { name: "sorbet", label: "Sorbet — light and fun", url: sorbetTheme },
  { name: "ocean", label: "Ocean — corporate SaaS", url: oceanTheme },
  { name: "forest", label: "Forest — organic", url: forestTheme },
  { name: "noir", label: "Noir — monochrome", url: noirTheme },
  { name: "midnight", label: "Midnight — electric", url: midnightTheme },
];

interface Invoice {
  id: string;
  customer: string;
  status: "Paid" | "Pending" | "Overdue";
  amount: number;
}

const INVOICES: Invoice[] = [
  { id: "INV-0012", customer: "Meridian Labs", status: "Paid", amount: 1250 },
  { id: "INV-0013", customer: "Hoot & Co", status: "Pending", amount: 860 },
  { id: "INV-0014", customer: "Aster Systems", status: "Overdue", amount: 3420.5 },
  { id: "INV-0015", customer: "Bluebird", status: "Paid", amount: 240 },
];

const STATUS_TONE = { Paid: "success", Pending: "warning", Overdue: "danger" } as const;

const columns: Array<Column<Invoice>> = [
  { key: "id", header: "Invoice", sortable: true },
  { key: "customer", header: "Customer", sortable: true },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>,
  },
  {
    key: "amount",
    header: "Amount",
    numeric: true,
    sortable: true,
    render: (row) => row.amount.toLocaleString("en-US", { style: "currency", currency: "USD" }),
  },
];

interface Shot {
  emoji: string;
  caption: string;
  ratio: string;
  from: string;
  to: string;
  likes: number;
}

const SHOTS: Shot[] = [
  { emoji: "🍓", caption: "Raspberry ripple", ratio: "3 / 4", from: "primary", to: "accent", likes: 128 },
  { emoji: "🌊", caption: "Sea foam", ratio: "1", from: "secondary", to: "info", likes: 64 },
  { emoji: "🍋", caption: "Lemon zest", ratio: "4 / 3", from: "warning", to: "accent", likes: 291 },
  { emoji: "🌿", caption: "New growth", ratio: "2 / 3", from: "success", to: "secondary", likes: 87 },
  { emoji: "🍇", caption: "Grape crush", ratio: "1", from: "accent", to: "primary", likes: 156 },
  { emoji: "🌅", caption: "Golden hour", ratio: "16 / 9", from: "warning", to: "danger", likes: 342 },
  { emoji: "🫐", caption: "Blueberry dusk", ratio: "3 / 4", from: "info", to: "accent", likes: 73 },
  { emoji: "🍑", caption: "Peach fuzz", ratio: "4 / 5", from: "danger", to: "warning", likes: 210 },
  { emoji: "🥝", caption: "Kiwi cross-section", ratio: "1", from: "success", to: "warning", likes: 45 },
  { emoji: "🍒", caption: "Cherry on top", ratio: "2 / 3", from: "primary", to: "danger", likes: 388 },
  { emoji: "🌌", caption: "Night swim", ratio: "16 / 9", from: "info", to: "primary", likes: 99 },
  { emoji: "🍊", caption: "Citrus study", ratio: "4 / 3", from: "warning", to: "primary", likes: 167 },
];

function MasonryTile({ shot }: { shot: Shot }) {
  return (
    <Card variant="flat">
      <Frame ratio={shot.ratio}>
        <div
          style={{
            inlineSize: "100%",
            blockSize: "100%",
            display: "grid",
            placeItems: "center",
            fontSize: "2.5rem",
            background: `linear-gradient(135deg, var(--sb-${shot.from}-subtle), var(--sb-${shot.to}-subtle))`,
          }}
        >
          {shot.emoji}
        </div>
      </Frame>
      <div style={{ padding: "var(--sb-space-3)" }}>
        <Cluster justify="between" gap={2}>
          <span className="u-text-sm">{shot.caption}</span>
          <span className="u-text-xs u-text-muted u-tabular">♥ {shot.likes}</span>
        </Cluster>
      </div>
    </Card>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ACTIVE_USERS = [
  { label: "Web", data: [4200, 4600, 5100, 4900, 5600, 6200, 6800, 7100, 7600, 8200, 8900, 9400] },
  { label: "iOS", data: [2100, 2300, 2600, 3000, 3200, 3500, 3900, 4300, 4500, 4800, 5300, 5800] },
  { label: "Android", data: [1500, 1700, 1800, 2100, 2400, 2500, 2900, 3100, 3400, 3600, 3900, 4300] },
];

const REVENUE = [
  { label: "Subscriptions", data: [38, 42, 47, 54] },
  { label: "Services", data: [12, 14, 13, 18] },
];

const TRAFFIC = [
  { label: "Organic", data: [52, 58, 61, 64, 69, 73] },
  { label: "Referral", data: [21, 22, 25, 24, 28, 30] },
  { label: "Paid", data: [14, 12, 16, 18, 15, 19] },
];

const SPARK = [8, 10, 9, 12, 13, 12, 15, 14, 17, 19, 18, 22];

const LABELS = [
  { value: "bug", label: "Bug", description: "Something is broken" },
  { value: "feature", label: "Feature", description: "New capability" },
  { value: "docs", label: "Docs", description: "Documentation only" },
  { value: "design", label: "Design", description: "Visual or UX work" },
  { value: "perf", label: "Performance" },
  { value: "a11y", label: "Accessibility" },
  { value: "breaking", label: "Breaking change", disabled: true },
];

const ASSIGNEES = [
  { value: "ada", label: "Ada Lovelace", description: "ada@sorbet.dev", group: "Engineering" },
  { value: "grace", label: "Grace Hopper", description: "grace@sorbet.dev", group: "Engineering" },
  { value: "alan", label: "Alan Turing", description: "alan@sorbet.dev", group: "Engineering", disabled: true },
  { value: "dieter", label: "Dieter Rams", description: "dieter@sorbet.dev", group: "Design" },
  { value: "susan", label: "Susan Kare", description: "susan@sorbet.dev", group: "Design" },
  { value: "don", label: "Don Norman", description: "don@sorbet.dev", group: "Design" },
  { value: "mary", label: "Mary Shelley", description: "mary@sorbet.dev", group: "Product" },
  { value: "ursula", label: "Ursula K. Le Guin", description: "ursula@sorbet.dev", group: "Product" },
];

const SPENDING = [
  { label: "Rent", value: 1850 },
  { label: "Groceries", value: 640 },
  { label: "Dining out", value: 380 },
  { label: "Transport", value: 240 },
  { label: "Fun money", value: 180 },
  { label: "Subscriptions", value: 120 },
  { label: "Pets", value: 90 },
  { label: "Misc", value: 60 },
];

const demoBox: React.CSSProperties = {
  padding: "var(--sb-space-3)",
  borderRadius: "var(--sb-radius-sm)",
  background: "var(--sb-primary-subtle)",
  color: "var(--sb-primary-text)",
  fontSize: "var(--sb-text-sm)",
  fontWeight: "var(--sb-weight-medium)" as "500",
  textAlign: "center",
};

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
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(2);
  const [chips, setChips] = useState(["Design", "Engineering", "Research"]);

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

            <Stack as="section" id="layout">
              <h2>Layout</h2>
              <Grid cols={2}>
                <Card>
                  <CardBody>
                    <Stack gap={2}>
                      <CardHeader className="sb-overline">Stack</CardHeader>
                      <div style={demoBox}>one</div>
                      <div style={demoBox}>two</div>
                    </Stack>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <Stack gap={2}>
                      <CardHeader className="sb-overline">Cluster</CardHeader>
                      <Cluster gap={2}>
                        <div style={demoBox}>chip</div>
                        <div style={demoBox}>wrap</div>
                        <div style={demoBox}>gap</div>
                      </Cluster>
                    </Stack>
                  </CardBody>
                </Card>
                <GridSpan2>
                  <Card>
                    <CardBody>
                      <Stack gap={2}>
                        <CardHeader className="sb-overline">Split</CardHeader>
                        <Split aside="8rem">
                          <SplitAside>
                            <div style={demoBox}>aside</div>
                          </SplitAside>
                          <SplitMain>
                            <div style={demoBox}>main takes the rest, stacks when narrow</div>
                          </SplitMain>
                        </Split>
                      </Stack>
                    </CardBody>
                  </Card>
                </GridSpan2>
              </Grid>

              <h2 id="masonry">Masonry</h2>
              <p className="u-text-muted">
                DOM order preserved, heights measured, images tracked — no third-party library. Where the browser has
                native CSS masonry, the balancer stands down.
              </p>
              <Masonry min="10rem" gap={3}>
                {SHOTS.map((shot) => (
                  <MasonryTile key={shot.caption} shot={shot} />
                ))}
              </Masonry>
            </Stack>

            <Stack as="section" id="atoms">
              <h2>Typography</h2>
              <Stack gap={3}>
                <Overline>Text primitives</Overline>
                <Heading level={2}>Heading — semantic level, chosen size</Heading>
                <Heading level={3} size="xl">
                  An h3 sized like an xl (level ≠ appearance)
                </Heading>
                <Lead>A lead paragraph: a larger, muted intro that frames the section without shouting.</Lead>
                <Text>
                  Body text is the default — a plain paragraph, tokenized to the sans stack at md size and
                  normal line height.
                </Text>
                <Text tone="muted" size="sm">
                  Info text — <code>&lt;Text tone="muted" size="sm"&gt;</code> for hints and captions.
                </Text>
                <Cluster gap={4}>
                  <Text weight="semibold">Semibold</Text>
                  <Text tone="subtle">Subtle</Text>
                  <Text as="span" size="xs" tone="muted">
                    xs muted span
                  </Text>
                </Cluster>
              </Stack>

              <h2>Buttons</h2>
              <Cluster>
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="accent">Accent</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="soft">Soft</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </Cluster>
              <Cluster>
                <Button size="sm">Small</Button>
                <Button size="lg">Large</Button>
                <Button pill>Pill</Button>
                <Button disabled>Disabled</Button>
                <Button loading>Loading</Button>
                <Tooltip content="Settings (Tooltip atom)">
                  <Button variant="ghost" iconOnly aria-label="Settings">
                    ⚙︎
                  </Button>
                </Tooltip>
                <Button as="a" href="#atoms" variant="outline">
                  Anchor button
                </Button>
              </Cluster>

              <h2>Form controls</h2>
              <Card as="form" onSubmit={(e: React.SubmitEvent) => e.preventDefault()}>
                <CardBody>
                  <Grid cols={2}>
                    <Field label="Full name" hint="As it appears on your profile." required>
                      <Input placeholder="Ada Lovelace" required />
                    </Field>
                    <Field label="Email" error="Enter a valid email address." invalid>
                      <Input type="email" defaultValue="not-an-email" />
                    </Field>
                    <Field label="Role">
                      <Select defaultValue="Engineer">
                        <option>Engineer</option>
                        <option>Designer</option>
                        <option>Product</option>
                      </Select>
                    </Field>
                    <DatePickerDemo />
                    <DateRangeDemo />
                    <Field label="Brand color" hint="Click the swatch — SV square, hue/opacity, RGB, eyedropper.">
                      <ColorInput defaultValue="#e35789" alpha />
                    </Field>
                    <Field label="Assignee" hint="Combobox — type to filter, arrows to navigate.">
                      <Combobox options={ASSIGNEES} placeholder="Search people…" name="assignee" />
                    </Field>
                    <Field label="Labels" hint="Multi-select — Backspace removes the last tag.">
                      <MultiCombobox
                        options={LABELS}
                        defaultValue={["bug", "docs"]}
                        placeholder="Add labels…"
                        name="labels"
                      />
                    </Field>
                    <Field label="Website">
                      <InputGroup>
                        <InputGroupAddon>https://</InputGroupAddon>
                        <Input placeholder="example.dev" />
                        <Button>Check</Button>
                      </InputGroup>
                    </Field>
                    <GridSpan2>
                      <Field label="Bio" optional hint="Grows with content — field-sizing, no JS.">
                        <Textarea autoResize placeholder="Tell us about yourself" />
                      </Field>
                    </GridSpan2>
                    <GridSpan2>
                      <Field label="Attachments" optional>
                        <Dropzone
                          name="attachments"
                          multiple
                          accept="image/*,.pdf"
                          maxFiles={3}
                          maxSize={1_048_576}
                          hint="Images or PDF · up to 3 files · 1 MB each"
                        />
                      </Field>
                    </GridSpan2>
                    <Stack gap={2}>
                      <Choice>
                        <Checkbox defaultChecked /> Product updates
                      </Choice>
                      <Choice>
                        <Checkbox indeterminate /> Weekly digest (mixed)
                      </Choice>
                      <Choice>
                        <Checkbox disabled /> Spam (disabled)
                      </Choice>
                    </Stack>
                    <Stack gap={2}>
                      <Choice>
                        <Radio name="plan" defaultChecked /> Free
                      </Choice>
                      <Choice>
                        <Radio name="plan" /> Pro
                      </Choice>
                      <Choice>
                        <Switch defaultChecked /> Marketing emails
                      </Choice>
                    </Stack>
                  </Grid>
                </CardBody>
                <CardFooter>
                  <Button variant="ghost" type="reset">
                    Cancel
                  </Button>
                  <Button type="submit">Save changes</Button>
                </CardFooter>
              </Card>

              <h2>Badges, chips &amp; indicators</h2>
              <Cluster>
                <Badge>Neutral</Badge>
                <Badge tone="primary">Primary</Badge>
                <Badge tone="success" dot>
                  Active
                </Badge>
                <Badge tone="warning">Pending</Badge>
                <Badge tone="danger" solid>
                  Failed
                </Badge>
                {chips.map((c) => (
                  <Chip key={c} selected={c === "Design"} onRemove={() => setChips(chips.filter((x) => x !== c))}>
                    {c}
                  </Chip>
                ))}
                <AvatarGroup>
                  <Avatar>AL</Avatar>
                  <Avatar>GH</Avatar>
                  <Avatar>+3</Avatar>
                </AvatarGroup>
                <Spinner />
                <Kbd>esc</Kbd>
              </Cluster>
              <Grid cols={2}>
                <Stack gap={2}>
                  <Progress value={65} label="Upload" />
                  <Progress value={100} tone="success" label="Complete" />
                  <Progress indeterminate label="Working" />
                </Stack>
                <Skeleton lines={3} />
              </Grid>
            </Stack>

            <Stack as="section" id="molecules">
              <h2>Cards &amp; stats</h2>
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

              <h2 id="charts">Data visualization</h2>
              <p className="u-text-muted">
                @sorbet/charts — SVG, dependency-free, themed by the validated chart tokens (8 fixed-order categorical
                slots per preset, CVD-checked). Every chart ships a legend, tooltips, and a table view.
              </p>
              <Grid cols={3}>
                <Card>
                  <CardBody>
                    <Stat
                      label="Monthly recurring revenue"
                      value="$72K"
                      delta="+9.1% vs last month"
                      trend="up"
                      chart={<Sparkline data={SPARK} />}
                    />
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <Stat
                      label="Churn"
                      value="1.9%"
                      delta="−0.3 pts vs last month"
                      trend="up"
                      chart={<Sparkline data={[...SPARK].reverse()} />}
                    />
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <Stat
                      label="NPS"
                      value="61"
                      delta="steady"
                      trend="flat"
                      chart={<Sparkline data={[12, 12, 13, 12, 12, 13, 12, 13, 13, 12, 13, 13]} accentLast={false} />}
                    />
                  </CardBody>
                </Card>
              </Grid>
              <Grid cols={2}>
                <Card>
                  <CardBody>
                    <LineChart
                      title="Weekly active users"
                      subtitle="By platform, trailing 12 months"
                      labels={MONTHS}
                      series={ACTIVE_USERS}
                    />
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <BarChart
                      title="Revenue"
                      subtitle="$K by quarter"
                      labels={["Q1", "Q2", "Q3", "Q4"]}
                      series={REVENUE}
                      formatValue={(v) => `$${v.toLocaleString()}K`}
                    />
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <BarChart
                      title="Traffic by channel"
                      subtitle="Sessions (K), stacked — part-to-whole without a pie"
                      labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
                      series={TRAFFIC}
                      stacked
                    />
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <LineChart
                      title="Deploy frequency"
                      subtitle="Single series — the title names it, no legend box"
                      labels={MONTHS}
                      series={[{ label: "Deploys", data: [22, 25, 24, 31, 30, 36, 34, 41, 44, 43, 49, 54] }]}
                      area
                    />
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <DonutChart
                      title="Spending breakdown"
                      subtitle="June, by category — smallest fold into Other (maxSlices)"
                      centerLabel="Spent in June"
                      data={SPENDING}
                      maxSlices={5}
                      formatValue={(v) => `$${v.toLocaleString()}`}
                    />
                  </CardBody>
                </Card>
              </Grid>

              <h2>Alerts &amp; toasts</h2>
              <Stack gap={3}>
                <Alert tone="success" title="Deployed" onDismiss={() => toast("Alert dismissed")}>
                  Build 214 is live in production.
                </Alert>
                <Alert tone="danger" title="Payment failed" role="alert">
                  We couldn't charge your card.
                </Alert>
              </Stack>
              <Cluster>
                <Button variant="soft" onClick={() => toast("All changes saved.", { tone: "success" })}>
                  Success toast
                </Button>
                <Button variant="soft" onClick={() => toast("I stay until dismissed.", { title: "Sticky", tone: "info", duration: 0 })}>
                  Sticky toast
                </Button>
              </Cluster>

              <h2>Tabs, accordion &amp; wayfinding</h2>
              <Tabs defaultValue="overview">
                <TabList aria-label="Example tabs">
                  <Tab value="overview">Overview</Tab>
                  <Tab value="activity">Activity</Tab>
                  <Tab value="settings">Settings</Tab>
                </TabList>
                <TabPanel value="overview">
                  <p className="u-text-muted">Controlled or uncontrolled; arrow keys work.</p>
                </TabPanel>
                <TabPanel value="activity">
                  <p className="u-text-muted">Recent activity renders here.</p>
                </TabPanel>
                <TabPanel value="settings">
                  <p className="u-text-muted">Settings form renders here.</p>
                </TabPanel>
              </Tabs>
              <Accordion name="faq">
                <AccordionItem name="faq" summary="Native details/summary underneath?" defaultOpen>
                  Yes — exclusive-open via the shared <code>name</code>, animated by <code>interpolate-size</code>.
                </AccordionItem>
                <AccordionItem name="faq" summary="Do themes stay accessible?">
                  Contrast is checked at build time; failing palettes fail the build.
                </AccordionItem>
              </Accordion>
              <Cluster justify="between">
                <Breadcrumb>
                  <BreadcrumbItem href="#top">Home</BreadcrumbItem>
                  <BreadcrumbItem href="#top">Projects</BreadcrumbItem>
                  <BreadcrumbItem current>Sorbet</BreadcrumbItem>
                </Breadcrumb>
                <Pagination page={page} pageCount={12} onPageChange={setPage} />
              </Cluster>

              <h2>Menu</h2>
              <Cluster>
                <Menu
                  alignEnd
                  trigger={<Button variant="outline">Options ▾</Button>}
                >
                  <MenuHeading>Project</MenuHeading>
                  <MenuItem shortcut="⌘R" onSelect={() => toast("Rename selected")}>
                    Rename
                  </MenuItem>
                  <MenuItem shortcut="⌘D" onSelect={() => toast("Duplicate selected")}>
                    Duplicate
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem danger onSelect={() => setModalOpen(true)}>
                    Delete project
                  </MenuItem>
                </Menu>
                <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
                  Open drawer
                </Button>
                <Popover aria-label="Quick settings" trigger={<Button variant="outline">Popover ▾</Button>}>
                  <Stack gap={3}>
                    <strong>Quick settings</strong>
                    <Field label="Project name">
                      <Input defaultValue="Sorbet" size="sm" />
                    </Field>
                    <Choice>
                      <Switch defaultChecked /> Public project
                    </Choice>
                    <Button size="sm" onClick={() => toast("Saved settings")}>
                      Save
                    </Button>
                  </Stack>
                </Popover>
              </Cluster>
            </Stack>

            <Stack as="section" id="organisms">
              <h2>Data table</h2>
              <DataTable
                columns={columns}
                data={INVOICES}
                rowKey={(row) => row.id}
                hover
                initialSort={{ key: "amount", direction: "descending" }}
              />
              <Divider label="fin" />
            </Stack>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="sm">
        <ModalHeader onClose={() => setModalOpen(false)}>
          <h2>Delete project?</h2>
        </ModalHeader>
        <ModalBody>
          <Stack gap={3}>
            <p>
              This permanently removes <strong>sorbet-playground</strong>. It cannot be undone.
            </p>
            <Field label="Type the project name to confirm">
              <Input placeholder="sorbet-playground" />
            </Field>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setModalOpen(false);
              toast("Project deleted", { tone: "danger" });
            }}
          >
            Delete forever
          </Button>
        </ModalFooter>
      </Modal>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <DrawerHeader onClose={() => setDrawerOpen(false)}>
          <h3>Filters</h3>
        </DrawerHeader>
        <DrawerBody>
          <Stack>
            <Field label="Status">
              <Select defaultValue="Any">
                <option>Any</option>
                <option>Paid</option>
                <option>Pending</option>
              </Select>
            </Field>
            <Choice>
              <Checkbox defaultChecked /> Only my invoices
            </Choice>
          </Stack>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="ghost" onClick={() => setDrawerOpen(false)}>
            Reset
          </Button>
          <Button onClick={() => setDrawerOpen(false)}>Apply</Button>
        </DrawerFooter>
      </Drawer>

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

/** DatePicker with live status wired through Field — masks as you type in
 *  mm/dd/yyyy and reports the two simple checks (valid + reasonable). */
function DatePickerDemo() {
  const [result, setResult] = useState<DateValidation | null>(null);
  const status: { hint?: string; error?: string } = !result || result.empty
    ? { hint: "Type digits — the slashes fill in for you." }
    : !result.complete
      ? { hint: "Keep typing…" }
      : !result.valid
        ? { error: "That's not a real calendar date." }
        : !result.inRange
          ? { error: "Pick a date between 1900 and 2100." }
          : { hint: `Looks good — ${result.date?.toLocaleDateString(undefined, { dateStyle: "full" })}.` };
  return (
    <Field label="Birthday" hint={status.hint} error={status.error} invalid={Boolean(status.error)}>
      <DatePicker format="mm/dd/yyyy" name="birthday" disableFuture onValueChange={(_, r) => setResult(r)} />
    </Field>
  );
}

/** DateRange with live status — pick a start day then an end day (or type into
 *  either input), no dates in the past, at least one night. */
function DateRangeDemo() {
  const [result, setResult] = useState<DateRangeValidation | null>(null);
  const status: { hint?: string; error?: string } = !result || !result.complete
    ? { hint: "Click a start day, then an end day — or type into either box." }
    : !result.start.valid || !result.end.valid
      ? { error: "One of those isn't a real calendar date." }
      : !result.ordered
        ? { error: "The start date must come before the end date." }
        : !result.spanOk
          ? { error: "The trip must be at least one night." }
          : { hint: `${result.nights} night${result.nights === 1 ? "" : "s"} booked.` };
  return (
    <Field label="Trip dates" hint={status.hint} error={status.error} invalid={Boolean(status.error)}>
      <DateRange format="mm/dd/yyyy" name="trip" disablePast minNights={1} onValueChange={(_, r) => setResult(r)} />
    </Field>
  );
}
