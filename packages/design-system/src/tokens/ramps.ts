/**
 * Primitive color ramps.
 *
 * Every hue is generated from the same OKLCH lightness curve, so step 600 of
 * any ramp has (near) identical perceived lightness — swapping hues between
 * presets never silently changes contrast behavior.
 */

import { oklchToHex, type Hex } from "./color.ts";

export const RAMP_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type RampStep = (typeof RAMP_STEPS)[number];
export type Ramp = Record<RampStep, Hex>;

/** Perceptual lightness per step — tuned so 600+ carries white text at ≥4.5:1. */
const LIGHTNESS: Record<RampStep, number> = {
  50: 0.977,
  100: 0.951,
  200: 0.906,
  300: 0.849,
  400: 0.766,
  500: 0.665,
  600: 0.552,
  700: 0.47,
  800: 0.397,
  900: 0.327,
  950: 0.258,
};

/** Chroma multiplier per step: pastel at the ends, vivid in the middle. */
const CHROMA_CURVE: Record<RampStep, number> = {
  50: 0.18,
  100: 0.34,
  200: 0.56,
  300: 0.78,
  400: 0.94,
  500: 1,
  600: 1,
  700: 0.92,
  800: 0.8,
  900: 0.66,
  950: 0.52,
};

export interface RampSpec {
  /** OKLCH hue angle */
  hue: number;
  /** peak chroma at steps 500–600 */
  chroma: number;
  /** optional hue rotation from lightest to darkest step */
  drift?: number;
}

export function makeRamp({ hue, chroma, drift = 0 }: RampSpec): Ramp {
  const entries = RAMP_STEPS.map((step, i) => {
    const t = i / (RAMP_STEPS.length - 1);
    return [
      step,
      oklchToHex({
        l: LIGHTNESS[step],
        c: chroma * CHROMA_CURVE[step],
        h: hue + drift * t,
      }),
    ];
  });
  return Object.fromEntries(entries) as Ramp;
}

const specs = {
  // chromatic
  red: { hue: 25, chroma: 0.195 },
  coral: { hue: 45, chroma: 0.175, drift: -6 },
  amber: { hue: 75, chroma: 0.165, drift: -8 },
  lemon: { hue: 98, chroma: 0.17, drift: -10 },
  lime: { hue: 128, chroma: 0.185 },
  green: { hue: 152, chroma: 0.16 },
  teal: { hue: 176, chroma: 0.14 },
  cyan: { hue: 215, chroma: 0.135 },
  blue: { hue: 255, chroma: 0.175 },
  indigo: { hue: 275, chroma: 0.185 },
  violet: { hue: 296, chroma: 0.2 },
  grape: { hue: 320, chroma: 0.2 },
  fuchsia: { hue: 336, chroma: 0.21 },
  raspberry: { hue: 356, chroma: 0.2 },
  // neutrals (tinted grays)
  gray: { hue: 260, chroma: 0.008 },
  slate: { hue: 257, chroma: 0.024 },
  sand: { hue: 78, chroma: 0.016 },
  mauve: { hue: 345, chroma: 0.014 },
} satisfies Record<string, RampSpec>;

export type RampName = keyof typeof specs;

export const ramps: Record<RampName, Ramp> = Object.fromEntries(
  Object.entries(specs).map(([name, spec]) => [name, makeRamp(spec)]),
) as Record<RampName, Ramp>;

export const NEUTRAL_RAMPS = ["gray", "slate", "sand", "mauve"] as const satisfies readonly RampName[];
