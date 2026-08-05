/**
 * The React Server Components contract, enforced the same way the WCAG one is:
 * a module that cannot run in the RSC environment must say so, or a consumer
 * only finds out at their build. `npm run check:client`.
 *
 * A module needs "use client" when it calls a hook, creates a context, reaches
 * for a browser global, or attaches an inline handler to a host element.
 * Everything else stays a Server Component on purpose — <Stack>, <Text> and a
 * link-flavoured <Button> should render on the server for a static page, so
 * blanket-marking the library would be the easy wrong answer.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { styleText } from "node:util";

const SRC = new URL("../src/", import.meta.url).pathname;

/** Anything here means the module cannot execute in the RSC environment. */
const CLIENT_ONLY: [RegExp, string][] = [
  [/\buse[A-Z][A-Za-z]*\s*[(<]/, "calls a hook"],
  [/\bcreateContext\s*[(<]/, "creates a context"],
  [
    /\b(window|document|navigator|localStorage|sessionStorage|matchMedia|requestAnimationFrame|ResizeObserver|IntersectionObserver|MutationObserver)\b/,
    "uses a browser global",
  ],
  [/\son[A-Z][A-Za-z]+=\{\s*(\(|async|function)/, "attaches an inline handler"],
];

const files: string[] = [];
for (const layer of readdirSync(SRC, { withFileTypes: true })) {
  if (!layer.isDirectory()) {
    continue;
  }
  for (const entry of readdirSync(join(SRC, layer.name))) {
    if (/\.tsx?$/.test(entry) && entry !== "index.ts" && entry !== "index.tsx") {
      files.push(join(layer.name, entry));
    }
  }
}
files.sort();

const missing: [string, string][] = [];
const superfluous: string[] = [];
let client = 0;

for (const rel of files) {
  // Strip comments and string bodies so prose about `document` or a doc example
  // showing useState doesn't read as real usage.
  const raw = readFileSync(join(SRC, rel), "utf8");
  const code = raw
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g, '""');

  const declared = /^\s*["']use client["']/.test(raw);
  const reasons = CLIENT_ONLY.filter(([re]) => re.test(code)).map(([, why]) => why);

  if (declared) {
    client++;
  }
  if (reasons.length > 0 && !declared) {
    missing.push([rel, reasons.join(", ")]);
  } else if (reasons.length === 0 && declared) {
    superfluous.push(rel);
  }
}

console.log(
  `${files.length} modules — ${client} client, ${files.length - client} server-capable`,
);

for (const [rel, why] of missing) {
  console.error(styleText("red", `  ✗ ${rel} — ${why}, but has no "use client"`));
}
for (const rel of superfluous) {
  console.error(
    styleText("yellow", `  ! ${rel} — declares "use client" but needs nothing client-only`),
  );
}

if (missing.length > 0 || superfluous.length > 0) {
  console.error(
    styleText("red", `\n✗ ${missing.length + superfluous.length} module(s) out of contract`),
  );
  process.exit(1);
}
console.log(styleText("green", "\n✓ every client-only module declares \"use client\""));
