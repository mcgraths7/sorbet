/**
 * @sorbet/react — the whole design system for React apps.
 *
 * Everything here is re-exported from the layer packages; install this one
 * package, or cherry-pick @sorbet/atoms, @sorbet/molecules, … individually.
 * Remember to import the stylesheet once:
 *
 *   import "@sorbet/styles/css";
 *   import "@sorbet/styles/themes/sorbet.css";
 */

export * from "@sorbet/core";
export * from "@sorbet/layout";
export * from "@sorbet/atoms";
export * from "@sorbet/molecules";
export * from "@sorbet/organisms";
export * from "@sorbet/templates";
export { ThemeProvider, useTheme, type ThemeContextValue, type ThemeMode, type ThemeProviderProps } from "./theme.tsx";
export * from "@sorbet/charts";
