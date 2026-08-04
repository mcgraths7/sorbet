import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@sorbet/component-library";

const STOCK = [
  { sku: "SB-100", item: "Raspberry ripple", qty: 12, status: "In stock" },
  { sku: "SB-201", item: "Sea foam", qty: 3, status: "Low" },
  { sku: "SB-330", item: "Lemon zest", qty: 0, status: "Out" },
  { sku: "SB-412", item: "Grape crush", qty: 27, status: "In stock" },
];

const TONE = { "In stock": "success", Low: "warning", Out: "danger" } as const;

/** `TableBody` is where the actual data rows live — one `TableRow` per
 *  record, whatever cell content that record needs. */
export function Default() {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell scope="col">SKU</TableHeaderCell>
          <TableHeaderCell scope="col">Item</TableHeaderCell>
          <TableHeaderCell scope="col" numeric>
            Qty
          </TableHeaderCell>
          <TableHeaderCell scope="col">Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {STOCK.map((row) => (
          <TableRow key={row.sku}>
            <TableCell>{row.sku}</TableCell>
            <TableCell>{row.item}</TableCell>
            <TableCell numeric>{row.qty}</TableCell>
            <TableCell>
              <Badge tone={TONE[row.status as keyof typeof TONE]}>{row.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Body rows under `hover` — the body is what actually reacts to the pointer,
 *  since only its rows carry data. */
export function HoverRows() {
  return (
    <Table hover striped>
      <TableHead>
        <TableRow>
          <TableHeaderCell scope="col">SKU</TableHeaderCell>
          <TableHeaderCell scope="col">Item</TableHeaderCell>
          <TableHeaderCell scope="col" numeric>
            Qty
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {STOCK.map((row) => (
          <TableRow key={row.sku}>
            <TableCell>{row.sku}</TableCell>
            <TableCell>{row.item}</TableCell>
            <TableCell numeric>{row.qty}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
