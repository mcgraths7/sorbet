/**
 * Proves the CLI works where users actually run it: installed from a tarball,
 * outside this repo. `pnpm check:cli [--keep]`.
 *
 * Everything in-repo resolves through workspace symlinks, which is exactly how
 * `sorbet create` shipped broken — it resolved "the monorepo root" three
 * levels up from its own dist and copied design-system files the published
 * package does not even contain. Green here means the PACKED artifact works,
 * so the test installs the real tarballs into a temp project and runs the
 * binary; running the checkout's dist would pass for the same false reason
 * everything else did.
 *
 * The scaffold is then built for real (registry install of sass + tsc), which
 * is the only honest check of the "token changes propagate automatically"
 * claim: the scaffolded project must produce its own themes and CSS from the
 * copied sources.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stripVTControlCharacters, styleText } from "node:util";

import { contractOf, measureColors, presets } from "../packages/design-system/src/tokens/index.ts";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const keep = process.argv.includes("--keep");

const run = (cmd: string, args: string[], cwd: string) =>
  execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

const temp = mkdtempSync(join(tmpdir(), "sorbet-cli-"));
const failures: string[] = [];
const check = (label: string, cond: boolean) => {
  console.log(cond ? styleText("green", `  ✓ ${label}`) : styleText("red", `  ✗ ${label}`));
  if (!cond) {
    failures.push(label);
  }
};

/**
 * What a contrast report must have printed to count as passing: one "all N
 * pairings pass" line for each preset and mode, N being what the source's own
 * measurement returns for it, and their sum on the last line. Looking for the
 * word "holds" was not enough — the report this replaced printed that too,
 * over "all 86 pairings pass" when 70 apply and it had measured 68.
 *
 * N is counted under the contract each preset declares for the mode
 * (`contractOf`), the same one the installed report must have used: a contract
 * named here instead would expect the wrong count the day a preset declares
 * another.
 */
const expectedCounts = Object.values(presets).flatMap((preset) => (["light", "dark"] as const).map((mode) => measureColors(mode, preset.colors[mode], contractOf(preset, mode)).length));
function reportsWhatWasMeasured(output: string): boolean {
  const text = stripVTControlCharacters(output);
  const printed = [...text.matchAll(/^ {2}(?:light|dark) +all (\d+) pairings pass/gm)].map((m) => Number(m[1]));
  const total = expectedCounts.reduce((sum, n) => sum + n, 0);
  return (
    total > 0 &&
    JSON.stringify(printed) === JSON.stringify(expectedCounts) &&
    text.includes(`holds for every preset in both modes (${total} pairings measured)`)
  );
}

try {
  // ---- pack the real artifacts ---------------------------------------------
  console.log(styleText("bold", "packing…"));
  const vendor = join(temp, "vendor");
  for (const pkg of ["design-system", "cli"]) {
    run("pnpm", ["--filter", `@sorbet/${pkg}`, "pack", "--pack-destination", vendor], ROOT);
  }
  const version = JSON.parse(readFileSync(join(ROOT, "packages", "cli", "package.json"), "utf8")).version;

  // ---- install them like a user would --------------------------------------
  writeFileSync(
    join(temp, "package.json"),
    JSON.stringify(
      {
        name: "cli-smoke",
        private: true,
        dependencies: { "@sorbet/cli": `file:./vendor/sorbet-cli-${version}.tgz` },
      },
      null,
      2,
    ),
  );
  // pack rewrites workspace:* to a bare version; redirect it to the tarball
  // (pnpm reads overrides from pnpm-workspace.yaml only — never package.json).
  writeFileSync(
    join(temp, "pnpm-workspace.yaml"),
    `overrides:\n  "@sorbet/design-system": "file:./vendor/sorbet-design-system-${version}.tgz"\n`,
  );
  console.log(styleText("bold", `installing into ${temp}…`));
  run("pnpm", ["install"], temp);
  const sorbet = join(temp, "node_modules", ".bin", "sorbet");

  // ---- exercise every command ----------------------------------------------
  console.log(styleText("bold", "running the binary…"));
  check("presets lists all five", ["sorbet", "ocean", "forest", "noir", "midnight"].every((p) => run(sorbet, ["presets"], temp).includes(p)));
  run(sorbet, ["theme", "ocean", "--out", "ocean.css"], temp);
  check("theme emits non-empty CSS with --sb- tokens", statSync(join(temp, "ocean.css")).size > 1000 && readFileSync(join(temp, "ocean.css"), "utf8").includes("--sb-"));
  check("contrast report passes, and prints the counts the contract measures", reportsWhatWasMeasured(run(sorbet, ["contrast"], temp)));

  run(sorbet, ["create", "app", "--preset", "forest", "--name", "Smoke"], temp);
  const app = join(temp, "app");
  for (const f of ["src/tokens/index.ts", "src/styles/index.scss", "src/scripts/index.ts", "src/tools/build-tokens.ts", "public/css/sorbet.css", "public/themes/forest.css", "public/index.html", "package.json", "tsconfig.base.json"]) {
    check(`create emitted ${f}`, existsSync(join(app, f)));
  }

  // ---- the propagation claim: the scaffold builds itself -------------------
  console.log(styleText("bold", "building the scaffold (real npm install + build)…"));
  run("npm", ["install", "--no-audit", "--no-fund"], app);
  rmSync(join(app, "public", "css", "sorbet.css"));
  rmSync(join(app, "public", "themes", "forest.css"));
  run("npm", ["run", "build"], app);
  check("scaffold rebuilt its own theme CSS from copied sources", existsSync(join(app, "public", "themes", "forest.css")));
  check("scaffold rebuilt sorbet.css from copied Sass", existsSync(join(app, "public", "css", "sorbet.css")));
  // The scaffold's report is a template: its imports resolve only once it has
  // been copied into a project. This is the packed copy, in a project that
  // `sorbet create` really made — `npm run build` above never runs it.
  check("scaffold's own contrast report passes, and prints the counts the contract measures", reportsWhatWasMeasured(run("npm", ["run", "check:contrast"], app)));
} finally {
  if (keep) {
    console.log(styleText("dim", `kept ${temp}`));
  } else {
    rmSync(temp, { recursive: true, force: true });
  }
}

if (failures.length > 0) {
  console.error(styleText("red", `\n✗ ${failures.length} CLI check(s) failed`));
  process.exit(1);
}
console.log(styleText("green", "\n✓ the packed CLI works outside the monorepo, and its scaffold builds itself"));
