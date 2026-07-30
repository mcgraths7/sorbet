import { cx } from "../core/index.ts";

import type { ComponentPropsWithRef } from "react";

export interface TableProps extends ComponentPropsWithRef<"table"> {
  hover?: boolean;
  striped?: boolean;
  compact?: boolean;
  /** Header sticks while the body scrolls. */
  stickyHeader?: boolean;
  /** Wrap in the bordered, horizontally-scrolling surface (default true).
   *  Turn it off only if you're supplying your own container. */
  wrap?: boolean;
  wrapClassName?: string;
}

/**
 * A plain, presentational table: the `sb-table` look over ordinary semantic
 * markup, with no state and no behavior.
 *
 * This is the one to reach for when you just need to show rows — it carries
 * none of `DataTable`'s sorting machinery, so nothing you don't use gets
 * bundled. `DataTable` is built on these same parts, which is what keeps the
 * two looking identical.
 *
 *   <Table hover>
 *     <TableHead>
 *       <TableRow><TableHeaderCell>Name</TableHeaderCell></TableRow>
 *     </TableHead>
 *     <TableBody>
 *       <TableRow><TableCell>Ada</TableCell></TableRow>
 *     </TableBody>
 *   </Table>
 *
 * The wrapper owns horizontal overflow, so a wide table never makes the page
 * scroll sideways.
 */
export function Table({
  hover,
  striped,
  compact,
  stickyHeader,
  wrap = true,
  wrapClassName,
  className,
  ...rest
}: TableProps) {
  const table = (
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
    />
  );
  return wrap ? <div className={cx("sb-table-wrap", wrapClassName)}>{table}</div> : table;
}

export function TableHead(props: ComponentPropsWithRef<"thead">) {
  return <thead {...props} />;
}

export function TableBody(props: ComponentPropsWithRef<"tbody">) {
  return <tbody {...props} />;
}

export function TableFoot(props: ComponentPropsWithRef<"tfoot">) {
  return <tfoot {...props} />;
}

export function TableRow(props: ComponentPropsWithRef<"tr">) {
  return <tr {...props} />;
}

export function TableCaption(props: ComponentPropsWithRef<"caption">) {
  return <caption {...props} />;
}

export interface TableCellProps extends ComponentPropsWithRef<"td"> {
  /** Right-aligned with tabular figures, so digits line up column-wise. */
  numeric?: boolean;
}

export function TableCell({ numeric, ...rest }: TableCellProps) {
  return <td data-numeric={numeric || undefined} {...rest} />;
}

export interface TableHeaderCellProps extends ComponentPropsWithRef<"th"> {
  numeric?: boolean;
  /** Current sort state for this column — emitted as `aria-sort`. Presentational
   *  only: put a button inside and own the clicks, or use `DataTable`. */
  sort?: "ascending" | "descending";
}

export function TableHeaderCell({ numeric, sort, ...rest }: TableHeaderCellProps) {
  return <th data-numeric={numeric || undefined} aria-sort={sort} {...rest} />;
}
