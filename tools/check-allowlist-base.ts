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
 * It FAILS CLOSED (audit of 7a683fd, guards F7), like `check-golden-base.ts`,
 * whose sibling it is: a ref git does not know, a removed list at the ref that
 * does not parse, and a list here that does not parse are each a failure,
 * never a pass. An unknown ref used to print "✓ <ref> has no removed list
 * yet", which is also exactly what a CI that fetched nothing would print. The
 * one allowance is a ref that exists and has no removed list at all (the pull
 * request that adds the file), told apart from an error with `git cat-file -e`
 * rather than by any `git show` failing. It runs as a script under
 * `import.meta.main`: a comparison of `process.argv[1]` with this file's URL
 * printed nothing at all, and exited 0, when the path was symlinked or held a
 * space. `test-contracts.ts` drives `droppedFromBase` and `removedAt` directly,
 * and runs the script against a throwaway repository, so a gutted check fails
 * `pnpm test`.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { styleText } from "node:util";

export interface RemovedEntry {
  file: string;
  selector: string;
}

export const PATH = "tools/stylelint/state-box-shadow-removed.json";
// fileURLToPath, not `.pathname`: a URL's path keeps a space as %20, so from a checkout whose path holds a space
// the root did not exist, every git call failed, and the failure read as "git does not know the ref".
const ROOT = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");

/** The base's entries the working tree's list lacks. Pure, so a test can drive it. */
export function droppedFromBase(base: readonly RemovedEntry[] | undefined, now: readonly RemovedEntry[]): RemovedEntry[] {
  const key = (e: RemovedEntry) => `${e.file}\u0000${e.selector}`;
  const here = new Set(now.map(key));
  return (base ?? []).filter((entry) => !here.has(key(entry)));
}

/** A parsed removed list, or a thrown error naming what is wrong with it. */
export function parseRemoved(text: string, where: string): RemovedEntry[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch(error) {
    throw new Error(`${where} is not JSON: ${(error as Error).message}`, { cause: error });
  }
  if (!Array.isArray(parsed) || !parsed.every((entry) => typeof entry === "object" && entry !== null && typeof (entry as RemovedEntry).file === "string" && typeof (entry as RemovedEntry).selector === "string")) {
    throw new Error(`${where} is not an array of { file, selector }`);
  }
  return parsed as RemovedEntry[];
}

/**
 * The removed list at `ref`: its entries, or `undefined` when the ref exists and has no such file. Throws when git
 * does not know the ref, or the file there does not parse.
 */
export function removedAt(ref: string, cwd: string): RemovedEntry[] | undefined {
  const git = (args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  try {
    git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
  } catch {
    throw new Error(`git does not know ${ref}: fetch it first (CI: git fetch origin "+refs/heads/<base>:refs/remotes/origin/<base>")`);
  }
  try {
    git(["cat-file", "-e", `${ref}:${PATH}`]);
  } catch {
    return undefined;
  }
  return parseRemoved(git(["show", `${ref}:${PATH}`]), `${ref}:${PATH}`);
}

if (import.meta.main) {
  const ref = process.argv[2] ?? "origin/main";
  try {
    const base = removedAt(ref, ROOT);
    const now = parseRemoved(readFileSync(join(ROOT, PATH), "utf8"), PATH);
    const dropped = droppedFromBase(base, now);
    if (dropped.length > 0) {
      console.error(styleText("red", `✗ ${dropped.length} entr${dropped.length === 1 ? "y" : "ies"} of ${ref}'s ${PATH} ${dropped.length === 1 ? "is" : "are"} missing here: the removed list is append-only, and a site taken off it is the allowlist growing back.`));
      dropped.forEach((e) => console.error(`  ${e.file}: ${e.selector}`));
      process.exit(1);
    }
    console.log(styleText("green", base === undefined ? `✓ ${ref} exists and has no ${PATH} yet; ${now.length} entries here` : `✓ the removed list keeps all ${base.length} of ${ref}'s entries (${now.length} here)`));
  } catch(error) {
    console.error(styleText("red", `✗ ${(error as Error).message}`));
    process.exit(1);
  }
}
