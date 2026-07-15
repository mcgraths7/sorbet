/**
 * Dark-mode management. Three states: explicit light, explicit dark, or
 * follow-the-OS. Explicit choices persist; "system" tracks the media query
 * live. The stylesheet reacts to `data-theme` on <html> (see theme CSS).
 */

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "sb-theme";

export class ThemeManager {
  #media = window.matchMedia("(prefers-color-scheme: dark)");

  constructor() {
    this.#apply();
    this.#media.addEventListener("change", () => {
      if (this.mode === "system") this.#notify();
    });
  }

  get mode(): ThemeMode {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  }

  /** The mode actually rendering right now. */
  get resolved(): "light" | "dark" {
    if (this.mode === "system") return this.#media.matches ? "dark" : "light";
    return this.mode;
  }

  set(mode: ThemeMode): void {
    if (mode === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, mode);
    this.#apply();
  }

  /** Flip between light and dark relative to what the user currently sees. */
  toggle(): "light" | "dark" {
    const next = this.resolved === "dark" ? "light" : "dark";
    this.set(next);
    return next;
  }

  #apply(): void {
    const root = document.documentElement;
    if (this.mode === "system") delete root.dataset.theme;
    else root.dataset.theme = this.mode;
    this.#notify();
  }

  #notify(): void {
    document.dispatchEvent(
      new CustomEvent<{ mode: ThemeMode; resolved: "light" | "dark" }>("sb:theme", {
        detail: { mode: this.mode, resolved: this.resolved },
      }),
    );
  }
}

let instance: ThemeManager | undefined;

export function getTheme(): ThemeManager {
  return (instance ??= new ThemeManager());
}
