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
 */

import { styleText } from "node:util";

import { measureColors, presets, ratioText, tally } from "../src/tokens/index.ts";

import type { Mode } from "../src/tokens/index.ts";

let failures = 0;
let measured = 0;

for (const preset of Object.values(presets)) {
  console.log(styleText("bold", `\n${preset.label} — ${preset.tagline}`));
  for (const mode of ["light", "dark"] as Mode[]) {
    const result = tally(measureColors(mode, preset.colors[mode]));
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
