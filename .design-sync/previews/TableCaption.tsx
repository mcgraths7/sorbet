import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@sorbet/component-library";

const SHIPMENTS = [
  { id: "SHP-2201", origin: "Portland, OR", eta: "Aug 5" },
  { id: "SHP-2202", origin: "Austin, TX", eta: "Aug 6" },
  { id: "SHP-2203", origin: "Newark, NJ", eta: "Aug 7" },
];

/** A short caption naming the table — the accessible name a screen reader
 *  announces before reading any cell. */
export function Default() {
  return (
    <Table>
      <TableCaption>Inbound shipments</TableCaption>
      <TableHead>
        <TableRow>
          <TableHeaderCell scope="col">Shipment</TableHeaderCell>
          <TableHeaderCell scope="col">Origin</TableHeaderCell>
          <TableHeaderCell scope="col">ETA</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {SHIPMENTS.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.id}</TableCell>
            <TableCell>{row.origin}</TableCell>
            <TableCell>{row.eta}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** A longer, descriptive caption — useful when the surrounding page has no
 *  other heading to explain what the table shows. */
export function Descriptive() {
  return (
    <Table striped>
      <TableCaption>
        Shipments currently in transit toward the Newark distribution center, sorted by expected arrival date.
      </TableCaption>
      <TableHead>
        <TableRow>
          <TableHeaderCell scope="col">Shipment</TableHeaderCell>
          <TableHeaderCell scope="col">Origin</TableHeaderCell>
          <TableHeaderCell scope="col">ETA</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {SHIPMENTS.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.id}</TableCell>
            <TableCell>{row.origin}</TableCell>
            <TableCell>{row.eta}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
