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
 * The measurement itself is `separation` in src/tokens/color.ts, asked for one
 * view at a time. This file used to carry its own copy of the simulation and
 * of the OKLab conversion; a second copy is how this gate and a contract that
 * measures the same thing would come to disagree about one colour. What stays
 * here is what is this gate's own: which views it checks, under which names it
 * prints them, and the floors.
 *
 * Floors are this tool's own first-run minima, rounded down to one decimal:
 * regression baselines, not aspirations. Raising a palette's separation may
 * raise its floor; lowering one below its floor is a build failure and a
 * deliberate design decision, in that order.
 */

import { styleText } from "node:util";

import { chartColors, chartThemes } from "../src/tokens/charts.ts";
import { separation, type CvdKind } from "../src/tokens/color.ts";

type Mode = "light" | "dark";
type Deficiency = "protanopia" | "deuteranopia";

/**
 * The two views this gate checks, under the names it has always printed, each
 * mapped to the shared instrument's name for it. Tritanopia is not here: the
 * floors below were never measured under it.
 */
const VIEW: Record<Deficiency, CvdKind> = {
  protanopia: "protan",
  deuteranopia: "deutan",
};

/** Per-preset/mode floors: min adjacent ΔE over both deficiencies. */
const FLOORS: Record<string, Record<Mode, number>> = {
  sorbet: { light: 14.6, dark: 14.9 },
  ocean: { light: 11.6, dark: 5.8 },
  forest: { light: 10.0, dark: 3.9 },
  noir: { light: 11.6, dark: 5.8 },
  midnight: { light: 3.9, dark: 5.8 },
};

/**
 * How far apart two colours look under one deficiency: `separation` with that
 * view. Two things are errors here and not numbers. A deficiency this gate has
 * no view for: `separation` with no view at all is the UNSIMULATED distance —
 * what full colour vision sees, which is not what a floor here was measured
 * against. And a colour that cannot be read: a chart slot that is not a colour
 * has no distance to pass a floor with.
 */
export function cvdDeltaE(hexA: string, hexB: string, d: Deficiency): number {
  if (!Object.hasOwn(VIEW, d)) {
    throw new TypeError(`cvdDeltaE: this gate checks ${Object.keys(VIEW).join(" and ")}, not ${JSON.stringify(d) ?? String(d)}`);
  }
  const dE = separation(hexA, hexB, VIEW[d]);
  if (dE === null) {
    throw new Error(`Expected two opaque colours, got "${hexA}" and "${hexB}"`);
  }
  return dE;
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

// import.meta.main: comparing process.argv[1] with this file's URL is false for
// a path with a space or a symlink in it, and the report then prints nothing.
if (import.meta.main) {
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
