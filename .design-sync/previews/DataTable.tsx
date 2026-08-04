import { Badge, DataTable, type Column } from "@sorbet/component-library";

interface Invoice {
  id: string;
  client: string;
  plan: "Starter" | "Team" | "Growth";
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
  due: string;
}

const INVOICES: Invoice[] = [
  { id: "INV-1042", client: "Nimbus Robotics", plan: "Team", amount: 480, status: "Paid", due: "2026-07-18" },
  { id: "INV-1043", client: "Halcyon Labs", plan: "Starter", amount: 96, status: "Overdue", due: "2026-07-02" },
  { id: "INV-1044", client: "Brightline Media", plan: "Growth", amount: 1240, status: "Paid", due: "2026-07-22" },
  { id: "INV-1045", client: "Fenwick & Co", plan: "Team", amount: 480, status: "Pending", due: "2026-07-29" },
  { id: "INV-1046", client: "Cedar Analytics", plan: "Growth", amount: 1240, status: "Paid", due: "2026-07-15" },
  { id: "INV-1047", client: "Solstice Studio", plan: "Starter", amount: 96, status: "Pending", due: "2026-08-05" },
  { id: "INV-1048", client: "Marrow Health", plan: "Growth", amount: 1240, status: "Overdue", due: "2026-06-30" },
];

const STATUS_TONE = {
  Paid: "success",
  Pending: "warning",
  Overdue: "danger",
} as const;

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/**
 * Parse a plain ISO date as a LOCAL date — `new Date("2026-07-18")` parses as
 * UTC midnight, which formats a day early anywhere behind UTC.
 */
const parseLocalDate = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
};

const invoiceColumns: Array<Column<Invoice>> = [
  { key: "id", header: "Invoice", sortable: true },
  { key: "client", header: "Client", sortable: true },
  { key: "plan", header: "Plan", sortable: true },
  { key: "amount", header: "Amount", numeric: true, sortable: true, render: (row) => money(row.amount) },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>,
  },
  {
    key: "due",
    header: "Due",
    sortable: true,
    render: (row) => parseLocalDate(row.due).toLocaleDateString("en-US", { day: "numeric", month: "short" }),
  },
];

/** Billing table sorted soonest-due-first — the realistic default for a finance view. */
export function Default() {
  return (
    <DataTable
      columns={invoiceColumns}
      data={INVOICES}
      rowKey={(row) => row.id}
      hover
      stickyHeader
      initialSort={{ key: "due", direction: "ascending" }}
    />
  );
}

interface Teammate {
  name: string;
  role: string;
  team: string;
  status: "Active" | "On leave" | "Invited";
  started: string;
}

const ROSTER: Teammate[] = [
  { name: "Elena Vasquez", role: "Senior Engineer", team: "Platform", status: "Active", started: "2024-03-11" },
  { name: "Noah Kim", role: "Product Designer", team: "Design", status: "Active", started: "2023-11-02" },
  { name: "Grace Okafor", role: "Support Lead", team: "Success", status: "On leave", started: "2022-06-20" },
  { name: "Liam Brennan", role: "Data Analyst", team: "Insights", status: "Active", started: "2025-01-14" },
  { name: "Ines Duarte", role: "Engineering Manager", team: "Platform", status: "Active", started: "2021-09-01" },
  { name: "Sam Whitfield", role: "Growth Marketer", team: "Marketing", status: "Invited", started: "2026-07-20" },
];

const ROSTER_TONE = { Active: "success", "On leave": "warning", Invited: "info" } as const;

const rosterColumns: Array<Column<Teammate>> = [
  { key: "name", header: "Name", sortable: true },
  { key: "role", header: "Role", sortable: true },
  { key: "team", header: "Team", sortable: true },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => <Badge tone={ROSTER_TONE[row.status]}>{row.status}</Badge>,
  },
  {
    key: "started",
    header: "Started",
    sortable: true,
    render: (row) => parseLocalDate(row.started).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
  },
];

/** Dense variant (`compact` + `striped`) for a longer, scannable roster. */
export function CompactStriped() {
  return (
    <DataTable
      columns={rosterColumns}
      data={ROSTER}
      rowKey={(row) => row.name}
      compact
      striped
      initialSort={{ key: "name", direction: "ascending" }}
    />
  );
}
