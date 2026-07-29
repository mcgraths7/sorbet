import { Badge, Divider } from "@sorbet/component-library/atoms";
import { DataTable, type Column } from "@sorbet/component-library/organisms";

import type { Demo } from "./types.ts";

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

export function DataTableDemo() {
  return (
    <>
      <DataTable
        columns={columns}
        data={INVOICES}
        rowKey={(row) => row.id}
        hover
        initialSort={{ key: "amount", direction: "descending" }}
      />
      <Divider label="fin" />
    </>
  );
}

export const demo: Demo = { title: "Data table", layer: "organisms", order: 20, Component: DataTableDemo };
