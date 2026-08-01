import { Badge, Button, Text } from "@sorbet/component-library/atoms";
import { Cluster, Stack } from "@sorbet/component-library/layout";
import {
  Menu,
  MenuItem,
  MenuSeparator,
  Section,
  Table,
  TableBody,
  TableCell,
  TableHeaderCell,
  TableRow,
  useToast,
} from "@sorbet/component-library/molecules";
import {
  DataTable,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  useConfirm,
  type Column,
} from "@sorbet/component-library/organisms";
import { useState } from "react";

import { ORDERS, STATUS_TONE, type Order } from "../data.ts";

const money = (n: number) => n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });

/**
 * Parse a plain ISO date as a LOCAL date. `new Date("2026-07-30")` is parsed as
 * UTC midnight, so anywhere behind UTC it formats as the day before — these are
 * calendar dates, not instants, so build them from the parts.
 */
const parseLocalDate = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
};

export function Orders() {
  const toast = useToast();
  const confirm = useConfirm();
  const [selected, setSelected] = useState<Order | null>(null);

  const cancelOrder = async(order: Order) => {
    const ok = await confirm({
      title: `Cancel ${order.id}?`,
      description: `${order.customer}'s box is already ${order.status.toLowerCase()}. Cancelling refunds ${money(order.total)} and stops the delivery.`,
      confirmLabel: "Cancel order",
      cancelLabel: "Keep it",
      tone: "danger",
    });
    if (ok) {
      setSelected(null);
      toast(`${order.id} cancelled and refunded.`, { tone: "danger" });
    }
  };

  const columns: Array<Column<Order>> = [
    { key: "id", header: "Order", sortable: true },
    { key: "customer", header: "Customer", sortable: true },
    { key: "plan", header: "Plan", sortable: true },
    { key: "meals", header: "Meals", numeric: true, sortable: true },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge>,
    },
    {
      key: "total",
      header: "Total",
      numeric: true,
      sortable: true,
      render: (row) => money(row.total),
    },
    {
      key: "placed",
      header: "Placed",
      sortable: true,
      render: (row) => parseLocalDate(row.placed).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    },
    {
      key: "actions",
      header: "",
      sortValue: () => "",
      render: (row) => (
        <Menu alignEnd trigger={<Button variant="ghost" size="sm">Actions ▾</Button>}>
          <MenuItem onSelect={() => setSelected(row)}>View details</MenuItem>
          <MenuItem onSelect={() => toast(`Resent confirmation to ${row.customer}.`)}>Resend confirmation</MenuItem>
          <MenuSeparator />
          <MenuItem danger onSelect={() => void cancelOrder(row)}>
            Cancel order
          </MenuItem>
        </Menu>
      ),
    },
  ];

  return (
    <Section
      id="orders"
      title="Orders"
      description="Everything placed in the last 48 hours."
      action={<Button variant="outline" onClick={() => toast("Exported 7 orders as CSV.")}>Export CSV</Button>}
      gap={4}
    >
      <DataTable
        columns={columns}
        data={ORDERS}
        rowKey={(row) => row.id}
        hover
        stickyHeader
        initialSort={{ key: "placed", direction: "descending" }}
      />

      {/* Detail lives in a drawer so the table stays put behind it. */}
      <Drawer open={selected != null} onClose={() => setSelected(null)} width="28rem">
        <DrawerHeader onClose={() => setSelected(null)}>
          <h3>{selected?.id}</h3>
        </DrawerHeader>
        <DrawerBody>
          {selected && (
            <Stack gap={4}>
              <Cluster gap={2}>
                <Badge tone={STATUS_TONE[selected.status]}>{selected.status}</Badge>
                <Badge>{selected.plan}</Badge>
              </Cluster>
              <Table wrap={false}>
                <TableBody>
                  <TableRow>
                    <TableHeaderCell scope="row">Customer</TableHeaderCell>
                    <TableCell numeric>{selected.customer}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHeaderCell scope="row">Meals</TableHeaderCell>
                    <TableCell numeric>{selected.meals}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHeaderCell scope="row">Placed</TableHeaderCell>
                    <TableCell numeric>{selected.placed}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHeaderCell scope="row">Total</TableHeaderCell>
                    <TableCell numeric>{money(selected.total)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Text size="sm" tone="subtle">
                Refunds are issued to the original payment method and usually land within three working days.
              </Text>
            </Stack>
          )}
        </DrawerBody>
        <DrawerFooter>
          <Button variant="ghost" onClick={() => setSelected(null)}>
            Close
          </Button>
          <Button variant="danger" onClick={() => selected && void cancelOrder(selected)}>
            Cancel order
          </Button>
        </DrawerFooter>
      </Drawer>
    </Section>
  );
}
