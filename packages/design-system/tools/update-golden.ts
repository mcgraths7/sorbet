/**
 * Rewrite ONE preset's golden file — the deliberate half of the golden gate.
 * `pnpm --filter @sorbet/design-system update:golden <preset>`.
 *
 * The build compares against tools/golden/ and never writes there; this is
 * the only thing that does, and only for the preset named on the command
 * line. That separation IS the gate: see check-golden.ts for the defect it
 * exists to catch. There is no "all", and nothing in the build calls this.
 *
 * Frozen presets are refused, with no --force (FROZEN_PRESETS in
 * check-golden.ts says what they are and what retires the list). The refusal
 * is a courtesy — it cannot stop an editor; check-golden-base.ts is what
 * holds a frozen golden to the copy on the base branch. A preset that has no
 * golden yet — a brand-new one — gets it created here.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { relative } from "node:path";
import { styleText } from "node:util";

import { PRESET_NAMES } from "../src/tokens/index.ts";

import { diffLines, FROZEN_PRESETS, GOLDEN_DIR, goldenPath, isFrozen, producedThemes, updateCommand } from "./check-golden.ts";

const fail = (...lines: string[]): never => {
  console.error(`${styleText("red", "✗")} ${lines.join("\n  ")}`);
  process.exit(1);
};

const names = process.argv.slice(2);
const name = names[0];
if (names.length !== 1 || name === undefined || name.startsWith("-")) {
  fail(
    `Usage: ${updateCommand("<preset>")}   — one preset, named; there is no "all".`,
    `Presets: ${PRESET_NAMES.map((p) => (isFrozen(p) ? `${p} (frozen)` : p)).join(", ")}`,
  );
}
const preset = name!;

// Frozen is checked before anything else, so the refusal reads the same
// whether or not the golden currently matches.
if (isFrozen(preset)) {
  fail(
    `${preset} is frozen: its golden is not rewritten, by this tool or by hand.`,
    `${FROZEN_PRESETS.join(", ")} are loaded as built by apps outside this repo, so their`,
    "theme files may not change by a byte. If the build says this one no longer",
    "matches, the change being made has re-picked its colours — that is the defect",
    "to fix, and the golden is the evidence of it. A frozen golden that has gone",
    "missing is restored from git, never regenerated.",
  );
}
// The same strings the build checks and writes — one definition of "produced".
// Object.hasOwn, not a bare lookup: `constructor`, `toString` and the like are
// on every object, and would otherwise pass as presets.
const produced = producedThemes();
const css = Object.hasOwn(produced, preset) ? produced[preset] : undefined;
if (css === undefined) {
  fail(`Unknown preset "${preset}". Available: ${PRESET_NAMES.join(", ")}`);
}
const file = goldenPath(preset);
const shown = relative(process.cwd(), file);
const before = existsSync(file) ? readFileSync(file, "utf8") : undefined;

if (before === css) {
  console.log(`${styleText("green", "✓")} ${shown} already matches what the build produces — nothing written`);
} else {
  mkdirSync(GOLDEN_DIR, { recursive: true });
  writeFileSync(file, css!);
  console.log(
    before === undefined
      ? `${styleText("green", "✓")} created ${shown} — ${preset} is now pinned`
      : `${styleText("green", "✓")} rewrote ${shown} — ${diffLines(before, css!).length} line(s) changed`,
  );
  console.log(
    styleText(
      "dim",
      before === undefined
        ? "  Commit it in the pull request that adds the preset."
        : `  Commit it only in a pull request whose stated purpose is to change ${preset}'s values;\n  this file's diff is what the reviewer reads.`,
    ),
  );
}
