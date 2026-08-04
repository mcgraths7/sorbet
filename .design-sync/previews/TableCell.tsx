import {
  Avatar,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@sorbet/component-library";

const TASKS = [
  { task: "Design onboarding flow", assignee: "Ada Okafor", initials: "AO", priority: "High", hours: 6 },
  { task: "Fix checkout bug", assignee: "Priya Nair", initials: "PN", priority: "Urgent", hours: 2.5 },
  { task: "Write release notes", assignee: "Liam Foster", initials: "LF", priority: "Low", hours: 1 },
];

const PRIORITY_TONE = { Urgent: "danger", High: "warning", Low: "info" } as const;

/** Plain text `TableCell`s — the common case, no special data-type. */
export function Default() {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell scope="col">Task</TableHeaderCell>
          <TableHeaderCell scope="col">Assignee</TableHeaderCell>
          <TableHeaderCell scope="col">Priority</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {TASKS.map((row) => (
          <TableRow key={row.task}>
            <TableCell>{row.task}</TableCell>
            <TableCell>{row.assignee}</TableCell>
            <TableCell>{row.priority}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** `numeric`: right-aligned with tabular figures, so a column of digits lines
 *  up edge to edge instead of ragging on the left. */
export function Numeric() {
  const rate = 85;
  return (
    <Table striped>
      <TableHead>
        <TableRow>
          <TableHeaderCell scope="col">Task</TableHeaderCell>
          <TableHeaderCell scope="col" numeric>
            Hours
          </TableHeaderCell>
          <TableHeaderCell scope="col" numeric>
            Cost
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {TASKS.map((row) => (
          <TableRow key={row.task}>
            <TableCell>{row.task}</TableCell>
            <TableCell numeric>{row.hours}</TableCell>
            <TableCell numeric>
              {(row.hours * rate).toLocaleString("en-US", { style: "currency", currency: "USD" })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Cells aren't limited to text — an `Avatar` + name pair and a status
 *  `Badge` both drop in as ordinary cell content. */
export function RichContent() {
  return (
    <Table hover>
      <TableHead>
        <TableRow>
          <TableHeaderCell scope="col">Task</TableHeaderCell>
          <TableHeaderCell scope="col">Assignee</TableHeaderCell>
          <TableHeaderCell scope="col">Priority</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {TASKS.map((row) => (
          <TableRow key={row.task}>
            <TableCell>{row.task}</TableCell>
            <TableCell>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar size="sm">{row.initials}</Avatar>
                {row.assignee}
              </div>
            </TableCell>
            <TableCell>
              <Badge tone={PRIORITY_TONE[row.priority as keyof typeof PRIORITY_TONE]}>{row.priority}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
