/**
 * Client-side column sorting for .sb-table. Numeric-aware ($, %, commas),
 * locale-aware for text, aria-sort kept in sync.
 *
 *   <table class="sb-table" data-sb="sortable">
 *     <thead><tr><th><button class="sb-table__sort">Name</button></th>…
 */

export class SortableTable {
  #body: HTMLTableSectionElement;
  #headers: HTMLTableCellElement[];

  constructor(table: HTMLTableElement) {
    const body = table.tBodies[0];
    if (!body) throw new Error("SortableTable needs a <tbody>");
    this.#body = body;
    this.#headers = [...table.querySelectorAll<HTMLTableCellElement>("thead th")];

    this.#headers.forEach((th, index) => {
      th.querySelector<HTMLElement>(".sb-table__sort")?.addEventListener("click", () => this.sort(index));
    });
  }

  sort(column: number): void {
    const th = this.#headers[column];
    if (!th) return;
    const direction = th.getAttribute("aria-sort") === "ascending" ? "descending" : "ascending";
    for (const header of this.#headers) header.removeAttribute("aria-sort");
    th.setAttribute("aria-sort", direction);

    const numeric = (text: string) => {
      const n = Number(text.replace(/[$,%\s]/g, ""));
      return Number.isNaN(n) ? null : n;
    };

    const key = (row: HTMLTableRowElement) => row.cells[column]?.textContent?.trim() ?? "";

    const rows = [...this.#body.rows].sort((a, b) => {
      const [ka, kb] = [key(a), key(b)];
      const [na, nb] = [numeric(ka), numeric(kb)];
      const cmp = na !== null && nb !== null ? na - nb : ka.localeCompare(kb, undefined, { sensitivity: "base" });
      return direction === "ascending" ? cmp : -cmp;
    });

    this.#body.append(...rows);
  }
}
