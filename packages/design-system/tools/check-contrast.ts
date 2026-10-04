/**
 * Standalone accessibility report: every WCAG pairing in the contract, per
 * preset and mode, with measured ratios. `npm run check:contrast`.
 *
 * It measures nothing of its own. `measureColors` is the list the build gate
 * fails on, and every count printed here is counted from that list — so this
 * cannot claim a pairing it did not measure. (It once carried its own loop,
 * skipped the two scrim pairs, and printed RULES.length all the same.) The
 * CLI's `sorbet contrast` and the scaffold's copy of this file are held to the
 * same list by test-contrast.ts.
 *
 * It decides nothing of its own either. Each preset and mode is measured
 * against the contract the preset declares for it (`contractOf`), never one
 * named here. A declaration that is missing or mistyped is a TypeError that
 * ends the run before anything is printed, not a preset quietly judged by some
 * other contract.
 */

import { styleText } from "node:util";

import { contractOf, measureColors, presets, ratioText, tally } from "../src/tokens/index.ts";

import type { Mode } from "../src/tokens/index.ts";

const MODES: Mode[] = ["light", "dark"];

// Every declaration is read before a line is printed: a preset that does not
// say which contract it is held to ends the run here, with no verdict above
// the error for a reader to stop at.
for (const preset of Object.values(presets)) {
  for (const mode of MODES) {
    contractOf(preset, mode);
  }
}

let failures = 0;
let measured = 0;

for (const preset of Object.values(presets)) {
  console.log(styleText("bold", `\n${preset.label} — ${preset.tagline}`));
  for (const mode of MODES) {
    const result = tally(measureColors(mode, preset.colors[mode], contractOf(preset, mode)));
    failures += result.failures.length;
    measured += result.measured;
    const rows = result.failures.map((pair) => {
      const found = pair.actual === null ? `could not be measured (needs ${pair.min})` : `${ratioText(pair.actual, pair.min)} < ${pair.min}`;
      return styleText("red", `    ✗ ${pair.fg} on ${pair.bg}: ${found}`);
    });
    const unmeasurable = result.unmeasurable > 0 ? `, ${result.unmeasurable} could not be measured` : "";
    const summary =
      rows.length === 0
        ? styleText("green", `all ${result.measured} pairings pass (tightest margin ×${result.tightest.toFixed(2)})`)
        : styleText("red", `${rows.length} failing (${result.measured} measured${unmeasurable})`);
    console.log(`  ${mode.padEnd(5)} ${summary}`);
    for (const row of rows) {
      console.log(row);
    }
  }
}

if (failures > 0) {
  console.error(styleText("red", `\n✗ ${failures} contrast failure(s)`));
  process.exit(1);
}
// No presets, so no pairs: "holds for every preset" would be true of nothing.
if (measured === 0) {
  console.error(styleText("red", "\n✗ nothing was measured: there are no presets"));
  process.exit(1);
}
console.log(styleText("green", `\n✓ WCAG AA contract holds for every preset in both modes (${measured} pairings measured)`));
