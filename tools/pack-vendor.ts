/**
 * Build and pack the consumable packages as tarballs, for a project that lives
 * outside this monorepo and vendors Sorbet instead of installing it from a
 * registry. `pnpm pack:vendor [--to <dir>] [--no-build]`.
 *
 * Vendoring is deliberate while Sorbet is pre-1.0 and unpublished: the tarballs
 * are committed in the consuming repo, so its CI and deploys build from what is
 * checked in, with no registry and no auth. Swapping to a real registry later
 * only changes the dependency specifier.
 *
 * The one sharp edge this script exists to guard: `pnpm pack` rewrites
 * `workspace:*` to a plain version, so the packed component library asks for
 * `@sorbet/design-system@<version>` from the registry — where it does not
 * exist. The consumer needs a pnpm `overrides` entry pointing at the vendored
 * design-system tarball, and in pnpm 11 that lives in `pnpm-workspace.yaml`;
 * in `package.json` it is silently ignored. The wiring is printed at the end.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, copyFileSync, statSync } from "node:fs";
import { basename, isAbsolute, join, resolve } from "node:path";
import { styleText } from "node:util";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const OUT = join(ROOT, "vendor-dist");

/** Packed in dependency order, so the design-system tarball exists first. */
const PACKAGES = ["design-system", "component-library"];

const argv = process.argv.slice(2);
const build = !argv.includes("--no-build");
const toIndex = argv.indexOf("--to");
const to = toIndex === -1 ? undefined : argv[toIndex + 1];

if (toIndex !== -1 && !to) {
  console.error(styleText("red", "--to needs a directory"));
  process.exit(1);
}

const run = (cmd: string, args: string[], cwd: string) =>
  execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });

if (build) {
  console.log(styleText("bold", "building…"));
  execFileSync("pnpm", ["build"], { cwd: ROOT, stdio: "inherit" });
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

console.log(styleText("bold", "\npacking…"));
const packed: string[] = [];

for (const pkg of PACKAGES) {
  const dir = join(ROOT, "packages", pkg);
  run("pnpm", ["pack", "--pack-destination", OUT], dir);

  const tarball = readdirSync(OUT).find((f) => f.includes(pkg) && f.endsWith(".tgz"));
  if (!tarball) {
    console.error(styleText("red", `  ✗ ${pkg} produced no tarball`));
    process.exit(1);
  }

  // A tarball that packs cleanly can still be uninstallable. Read the manifest
  // back out and fail loudly rather than let the consumer discover it.
  const manifest = JSON.parse(run("tar", ["-xzOf", join(OUT, tarball), "package/package.json"], OUT));
  const deps = { ...manifest.dependencies, ...manifest.peerDependencies };
  const unresolved = Object.entries(deps).filter(([, spec]) => String(spec).startsWith("workspace:"));
  if (unresolved.length > 0) {
    console.error(
      styleText("red", `  ✗ ${tarball} kept a workspace specifier: ${unresolved.map(([n]) => n).join(", ")}`),
    );
    process.exit(1);
  }

  const kb = Math.round(statSync(join(OUT, tarball)).size / 1024);
  console.log(`  ✓ ${tarball.padEnd(44)} ${String(kb).padStart(4)} kB`);
  packed.push(tarball);
}

if (to) {
  const dest = isAbsolute(to) ? to : resolve(process.cwd(), to);
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  // Clear stale versions, or an old tarball lingers and the `file:` specifier
  // silently keeps resolving to it.
  for (const stale of readdirSync(dest)) {
    if (stale.startsWith("sorbet-") && stale.endsWith(".tgz")) {
      rmSync(join(dest, stale));
    }
  }
  for (const tarball of packed) {
    copyFileSync(join(OUT, tarball), join(dest, tarball));
  }
  console.log(styleText("green", `\n✓ copied ${packed.length} tarball(s) to ${dest}`));
  console.log(styleText("dim", "  re-run `pnpm install` there to pick them up"));
} else {
  const ds = packed.find((f) => f.includes("design-system"))!;
  const cl = packed.find((f) => f.includes("component-library"))!;
  console.log(styleText("green", `\n✓ ${OUT}`));
  console.log("\nIn the consuming project — package.json:\n");
  console.log(`  "@sorbet/component-library": "file:./vendor/${cl}",`);
  console.log(`  "@sorbet/design-system": "file:./vendor/${ds}"`);
  console.log("\n…and pnpm-workspace.yaml (NOT package.json — pnpm 11 ignores it there):\n");
  console.log("  overrides:");
  console.log(`    "@sorbet/design-system": "file:./vendor/${basename(ds)}"`);
  console.log(styleText("dim", "\nOr skip the copying: pnpm pack:vendor --to ../your-project/vendor"));
}
