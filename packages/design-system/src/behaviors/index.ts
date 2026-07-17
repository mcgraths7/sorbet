/**
 * Sorbet behaviors — framework-agnostic, dependency-free progressive
 * enhancement over the Sass components.
 *
 *   import { init } from "sorbet-ds";
 *   init();
 *
 * `init` wires everything declared in markup via data attributes; the
 * classes are exported for imperative use.
 */

export { getTheme, ThemeManager, type ThemeMode } from "./theme.ts";
export { Tabs } from "./tabs.ts";
export { initModals, openModal } from "./modal.ts";
export { Menu } from "./menu.ts";
export { toast, type ToastOptions } from "./toast.ts";
export { initTooltips } from "./tooltip.ts";
export { SortableTable } from "./table-sort.ts";
export { initDismiss } from "./dismiss.ts";
export { Masonry, supportsNativeMasonry } from "./masonry.ts";
export { Dropzone, type DropzoneRejection } from "./dropzone.ts";

import { getTheme } from "./theme.ts";
import { Tabs } from "./tabs.ts";
import { initModals } from "./modal.ts";
import { Menu } from "./menu.ts";
import { initTooltips } from "./tooltip.ts";
import { SortableTable } from "./table-sort.ts";
import { initDismiss } from "./dismiss.ts";
import { Masonry } from "./masonry.ts";
import { Dropzone } from "./dropzone.ts";

function wire<T extends HTMLElement>(root: ParentNode, selector: string, create: (el: T) => unknown): void {
  for (const el of root.querySelectorAll<T>(selector)) {
    if (el.dataset.sbReady) continue;
    el.dataset.sbReady = "true";
    create(el);
  }
}

export function init(root: ParentNode = document): void {
  getTheme(); // applies any persisted theme choice immediately

  wire(root, '[data-sb="tabs"]', (el) => new Tabs(el));
  wire(root, '[data-sb="menu"]', (el) => new Menu(el));
  wire(root, '[data-sb="masonry"]', (el) => new Masonry(el));
  wire(root, '[data-sb="dropzone"]', (el) => new Dropzone(el));
  wire<HTMLTableElement>(root, 'table[data-sb="sortable"]', (el) => new SortableTable(el));
  initModals(root);

  if (root === document) {
    initTooltips(root);
    initDismiss(root);
  }
}
