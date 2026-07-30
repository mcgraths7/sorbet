import type { Demo, DemoComponent, DemoLayer } from "./types.ts";

export type { Demo, DemoLayer };

/**
 * Zero-touch registration: every `./*.tsx` in this folder is scanned for a
 * component carrying `.demo` metadata (Vite's import.meta.glob, resolved at
 * build time).
 *
 * That's deliberate — adding a demo is a NEW FILE and nothing else. There's no
 * shared list to edit, so two branches adding demos in parallel never conflict.
 * Position comes from each demo's own `order`, not from a central array.
 *
 * The metadata rides on the component instead of being its own export so each
 * demo module exports only a component, which keeps Vite Fast Refresh able to
 * hot-update it (a mixed export forces a full page reload).
 */
const modules = import.meta.glob<Record<string, unknown>>("./*.tsx", { eager: true });

const isDemoComponent = (value: unknown): value is DemoComponent =>
  typeof value === "function" && "demo" in value && value.demo != null;

export const demos: Demo[] = Object.values(modules)
  .flatMap((module) => Object.values(module).filter(isDemoComponent))
  .map((Component) => ({ ...Component.demo, Component }))
  // Ties (two branches picking the same order) fall back to the title so the
  // rendered order stays stable rather than depending on glob iteration.
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

export function demosFor(layer: DemoLayer): Demo[] {
  return demos.filter((d) => d.layer === layer);
}
