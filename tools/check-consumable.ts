/**
 * Proves the packages work for someone who is NOT in this monorepo.
 * `pnpm check:consumable [--no-build] [--keep]`.
 *
 * Every app in here consumes Sorbet through `workspace:*`, which resolves by
 * symlink and hides the things that actually break a real consumer: an
 * `exports` entry pointing at a path `files` doesn't ship, a subpath that was
 * renamed in dist but not in the map, a module that touches `document` at
 * import time. This packs the tarballs, installs them into a throwaway project
 * outside the workspace, and exercises them the way a consumer would.
 *
 * The subpath list is read out of each package.json rather than hardcoded, so a
 * new export is covered the moment it's added and this can't quietly rot.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { styleText } from "node:util";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const argv = process.argv.slice(2);
const keep = argv.includes("--keep");

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const pkgDir = (name: string) => join(ROOT, "packages", name);

const PACKAGES = ["design-system", "component-library"];

/**
 * Expand one `exports` key into something resolvable. A wildcard key like
 * `./themes/*` is only meaningful with a real file substituted in, so glob the
 * target directory and take the first file it actually ships.
 */
function expand(key: string, target: unknown, dir: string): string | undefined {
  if (!key.includes("*")) {
    return key;
  }
  const pattern = typeof target === "string" ? target : (target as { default?: string })?.default;
  if (!pattern?.includes("*")) {
    return undefined;
  }
  const [before, after] = pattern.split("*");
  // The dummy filename lets dirname() find the directory whether the prefix
  // ends at a slash ("./dist/themes/*") or mid-name ("./dist/theme-*").
  const searchDir = join(dir, dirname(`${before}x`));
  let entries: string[];
  try {
    entries = readdirSync(searchDir);
  } catch {
    return undefined;
  }
  const sample = entries.find(
    (e) => e.endsWith(after) && statSync(join(searchDir, e)).isFile(),
  );
  return sample ? key.replace("*", sample.slice(0, sample.length - after.length)) : undefined;
}

// ---- pack straight into the throwaway project ------------------------------

const temp = mkdtempSync(join(tmpdir(), "sorbet-consumable-"));
const vendor = join(temp, "vendor");

console.log(styleText("bold", "packing…"));
execFileSync(
  "node",
  ["tools/pack-vendor.ts", ...argv.filter((a) => a === "--no-build"), "--to", vendor],
  { cwd: ROOT, stdio: ["ignore", "ignore", "inherit"] },
);

const tarballs = new Map<string, string>();
for (const pkg of PACKAGES) {
  const { version } = readJson(join(pkgDir(pkg), "package.json"));
  tarballs.set(pkg, `sorbet-${pkg}-${version}.tgz`);
}

const deps: Record<string, string> = { react: "^19.1.0", "react-dom": "^19.1.0" };
for (const [pkg, tarball] of tarballs) {
  deps[`@sorbet/${pkg}`] = `file:./vendor/${tarball}`;
}

writeFileSync(
  join(temp, "package.json"),
  JSON.stringify({ name: "sorbet-consumable-probe", private: true, type: "module", dependencies: deps }, null, 2),
);
// pnpm rewrites workspace:* to a bare version on pack, so the component
// library asks the registry for a design-system that isn't published. Same
// redirect a real consumer needs — and in pnpm 11 it only counts here, not in
// package.json.
writeFileSync(
  join(temp, "pnpm-workspace.yaml"),
  `overrides:\n  "@sorbet/design-system": "file:./vendor/${tarballs.get("design-system")}"\n`,
);

// Not --ignore-workspace: that flag makes pnpm skip pnpm-workspace.yaml, which
// is where the overrides above live, so the redirect would be dropped and the
// install would 404 on the registry. The temp dir sits outside this repo and
// carries its own workspace file, so there's nothing to leak in anyway.
console.log(styleText("bold", `\ninstalling into ${temp}…`));
execFileSync("pnpm", ["install"], { cwd: temp, stdio: ["ignore", "ignore", "inherit"] });

