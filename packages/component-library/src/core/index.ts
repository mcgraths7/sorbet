/**
 * @sorbet/core — shared plumbing for the Sorbet React packages.
 * No components live here; only the pieces every layer needs.
 */

import type { ComponentPropsWithRef, ElementType, Ref } from "react";

/** Join class names, skipping falsy values. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Status tones, matching the semantic token roles. */
export type Tone = "success" | "warning" | "danger" | "info";

/** Brand tones. */
export type BrandTone = "primary" | "secondary" | "accent";

/** Control sizing shared by buttons and inputs. */
export type Size = "sm" | "md" | "lg";

/**
 * Props for a polymorphic component: its own props plus everything the
 * rendered element accepts. `as` swaps the underlying element:
 *   <Stack as="section">…
 */
export type PolymorphicProps<E extends ElementType, OwnProps> = OwnProps &
  Omit<ComponentPropsWithRef<E>, keyof OwnProps | "as"> & { as?: E };

/** Compose multiple refs onto one element (React 19 ref-as-prop friendly). */
export function composeRefs<T>(...refs: Array<Ref<T> | undefined>): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref != null) {
        (ref as { current: T | null }).current = node;
      }
    }
  };
}

/** Chain event handlers into one — each runs in order, `undefined` skipped. Lets
 *  a cloned trigger keep its own handler while we add ours. */
export function chain<A extends unknown[]>(...fns: Array<((...args: A) => void) | undefined>): (...args: A) => void {
  return (...args) => {
    for (const fn of fns) {
      fn?.(...args);
    }
  };
}

/**
 * Next index for roving-focus keyboard nav over a list: Arrow keys (wrapping at
 * the ends), Home, End. Returns `null` when `key` isn't a navigation key so the
 * caller can ignore it. `orientation` gates which arrows move — "vertical" =
 * Up/Down, "horizontal" = Left/Right, "both" = all four.
 */
export function rovingIndex(
  key: string,
  current: number,
  length: number,
  orientation: "vertical" | "horizontal" | "both" = "both",
): number | null {
  if (length === 0) {
    return null;
  }
  const vertical = orientation !== "horizontal";
  const horizontal = orientation !== "vertical";
  if ((vertical && key === "ArrowDown") || (horizontal && key === "ArrowRight")) {
    return (current + 1) % length;
  }
  if ((vertical && key === "ArrowUp") || (horizontal && key === "ArrowLeft")) {
    return current <= 0 ? length - 1 : current - 1;
  }
  if (key === "Home") {
    return 0;
  }
  if (key === "End") {
    return length - 1;
  }
  return null;
}

// Theming is a framework service, not a component layer — it lives here so
// cherry-picked layer packages get dark mode without the umbrella.
export {
  ThemeProvider,
  useTheme,
  type ThemeContextValue,
  type ThemeMode,
  type ThemeProviderProps,
} from "./theme.tsx";

// Popover plumbing — shared by every top-layer flyout (atoms + molecules).
export {
  positionPopover,
  usePopover,
  type PopoverPlacement,
  type UsePopoverOptions,
  type UsePopoverResult,
} from "./use-popover.ts";

// Controlled/uncontrolled state — the value/defaultValue/onChange trio.
export { useControllableState } from "./use-controllable-state.ts";
