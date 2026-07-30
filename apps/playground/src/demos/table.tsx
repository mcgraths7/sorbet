import { Badge } from "@sorbet/component-library/atoms";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@sorbet/component-library/molecules";

import type { DemoMeta } from "./types.ts";

const ROWS = [
  { sku: "SB-100", item: "Raspberry ripple", qty: 12, price: 4.5, status: "In stock" },
  { sku: "SB-201", item: "Sea foam", qty: 3, price: 5.25, status: "Low" },
  { sku: "SB-330", item: "Lemon zest", qty: 0, price: 4.75, status: "Out" },
  { sku: "SB-412", item: "Grape crush", qty: 27, price: 5.0, status: "In stock" },
];

const TONE = { "In stock": "success", Low: "warning", Out: "danger" } as const;
const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/** The presentational table: plain semantic markup, no state, no sorting — you
 *  write the rows. Same look as DataTable because DataTable is built on it. */
export function TableDemo() {
  const total = ROWS.reduce((sum, r) => sum + r.qty * r.price, 0);
  return (
    <Table striped>
      <TableCaption>Inventory — a static table, written row by row.</TableCaption>
      <TableHead>
        <TableRow>
          <TableHeaderCell scope="col">SKU</TableHeaderCell>
          <TableHeaderCell scope="col">Item</TableHeaderCell>
          <TableHeaderCell scope="col">Status</TableHeaderCell>
          <TableHeaderCell scope="col" numeric>
            Qty
          </TableHeaderCell>
          <TableHeaderCell scope="col" numeric>
            Price
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {ROWS.map((row) => (
          <TableRow key={row.sku}>
            <TableHeaderCell scope="row">{row.sku}</TableHeaderCell>
            <TableCell>{row.item}</TableCell>
            <TableCell>
              <Badge tone={TONE[row.status as keyof typeof TONE]}>{row.status}</Badge>
            </TableCell>
            <TableCell numeric>{row.qty}</TableCell>
            <TableCell numeric>{money(row.price)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFoot>
        <TableRow>
          <TableHeaderCell scope="row" colSpan={4}>
            Stock value
          </TableHeaderCell>
          <TableCell numeric>{money(total)}</TableCell>
        </TableRow>
      </TableFoot>
    </Table>
  );
}

TableDemo.demo = { title: "Table (presentational)", layer: "molecules", order: 15 } satisfies DemoMeta;
