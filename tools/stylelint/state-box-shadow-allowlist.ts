/**
 * The allowlist of `sorbet/no-state-box-shadow`, generated, never typed:
 * `node tools/stylelint/state-box-shadow-allowlist.ts [--ref <commit>] [--write | --check]`.
 *
 * The rule forbids a partial outside `abstracts/` from writing `box-shadow` on
 * a state selector (legibility-spec.md L153). The sites that did so on `main`
 * when the rule arrived (`e24df74`) are its named exceptions until each is
 * fixed; a fixed site moves to the append-only removed list,
 * `state-box-shadow-removed.json`, and never comes back without a diff to that
 * list (L154).
 *
 *   (no flag)  print the sites the rule finds at the ref
 *   --write    rewrite the allowlist as: the sites the rule finds at the ref,
 *              that it still finds in the working tree, less the removed list.
 *              A site at the ref that is no longer one is APPENDED to the
 *              removed list. Nothing here can add a site the ref did not have.
 *   --check    exit 1 unless every allowlisted entry is a site the rule finds
 *              at the ref. That is all it checks. What holds "only shrinks" is
 *              the test in `pnpm test` (allowlist + removed list = the sites the
 *              compiled check finds at e24df74, recorded as a fixture) and the
 *              CI step tools/check-allowlist-base.ts (the removed list keeps
 *              every entry its base branch has).
 *
 * The removed list was seeded once with the fifteen field focus and invalid
 * glows, which the source rule cannot see (they are written by a mixin in
 * abstracts/) but the compiled check found at e24df74 (L163), and which step
 * 2.4 moved into `--state-layer`. `--ref` defaults to the commit the allowlist
 * records (`generatedFrom`), else `e24df74`.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import stylelint from "stylelint";

const ROOT = new URL("../..", import.meta.url).pathname.replace(/\/$/, "");
const STYLES = "packages/design-system/src/styles";
const ALLOWLIST = join(ROOT, "tools", "stylelint", "state-box-shadow-allowlist.json");
const REMOVED = join(ROOT, "tools", "stylelint", "state-box-shadow-removed.json");
const RULE = "sorbet/no-state-box-shadow";

interface Entry {
  file: string;
  selector: string;
  line?: number;
}
interface Allowlist {
  rule: string;
  generatedFrom: string;
  about: string;
  entries: Entry[];
}

const argv = process.argv.slice(2);
const existing: Allowlist | undefined = existsSync(ALLOWLIST) ? JSON.parse(readFileSync(ALLOWLIST, "utf8")) : undefined;
const removed: Entry[] = existsSync(REMOVED) ? JSON.parse(readFileSync(REMOVED, "utf8")) : [];
const at = argv.indexOf("--ref");
const ref = at === -1 ? (existing?.generatedFrom ?? "e24df74") : argv[at + 1]!;
const git = (...args: string[]) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28 });

/** Every site the rule reports, over the given partials, with the allowlist switched off. */
async function sites(files: { path: string; code: string }[]): Promise<Entry[]> {
  const out: Entry[] = [];
  for (const { path, code } of files) {
    const { results } = await stylelint.lint({
      code,
      codeFilename: join(ROOT, path),
      config: {
        extends: ["stylelint-config-standard-scss"],
        plugins: [join(ROOT, "tools", "stylelint", "no-state-box-shadow.js")],
        rules: { [RULE]: [true, { allowlist: false }] },
      },
    });
    for (const warning of results[0]?.warnings ?? []) {
      if (warning.rule !== RULE) {
        continue;
      }
      const selector = /\((.*)\)\. An element's shadow/.exec(warning.text)?.[1];
      if (selector === undefined) {
        throw new Error(`cannot read the selector out of: ${warning.text}`);
      }
      out.push({ file: relative(STYLES, path), selector, line: warning.line });
    }
  }
  return out;
}

const partialsAt = (commit: string) =>
  git("ls-tree", "-r", "--name-only", commit, "--", STYLES)
    .split("\n")
    .filter((p) => p.endsWith(".scss") && !p.endsWith("_generated.scss"))
    .map((path) => ({ path, code: git("show", `${commit}:${path}`) }));

const partialsHere = () => {
  const walk = (dir: string): string[] =>
    readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(join(dir, d.name)) : d.name.endsWith(".scss") && d.name !== "_generated.scss" ? [join(dir, d.name)] : []));
  return walk(STYLES).map((path) => ({ path, code: readFileSync(join(ROOT, path), "utf8") }));
};

const key = (e: { file: string; selector: string }) => `${e.file}\u0000${e.selector}`;
const atRef = await sites(partialsAt(ref));
const refKeys = new Set(atRef.map(key));

if (argv.includes("--check")) {
  const extra = (existing?.entries ?? []).filter((e) => !refKeys.has(key(e)));
  if (extra.length > 0) {
    console.error(`✗ ${extra.length} allowlist entr${extra.length === 1 ? "y is" : "ies are"} not a site the rule finds at ${ref}.`);
    extra.forEach((e) => console.error(`  ${e.file}: ${e.selector}`));
    process.exit(1);
  }
  console.log(`✓ All ${existing?.entries.length ?? 0} allowlist entries are sites the rule finds at ${ref} (${atRef.length} there). This is all --check holds; "only shrinks" is held by pnpm test and tools/check-allowlist-base.ts.`);
} else if (argv.includes("--write")) {
  const hereKeys = new Set((await sites(partialsHere())).map(key));
  const removedKeys = new Set(removed.map(key));
  const entries = atRef.filter((e) => hereKeys.has(key(e)) && !removedKeys.has(key(e)));
  const gone = atRef.filter((e) => !hereKeys.has(key(e)) && !removedKeys.has(key(e))).map(({ file, selector }) => ({ file, selector }));
  const list: Allowlist = {
    rule: RULE,
    generatedFrom: ref,
    about: "Generated by tools/stylelint/state-box-shadow-allowlist.ts: the sites the rule finds at generatedFrom that are still sites, less state-box-shadow-removed.json; `line` is the line there. It only shrinks: a fixed site moves to the append-only removed list, and pnpm test holds the two lists to the sites at e24df74 (L154).",
    entries,
  };
  writeFileSync(ALLOWLIST, `${JSON.stringify(list, null, 2)}\n`);
  if (gone.length > 0) {
    writeFileSync(REMOVED, `${JSON.stringify([...removed, ...gone], null, 2)}\n`);
  }
  console.log(`Wrote ${entries.length} allowlist entr${entries.length === 1 ? "y" : "ies"} (of ${atRef.length} at ${ref}); appended ${gone.length} to the removed list.`);
} else {
  console.log(`${atRef.length} site(s) at ${ref}:`);
  atRef.forEach((e) => console.log(`  ${e.file}:${e.line}  ${e.selector}`));
}
