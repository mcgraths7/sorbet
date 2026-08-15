/**
 * The CVD gate the chart-palette comments always claimed: adjacent chart slots
 * must stay distinguishable under the two common dichromacies. `npm run
 * check:cvd` for the report; build-tokens invokes it as part of the build, so
 * reordering slots — the order is the CVD guarantee — or shifting a ramp under
 * a slot fails loudly instead of silently un-validating the palette.
 *
 * Method (documented so the numbers are reproducible, which is the entire
 * point — the previous numbers lived only in comments):
 *   hex → linear sRGB → Machado et al. 2009 severity-1.0 simulation for
 *   protanopia and deuteranopia → OKLab → Euclidean ΔE × 100 between each
 *   ADJACENT slot pair. The per-preset/mode minimum over both deficiencies is
 *   asserted against the floors below.
 *
 * Floors are this tool's own first-run minima, rounded down to one decimal:
 * regression baselines, not aspirations. Raising a palette's separation may
 * raise its floor; lowering one below its floor is a build failure and a
 * deliberate design decision, in that order.
 */

import { styleText } from "node:util";

import { chartColors, chartThemes } from "../src/tokens/charts.ts";
import { hexToRgb } from "../src/tokens/color.ts";

type Mode = "light" | "dark";
type Deficiency = "protanopia" | "deuteranopia";

// Machado, Oliveira & Fernandes (2009), severity 1.0, applied in linear RGB.
const MACHADO: Record<Deficiency, number[][]> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
};

/** Per-preset/mode floors: min adjacent ΔE over both deficiencies. */
const FLOORS: Record<string, Record<Mode, number>> = {
  sorbet: { light: 14.6, dark: 14.9 },
  ocean: { light: 11.6, dark: 5.8 },
  forest: { light: 10.0, dark: 3.9 },
  noir: { light: 11.6, dark: 5.8 },
  midnight: { light: 3.9, dark: 5.8 },
};

const linearize = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function simulate(rgb: [number, number, number], d: Deficiency): [number, number, number] {
  const m = MACHADO[d];
  return [0, 1, 2].map((i) =>
    Math.min(1, Math.max(0, m[i]![0]! * rgb[0] + m[i]![1]! * rgb[1] + m[i]![2]! * rgb[2])),
  ) as [number, number, number];
}

/** Linear sRGB → OKLab (Ottosson). */
function oklab([r, g, b]: [number, number, number]): [number, number, number] {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function cvdDeltaE(hexA: string, hexB: string, d: Deficiency): number {
  const lin = (hex: string): [number, number, number] => {
    const { r, g, b } = hexToRgb(hex);
    return [linearize(r / 255), linearize(g / 255), linearize(b / 255)];
  };
  const a = oklab(simulate(lin(hexA), d));
  const b = oklab(simulate(lin(hexB), d));
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * 100;
}

export interface CvdFailure {
  preset: string;
  mode: Mode;
  min: number;
  floor: number;
  worstPair: string;
}

export function checkCvd(report = false): CvdFailure[] {
  const failures: CvdFailure[] = [];
  for (const [preset, theme] of Object.entries(chartThemes)) {
    for (const mode of ["light", "dark"] as Mode[]) {
      const colors = chartColors(theme, mode);
      let min = Infinity;
      let worstPair = "";
      for (let i = 0; i < colors.length - 1; i++) {
        for (const d of ["protanopia", "deuteranopia"] as Deficiency[]) {
          const dE = cvdDeltaE(colors[i]!, colors[i + 1]!, d);
          if (dE < min) {
            min = dE;
            worstPair = `slots ${i + 1}–${i + 2} (${d})`;
          }
        }
      }
      const floor = FLOORS[preset]![mode];
      if (report) {
        console.log(`  ${preset.padEnd(9)} ${mode.padEnd(6)} min adjacent ΔE ${min.toFixed(1)}  (floor ${floor}, worst ${worstPair})`);
      }
      if (min < floor) {
        failures.push({ preset, mode, min, floor, worstPair });
      }
    }
  }
  return failures;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log(styleText("bold", "adjacent-slot CVD separation (Machado 1.0, OKLab ΔE×100):"));
  const failures = checkCvd(true);
  if (failures.length > 0) {
    for (const f of failures) {
      console.error(styleText("red", `✗ ${f.preset}/${f.mode}: min ΔE ${f.min.toFixed(1)} < floor ${f.floor} at ${f.worstPair}`));
    }
    process.exit(1);
  }
  console.log(styleText("green", "✓ every adjacent pair clears its preset's floor under both dichromacies"));
}
