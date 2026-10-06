/**
 * Generate theme CSS + the Sass token maps from @sorbet/tokens, and verify
 * them BEFORE writing them. A preset that fails the contract it declares fails
 * the build — inaccessible themes are unrepresentable — and so does a theme
 * file that no longer matches its golden copy.
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

import { checkPreset, checkStructure, contractOf, contracts, declaredContracts, generatedScss, manifest, METRIC_WORD, presets, ratioText } from "../src/tokens/index.ts";

import { checkCvd } from "./check-cvd.ts";
import { checkGolden, goldenFailureText, goldenSuccessText, producedThemes } from "./check-golden.ts";

import type { Failure } from "../src/tokens/index.ts";

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

// The contract each preset declares: its measurement (checkPreset) and its
// true-or-false checks (checkStructure). A failing pair prints in its metric's
// form, and under each preset-mode's failures each failing tier's `why` and
// `retire` are printed once, so a floor's reason is in front of whoever is
// tempted to lower it. Structure failures are counted on their own line, never
// in the contrast count.
{
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
        for (const f of here) {
          console.error(`  ${f.preset}/${f.mode}: ${f.fg} on ${f.bg} ${row(f)}`);
        }
        for (const tier of new Set(here.map((f) => f.tier))) {
          const { why, retire } = contracts[contractOf(preset, mode)].tiers[tier]!;
          console.error(`      why (${tier}): ${why}`);
          console.error(`      retire (${tier}): ${retire}`);
        }
      }
    }
    failed = true;
  }
  if (structure.length > 0) {
    console.error(styleText("red", `\n✗ ${structure.length} structure failure(s):`));
    for (const failure of structure) {
      console.error(`  ${failure.preset}/${failure.mode}: ${failure.check}: ${failure.detail}`);
    }
    failed = true;
  }
  if (failures.length === 0 && structure.length === 0) {
    if (all.length === 0) {
      // No presets, so no pairs: "holds for 0 presets" would be true of nothing.
      console.error(styleText("red", "\n✗ the contrast contract measured nothing: there are no presets"));
      failed = true;
    } else {
      console.log(styleText("green", `✓ every preset holds the contract it declares: ${declaredContracts(all)}`));
    }
  }
}

// A partial may re-scope a token (`--sb-text: …` inside a context) — but the
// LEFT side of that assignment is raw text no accessor validates, and a typo
// there is a silent no-op: the variable is defined, nothing reads it, and the
// context quietly does nothing. Reads are validated by the Sass accessors;
// this closes the same contract over writes. The universe of legal names is
// whatever the generators actually emit, so it can never drift from reality —
// from EVERY theme: an optional token (seams.ts) is emitted only by a theme
// that defines it, so reading one theme's names would make a partial's
// assignment legal or not by the order the presets happen to be listed in.
{
  const emitted = new Set(
    [...(Object.values(themes).join("") + scss).matchAll(/--sb-([a-z0-9-]+):/g)].map((m) => m[1]!),
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

// process.exitCode, never process.exit(): exit() drops what is still queued for
// a pipe, so a long failure report read through one lost its tail at random.
if (failed) {
  console.error(styleText("red", "\n✗ build-tokens wrote nothing: dist/themes/ and _generated.scss are as they were before it ran"));
  process.exitCode = 1;
} else {
  await mkdir(themesDir, { recursive: true });

  for (const [name, css] of Object.entries(themes)) {
    await writeFile(join(themesDir, `${name}.css`), css);
    console.log(`${styleText("green", "✓")} dist/themes/${name}.css`);
  }
  await writeFile(join(themesDir, "manifest.json"), manifestJson);
  await writeFile(join(pkgRoot, "src", "styles", "abstracts", "_generated.scss"), scss);
  console.log(`${styleText("green", "✓")} dist/themes/manifest.json`);
  console.log(`${styleText("green", "✓")} src/styles/abstracts/_generated.scss`);
}
