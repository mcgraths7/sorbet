"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeContextValue {
  /** The user's choice: explicit light/dark, or follow the OS. */
  mode: ThemeMode;
  /** What is actually rendering right now. */
  resolved: "light" | "dark";
  set: (mode: ThemeMode) => void;
  /** Flip relative to what the user currently sees. */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const query = "(prefers-color-scheme: dark)";

function subscribe(callback: () => void): () => void {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

/**
 * The stored choice is not React state — it lives in localStorage, and this
 * subscribes to it. Keeping one source of truth is what makes the value safe to
 * server render: `getServerSnapshot` answers for both the server and the
 * client's hydrating render, so the two agree, and React re-reads storage only
 * once hydration is done.
 *
 * Reading storage in a `useState` initializer instead — the obvious approach,
 * and correct in a client-only app — produces markup on the client that the
 * server could never have produced, which is a hydration mismatch.
 */
const storeListeners = new Set<() => void>();

function notifyStore(): void {
  for (const listener of storeListeners) {
    listener();
  }
}

function subscribeStore(callback: () => void): () => void {
  storeListeners.add(callback);
  // `storage` fires in the *other* tabs, so a choice made in one follows.
  window.addEventListener("storage", callback);
  return () => {
    storeListeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function readStored(storageKey: string): ThemeMode {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    // Storage can throw outright when cookies are blocked.
    return "system";
  }
}

export interface ThemeProviderProps {
  children: ReactNode;
  /** localStorage key for the explicit choice. */
  storageKey?: string;
}

/**
 * Owns dark mode: applies data-theme to <html>, persists explicit choices,
 * and tracks the OS preference live in "system" mode. The theme CSS reacts
 * to the attribute; components never re-render for color changes.
 */
export function ThemeProvider({ children, storageKey = "sb-theme" }: ThemeProviderProps) {
  // "system" for the server and for the client's hydrating render, so the two
  // agree; the stored choice arrives in the commit straight after.
  const mode = useSyncExternalStore(
    subscribeStore,
    () => readStored(storageKey),
    () => "system" as ThemeMode,
  );

  const systemDark = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );

  const resolved = mode === "system" ? (systemDark ? "dark" : "light") : mode;

  useEffect(() => {
    const root = document.documentElement;
    if (mode === "system") {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = mode;
    }
  }, [mode]);

  const set = useCallback(
    (next: ThemeMode) => {
      try {
        if (next === "system") {
          localStorage.removeItem(storageKey);
        } else {
          localStorage.setItem(storageKey, next);
        }
      } catch {
        // Blocked storage costs persistence, not the switch itself.
      }
      notifyStore();
    },
    [storageKey],
  );

  const toggle = useCallback(() => {
    const current = mode === "system" ? (window.matchMedia(query).matches ? "dark" : "light") : mode;
    set(current === "dark" ? "light" : "dark");
  }, [mode, set]);

  const value = useMemo(() => ({ mode, resolved, set, toggle }), [mode, resolved, set, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}
