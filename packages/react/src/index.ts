/**
 * @sorbet/react — the whole design system in one import.
 *
 * A pure re-export barrel: every component layer plus the theming service
 * from @sorbet/core. Nothing is defined here — cherry-pick the layer
 * packages (@sorbet/atoms, @sorbet/molecules, …) whenever you'd rather
 * import by tier. Remember to import the stylesheet once:
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
export * from "@sorbet/charts";
