import type { ComponentType } from "react";

/** The atomic-design section a demo appears under (matches the sidebar anchors). */
export type DemoLayer = "layout" | "atoms" | "molecules" | "organisms";

export interface DemoMeta {
  /** Section heading, rendered as the <h2>. */
  title: string;
  layer: DemoLayer;
  /** Sort position within the layer. Numbered in tens so a new demo can slot
   *  between two existing ones without renumbering (and without conflicting). */
  order: number;
  /** Optional id for the <h2>, for deep links like #charts. */
  anchor?: string;
}

/**
 * A demo component with its metadata hung off the function:
 *
 *   export function ThingDemo() { … }
 *   ThingDemo.demo = { title: "Thing", layer: "atoms", order: 10 } satisfies DemoMeta;
 *
 * Attached rather than exported separately so each file's ONLY export is a
 * component — which is what Vite's Fast Refresh requires to hot-update a module.
 * A second, non-component export makes it bail out to a full page reload.
 */
export type DemoComponent = ComponentType & { demo: DemoMeta };

/** A resolved registry entry: the metadata plus the component to render. */
export interface Demo extends DemoMeta {
  Component: ComponentType;
}
