import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@sorbet/component-library";

const INVENTORY = [
  { sku: "SB-100", item: "Raspberry ripple", qty: 12, price: 4.5 },
  { sku: "SB-201", item: "Sea foam", qty: 3, price: 5.25 },
  { sku: "SB-330", item: "Lemon zest", qty: 0, price: 4.75 },
];

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/** Column headers via `scope="col"` — uppercase, muted, on the sunken
 *  surface that marks the header row. */
export function Default() {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell scope="col">SKU</TableHeaderCell>
          <TableHeaderCell scope="col">Item</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {INVENTORY.map((row) => (
          <TableRow key={row.sku}>
            <TableCell>{row.sku}</TableCell>
            <TableCell>{row.item}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** `numeric` right-aligns the header to sit flush above the tabular figures
 *  in the column below it. */
export function Numeric() {
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
        {INVENTORY.map((row) => (
          <TableRow key={row.sku}>
            <TableCell>{row.item}</TableCell>
            <TableCell numeric>{row.qty}</TableCell>
            <TableCell numeric>{money(row.price)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** `sort="ascending"` (or `"descending"`) emits `aria-sort`, which the
 *  `sb-table__sort` styles key off to show the arrow glyph — presentational
 *  only, so the click handling and live state belong to the caller. */
export function Sorted() {
  return (
    <Table hover>
      <TableHead>
        <TableRow>
          <TableHeaderCell scope="col" sort="ascending">
            <button type="button" className="sb-table__sort">
              Item
            </button>
          </TableHeaderCell>
          <TableHeaderCell scope="col" numeric>
            Qty
          </TableHeaderCell>
          <TableHeaderCell scope="col" numeric>
            Price
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {[...INVENTORY]
          .sort((a, b) => a.item.localeCompare(b.item))
          .map((row) => (
            <TableRow key={row.sku}>
              <TableCell>{row.item}</TableCell>
              <TableCell numeric>{row.qty}</TableCell>
              <TableCell numeric>{money(row.price)}</TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