// ---- assert ----------------------------------------------------------------

const failures: string[] = [];
let checked = 0;

/** Node's stderr ends with a version banner; dig out the line that says why. */
const reason = (err: unknown) => {
  const stderr = (err as { stderr?: string }).stderr ?? "";
  const lines = stderr.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.find((l) => /^[A-Za-z]*Error(\s\[[^\]]+\])?:/.test(l)) ?? lines[0] ?? "unknown";
};

const probe = join(temp, "probe.mjs");
for (const pkg of PACKAGES) {
  const name = `@sorbet/${pkg}`;
  const installed = join(temp, "node_modules", name);
  const { exports } = readJson(join(installed, "package.json"));

  const subpaths: string[] = [];
  for (const [key, target] of Object.entries(exports ?? {})) {
    const expanded = expand(key, target, installed);
    if (expanded) {
      subpaths.push(expanded === "." ? name : `${name}/${expanded.slice(2)}`);
    } else {
      failures.push(`${name}: could not expand exports key "${key}" — nothing shipped matches it`);
    }
  }

  for (const spec of subpaths) {
    checked++;
    writeFileSync(probe, `import { createRequire } from "node:module";\nconsole.log(createRequire(${JSON.stringify(probe)}).resolve(${JSON.stringify(spec)}));\n`);
    try {
      execFileSync("node", [probe], { cwd: temp, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    } catch(err) {
      failures.push(`${spec} — does not resolve: ${reason(err)}`);
    }
  }
}

// Resolving only proves the paths exist. Importing proves the modules actually
// evaluate — that nothing reaches for a browser global at module scope, which
// would break any server-rendering consumer on their first import.
console.log(styleText("bold", "\nevaluating…"));
for (const pkg of PACKAGES) {
  const entry = pkg === "design-system" ? "@sorbet/design-system" : "@sorbet/component-library";
  writeFileSync(probe, `await import(${JSON.stringify(entry)});\n`);
  try {
    execFileSync("node", [probe], { cwd: temp, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    console.log(`  ✓ ${entry} imports cleanly in a bare Node environment`);
  } catch(err) {
    failures.push(`${entry} — throws on import: ${reason(err)}`);
  }
}

// The RSC boundary has to survive packing, or a Next.js consumer is back to
// square one. Assert both directions: interactive modules keep the directive,
// layout primitives stay server-capable.
const clDist = join(temp, "node_modules", "@sorbet/component-library", "dist");
let clientCount = 0;
try {
  clientCount = execFileSync("grep", ["-rl", "use client", clDist], { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter((f) => f.endsWith(".js")).length;

  const stack = readFileSync(join(clDist, "layout", "stack.js"), "utf8");
  if (/^\s*["']use client["']/.test(stack)) {
    failures.push("layout/stack.js became a client module — layout primitives should stay server-capable");
  }
  if (clientCount === 0) {
    failures.push('no "use client" modules survived packing — RSC consumers will break');
  }
} catch {
  // grep exits non-zero on no matches as well as on a missing directory, and
  // either one means the RSC boundary did not make it into the tarball.
  failures.push(`could not inspect ${clDist} — dist is missing from the package, or ships no client modules`);
}

// ---- report ----------------------------------------------------------------

if (keep) {
  console.log(styleText("dim", `\nkept ${temp}`));
} else {
  rmSync(temp, { recursive: true, force: true });
}

console.log(
  `\n${checked} export subpath(s) across ${PACKAGES.length} packages · ${clientCount} client module(s) intact`,
);
for (const f of failures) {
  console.error(styleText("red", `  ✗ ${f}`));
}
if (failures.length > 0) {
  console.error(styleText("red", `\n✗ ${failures.length} consumability failure(s)`));
  process.exit(1);
}
console.log(styleText("green", "\n✓ packages are consumable outside the monorepo"));
