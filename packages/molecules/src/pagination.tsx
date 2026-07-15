import { cx } from "@sorbet/core";
import type { ComponentPropsWithRef } from "react";

export interface PaginationProps extends Omit<ComponentPropsWithRef<"nav">, "onChange"> {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Pages shown on each side of the current page. */
  siblings?: number;
}

type PageToken = number | "…";

function model(page: number, pageCount: number, siblings: number): PageToken[] {
  const wanted = new Set<number>([1, pageCount]);
  for (let p = page - siblings; p <= page + siblings; p++) {
    if (p >= 1 && p <= pageCount) wanted.add(p);
  }
  const sorted = [...wanted].sort((a, b) => a - b);
  const out: PageToken[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev === 2) out.push(prev + 1);
    else if (p - prev > 2) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

export function Pagination({ page, pageCount, onPageChange, siblings = 1, className, ...rest }: PaginationProps) {
  return (
    <nav className={cx("sb-pagination", className)} aria-label="Pagination" {...rest}>
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ‹
      </button>
      {model(page, pageCount, siblings).map((token, i) =>
        token === "…" ? (
          <span key={`gap-${i}`}>…</span>
        ) : (
          <button
            key={token}
            type="button"
            aria-current={token === page ? "page" : undefined}
            aria-label={`Page ${token}`}
            onClick={() => onPageChange(token)}
          >
            {token}
          </button>
        ),
      )}
      <button
        type="button"
        aria-label="Next page"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        ›
      </button>
    </nav>
  );
}
