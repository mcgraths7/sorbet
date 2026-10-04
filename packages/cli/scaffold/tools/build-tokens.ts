/**
 * SCAFFOLD TEMPLATE — copied into projects by `sorbet create`; the relative
 * imports resolve in the scaffolded layout, not here.
 *
 * Verifies the WCAG AA contract, then generates theme CSS + Sass token maps.
 * A palette that fails contrast fails the build — and writes nothing: the
 * check runs on the presets before any file is written, so a failed build
 * cannot leave a freshly written theme behind for something to copy.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { styleText } from "node:util";
import { generatedScss, manifest, themeCss } from "../tokens/emit.ts";
import { presets } from "../tokens/presets.ts";
import { checkPreset, ratioText } from "../tokens/rules.ts";

const root = join(import.meta.dirname, "..", "..");
// Theme output dir is overridable: `node src/tools/build-tokens.ts public/themes`
const outArg = process.argv[2] ?? join("dist", "themes");
const themesDir = join(root, outArg);

const failures = Object.values(presets).flatMap(checkPreset);
if (failures.length > 0) {
  console.error(styleText("red", `\n✗ ${failures.length} contrast failure(s):`));
  for (const f of failures) {
    const found = f.actual === null ? "could not be measured" : `= ${ratioText(f.actual, f.min)}`;
    console.error(`  ${f.preset}/${f.mode}: ${f.fg} on ${f.bg} ${found} (needs ${f.min})`);
  }
  console.error(styleText("red", "\n✗ nothing was written"));
  process.exit(1);
}
// No presets, so no pairs: "holds for 0 presets" would be true of nothing.
if (Object.keys(presets).length === 0) {
  console.error(styleText("red", "\n✗ the contrast contract measured nothing: there are no presets\n✗ nothing was written"));
  process.exit(1);
}
console.log(styleText("green", `✓ contrast contract holds for ${Object.keys(presets).length} presets × 2 modes`));

await mkdir(themesDir, { recursive: true });

for (const preset of Object.values(presets)) {
  await writeFile(join(themesDir, `${preset.name}.css`), themeCss(preset));
  console.log(`${styleText("green", "✓")} ${outArg}/${preset.name}.css`);
}
await writeFile(join(themesDir, "manifest.json"), manifest(presets));
await writeFile(join(root, "src", "styles", "abstracts", "_generated.scss"), generatedScss());
console.log(`${styleText("green", "✓")} src/styles/abstracts/_generated.scss`);
