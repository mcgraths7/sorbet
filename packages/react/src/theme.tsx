import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    const stored = localStorage.getItem(storageKey);
    return stored === "light" || stored === "dark" ? stored : "system";
  });

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
      localStorage.removeItem(storageKey);
    } else {
      root.dataset.theme = mode;
      localStorage.setItem(storageKey, mode);
    }
  }, [mode, storageKey]);

  const set = useCallback((next: ThemeMode) => setMode(next), []);
  const toggle = useCallback(() => {
    setMode((prev) => {
      const current = prev === "system" ? (window.matchMedia(query).matches ? "dark" : "light") : prev;
      return current === "dark" ? "light" : "dark";
    });
  }, []);

  const value = useMemo(() => ({ mode, resolved, set, toggle }), [mode, resolved, set, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
