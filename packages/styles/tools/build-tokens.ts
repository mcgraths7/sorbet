/**
 * Generate theme CSS + the Sass token maps from @sorbet/tokens, then verify
 * the accessibility contract. A preset that fails WCAG AA fails the build —
 * inaccessible themes are unrepresentable.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { styleText } from "node:util";
import { checkPreset, generatedScss, manifest, presets, themeCss } from "@sorbet/tokens";

const pkgRoot = join(import.meta.dirname, "..");
const themesDir = join(pkgRoot, "dist", "themes");

await mkdir(themesDir, { recursive: true });

for (const preset of Object.values(presets)) {
  await writeFile(join(themesDir, `${preset.name}.css`), themeCss(preset));
  console.log(`${styleText("green", "✓")} dist/themes/${preset.name}.css`);
}
await writeFile(join(themesDir, "manifest.json"), manifest(presets));
await writeFile(join(pkgRoot, "src", "abstracts", "_generated.scss"), generatedScss());
console.log(`${styleText("green", "✓")} dist/themes/manifest.json`);
console.log(`${styleText("green", "✓")} src/abstracts/_generated.scss`);

const failures = Object.values(presets).flatMap(checkPreset);
if (failures.length > 0) {
  console.error(styleText("red", `\n✗ ${failures.length} contrast failure(s):`));
  for (const f of failures) {
    console.error(`  ${f.preset}/${f.mode}: ${f.fg} on ${f.bg} = ${f.actual.toFixed(2)} (needs ${f.min})`);
  }
  process.exit(1);
}
console.log(styleText("green", `✓ contrast contract holds for ${Object.keys(presets).length} presets × 2 modes`));
