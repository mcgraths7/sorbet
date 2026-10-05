/**
 * SCAFFOLD TEMPLATE — copied into projects by `sorbet create`; the relative
 * imports resolve in the scaffolded layout, not here.
 *
 * Verifies the contract each preset declares, then generates theme CSS +
 * Sass token maps. A palette that fails its contract fails the build — and
 * writes nothing: the check runs on the presets before any file is written,
 * so a failed build cannot leave a freshly written theme behind for something
 * to copy.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { styleText } from "node:util";
import { generatedScss, manifest, themeCss } from "../tokens/emit.ts";
import { contracts, METRIC_WORD } from "../tokens/contracts.ts";
import { presets } from "../tokens/presets.ts";
import { checkPreset, checkStructure, contractOf, declaredContracts, ratioText, type Failure } from "../tokens/rules.ts";

const root = join(import.meta.dirname, "..", "..");
// Theme output dir is overridable: `node src/tools/build-tokens.ts public/themes`
const outArg = process.argv[2] ?? join("dist", "themes");
const themesDir = join(root, outArg);

// The contract each preset declares: its measurement (checkPreset) and its
// true-or-false checks (checkStructure). Under each preset-mode's failures,
// each failing tier's `why` and `retire` are printed once. Structure failures
// are counted on their own line, never in the contrast count.
const all = Object.values(presets);
const failures = all.flatMap(checkPreset);
const structure = all.flatMap(checkStructure);
const row = (f: Failure): string => {
  const word = METRIC_WORD[f.metric];
  if (f.actual === null) {
    return `could not be measured (needs ${word === "" ? "" : `${word} `}${f.min})`;
  }
  return f.metric === "ratio" ? `= ${ratioText(f.actual, f.min)} (needs ${f.min})` : `= ${word} ${ratioText(f.actual, f.min)} (needs ${f.min}, ${f.view} view)`;
};
if (failures.length > 0) {
  console.error(styleText("red", `\n✗ ${failures.length} contrast failure(s):`));
  for (const preset of all) {
    for (const mode of ["light", "dark"] as const) {
      const here = failures.filter((f) => f.preset === preset.name && f.mode === mode);
      for (const f of here) console.error(`  ${f.preset}/${f.mode}: ${f.fg} on ${f.bg} ${row(f)}`);
      for (const tier of new Set(here.map((f) => f.tier))) {
        const { why, retire } = contracts[contractOf(preset, mode)].tiers[tier]!;
        console.error(`      why (${tier}): ${why}`);
        console.error(`      retire (${tier}): ${retire}`);
      }
    }
  }
}
if (structure.length > 0) {
  console.error(styleText("red", `\n✗ ${structure.length} structure failure(s):`));
  for (const failure of structure) console.error(`  ${failure.preset}/${failure.mode}: ${failure.check}: ${failure.detail}`);
}
if (failures.length > 0 || structure.length > 0) {
  console.error(styleText("red", "\n✗ nothing was written"));
  process.exit(1);
}
// No presets, so no pairs: "holds for 0 presets" would be true of nothing.
if (all.length === 0) {
  console.error(styleText("red", "\n✗ the contrast contract measured nothing: there are no presets\n✗ nothing was written"));
  process.exit(1);
}
console.log(styleText("green", `✓ every preset holds the contract it declares: ${declaredContracts(all)}`));

await mkdir(themesDir, { recursive: true });

for (const preset of Object.values(presets)) {
  await writeFile(join(themesDir, `${preset.name}.css`), themeCss(preset));
  console.log(`${styleText("green", "✓")} ${outArg}/${preset.name}.css`);
}
await writeFile(join(themesDir, "manifest.json"), manifest(presets));
await writeFile(join(root, "src", "styles", "abstracts", "_generated.scss"), generatedScss());
console.log(`${styleText("green", "✓")} src/styles/abstracts/_generated.scss`);
