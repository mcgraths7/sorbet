import {
  Badge,
  Button,
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
];

const TONE = { Active: "success", Away: "warning" } as const;

/** One `TableRow` per record — a plain `<tr>` that holds whatever cells the
 *  row needs. */
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

/** Under `Table hover`, each row highlights on mouseover — useful when a row
 *  carries its own action, like this trailing "Manage" button. */
export function Hover() {
  return (
    <Table hover>
      <TableHead>
        <TableRow>
          <TableHeaderCell scope="col">Name</TableHeaderCell>
          <TableHeaderCell scope="col">Role</TableHeaderCell>
          <TableHeaderCell scope="col">Status</TableHeaderCell>
          <TableHeaderCell scope="col" />
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
            <TableCell>
              <Button size="sm" variant="ghost">
                Manage
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
