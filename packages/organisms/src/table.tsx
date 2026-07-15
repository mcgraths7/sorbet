import { cx } from "@sorbet/core";
import { useMemo, useState, type ComponentPropsWithRef, type ReactNode } from "react";

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

/** Sortable data table. The wrapper owns horizontal overflow. */
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
  className,
  ...rest
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; direction: Direction } | null>(initialSort ?? null);

  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return data;
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
    <div className={cx("sb-table-wrap", wrapClassName)}>
      <table
        className={cx(
          "sb-table",
          hover && "sb-table--hover",
          striped && "sb-table--striped",
          compact && "sb-table--compact",
          stickyHeader && "sb-table--sticky-header",
          className,
        )}
        {...rest}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                data-numeric={col.numeric || undefined}
                aria-sort={sort?.key === col.key ? sort.direction : undefined}
              >
                {col.sortable ? (
                  <button type="button" className="sb-table__sort" onClick={() => toggle(col.key)}>
                    {col.header}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((col) => (
                <td key={col.key} data-numeric={col.numeric || undefined}>
                  {col.render ? col.render(row) : ((row as Record<string, unknown>)[col.key] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
