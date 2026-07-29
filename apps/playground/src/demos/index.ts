import type { Demo, DemoLayer } from "./types.ts";

export type { Demo, DemoLayer };

/**
 * Zero-touch registration: every `./*.tsx` in this folder that exports a `demo`
 * is picked up automatically (Vite's import.meta.glob, resolved at build time).
 *
 * That's deliberate — adding a demo is a NEW FILE and nothing else. There's no
 * shared list to edit, so two branches adding demos in parallel never conflict.
 * Position comes from each demo's own `order`, not from a central array.
 */
const modules = import.meta.glob<{ demo?: Demo }>("./*.tsx", { eager: true });

export const demos: Demo[] = Object.values(modules)
  .flatMap((m) => (m.demo ? [m.demo] : []))
  // Ties (two branches picking the same order) fall back to the title so the
  // rendered order stays stable rather than depending on glob iteration.
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

export function demosFor(layer: DemoLayer): Demo[] {
  return demos.filter((d) => d.layer === layer);
}
