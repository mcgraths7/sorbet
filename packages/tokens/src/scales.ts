/**
 * Non-color scales. These are identical across presets (except radius, which
 * each preset picks a personality for) and are emitted once into the compiled
 * stylesheet as custom properties.
 */

export const space = {
  "0": "0",
  px: "1px",
  "1": "0.25rem",
  "2": "0.5rem",
  "3": "0.75rem",
  "4": "1rem",
  "5": "1.25rem",
  "6": "1.5rem",
  "8": "2rem",
  "10": "2.5rem",
  "12": "3rem",
  "16": "4rem",
  "20": "5rem",
  "24": "6rem",
  "32": "8rem",
} as const;

/** Fluid at the display end: clamp() scales headings with the viewport. */
export const fontSize = {
  xs: "0.75rem",
  sm: "0.875rem",
  md: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
  "2xl": "clamp(1.5rem, 1.32rem + 0.9vw, 1.875rem)",
  "3xl": "clamp(1.875rem, 1.56rem + 1.6vw, 2.5rem)",
  "4xl": "clamp(2.25rem, 1.8rem + 2.25vw, 3.25rem)",
  "5xl": "clamp(2.75rem, 2rem + 3.75vw, 4.25rem)",
} as const;

export const lineHeight = {
  tight: "1.15",
  snug: "1.3",
  normal: "1.5",
  relaxed: "1.65",
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  black: "800",
} as const;

export const tracking = {
  tight: "-0.02em",
  normal: "0",
  wide: "0.04em",
  wider: "0.08em",
} as const;

/** Radius personalities — presets choose one. `full` is always pill-shaped. */
export const radiusStyles = {
  sharp: { xs: "0.125rem", sm: "0.1875rem", md: "0.25rem", lg: "0.375rem", xl: "0.5rem" },
  soft: { xs: "0.25rem", sm: "0.375rem", md: "0.5rem", lg: "0.75rem", xl: "1.25rem" },
  round: { xs: "0.375rem", sm: "0.625rem", md: "0.875rem", lg: "1.25rem", xl: "1.75rem" },
} as const;

export type RadiusStyle = keyof typeof radiusStyles;

export const motion = {
  "duration-fast": "120ms",
  "duration-base": "200ms",
  "duration-slow": "320ms",
  "duration-slower": "500ms",
  "ease-out": "cubic-bezier(0.22, 1, 0.36, 1)",
  "ease-in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
  "ease-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export const zIndex = {
  "z-dropdown": "1000",
  "z-sticky": "1100",
  "z-overlay": "1200",
  "z-modal": "1300",
  "z-popover": "1400",
  "z-toast": "1500",
  "z-tooltip": "1600",
} as const;

/** Sass-side too: media queries can't read custom properties. */
export const breakpoints = {
  sm: "40em",
  md: "48em",
  lg: "64em",
  xl: "80em",
  "2xl": "96em",
} as const;

export const containers = {
  sm: "40rem",
  md: "48rem",
  lg: "64rem",
  xl: "80rem",
} as const;

export const misc = {
  "measure": "65ch",
  "focus-ring-width": "3px",
  "border-width": "1px",
  "control-height-sm": "2rem",
  "control-height-md": "2.5rem",
  "control-height-lg": "3rem",
} as const;
