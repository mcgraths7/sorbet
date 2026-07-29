import type { ComponentType } from "react";

/** The atomic-design section a demo appears under (matches the sidebar anchors). */
export type DemoLayer = "layout" | "atoms" | "molecules" | "organisms";

export interface Demo {
  /** Section heading, rendered as the <h2>. */
  title: string;
  layer: DemoLayer;
  /** Sort position within the layer. Numbered in tens so a new demo can slot
   *  between two existing ones without renumbering (and without conflicting). */
  order: number;
  /** Optional id for the <h2>, for deep links like #charts. */
  anchor?: string;
  Component: ComponentType;
}
