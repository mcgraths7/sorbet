import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@sorbet/component-library";

const TEAM = [
  { name: "Ada Okafor", role: "Design", status: "Active" },
  { name: "Priya Nair", role: "Engineering", status: "Active" },
  { name: "Liam Foster", role: "Support", status: "Away" },
  { name: "Mei Chen", role: "Engineering", status: "Active" },
  { name: "Jonas Weber", role: "Sales", status: "Active" },
  { name: "Sofia Reyes", role: "Design", status: "Away" },
];

const TONE = { Active: "success", Away: "warning" } as const;

/** `TableHead` wraps the one header row that names each column — always the
 *  first child of `Table`, before the body. */
export function Default() {
  return (
    <Table striped>
      <TableHead>
        <TableRow>
          <TableHeaderCell scope="col">Name</TableHeaderCell>
          <TableHeaderCell scope="col">Role</TableHeaderCell>
          <TableHeaderCell scope="col">Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {TEAM.slice(0, 4).map((row) => (
          <TableRow key={row.name}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.role}</TableCell>
            <TableCell>
              <Badge tone={TONE[row.status as keyof typeof TONE]}>{row.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** `stickyHeader` keeps this row pinned to the top of its scrolling ancestor
 *  as a long roster like this one scrolls underneath it. */
export function Sticky() {
  return (
    <Table stickyHeader hover>
      <TableHead>
        <TableRow>
          <TableHeaderCell scope="col">Name</TableHeaderCell>
          <TableHeaderCell scope="col">Role</TableHeaderCell>
          <TableHeaderCell scope="col">Status</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {TEAM.map((row) => (
          <TableRow key={row.name}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.role}</TableCell>
            <TableCell>
              <Badge tone={TONE[row.status as keyof typeof TONE]}>{row.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
