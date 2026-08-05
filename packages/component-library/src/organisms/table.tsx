"use client";

import { useMemo, useState, type ComponentPropsWithRef, type ReactNode } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "../molecules/table.tsx";

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Right-aligned tabular numerals. */
  numeric?: boolean;
  sortable?: boolean;
  /** Cell renderer; defaults to row[key]. */
  render?: (row: T) => ReactNode;
  /** Sort value extractor; defaults to row[key]. */
  sortValue?: (row: T) => string | number;
}

export interface DataTableProps<T> extends Omit<ComponentPropsWithRef<"table">, "children"> {
  columns: Array<Column<T>>;
  data: T[];
  rowKey: (row: T) => string | number;
  hover?: boolean;
  striped?: boolean;
  compact?: boolean;
  stickyHeader?: boolean;
  /** Initial sort, e.g. { key: "amount", direction: "descending" }. */
  initialSort?: { key: string; direction: "ascending" | "descending" };
  /** Extra classes for the scroll wrapper. */
  wrapClassName?: string;
}

type Direction = "ascending" | "descending";

/**
 * The interactive table: columns in, sorted rows out.
 *
 * It renders the presentational `Table` parts rather than its own markup, so
 * the two can't drift apart visually — this file owns only the behavior. If you
 * just need to show rows, import `Table` instead and none of this sorting
 * machinery gets bundled.
 */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  hover,
  striped,
  compact,
  stickyHeader,
  initialSort,
  wrapClassName,
  ...rest
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; direction: Direction } | null>(initialSort ?? null);

  const sorted = useMemo(() => {
    if (!sort) {
      return data;
    }
    const col = columns.find((c) => c.key === sort.key);
    if (!col) {
      return data;
    }
    const value = col.sortValue ?? ((row: T) => (row as Record<string, unknown>)[col.key] as string | number);
    return [...data].sort((a, b) => {
      const [va, vb] = [value(a), value(b)];
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), undefined, { sensitivity: "base", numeric: true });
      return sort.direction === "ascending" ? cmp : -cmp;
    });
  }, [data, sort, columns]);

  const toggle = (key: string) =>
    setSort((prev) =>
      prev?.key === key
        ? { key, direction: prev.direction === "ascending" ? "descending" : "ascending" }
        : { key, direction: "ascending" },
    );

  return (
    <Table
      hover={hover}
      striped={striped}
      compact={compact}
      stickyHeader={stickyHeader}
      wrapClassName={wrapClassName}
      {...rest}
    >
      <TableHead>
        <TableRow>
          {columns.map((col) => (
            <TableHeaderCell
              key={col.key}
              scope="col"
              numeric={col.numeric}
              sort={sort?.key === col.key ? sort.direction : undefined}
            >
              {col.sortable ? (
                <button type="button" className="sb-table__sort" onClick={() => toggle(col.key)}>
                  {col.header}
                </button>
              ) : (
                col.header
              )}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.map((row) => (
          <TableRow key={rowKey(row)}>
            {columns.map((col) => (
              <TableCell key={col.key} numeric={col.numeric}>
                {col.render ? col.render(row) : ((row as Record<string, unknown>)[col.key] as ReactNode)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
