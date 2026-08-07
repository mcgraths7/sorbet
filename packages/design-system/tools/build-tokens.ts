/**
 * Generate theme CSS + the Sass token maps from @sorbet/tokens, then verify
 * the accessibility contract. A preset that fails WCAG AA fails the build —
 * inaccessible themes are unrepresentable.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { styleText } from "node:util";

import { checkPreset, generatedScss, manifest, presets, themeCss } from "../src/tokens/index.ts";

const pkgRoot = join(import.meta.dirname, "..");
const themesDir = join(pkgRoot, "dist", "themes");

await mkdir(themesDir, { recursive: true });

for (const preset of Object.values(presets)) {
  await writeFile(join(themesDir, `${preset.name}.css`), themeCss(preset));
  console.log(`${styleText("green", "✓")} dist/themes/${preset.name}.css`);
}
await writeFile(join(themesDir, "manifest.json"), manifest(presets));
await writeFile(join(pkgRoot, "src", "styles", "abstracts", "_generated.scss"), generatedScss());
console.log(`${styleText("green", "✓")} dist/themes/manifest.json`);
console.log(`${styleText("green", "✓")} src/styles/abstracts/_generated.scss`);

const failures = Object.values(presets).flatMap(checkPreset);
if (failures.length > 0) {
  console.error(styleText("red", `\n✗ ${failures.length} contrast failure(s):`));
  for (const f of failures) {
    console.error(`  ${f.preset}/${f.mode}: ${f.fg} on ${f.bg} = ${f.actual.toFixed(2)} (needs ${f.min})`);
  }
  process.exit(1);
}
console.log(styleText("green", `✓ contrast contract holds for ${Object.keys(presets).length} presets × 2 modes`));

// A partial may re-scope a token (`--sb-text: …` inside a context) — but the
// LEFT side of that assignment is raw text no accessor validates, and a typo
// there is a silent no-op: the variable is defined, nothing reads it, and the
// context quietly does nothing. Reads are validated by the Sass accessors;
// this closes the same contract over writes. The universe of legal names is
// whatever the generators actually emit, so it can never drift from reality.
{
  const anyPreset = Object.values(presets)[0]!;
  const emitted = new Set(
    [...(themeCss(anyPreset) + generatedScss()).matchAll(/--sb-([a-z0-9-]+):/g)].map((m) => m[1]!),
  );

  const { globSync, readFileSync } = await import("node:fs");
  const partials = globSync(join(pkgRoot, "src", "styles", "**", "*.scss")).filter(
    (f) => !f.endsWith("_generated.scss"),
  );

  const bad: string[] = [];
  for (const file of partials) {
    for (const m of readFileSync(file, "utf8").matchAll(/--sb-([a-z0-9-]+)\s*:/g)) {
      if (!emitted.has(m[1]!)) {
        bad.push(`${file.slice(pkgRoot.length + 1)}: --sb-${m[1]} (no such token is ever emitted)`);
      }
    }
  }
  if (bad.length > 0) {
    console.error(styleText("red", `\n✗ ${bad.length} assignment(s) to unknown --sb- variables:`));
    for (const line of bad) {
      console.error(`  ${line}`);
    }
    process.exit(1);
  }
  console.log(styleText("green", "✓ every --sb- assignment in the partials targets an emitted token"));
}
