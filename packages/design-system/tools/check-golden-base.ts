/**
 * The lock behind "frozen": every frozen preset's golden file must be
 * byte-identical to the copy on the branch a pull request merges into.
 * `pnpm check:golden:base [ref]` (default `origin/main`); CI runs it on every
 * pull request.
 *
 * THE DEFECT THIS EXISTS TO CATCH. The golden gate (check-golden.ts) compares
 * what the build produces with tools/golden/. It cannot tell a golden that was
 * left alone from one that was overwritten in the same change — both match —
 * so a change that re-picks noir's colours AND rewrites noir.css builds green,
 * with the success line still counting noir as frozen. `update-golden.ts`
 * refuses the frozen names, but that stops only that tool: the file is one
 * writeFile away. Nothing was comparing a frozen golden with yesterday's.
 * This does: the base branch's copy is the one thing a pull request cannot
 * edit.
 *
 * What it allows: a frozen golden the base does not have yet (the pull
 * request that first adds it), and any change to a preset that is not frozen
 * — that one is printed, not failed, so the log says which pinned themes the
 * pull request moves.
 *
 * What it cannot hold: a pull request that takes a preset out of
 * FROZEN_PRESETS and rewrites its golden passes here. That edit is one line in
 * check-golden.ts whose docblock says what it means, and the preset then
 * shows below as a pinned theme that changed.
 *
 * What retires it: the same thing that retires FROZEN_PRESETS.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { styleText } from "node:util";

import { PRESET_NAMES } from "../src/tokens/index.ts";

import { FROZEN_PRESETS, GOLDEN_DIR, goldenPath, isFrozen } from "./check-golden.ts";

const pkgRoot = join(import.meta.dirname, "..");

/** One golden's bytes, or `undefined` where that side has no such file. */
export type ReadGolden = (preset: string) => Buffer | undefined;

export interface BaseReport {
  /** Frozen presets whose golden equals the base's, byte for byte. */
  same: string[];
  /** Frozen presets whose golden the base does not have yet. */
  fresh: string[];
  /** Presets that are NOT frozen and whose golden differs from the base's. */
  moved: string[];
  failures: { preset: string; problem: string }[];
}

/**
 * Compare each preset's golden now with the base's. Pure: both sides are
 * handed in, so test-golden.ts can drive it without a repository.
 */
export function checkAgainstBase(names: readonly string[], base: ReadGolden, now: ReadGolden): BaseReport {
  const report: BaseReport = { same: [], fresh: [], moved: [], failures: [] };
  for (const preset of names) {
    const [was, is] = [base(preset), now(preset)];
    if (!isFrozen(preset)) {
      if (was !== undefined && (is === undefined || !was.equals(is))) {
        report.moved.push(preset);
      }
    } else if (was === undefined && is === undefined) {
      report.failures.push({ preset, problem: "has no golden file, here or on the base" });
    } else if (was === undefined) {
      report.fresh.push(preset);
    } else if (is === undefined) {
      report.failures.push({ preset, problem: "its golden file was deleted; the base has one" });
    } else if (was.equals(is)) {
      report.same.push(preset);
    } else {
      report.failures.push({ preset, problem: "its golden file differs from the base's copy" });
    }
  }
  return report;
}

const git = (...args: string[]) => execFileSync("git", args, { cwd: pkgRoot, stdio: ["ignore", "pipe", "pipe"] });

/** A golden as committed at `ref`. Throws if git itself fails — that is not "absent". */
export const goldenAt = (ref: string): ReadGolden => (preset) => {
  const path = `./${relative(pkgRoot, goldenPath(preset))}`;
  const listed = git("ls-tree", "--name-only", ref, "--", path).toString().trim();
  return listed === "" ? undefined : git("show", `${ref}:${path}`);
};

/** A golden as it is in the working tree. */
export const goldenNow: ReadGolden = (preset) => {
  try {
    return readFileSync(goldenPath(preset));
  } catch(error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
};

if (import.meta.main) {
  const ref = process.argv[2] ?? "origin/main";
  const shown = relative(pkgRoot, GOLDEN_DIR);
  try {
    git("rev-parse", "--verify", "--quiet", `${ref}^{commit}`);
  } catch {
    console.error(styleText("red", `✗ cannot compare the frozen goldens with "${ref}": git does not know that ref.`));
    console.error("  That is a failure, never a skip. Fetch it, or name the base: pnpm check:golden:base <ref>");
    process.exit(1);
  }

  // Every preset the build knows, plus every frozen name — so a frozen preset
  // that was deleted outright is still asked about.
  const names = [...new Set([...PRESET_NAMES, ...FROZEN_PRESETS])];
  const report = checkAgainstBase(names, goldenAt(ref), goldenNow);

  console.log(styleText("bold", `frozen goldens in ${shown}/ against ${ref}:`));
  for (const preset of report.same) {
    console.log(`  ${preset.padEnd(9)} identical`);
  }
  for (const preset of report.fresh) {
    console.log(`  ${preset.padEnd(9)} new — ${ref} has no golden for it yet`);
  }
  for (const preset of report.moved) {
    console.log(`  ${preset.padEnd(9)} ${styleText("yellow", "pinned, and changed")} — this must be the stated purpose of the pull request`);
  }
  if (report.failures.length > 0) {
    console.error(styleText("red", `\n✗ ${report.failures.length} frozen golden(s) changed against ${ref}:`));
    for (const f of report.failures) {
      console.error(`  ${styleText("bold", f.preset)}: ${f.problem}`);
    }
    console.error(
      [
        "",
        "  What it means: a frozen theme file may not change by a byte, and its golden is",
        "  the record of those bytes. The golden was rewritten, so the build's own",
        "  comparison now passes against the new bytes and proves nothing. Restore it",
        `  (git checkout ${ref} -- <file>), then fix the change that moved the theme.`,
      ].join("\n"),
    );
    process.exit(1);
  }
  const compared = report.same.length + report.fresh.length;
  if (compared !== FROZEN_PRESETS.length) {
    console.error(styleText("red", `✗ ${compared} of ${FROZEN_PRESETS.length} frozen presets were compared`));
    process.exit(1);
  }
  console.log(
    styleText("green", `✓ ${report.same.length} frozen golden(s) identical to ${ref}, ${report.fresh.length} new`),
  );
}
