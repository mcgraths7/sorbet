import { useSyncExternalStore } from "react";

/** The platform never changes at runtime, so there's nothing to subscribe to. */
const subscribeNever = () => () => {};

const isApplePlatformNow = () =>
  typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);

export interface ModifierKey {
  /** True on Apple platforms, where the shortcut modifier is ⌘ (`metaKey`). */
  isApple: boolean;
  /** Label to show in a shortcut hint: `⌘` or `Ctrl`. */
  label: string;
  /** The name `aria-keyshortcuts` expects: `Meta` or `Control`. */
  ariaName: string;
}

/**
 * The platform's shortcut modifier — for matching (`metaKey` vs `ctrlKey`) and
 * for display (`⌘` vs `Ctrl`).
 *
 * Read through `useSyncExternalStore` rather than during render: a server render
 * reports the non-Apple default and the client adopts the real answer on
 * hydration, so there's no mismatch and no effect needed.
 */
export function useModifierKey(): ModifierKey {
  const isApple = useSyncExternalStore(subscribeNever, isApplePlatformNow, () => false);
  return {
    isApple,
    label: isApple ? "⌘" : "Ctrl",
    ariaName: isApple ? "Meta" : "Control",
  };
}
