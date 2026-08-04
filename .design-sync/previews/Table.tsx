import {
  Badge,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@sorbet/component-library";

const ORDERS = [
  { id: "SB-1042", customer: "Ada Okafor", plan: "Family (4)", meals: 12, total: 68.4, status: "Delivered" },
  { id: "SB-1043", customer: "Priya Nair", plan: "Couple (2)", meals: 6, total: 34.2, status: "Preparing" },
  { id: "SB-1044", customer: "Liam Foster", plan: "Solo (1)", meals: 3, total: 17.1, status: "Delivered" },
  { id: "SB-1045", customer: "Mei Chen", plan: "Family (4)", meals: 12, total: 68.4, status: "Cancelled" },
];

const TONE = { Delivered: "success", Preparing: "warning", Cancelled: "danger" } as const;
const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/** The default look: striped rows, a caption, and a totals footer — the
 *  shape most tables in the product actually take. */
export function Default() {
  const total = ORDERS.reduce((sum, row) => sum + row.total, 0);
  return (
    <Table striped>
      <TableCaption>Recent orders across all subscription plans.</TableCaption>
      <TableHead>
        <TableRow>
          <TableHeaderCell scope="col">Order</TableHeaderCell>
          <TableHeaderCell scope="col">Customer</TableHeaderCell>
          <TableHeaderCell scope="col">Plan</TableHeaderCell>
          <TableHeaderCell scope="col" numeric>
            Meals
          </TableHeaderCell>
          <TableHeaderCell scope="col">Status</TableHeaderCell>
          <TableHeaderCell scope="col" numeric>
            Total
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {ORDERS.map((row) => (
          <TableRow key={row.id}>
            <TableHeaderCell scope="row">{row.id}</TableHeaderCell>
            <TableCell>{row.customer}</TableCell>
            <TableCell>{row.plan}</TableCell>
            <TableCell numeric>{row.meals}</TableCell>
            <TableCell>
              <Badge tone={TONE[row.status as keyof typeof TONE]}>{row.status}</Badge>
            </TableCell>
            <TableCell numeric>{money(row.total)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFoot>
        <TableRow>
          <TableHeaderCell scope="row" colSpan={5}>
            Total
          </TableHeaderCell>
          <TableCell numeric>{money(total)}</TableCell>
        </TableRow>
      </TableFoot>
    </Table>
  );
}

/** `compact` tightens cell padding for dense, scan-heavy lists — paired here
 *  with `hover` so rows pick out on mouseover. */
export function Compact() {
  return (
    <Table compact hover>
      <TableHead>
        <TableRow>
          <TableHeaderCell scope="col">Order</TableHeaderCell>
          <TableHeaderCell scope="col">Customer</TableHeaderCell>
          <TableHeaderCell scope="col">Plan</TableHeaderCell>
          <TableHeaderCell scope="col" numeric>
            Meals
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {ORDERS.map((row) => (
          <TableRow key={row.id}>
            <TableHeaderCell scope="row">{row.id}</TableHeaderCell>
            <TableCell>{row.customer}</TableCell>
            <TableCell>{row.plan}</TableCell>
            <TableCell numeric>{row.meals}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Unwrapped (`wrap={false}`): no border/surface chrome, for callers dropping
 *  the table into their own container. */
export function Unwrapped() {
  return (
    <Table wrap={false}>
      <TableHead>
        <TableRow>
          <TableHeaderCell scope="col">Order</TableHeaderCell>
          <TableHeaderCell scope="col">Status</TableHeaderCell>
          <TableHeaderCell scope="col" numeric>
            Total
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {ORDERS.slice(0, 3).map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.id}</TableCell>
            <TableCell>
              <Badge tone={TONE[row.status as keyof typeof TONE]}>{row.status}</Badge>
            </TableCell>
            <TableCell numeric>{money(row.total)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
