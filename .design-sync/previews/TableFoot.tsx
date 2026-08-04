import {
  Table,
  TableBody,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@sorbet/component-library";

const LINE_ITEMS = [
  { item: "Family plan — 4 meals", qty: 4, price: 11.5 },
  { item: "Sourdough add-on", qty: 1, price: 4.0 },
  { item: "Delivery", qty: 1, price: 5.0 },
];

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/** A totals row in `TableFoot`, spanning the label columns with `colSpan` so
 *  the number lines up under the price column above it. */
export function Default() {
  const subtotal = LINE_ITEMS.reduce((sum, row) => sum + row.qty * row.price, 0);
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell scope="col">Item</TableHeaderCell>
          <TableHeaderCell scope="col" numeric>
            Qty
          </TableHeaderCell>
          <TableHeaderCell scope="col" numeric>
            Price
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {LINE_ITEMS.map((row) => (
          <TableRow key={row.item}>
            <TableCell>{row.item}</TableCell>
            <TableCell numeric>{row.qty}</TableCell>
            <TableCell numeric>{money(row.price)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFoot>
        <TableRow>
          <TableHeaderCell scope="row" colSpan={2}>
            Subtotal
          </TableHeaderCell>
          <TableCell numeric>{money(subtotal)}</TableCell>
        </TableRow>
      </TableFoot>
    </Table>
  );
}

/** A multi-row summary — subtotal, tax, and a bolded grand total — the shape
 *  an invoice or receipt table's foot actually takes. */
export function OrderSummary() {
  const subtotal = LINE_ITEMS.reduce((sum, row) => sum + row.qty * row.price, 0);
  const tax = subtotal * 0.08;
  return (
    <Table striped>
      <TableHead>
        <TableRow>
          <TableHeaderCell scope="col">Item</TableHeaderCell>
          <TableHeaderCell scope="col" numeric>
            Qty
          </TableHeaderCell>
          <TableHeaderCell scope="col" numeric>
            Price
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {LINE_ITEMS.map((row) => (
          <TableRow key={row.item}>
            <TableCell>{row.item}</TableCell>
            <TableCell numeric>{row.qty}</TableCell>
            <TableCell numeric>{money(row.price)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFoot>
        <TableRow>
          <TableHeaderCell scope="row" colSpan={2}>
            Subtotal
          </TableHeaderCell>
          <TableCell numeric>{money(subtotal)}</TableCell>
        </TableRow>
        <TableRow>
          <TableHeaderCell scope="row" colSpan={2}>
            Tax (8%)
          </TableHeaderCell>
          <TableCell numeric>{money(tax)}</TableCell>
        </TableRow>
        <TableRow>
          <TableHeaderCell scope="row" colSpan={2}>
            Total
          </TableHeaderCell>
          <TableCell numeric>
            <strong>{money(subtotal + tax)}</strong>
          </TableCell>
        </TableRow>
      </TableFoot>
    </Table>
  );
}
