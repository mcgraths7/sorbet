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
      if (typeof ref === "function") ref(node);
      else if (ref != null) (ref as { current: T | null }).current = node;
    }
  };
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
