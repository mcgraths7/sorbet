/**
 * SCAFFOLD TEMPLATE — copied into projects by `sorbet create`; the relative
 * imports resolve in the scaffolded layout, not here.
 *
 * Standalone accessibility report: every pairing each preset's contract
 * holds, per preset and mode, with what it measured.
 *
 * It measures nothing of its own. `measurePreset` is the list the build gate
 * (build-tokens.ts) fails on, and every count printed here is counted from
 * that list — so the report and the gate cannot disagree about what was
 * measured, the pairs over the translucent scrim included.
 *
 * It decides nothing of its own either. Each preset and mode is measured
 * against the contract the preset declares for it (`contractOf`, inside
 * `measurePreset`), never one named here, and each mode's line says which
 * contract that is and how many of the rules that apply it leaves unheld. A
 * declaration that is missing or mistyped is a TypeError that ends the run
 * before anything is printed, not a preset quietly judged by some other
 * contract. The contract's true-or-false checks (`checkStructure`) are run
 * and printed beside the measurement, and fail the run the same way.
 */

import { styleText } from "node:util";

import { contracts, METRIC_WORD } from "../tokens/contracts.ts";
import { presets } from "../tokens/presets.ts";
import { applyingCount, checkStructure, contractOf, declaredContracts, measurePreset, ratioText, tally, type Measurement } from "../tokens/rules.ts";
import type { Mode } from "../tokens/semantics.ts";

const MODES: Mode[] = ["light", "dark"];

// Every declaration is read, and everything is measured, before a line is
// printed: a preset that does not say which contract it is held to ends the
// run here, with no verdict above the error for a reader to stop at.
for (const preset of Object.values(presets)) {
  for (const mode of MODES) {
    contractOf(preset, mode);
  }
}
const results = Object.values(presets).map((preset) => ({
  preset,
  structure: checkStructure(preset),
  modes: MODES.map((mode) => ({ mode, contract: contractOf(preset, mode), pairs: measurePreset(preset, mode) })),
}));

/** A failing pair as the report prints it: the metric's word, the value, the floor, and the view it failed in. */
function row(pair: Measurement): string {
  const word = METRIC_WORD[pair.metric] === "" ? "" : `${METRIC_WORD[pair.metric]} `;
  if (pair.actual === null) {
    return `could not be measured (needs ${word}${pair.min})`;
  }
  return `${word}${ratioText(pair.actual, pair.min)} < ${pair.min}${pair.metric === "ratio" ? "" : ` (${pair.view} view)`}`;
}

let failures = 0;
let structural = 0;
let measured = 0;

for (const { preset, structure, modes } of results) {
  console.log(styleText("bold", `\n${preset.label} — ${preset.tagline}`));
  for (const { mode, contract, pairs } of modes) {
    const result = tally(pairs);
    failures += result.failures.length;
    measured += result.measured;
    const unmeasurable = result.unmeasurable > 0 ? `, ${result.unmeasurable} could not be measured` : "";
    const summary =
      result.failures.length === 0
        ? styleText("green", `all ${result.measured} pairings pass (tightest margin ×${result.tightest.toFixed(2)})`)
        : styleText("red", `${result.failures.length} failing (${result.measured} measured${unmeasurable})`);
    console.log(`  ${mode.padEnd(5)} ${summary} — ${contract}; ${applyingCount(mode) - pairs.length} rules not held`);
    for (const pair of result.failures) {
      console.log(styleText("red", `    ✗ ${pair.fg} on ${pair.bg}: ${row(pair)}`));
    }
    // Each failing tier's reasons, once: a floor's reason is in front of whoever is tempted to lower it.
    for (const tier of new Set(result.failures.map((pair) => pair.tier))) {
      const { why, retire } = contracts[contract].tiers[tier]!;
      console.log(styleText("dim", `      why (${tier}): ${why}`));
      console.log(styleText("dim", `      retire (${tier}): ${retire}`));
    }
    for (const failure of structure.filter((each) => each.mode === mode)) {
      structural++;
      console.log(styleText("red", `    ✗ ${failure.check}: ${failure.detail}`));
    }
  }
}

if (failures > 0) {
  console.error(styleText("red", `\n✗ ${failures} contrast failure(s)`));
}
if (structural > 0) {
  console.error(styleText("red", `${failures > 0 ? "" : "\n"}✗ ${structural} structure failure(s)`));
}
// process.exitCode, never process.exit(): exit() drops what is still queued for
// a pipe, so a long report read through one lost its tail at random.
if (failures > 0 || structural > 0) {
  process.exitCode = 1;
} else if (measured === 0) {
  // No presets, so no pairs: "holds for every preset" would be true of nothing.
  console.error(styleText("red", "\n✗ nothing was measured: there are no presets"));
  process.exitCode = 1;
} else {
  console.log(styleText("green", `\n✓ every declared contract holds for every preset in both modes (${measured} pairings measured): ${declaredContracts(Object.values(presets))}`));
}
