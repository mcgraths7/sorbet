/**
 * Chart color tokens.
 *
 * Series identity uses an 8-slot categorical palette with a FIXED order per
 * preset — the order is the color-vision-deficiency safety mechanism, chosen
 * so adjacent slots stay separable under protanopia/deuteranopia (validated
 * with a Machado-2009 ΔE simulation during development; slot orders and steps
 * below are the passing result). Assign slots in sequence, never cycled; a
 * 9th series folds into "Other" (chart-muted).
 *
 * Each mode picks its own ramp steps: light mode needs darker steps to hold
 * ≥3:1 against white-ish surfaces; dark mode sits in a narrower lightness
 * band (~0.48–0.67 OKLCH L) so marks neither glare nor sink.
 */

import type { Ramp, RampName, RampStep } from "./ramps.ts";
import { ramps } from "./ramps.ts";

export interface ChartSlot {
  ramp: RampName;
  light: RampStep;
  dark: RampStep;
}

export type ChartTheme = [ChartSlot, ChartSlot, ChartSlot, ChartSlot, ChartSlot, ChartSlot, ChartSlot, ChartSlot];

const slot = (ramp: RampName, light: RampStep, dark: RampStep): ChartSlot => ({ ramp, light, dark });

/**
 * Slot orders are brand-led (slot 1 = the preset's lead hue family) and then
 * optimized: candidate orders were run through the six-checks validator and
 * the order maximizing the minimum adjacent CVD ΔE was kept.
 */
export const chartThemes: { [name in "sorbet" | "ocean" | "forest" | "noir" | "midnight"]: ChartTheme } = {
  sorbet: [
    // Validated (six checks, both modes): worst adjacent CVD ΔE 38.6 light / 38.7 dark.
    slot("raspberry", 600, 500),
    slot("blue", 600, 500),
    slot("amber", 600, 500),
    slot("teal", 600, 600),
    slot("indigo", 700, 500),
    slot("coral", 600, 500),
    slot("grape", 600, 500),
    slot("green", 700, 600),
  ],
  // Validated: worst adjacent CVD ΔE 34.0 light / 26.2 dark.
  ocean: [
    slot("blue", 600, 500),
    slot("teal", 600, 600),
    slot("amber", 500, 500),
    slot("green", 700, 600),
    slot("violet", 600, 500),
    slot("red", 600, 500),
    slot("fuchsia", 500, 600),
    slot("coral", 700, 500),
  ],
  // Validated: worst adjacent CVD ΔE 22.4 light / 14.7 dark.
  forest: [
    slot("green", 600, 500),
    slot("violet", 600, 500),
    slot("amber", 600, 500),
    slot("teal", 600, 600),
    slot("red", 600, 500),
    slot("blue", 600, 600),
    slot("coral", 700, 500),
    slot("grape", 600, 600),
  ],
  // Same theme as ocean (validated identically) — noir keeps hue for data.
  noir: [
    slot("blue", 600, 500),
    slot("teal", 600, 600),
    slot("amber", 500, 500),
    slot("green", 700, 600),
    slot("violet", 600, 500),
    slot("red", 600, 500),
    slot("fuchsia", 500, 600),
    slot("coral", 700, 500),
  ],
  // Validated: worst adjacent CVD ΔE 20.6 light / 26.2 dark.
  midnight: [
    slot("violet", 600, 500),
    slot("teal", 600, 600),
    slot("amber", 600, 500),
    slot("green", 700, 600),
    slot("blue", 600, 500),
    slot("red", 600, 500),
    slot("fuchsia", 600, 600),
    slot("coral", 700, 500),
  ],
};

export function chartColors(theme: ChartTheme, mode: "light" | "dark"): string[] {
  return theme.map(({ ramp, light, dark }) => ramps[ramp][mode === "light" ? light : dark]);
}

/** De-emphasis / "Other" series color, from the preset's neutral ramp. */
export function chartMuted(neutral: Ramp, mode: "light" | "dark"): string {
  return mode === "light" ? neutral[400] : neutral[500];
}
