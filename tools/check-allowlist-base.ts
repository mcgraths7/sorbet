/**
 * The lock behind "the state-shadow allowlist only shrinks" (legibility-spec.md
 * L154 (3)): the append-only removed list,
 * `tools/stylelint/state-box-shadow-removed.json`, must keep every entry the
 * branch a pull request merges into has. `node tools/check-allowlist-base.ts [ref]`
 * (default `origin/main`); CI runs it on every pull request, beside
 * `check-golden-base.ts`.
 *
 * THE DEFECT THIS EXISTS TO CATCH. The test in `pnpm test` holds the allowlist
 * and the removed list, together, to the sites the compiled check found at
 * e24df74. A site moved back from the removed list to the allowlist keeps
 * that union whole, so the test passes: the allowlist has grown and every
 * check is green (audit finding M5). The base branch's removed list is the
 * one copy a pull request cannot edit, so an entry it has and the pull request
 * lacks is that move.
 *
 * What it allows: a base with no removed list yet (the pull request that adds
 * it), and entries appended to it.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { styleText } from "node:util";

export interface RemovedEntry {
  file: string;
  selector: string;
}

const PATH = "tools/stylelint/state-box-shadow-removed.json";
const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

/** The base's entries the working tree's list lacks. Pure, so a test can drive it. */
export function droppedFromBase(base: readonly RemovedEntry[] | undefined, now: readonly RemovedEntry[]): RemovedEntry[] {
  const key = (e: RemovedEntry) => `${e.file}\u0000${e.selector}`;
  const here = new Set(now.map(key));
  return (base ?? []).filter((entry) => !here.has(key(entry)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ref = process.argv[2] ?? "origin/main";
  let base: RemovedEntry[] | undefined;
  try {
    base = JSON.parse(execFileSync("git", ["show", `${ref}:${PATH}`], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
  } catch {
    base = undefined;
  }
  const now = JSON.parse(readFileSync(join(ROOT, PATH), "utf8")) as RemovedEntry[];
  const dropped = droppedFromBase(base, now);
  if (dropped.length > 0) {
    console.error(styleText("red", `✗ ${dropped.length} entr${dropped.length === 1 ? "y" : "ies"} of ${ref}'s ${PATH} ${dropped.length === 1 ? "is" : "are"} missing here: the removed list is append-only, and a site taken off it is the allowlist growing back.`));
    dropped.forEach((e) => console.error(`  ${e.file}: ${e.selector}`));
    process.exit(1);
  }
  console.log(styleText("green", base === undefined ? `✓ ${ref} has no ${PATH} yet; ${now.length} entries here` : `✓ the removed list keeps all ${base.length} of ${ref}'s entries (${now.length} here)`));
}
