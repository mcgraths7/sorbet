/**
 * The catalog parenthetical said "kept current per PR"; this makes that a gate
 * instead of a memory. Every component the library actually exports must be
 * findable in the README's Component catalog — verbatim, or via the catalog's
 * own shorthand (`Stack(+Push)`, `Card (header/body/footer …)`,
 * `Navbar (… menu-button)`), matched case-insensitively with punctuation
 * stripped so `HeaderCell` matches `/HeaderCell` and `NavbarMenuButton`
 * matches `menu-button` on the Navbar line.
 *
 * `pnpm check:catalog`. Runs against the BUILT barrel, so it sees exactly what
 * consumers see.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { styleText } from "node:util";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

const readme = readFileSync(join(ROOT, "README.md"), "utf8");
const start = readme.indexOf("## Component catalog");
if (start === -1) {
  console.error(styleText("red", "✗ README has no '## Component catalog' section"));
  process.exit(1);
}
const catalog = readme.slice(start);
const lines = catalog.split("\n").filter((l) => l.startsWith("- "));

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const all = (await import(join(ROOT, "packages", "component-library", "dist", "index.js"))) as Record<string, unknown>;
const components = Object.keys(all).filter((name) => /^[A-Z]/.test(name) && typeof all[name] === "function");

const missing: string[] = [];
for (const name of components) {
  // Verbatim, as a word: "DataTable", "GridSpan2", "CheckIcon".
  if (new RegExp(`\\b${name}\\b`).test(catalog)) {
    continue;
  }
  // Shorthand: a catalog line starting with a prefix of the name whose
  // remainder appears somewhere on that line (normalized) — CardBody via
  // "Card (header/body/…)", StackPush via "Stack(+Push)".
  const ok = lines.some((line) => {
    const lead = line.slice(2).match(/^[A-Za-z][A-Za-z0-9]*/)?.[0];
    return lead && name.startsWith(lead) && name !== lead && norm(line).includes(norm(name.slice(lead.length)));
  });
  if (!ok) {
    missing.push(name);
  }
}

console.log(`${components.length} exported component(s) checked against the catalog`);
if (missing.length > 0) {
  console.error(styleText("red", `\n✗ ${missing.length} exported component(s) absent from the README catalog:`));
  for (const name of missing) {
    console.error(styleText("red", `    ${name}`));
  }
  console.error(styleText("red", "\nAdd each to its layer's list (or its parent's parenthetical) in README.md — one component per line, append, don't reflow."));
  process.exit(1);
}
console.log(styleText("green", "✓ every exported component is in the catalog"));
