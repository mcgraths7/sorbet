/**
 * Generate theme CSS + the Sass token maps from @sorbet/tokens, and verify
 * them BEFORE writing them. A preset that fails WCAG AA fails the build —
 * inaccessible themes are unrepresentable — and so does a theme file that no
 * longer matches its golden copy.
 *
 * The order is the point: produce everything in memory, run every check on
 * that, and only then touch the disk. It used to write first and check after,
 * so a failed gate still left freshly written theme files in dist/ — and
 * anything that copies dist/ without reading the exit code shipped a theme
 * that had failed. A failing CHECK now means this script writes nothing.
 *
 * That is the whole of the promise. It does not cover a write that itself
 * fails part-way (a read-only file in dist/themes/), and it does not cover the
 * steps that run after this one in the package's `build` script: if the Sass
 * or TypeScript compile fails, the build exits non-zero with this script's
 * output already on disk — output that passed every check here.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { styleText } from "node:util";

import { checkPreset, generatedScss, manifest, presets, ratioText } from "../src/tokens/index.ts";

import { checkCvd } from "./check-cvd.ts";
import { checkGolden, goldenFailureText, goldenSuccessText, producedThemes } from "./check-golden.ts";

const pkgRoot = join(import.meta.dirname, "..");
const themesDir = join(pkgRoot, "dist", "themes");

// Everything this build emits, produced once, and written at the bottom from
// these same strings. The golden check and the --sb- name check read the
// strings themselves; the contrast and chart checks read the presets and chart
// themes the strings were made from. Nothing checks the manifest.
const themes = producedThemes();
const manifestJson = manifest(presets);
const scss = generatedScss();

// A check that FAILS does not stop the ones after it — a contrast failure and
// a golden mismatch have different remedies, and one build should report both
// — so no check exits on its own; the single exit is below, ahead of the first
// write. A check that THROWS still ends the run there, with a stack trace and
// nothing written.
let failed = false;

const failures = Object.values(presets).flatMap(checkPreset);
if (failures.length > 0) {
  console.error(styleText("red", `\n✗ ${failures.length} contrast failure(s):`));
  for (const f of failures) {
    const found = f.actual === null ? "could not be measured" : `= ${ratioText(f.actual, f.min)}`;
    console.error(`  ${f.preset}/${f.mode}: ${f.fg} on ${f.bg} ${found} (needs ${f.min})`);
  }
  failed = true;
} else if (Object.keys(presets).length === 0) {
  // No presets, so no pairs: "holds for 0 presets" would be true of nothing.
  console.error(styleText("red", "\n✗ the contrast contract measured nothing: there are no presets"));
  failed = true;
} else {
  console.log(styleText("green", `✓ contrast contract holds for ${Object.keys(presets).length} presets × 2 modes`));
}

// A partial may re-scope a token (`--sb-text: …` inside a context) — but the
// LEFT side of that assignment is raw text no accessor validates, and a typo
// there is a silent no-op: the variable is defined, nothing reads it, and the
// context quietly does nothing. Reads are validated by the Sass accessors;
// this closes the same contract over writes. The universe of legal names is
// whatever the generators actually emit, so it can never drift from reality.
{
  const anyTheme = Object.values(themes)[0]!;
  const emitted = new Set(
    [...(anyTheme + scss).matchAll(/--sb-([a-z0-9-]+):/g)].map((m) => m[1]!),
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
    failed = true;
  } else {
    console.log(styleText("green", "✓ every --sb- assignment in the partials targets an emitted token"));
  }
}

// Chart slot order is the CVD guarantee; the comments used to claim numbers no
// tool could reproduce. Now the gate is the claim.
{
  const cvdFailures = checkCvd();
  if (cvdFailures.length > 0) {
    console.error(styleText("red", `\n✗ ${cvdFailures.length} chart palette(s) below their CVD separation floor:`));
    for (const f of cvdFailures) {
      console.error(`  ${f.preset}/${f.mode}: min adjacent ΔE ${f.min.toFixed(1)} < ${f.floor} at ${f.worstPair}`);
    }
    failed = true;
  } else {
    console.log(styleText("green", "✓ adjacent chart slots stay separable under protanopia and deuteranopia"));
  }
}

// The three checks above ask whether each theme is ACCEPTABLE. None asks
// whether it is still the SAME theme: colours are picked by walking shared
// ramps, so an edit aimed at one preset can re-pick another's and stay green.
// The golden files are the diff that dist/ (not in git) cannot give — see
// check-golden.ts for the defect, and for what a mismatch means.
{
  const golden = checkGolden(themes);
  if (golden.failures.length > 0) {
    console.error(goldenFailureText(golden.failures));
    failed = true;
  } else {
    console.log(goldenSuccessText(golden));
  }
}

if (failed) {
  console.error(styleText("red", "\n✗ build-tokens wrote nothing: dist/themes/ and _generated.scss are as they were before it ran"));
  process.exit(1);
}

await mkdir(themesDir, { recursive: true });

for (const [name, css] of Object.entries(themes)) {
  await writeFile(join(themesDir, `${name}.css`), css);
  console.log(`${styleText("green", "✓")} dist/themes/${name}.css`);
}
await writeFile(join(themesDir, "manifest.json"), manifestJson);
await writeFile(join(pkgRoot, "src", "styles", "abstracts", "_generated.scss"), scss);
console.log(`${styleText("green", "✓")} dist/themes/manifest.json`);
console.log(`${styleText("green", "✓")} src/styles/abstracts/_generated.scss`);
