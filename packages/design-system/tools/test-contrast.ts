/**
 * Proof that the contrast contract is still measured ONCE. `pnpm
 * test:contrast`; part of `pnpm test`, and a step of CI's build job.
 *
 * WHAT THIS EXISTS TO CATCH. The contract (src/tokens/rules.ts) was measured
 * in five places that did not agree, and every one of them printed a green
 * line. The build gate measured every pair. The report (check-contrast.ts),
 * the CLI (`sorbet contrast`) and the scaffold's copy of the report each
 * carried a hand copy of the loop — one that skipped any pair with a
 * translucent side, which is the two scrim pairs — and then printed "all
 * ${RULES.length} pairings pass": 86, when 70 apply in a mode and 68 had been
 * measured. A pair that nobody could measure was dropped in silence by all of
 * them, the gate included, and a skip looks exactly like a pass. The numbers
 * quoted in prose had drifted the same way ("47 contrast pairings", "790
 * checks").
 *
 * A second loop is always green on the day it is written. So this holds every
 * surface to the gate's own function, by running the real files:
 *
 *   - the measurement returns every rule that applies in a mode, the scrim
 *     pairs included, and never skips or throws on a value it cannot read;
 *   - every ratio and every verdict is right by this file's OWN arithmetic —
 *     nothing below borrows the maths it is checking — including a pair a
 *     thousandth under its floor and a scrim whose worse backdrop is black;
 *   - a colour measures the same however it is spelled, and in particular as
 *     the playground's real minifier respells it (see TOKEN STUDIO below);
 *   - the gate's functions (checkColors, checkPreset) are exactly its failures;
 *   - nothing outside rules.ts names RULES or measures a pair for itself;
 *   - each report, run for real, prints the counts the gate's function
 *     measured, and the three agree with one another line for line;
 *   - on a copy of the sources with presets broken on purpose — a scrim pair
 *     under its floor, a translucent foreground, a missing value, an
 *     unparseable one — both gates and all three reports exit 1 and name
 *     exactly the pairs the gate's function names, with the same numbers, and
 *     none of them crashes;
 *   - the figures README.md states by hand are the ones RULES has.
 *
 * TOKEN STUDIO is a React component and is not run here; nothing in this
 * repository can mount it. What it does is read every colour back off the page
 * as text and hand the record to checkColors, so it is held in two halves:
 *
 *   - the record it would read from a PRODUCTION build is rebuilt here with the
 *     minifier that build uses (lightningcss, resolved through the playground's
 *     own vite) and must measure exactly as the preset does. This is the half
 *     that was broken: the minifier turns `#ffffff` into `#fff` and the scrim
 *     into `#0009`, the measurement read neither, and Token Studio showed 24
 *     to 58 "contrast failures" on shipped themes the gate passes (and, before
 *     unmeasurable pairs were failures, skipped them and said "all passing");
 *   - the component must hand what it reads straight to checkColors and show
 *     the answer whole — a text check on the one line that does it. A text
 *     check cannot see behaviour. It is what there is until the component can
 *     be mounted in a test.
 *
 * A NEW SURFACE — anything that prints or shows what the contract measured —
 * goes in SURFACES below, and in REPORTS or GATES if it can be run.
 *
 * Everything is done in memory or in a temporary directory; nothing here
 * writes inside the repository.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { stripVTControlCharacters, styleText } from "node:util";

import { NAMED_COLORS } from "../src/tokens/color.ts";
import { checkColors, checkPreset, measureColors, presets, ratioText, RULES, tally } from "../src/tokens/index.ts";

import type { Failure, Measurement, Mode, Preset, SemanticColorName, SemanticColors } from "../src/tokens/index.ts";

const pkgRoot = join(import.meta.dirname, "..");
const repoRoot = join(pkgRoot, "..", "..");
const cliRoot = join(repoRoot, "packages", "cli");
// The space is deliberate, as in test-golden.ts: every path below goes through it.
const tmp = mkdtempSync(join(tmpdir(), "sorbet contrast "));

const MODES: Mode[] = ["light", "dark"];
type Presets = Record<string, Preset>;
const shipped: Presets = presets;
const each = (all: Presets) => Object.values(all).flatMap((preset) => MODES.map((mode) => ({ preset, mode, colors: preset.colors[mode] })));

let ran = 0;
const failed: string[] = [];
function test(name: string, fn: () => void) {
  ran++;
  try {
    fn();
    console.log(`  ${styleText("green", "✓")} ${name}`);
  } catch(error) {
    failed.push(name);
    console.error(`  ${styleText("red", "✗")} ${name}\n      ${String((error as Error).message).split("\n").join("\n      ")}`);
  }
}

// ── what this file works out for itself, so it is not marking its own homework ──

/**
 * Today's floor for each tier, typed in here. A rule no longer carries its
 * number: its tier does, through a contract (contracts.ts). This file does not
 * ask floorFor() for it — that is the code being checked, and it would be
 * marking its own homework. A tier this table does not know is a failure, not
 * a floor of undefined that nothing can fall under.
 */
const FLOORS: Record<string, number | Record<Mode, number>> = {
  text: 4.5,
  "text-subtle": 3,
  scrim: 4.5,
  "control-border": 3,
  shape: 3,
  focus: 3,
  chart: { light: 3, dark: 2.25 },
};
function floorOf(tier: string, mode: Mode): number {
  assert.ok(Object.hasOwn(FLOORS, tier), `this file states no floor for a tier called ${JSON.stringify(tier)}: add it to FLOORS, from the contract's own table`);
  const floor = FLOORS[tier]!;
  return typeof floor === "number" ? floor : floor[mode];
}
/** The rules that apply in a mode — filtered here, not asked of rules.ts — each with the floor this file says its tier owes. */
const applies = (mode: Mode) => RULES.filter((rule) => rule.mode === undefined || rule.mode === mode).map((rule) => ({ ...rule, min: floorOf(rule.tier, mode) }));
const pairOf = ({ fg, bg, min }: { fg: string; bg: string; min: number }) => `${fg} on ${bg} ≥ ${min}`;
const touches = (token: SemanticColorName) => (pair: { fg: string; bg: string }) => pair.fg === token || pair.bg === token;

// WCAG 2.x, written out again here. None of it is imported from src/tokens:
// a test that borrows contrast() from the code it checks agrees with it by
// construction, and three wrong measurements once passed every check that way
// (every ratio doubled; every floor halved; the scrim taken over white only).
type Bytes = readonly [number, number, number];
const channel = (byte: number) => {
  const v = byte / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]: Bytes) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const wcag = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
/** A colour in one of the two forms the presets write: `#rrggbb`, or withAlpha()'s `rgb(r g b / a)`. */
function presetForm(value: string): { rgb: Bytes; alpha: number } {
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(value);
  const fn = /^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/.exec(value);
  assert.ok(hex ?? fn, `this file's own arithmetic reads only the presets' two forms, not "${value}"`);
  return hex
    ? { rgb: [parseInt(hex[1]!, 16), parseInt(hex[2]!, 16), parseInt(hex[3]!, 16)], alpha: 1 }
    : { rgb: [Number(fn![1]), Number(fn![2]), Number(fn![3])], alpha: Number(fn![4]) };
}
/**
 * The ratio a pair can promise. Over a translucent background that is the worst
 * the text meets against ANY backdrop: the background ends up somewhere between
 * its composite over white and its composite over black, so text whose own
 * luminance lies between those two meets itself (1:1); otherwise the worse end.
 */
function ownRatio(fg: string, bg: string): number {
  const text = presetForm(fg);
  const back = presetForm(bg);
  assert.equal(text.alpha, 1, `"${fg}" is translucent: as a foreground it has no ratio`);
  const own = lum(text.rgb);
  if (back.alpha === 1) {
    return wcag(own, lum(back.rgb));
  }
  const over = (backdrop: number) => lum(back.rgb.map((c) => Math.round(c * back.alpha + backdrop * (1 - back.alpha))) as unknown as Bytes);
  const [white, black] = [over(255), over(0)];
  return own >= Math.min(white, black) && own <= Math.max(white, black) ? 1 : Math.min(wcag(own, white), wcag(own, black));
}
/** Equal as measurements: floating point may order the same sums differently. */
const close = (a: number | null, b: number) => a !== null && Math.abs(a - b) < 1e-9;

/** A ratio as every surface must print it: two decimals, more only if a FAILING ratio would otherwise read as its floor. */
function shown(actual: number, min: number): string {
  let digits = 2;
  while (actual < min && Number(actual.toFixed(digits)) >= min) {
    digits++;
  }
  return actual.toFixed(digits);
}
/** A failing pair as a REPORT prints it … */
const reportRow = (f: Failure) =>
  `${f.fg} on ${f.bg}: ${f.actual === null ? `could not be measured (needs ${f.min})` : `${shown(f.actual, f.min)} < ${f.min}`}`;
/** … and as a GATE prints it. */
const gateRow = (f: Failure) =>
  `${f.preset}/${f.mode}: ${f.fg} on ${f.bg} ${f.actual === null ? "could not be measured" : `= ${shown(f.actual, f.min)}`} (needs ${f.min})`;

// ── the minifier a production build really runs ─────────────────────────────

/**
 * lightningcss, found the way the playground's build finds it: through vite.
 * It is not a dependency of this package, and it must not become one just for
 * this — the point is to use the very minifier that respelled the themes.
 */
function realMinifier(): (css: string) => string {
  const vite = createRequire(join(repoRoot, "apps", "playground", "package.json")).resolve("vite");
  const { transform } = createRequire(vite)("lightningcss") as {
    transform: (options: { filename: string; code: Uint8Array; minify: boolean }) => { code: Uint8Array };
  };
  return (css) => Buffer.from(transform({ filename: "theme.css", code: Buffer.from(css), minify: true }).code).toString("utf8");
}
/** A colour record as Token Studio reads it: each `--sb-<name>` custom property's text, trimmed. */
function readBack(css: string): Record<string, string> {
  return Object.fromEntries([...css.matchAll(/--sb-([a-z0-9-]+):([^;}]+)/g)].map((m) => [m[1]!, m[2]!.trim()]));
}

// ── presets broken on purpose ───────────────────────────────────────────────

interface Tamper {
  preset: string;
  mode: Mode;
  token: SemanticColorName;
  /** `undefined` removes the token from the record altogether. */
  value: string | undefined;
}

const TAMPERS: Tamper[] = [
  // The pair the private loops skipped: opaque text over the translucent scrim, far too faint.
  { preset: "sorbet", mode: "light", token: "on-scrim", value: "#808080" },
  // The right shape and an impossible alpha. Compositing it used to throw.
  { preset: "sorbet", mode: "dark", token: "scrim", value: "rgb(0 0 0 / 1.5)" },
  // A translucent foreground: there is no one ratio to measure.
  { preset: "ocean", mode: "dark", token: "link-hover", value: "rgb(255 255 255 / 0.5)" },
  // The ordinary failure: opaque, and plainly under its floor on all five surfaces.
  { preset: "forest", mode: "light", token: "text", value: "#ffffff" },
  // A background the contract cannot read: a real colour, in a notation outside sRGB bytes.
  { preset: "noir", mode: "dark", token: "scrim", value: "oklch(0 0 0 / 0.6)" },
  // A value that is not there. As a background this used to be a TypeError.
  { preset: "midnight", mode: "dark", token: "primary-subtle", value: undefined },
  // …in the same mode as five measured failures, so one summary line has to carry both counts.
  { preset: "midnight", mode: "dark", token: "text-muted", value: "#000000" },
  // A thousandth under its floor (4.4990 on sorbet's page, floor 4.5). Two decimals print "4.50 < 4.5".
  { preset: "sorbet", mode: "light", token: "link-hover", value: "#d92360" },
];

const broken = structuredClone(presets) as Presets;
for (const { preset, mode, token, value } of TAMPERS) {
  const colors = broken[preset]!.colors[mode] as Partial<SemanticColors>;
  if (value === undefined) {
    delete colors[token];
  } else {
    colors[token] = value;
  }
}

/** The same breakage as source text, appended to a COPY of presets.ts. */
const tamperSource = `\n// test-contrast.ts: broken on purpose, in a temporary copy.\n${TAMPERS.map(({ preset, mode, token, value }) => {
  const at = `presets[${JSON.stringify(preset)}].colors.${mode}[${JSON.stringify(token)}]`;
  return value === undefined ? `delete ${at};` : `${at} = ${JSON.stringify(value)};`;
}).join("\n")}\n`;

// ── the real files, planted where each one really runs ──────────────────────

interface Tree {
  ds: string;
  cli: string;
  app: string;
}

/**
 * The sources as three projects hold them: the package; the CLI beside it,
 * resolving `@sorbet/design-system` through node_modules the way pnpm links it;
 * and an app laid out the way `sorbet create` lays one out (the token sources
 * under src/tokens, the scaffold's tools under src/tools).
 */
function plant(name: string, append = ""): Tree {
  const root = join(tmp, name);
  const tree = { ds: join(root, "design-system"), cli: join(root, "cli"), app: join(root, "app") };

  cpSync(join(pkgRoot, "src", "tokens"), join(tree.ds, "src", "tokens"), { recursive: true });
  cpSync(join(pkgRoot, "tools"), join(tree.ds, "tools"), { recursive: true });
  writeFileSync(
    join(tree.ds, "package.json"),
    JSON.stringify({ name: "@sorbet/design-system", type: "module", exports: { "./tokens": "./src/tokens/index.ts", "./package.json": "./package.json" } }),
  );

  cpSync(join(cliRoot, "src"), join(tree.cli, "src"), { recursive: true });
  writeFileSync(join(tree.cli, "package.json"), JSON.stringify({ type: "module" }));
  mkdirSync(join(tree.cli, "node_modules", "@sorbet"), { recursive: true });
  symlinkSync(tree.ds, join(tree.cli, "node_modules", "@sorbet", "design-system"), "dir");

  cpSync(join(pkgRoot, "src", "tokens"), join(tree.app, "src", "tokens"), { recursive: true });
  cpSync(join(cliRoot, "scaffold", "tools"), join(tree.app, "src", "tools"), { recursive: true });
  writeFileSync(join(tree.app, "package.json"), JSON.stringify({ type: "module" }));

  for (const project of [tree.ds, tree.app]) {
    appendFileSync(join(project, "src", "tokens", "presets.ts"), append);
  }
  return tree;
}

interface Ran {
  status: number | null;
  stdout: string;
  stderr: string;
}

// Plain text whatever the caller's terminal asks for: the output is read back below.
const { FORCE_COLOR: _forced, ...inherited } = process.env;
const env = { ...inherited, NO_COLOR: "1" };
function node(args: string[], cwd: string): Ran {
  const run = spawnSync(process.execPath, args, { cwd, encoding: "utf8", env });
  return { status: run.status, stdout: stripVTControlCharacters(run.stdout), stderr: stripVTControlCharacters(run.stderr) };
}
const crashed = (stderr: string) => /TypeError|ReferenceError|\n\s+at .+:\d+:\d+/.test(stderr);

/** Every file that speaks for the contract, and the function it must get its answer from. */
const SURFACES: { name: string; file: string; reads: string }[] = [
  { name: "the build gate", file: "packages/design-system/tools/build-tokens.ts", reads: "checkPreset" },
  { name: "the scaffold's build gate", file: "packages/cli/scaffold/tools/build-tokens.ts", reads: "checkPreset" },
  { name: "the report", file: "packages/design-system/tools/check-contrast.ts", reads: "measureColors" },
  { name: "the CLI's contrast command", file: "packages/cli/src/index.ts", reads: "measureColors" },
  { name: "the scaffold's report", file: "packages/cli/scaffold/tools/check-contrast.ts", reads: "measureColors" },
  { name: "Token Studio's live check", file: "packages/component-library/src/organisms/token-studio.tsx", reads: "checkColors" },
];

interface Report {
  name: string;
  /** Whether its passing line carries "(tightest margin ×…)". The CLI's never has. */
  margin: boolean;
  run: (tree: Tree) => Ran;
}

const REPORTS: Report[] = [
  { name: "check-contrast.ts", margin: true, run: (tree) => node(["tools/check-contrast.ts"], tree.ds) },
  { name: "sorbet contrast", margin: false, run: (tree) => node(["src/index.ts", "contrast"], tree.cli) },
  { name: "the scaffold's check-contrast.ts", margin: true, run: (tree) => node(["src/tools/check-contrast.ts"], tree.app) },
];

const GATES: { name: string; run: (tree: Tree) => Ran; wrote: (tree: Tree) => boolean }[] = [
  { name: "build-tokens.ts", run: (tree) => node(["tools/build-tokens.ts"], tree.ds), wrote: (tree) => existsSync(join(tree.ds, "dist")) },
  {
    name: "the scaffold's build-tokens.ts",
    run: (tree) => node(["src/tools/build-tokens.ts", "public/themes"], tree.app),
    wrote: (tree) => existsSync(join(tree.app, "public")),
  },
];

interface Printed {
  preset: string;
  mode: Mode;
  summary: string;
  rows: string[];
}

/** A report's output, read back: one entry per mode line, with the failure rows under it. */
function printedModes(stdout: string, all: Presets): Printed[] {
  const headings = new Map(Object.values(all).map((preset) => [`${preset.label} — ${preset.tagline}`, preset.name]));
  const out: Printed[] = [];
  let preset = "";
  for (const line of stdout.split("\n")) {
    const row = /^ {4}✗ (.+)$/.exec(line);
    const mode = /^ {2}(light|dark) +(.+)$/.exec(line);
    if (headings.has(line)) {
      preset = headings.get(line)!;
    } else if (row) {
      assert.ok(out.length > 0, `a failure row before any mode line: "${line}"`);
      out.at(-1)!.rows.push(row[1]!);
    } else if (mode) {
      out.push({ preset, mode: mode[1] as Mode, summary: mode[2]!, rows: [] });
    }
  }
  return out;
}

/** One report's run against what the gate's function says about the same presets. */
function reportAgrees(report: Report, run: Ran, all: Presets) {
  const gate = Object.values(all).flatMap(checkPreset);
  assert.ok(!crashed(run.stderr), `${report.name} crashed:\n${run.stderr}`);
  assert.equal(run.status, gate.length === 0 ? 0 : 1, `${report.name} exited ${run.status}\n${run.stderr}`);

  const printed = printedModes(run.stdout, all);
  assert.deepEqual(
    printed.map((p) => `${p.preset}/${p.mode}`),
    each(all).map(({ preset, mode }) => `${preset.name}/${mode}`),
    `${report.name} should print one line for each preset and mode`,
  );

  let measuredInAll = 0;
  for (const p of printed) {
    const colors = all[p.preset]!.colors[p.mode];
    const pairs = measureColors(p.mode, colors, "wcag-aa");
    const failing = checkColors(p.preset, p.mode, colors, "wcag-aa");
    const measured = pairs.filter((pair) => pair.actual !== null).length;
    measuredInAll += measured;
    const where = `${report.name}, ${p.preset}/${p.mode}, printed "${p.summary}"`;

    assert.deepEqual(p.rows, failing.map(reportRow), `${where}: its failing pairs are not the gate's`);
    if (failing.length === 0) {
      const m = /^all (\d+) pairings pass(?: \(tightest margin ×([\d.]+)\))?$/.exec(p.summary);
      assert.ok(m, `${where}: not a passing line, and the gate passes this mode`);
      assert.equal(Number(m[1]), measured, `${where}: the gate measured ${measured} pairs here`);
      const tightest = Math.min(...pairs.map((pair) => pair.actual! / pair.min)).toFixed(2);
      assert.equal(m[2], report.margin ? tightest : undefined, `${where}: the tightest margin is ×${tightest}`);
    } else {
      const m = /^(\d+) failing \((\d+) measured(?:, (\d+) could not be measured)?\)$/.exec(p.summary);
      assert.ok(m, `${where}: not a failing line, and the gate fails ${failing.length} pair(s) in this mode`);
      assert.deepEqual(
        { failing: Number(m[1]), measured: Number(m[2]), unmeasurable: Number(m[3] ?? 0) },
        { failing: failing.length, measured, unmeasurable: pairs.length - measured },
        `${where}: those are not the gate's counts`,
      );
    }
  }

  if (gate.length === 0) {
    const last = run.stdout.trimEnd().split("\n").at(-1)!;
    assert.match(last, /holds/, `${report.name}'s last line`);
    assert.equal(Number(/\((\d+) pairings measured\)/.exec(last)?.[1]), measuredInAll, `${report.name}'s total, in "${last}"`);
  } else {
    assert.ok(!run.stdout.includes("holds"), `${report.name} printed its success line on a failing run`);
    assert.ok(run.stderr.includes(`✗ ${gate.length} contrast failure(s)`), `${report.name} should count ${gate.length} failures:\n${run.stderr}`);
  }
}

/** Every source file in the repository that is ours. */
const SKIP = new Set(["node_modules", "dist", ".git", "ds-bundle", ".ds-sync", "vendor-dist"]);
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      return SKIP.has(entry.name) ? [] : sources(join(dir, entry.name));
    }
    return /\.(ts|tsx|js|mjs|cjs)$/.test(entry.name) ? [join(dir, entry.name)] : [];
  });
}
/** Source with its comments removed: a docblock may tell the story of RULES.length; code may not use it. */
const code = (file: string) => readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
/** …and with its import statements removed too: importing a function is not calling it. */
const body = (file: string) => code(file).replace(/^import\b[\s\S]*?;[ \t]*$/gm, "");

/**
 * A file that takes the rule list or the pair-level measurement from the
 * tokens: it imports (or re-exports) one of them by name, or reaches it through
 * a namespace. An unrelated `const RULES = …` somewhere else is none of this
 * file's business — matching the bare word used to fail on one, and blame it
 * for a second loop over the contract.
 */
const TAKES = /\b(?:import|export)\b[^;]*?\{[^}]*\b(RULES|worstCaseContrast)\b[^}]*\}\s*from\b|\.\s*(RULES|worstCaseContrast)\b/g;

/** The only files that may name the rule list or the pair-level measurement. */
const MAY_MEASURE = new Set([
  "packages/design-system/src/tokens/rules.ts", // the list, and the one measurement
  "packages/design-system/src/tokens/index.ts", // re-exports the list
  "packages/design-system/src/tokens/color.ts", // defines worstCaseContrast
  "packages/design-system/tools/test-contrast.ts", // this file: it re-derives the list to check the measurement
  "packages/design-system/tools/test-contracts.ts", // holds the list and its tiers to what they were before a contract carried the floors
]);

console.log(styleText("bold", "the contrast contract, measured once:"));

try {
  // ── the measurement ────────────────────────────────────────────────────
  test("every rule that applies in a mode is measured — in contract order, none skipped, none added", () => {
    for (const { preset, mode, colors } of each(shipped)) {
      assert.deepEqual(measureColors(mode, colors, "wcag-aa").map(pairOf), applies(mode).map(pairOf), `${preset.name}/${mode}`);
    }
    for (const mode of MODES) {
      assert.ok(applies(mode).length > 0, `no rule applies in ${mode}: a contract over nothing passes everything`);
    }
  });

  test("the scrim pairs are measured in every preset and mode, as the worst case over white and black", () => {
    assert.ok(RULES.filter((rule) => rule.bg === "scrim").length >= 2, "RULES no longer holds the scrim pairs — the pairs this file exists to keep measured");
    for (const { preset, mode, colors } of each(shipped)) {
      const scrimRules = applies(mode).filter((rule) => rule.bg === "scrim");
      assert.match(colors.scrim, /^rgb\(/, `${preset.name}/${mode}: the scrim is no longer translucent, so this proves nothing about translucent backgrounds`);
      const measured = measureColors(mode, colors, "wcag-aa").filter((pair) => pair.bg === "scrim");
      assert.deepEqual(measured.map(pairOf), scrimRules.map(pairOf), `${preset.name}/${mode}`);
      for (const pair of measured) {
        assert.ok(close(pair.actual, ownRatio(colors[pair.fg], colors.scrim)), `${preset.name}/${mode}: ${pair.fg} on scrim measured ${pair.actual}`);
      }
    }
  });

  test("every ratio is the WCAG ratio and every verdict is ratio ≥ floor — by this file's own arithmetic", () => {
    for (const { preset, mode, colors } of each(shipped)) {
      const rules = applies(mode);
      measureColors(mode, colors, "wcag-aa").forEach((pair, i) => {
        const own = ownRatio(colors[pair.fg], colors[pair.bg]);
        assert.ok(close(pair.actual, own), `${preset.name}/${mode}: ${pairOf(pair)} measured ${pair.actual}, and it is ${own}`);
        assert.equal(pair.holds, own >= rules[i]!.min, `${preset.name}/${mode}: ${pairOf(pair)} at ${own}`);
      });
    }
  });

  test("a pair a thousandth under its floor fails, one a hair over it holds, and neither is printed as the other", () => {
    // No 8-bit pair lands exactly on 4.5; these two are the nearest either side on sorbet's page colour.
    const page = "#f8f7f5";
    const on = (text: string) => measureColors("light", { ...presets.sorbet.colors.light, bg: page, "link-hover": text }, "wcag-aa").find((pair) => pair.fg === "link-hover" && pair.bg === "bg")!;
    const [under, over] = [on("#d92360"), on("#df1158")];
    assert.equal(under.min, 4.5, "link-hover on bg is no longer a 4.5 rule — pick another pair for this test");
    assert.ok(Math.abs(ownRatio("#d92360", page) - 4.498999) < 1e-6 && Math.abs(ownRatio("#df1158", page) - 4.500001) < 1e-6, "this file's own arithmetic moved");
    assert.ok(close(under.actual, ownRatio("#d92360", page)) && close(over.actual, ownRatio("#df1158", page)));
    assert.deepEqual([under.holds, over.holds], [false, true]);
    assert.equal(ratioText(under.actual!, 4.5), "4.499", "a failing ratio must not be rounded up onto its floor");
    assert.equal(ratioText(4.499998041693683, 4.5), "4.499998");
    assert.equal(ratioText(over.actual!, 4.5), "4.50");
    for (const [actual, min] of [[1.066, 4.5], [2.994, 3], [2.996, 3], [2.2499, 2.25], [21, 4.5], [3, 3], [4.4949, 4.5]] as const) {
      assert.equal(ratioText(actual, min), shown(actual, min), `${actual} against ${min}`);
      assert.ok(actual >= min || Number(ratioText(actual, min)) < min, `${actual} printed as ${ratioText(actual, min)} against a floor of ${min}`);
    }
  });

  test("a translucent background promises its worst backdrop: either end, or 1:1 when the text lies between them", () => {
    const light = presets.sorbet.colors.light;
    const scrimPair = (scrim: string, text: string) => measureColors("light", { ...light, scrim, "on-scrim": text }, "wcag-aa").find((pair) => pair.fg === "on-scrim")!;
    for (const alpha of [0, 0.05, 0.6, 1]) {
      for (const [veil, text] of [["0 0 0", "#ffffff"], ["255 255 255", "#000000"], ["0 0 0", "#767676"], ["120 40 200", "#101010"]] as const) {
        const scrim = `rgb(${veil} / ${alpha})`;
        const pair = scrimPair(scrim, text);
        const own = ownRatio(text, scrim);
        assert.ok(close(pair.actual, own), `${text} on ${scrim} measured ${pair.actual}, and it is ${own}`);
        assert.equal(pair.holds, own >= 4.5, `${text} on ${scrim}`);
      }
    }
    // Light text on a dark veil: white is the worse backdrop. Dark text on a light veil: black is.
    assert.ok(close(scrimPair("rgb(0 0 0 / 0.6)", "#ffffff").actual, wcag(1, lum([102, 102, 102]))));
    assert.ok(close(scrimPair("rgb(255 255 255 / 0.6)", "#000000").actual, wcag(0, lum([153, 153, 153]))));
    // Mid-grey text on a scrim that is not there: some photo is exactly that grey.
    assert.deepEqual({ ...scrimPair("rgb(0 0 0 / 0)", "#767676"), fg: undefined, bg: undefined }, { fg: undefined, bg: undefined, tier: "scrim", kind: "text", min: 4.5, actual: 1, holds: false });
  });

  test("a colour measures the same however it is spelled", () => {
    const two = (n: number) => n.toString(16).padStart(2, "0");
    const spellings = (value: string): string[] => {
      const { rgb: [r, g, b], alpha } = presetForm(value);
      if (alpha === 1) {
        const short = [r, g, b].every((c) => c % 17 === 0) ? [`#${[r, g, b].map((c) => (c / 17).toString(16)).join("")}`] : [];
        return [value.toUpperCase(), ` ${value}\n`, `${value}ff`, `rgb(${r}, ${g}, ${b})`, `rgb(${r} ${g} ${b})`, `rgba(${r}, ${g}, ${b}, 1)`, `RGB(${r} ${g} ${b} / 100%)`, ...short];
      }
      const exact = Number.isInteger(alpha * 255) ? [`#${two(r)}${two(g)}${two(b)}${two(alpha * 255)}`] : [];
      return [`\t${value} `, `rgba(${r}, ${g}, ${b}, ${alpha})`, `rgb(${r} ${g} ${b}/${alpha * 100}%)`, `rgba(${r} ${g} ${b} / ${String(alpha).replace(/^0\./, ".")})`, ...exact];
    };
    let tried = 0;
    for (const { preset, mode, colors } of each(shipped)) {
      const expected = measureColors(mode, colors, "wcag-aa");
      const variants = Object.fromEntries(Object.entries(colors).map(([name, value]) => [name, spellings(value)]));
      const most = Math.max(...Object.values(variants).map((list) => list.length));
      for (let i = 0; i < most; i++) {
        const respelled = Object.fromEntries(Object.entries(variants).map(([name, list]) => [name, list[i % list.length]!]));
        assert.deepEqual(measureColors(mode, respelled, "wcag-aa"), expected, `${preset.name}/${mode}, spelling ${i}: ${JSON.stringify(respelled.text)} … ${JSON.stringify(respelled.scrim)}`);
        tried++;
      }
    }
    assert.ok(tried >= 50, `only ${tried} respelled records were measured`);
  });

  // ── Token Studio's half: the page a production build serves ─────────────
  test("the record Token Studio reads off a MINIFIED theme measures exactly as the preset does", () => {
    const minify = realMinifier();
    let respelled = 0;
    for (const { preset, mode, colors } of each(shipped)) {
      const page = readBack(minify(`:root{${Object.entries(colors).map(([name, value]) => `--sb-${name}:${value}`).join(";")}}`));
      assert.deepEqual(Object.keys(page), Object.keys(colors), `${preset.name}/${mode}: the minified theme lost a colour`);
      respelled += Object.entries(colors).filter(([name, value]) => page[name] !== value).length;
      assert.doesNotMatch(page.scrim!, /^rgb\(/, `${preset.name}/${mode}: the minifier left the scrim alone, so this proves nothing about what it does to it`);
      assert.deepEqual(checkColors("studio", mode, page, "wcag-aa"), [], `${preset.name}/${mode}: the gate passes this preset, and Token Studio would list these as failures on a production build`);
      assert.deepEqual(measureColors(mode, page, "wcag-aa"), measureColors(mode, colors, "wcag-aa"), `${preset.name}/${mode}`);
    }
    assert.ok(respelled >= 20, `the minifier respelled only ${respelled} values: it no longer does what this test is here for`);
  });

  test("every named colour is the colour the minifier says it is", () => {
    const minify = realMinifier();
    const names = Object.keys(NAMED_COLORS);
    assert.equal(names.length, 148, "CSS has 148 named colours");
    assert.equal(minify("a{color:#ff0000}"), "a{color:red}", "the minifier no longer turns a hex into a name; this table was added because it does");
    for (const name of names) {
      assert.equal(minify(`a{color:${name}}`), minify(`a{color:${NAMED_COLORS[name]}}`), `${name} is not ${NAMED_COLORS[name]}`);
      const pair = measureColors("light", { ...presets.sorbet.colors.light, bg: name, text: "#000000" }, "wcag-aa").find((p) => p.fg === "text" && p.bg === "bg")!;
      assert.ok(close(pair.actual, ownRatio("#000000", NAMED_COLORS[name]!)), `black on ${name}`);
    }
  });

  test("Token Studio hands what it reads straight to checkColors and shows the answer whole", () => {
    const studio = body(join(repoRoot, "packages/component-library/src/organisms/token-studio.tsx")).replace(/\s+/g, " ");
    assert.ok(
      studio.includes("SEMANTIC_COLOR_NAMES.map((n) => [n, styles.getPropertyValue(`--sb-${n}`).trim()])"),
      "it no longer reads every semantic colour off the page as text — the minified-theme test above models exactly that read; change the two together",
    );
    assert.ok(
      studio.includes('setFailures(checkColors("studio", mode, colors, "wcag-aa"));'),
      "its failure list is no longer checkColors' answer, whole — a filter here is how a pair that cannot be measured turns back into a silent pass",
    );
    assert.equal(studio.match(/\bsetFailures\(/g)?.length, 1, "a second place sets the failure list");
  });

  test("no shipped preset has a pair that cannot be measured, and the gate passes all five", () => {
    for (const { preset, mode, colors } of each(shipped)) {
      const pairs = measureColors(mode, colors, "wcag-aa");
      assert.deepEqual(pairs.filter((pair) => pair.actual === null).map(pairOf), [], `${preset.name}/${mode}: unmeasurable`);
      assert.deepEqual(pairs.filter((pair) => !pair.holds).map(pairOf), [], `${preset.name}/${mode}: failing`);
    }
    assert.deepEqual(Object.values(shipped).flatMap(checkPreset), []);
  });

  // A foreground-only token and a background-only one, so each value is tried in both seats.
  const seats: [SemanticColorName, unknown[]][] = [
    // Not colours, colours outside sRGB bytes, impossible values — and, for a foreground, anything translucent.
    ["link-hover", [undefined, null, 42, "", "redd", "currentColor", "#ff", "#fffff", "#ggg", "rgb(0, 0 0)", "rgb(256 0 0)", "hsl(0 0% 0%)", "oklch(0.5 0.1 200)", "var(--sb-surface)", "color-mix(in srgb, red, blue)", "transparent", "#ffffff80", "#fff8", "rgb(255 255 255 / 0.5)", "rgba(0, 0, 0, 50%)"]],
    ["primary-subtle", [undefined, null, 42, "", "redd", "currentColor", "#ff", "#fffff", "#ggg", "rgb(0, 0 0)", "rgb(256 0 0)", "hsl(0 0% 0%)", "oklch(0.5 0.1 200)", "var(--sb-surface)", "rgb(999 0 0 / 0.5)", "rgb(0 0 0 / 1.5)", "rgb(0 0 0 / 150%)", "rgb(0 0 0 / 1.2.3)", "rgb(0 0 0 / .)"]],
  ];
  for (const [token, values] of seats) {
    test(`a ${token} that cannot be read is a failure naming its pair — never a skip, never a throw`, () => {
      const good = presets.ocean.colors.light;
      const untouched = measureColors("light", good, "wcag-aa").filter((pair) => !touches(token)(pair));
      assert.ok(applies("light").some(touches(token)), `no rule names ${token} any more — pick another token for this test`);
      for (const value of values) {
        const colors = { ...good, [token]: value } as Partial<SemanticColors>;
        if (value === undefined) {
          delete colors[token];
        }
        const what = `${token} = ${JSON.stringify(value) ?? "(missing)"}`;
        let pairs: Measurement[] = [];
        assert.doesNotThrow(() => {
          pairs = measureColors("light", colors, "wcag-aa");
        }, what);
        const hit = pairs.filter(touches(token));
        assert.deepEqual(hit.map(pairOf), applies("light").filter(touches(token)).map(pairOf), `${what}: a pair went missing`);
        for (const pair of hit) {
          assert.deepEqual({ actual: pair.actual, holds: pair.holds }, { actual: null, holds: false }, `${what}: ${pairOf(pair)}`);
        }
        assert.deepEqual(pairs.filter((pair) => !touches(token)(pair)), untouched, `${what}: it changed a pair that does not name ${token}`);
        assert.deepEqual(
          checkColors("probe", "light", colors, "wcag-aa").map(gateRow),
          hit.map((pair) => gateRow({ preset: "probe", mode: "light", ...pair })),
          `${what}: the gate did not report it`,
        );
        assert.equal(tally(pairs).unmeasurable, hit.length, what);
      }
    });
  }

  test("a mode that does not exist is refused, and a record that is not there is every pair unmeasurable", () => {
    const light = presets.sorbet.colors.light;
    for (const mode of ["system", "Light", "auto", "", undefined, null]) {
      assert.throws(() => measureColors(mode as Mode, light, "wcag-aa"), /the mode must be "light" or "dark"/, `mode ${JSON.stringify(mode)}: it used to return the 54 pairs of neither mode, and say nothing of the 16 chart pairs`);
      assert.throws(() => checkColors("probe", mode as Mode, light, "wcag-aa"), TypeError);
    }
    for (const mode of MODES) {
      for (const record of [undefined, null, {}]) {
        const pairs = measureColors(mode, record as Partial<SemanticColors> | undefined, "wcag-aa");
        assert.deepEqual(pairs.map(pairOf), applies(mode).map(pairOf));
        assert.ok(pairs.every((pair) => pair.actual === null && !pair.holds), `${mode}, record ${JSON.stringify(record)}`);
      }
    }
    const half = { ...presets.ocean, colors: { light: presets.ocean.colors.light } } as unknown as Preset;
    assert.deepEqual(checkPreset(half).map((f) => `${f.mode} ${f.actual}`), applies("dark").map(() => "dark null"), "a preset with no dark record");
  });

  // ── the gate's functions, and the tally the reports print from ──────────
  test("the broken presets are broken the way this file needs", () => {
    const failures = Object.values(broken).flatMap(checkPreset);
    const scrim = failures.find((f) => f.preset === "sorbet" && f.mode === "light" && f.bg === "scrim");
    assert.ok(scrim && scrim.actual !== null && scrim.actual < scrim.min, "the scrim pair should fail by measurement");
    assert.equal(failures.filter((f) => f.actual === null).length, 6, "six pairs should be unmeasurable");
    const hair = failures.find((f) => f.preset === "sorbet" && f.fg === "link-hover");
    assert.ok(hair && hair.actual !== null && hair.actual.toFixed(2) === "4.50" && hair.min === 4.5, "one pair should fail by so little that two decimals print its floor");
    assert.ok(failures.some((f) => f.actual !== null && f.preset === "midnight") && failures.some((f) => f.actual === null && f.preset === "midnight"));
    assert.deepEqual(checkPreset(broken.ocean!).map((f) => f.mode), ["dark"], "the mode beside a broken one should be untouched");
  });

  test("checkColors and checkPreset are the measurement's failures — the same pairs, the same numbers", () => {
    for (const all of [shipped, broken]) {
      for (const { preset, mode, colors } of each(all)) {
        const failing = measureColors(mode, colors, "wcag-aa").filter((pair) => !pair.holds);
        assert.deepEqual(
          checkColors(preset.name, mode, colors, "wcag-aa"),
          failing.map(({ fg, bg, min, actual }) => ({ preset: preset.name, mode, fg, bg, min, actual })),
          `${preset.name}/${mode}`,
        );
      }
      for (const preset of Object.values(all)) {
        assert.deepEqual(checkPreset(preset), MODES.flatMap((mode) => checkColors(preset.name, mode, preset.colors[mode], "wcag-aa")), preset.name);
      }
    }
  });

  test("a pair holds only if it was measured and met its floor", () => {
    for (const { preset, mode, colors } of each(broken)) {
      const rules = applies(mode);
      measureColors(mode, colors, "wcag-aa").forEach((pair, i) => {
        assert.equal(pair.holds, pair.actual !== null && pair.actual >= rules[i]!.min, `${preset.name}/${mode}: ${pairOf(pair)}`);
      });
    }
  });

  test("the tally counts what was measured, and only that", () => {
    for (const { preset, mode, colors } of [...each(shipped), ...each(broken)]) {
      const pairs = measureColors(mode, colors, "wcag-aa");
      const ratios = pairs.filter((pair) => pair.actual !== null).map((pair) => pair.actual! / pair.min);
      assert.deepEqual(
        tally(pairs),
        { measured: ratios.length, unmeasurable: pairs.length - ratios.length, failures: pairs.filter((pair) => !pair.holds), tightest: Math.min(...ratios) },
        `${preset.name}/${mode}`,
      );
    }
    assert.deepEqual(tally([]), { measured: 0, unmeasurable: 0, failures: [], tightest: Infinity });
  });

  // ── who measures ───────────────────────────────────────────────────────
  for (const surface of SURFACES) {
    test(`${surface.name} gets its answer from ${surface.reads}()`, () => {
      assert.match(body(join(repoRoot, surface.file)), new RegExp(`\\b${surface.reads}\\b`), `${surface.file} no longer uses ${surface.reads}()`);
    });
  }

  test("no surface formats a ratio for itself", () => {
    for (const surface of SURFACES) {
      const text = body(join(repoRoot, surface.file));
      assert.doesNotMatch(text, /actual!?\s*\.toFixed/, `${surface.file} rounds a ratio itself: 4.499 under a floor of 4.5 prints as "4.50"`);
      assert.match(text, /\bratioText\(/, `${surface.file} prints a ratio without ratioText()`);
    }
  });

  test("nothing outside rules.ts walks RULES or measures a pair for itself", () => {
    const offenders = sources(repoRoot)
      .map((file) => ({ path: relative(repoRoot, file).split(sep).join("/"), names: [...code(file).matchAll(TAKES)].map((m) => m[1] ?? m[2]!) }))
      .filter(({ path, names }) => names.length > 0 && !MAY_MEASURE.has(path))
      .map(({ path, names }) => `${path} uses ${[...new Set(names)].join(" and ")}`);
    assert.deepEqual(offenders, [], "a second loop over the contract — call measureColors() and print what it returns");
  });

  // ── the reports, run for real ──────────────────────────────────────────
  for (const [what, all, append] of [["the shipped presets", shipped, ""], ["the broken presets", broken, tamperSource]] as const) {
    const tree = plant(all === shipped ? "shipped" : "broken", append);
    const runs = REPORTS.map((report) => ({ report, run: report.run(tree) }));

    for (const { report, run } of runs) {
      test(`${report.name}, on ${what}: the pairs and the counts it prints are the gate's`, () => {
        reportAgrees(report, run, all);
        if (all === broken) {
          assert.ok(run.stdout.includes("    ✗ link-hover on bg: 4.499 < 4.5\n"), `${report.name} should print the hair-under pair as what it is`);
        }
      });
    }

    test(`on ${what}, the three reports agree line for line`, () => {
      const [tool, cli, scaffold] = runs.map(({ run }) => run); // REPORTS' order
      const withoutMargin = (text: string) => text.replace(/ \(tightest margin ×[\d.]+\)/g, "");
      assert.equal(scaffold!.stdout, tool!.stdout, "the scaffold's report and check-contrast.ts print different things");
      assert.equal(scaffold!.stderr, tool!.stderr);
      assert.equal(cli!.stdout, withoutMargin(tool!.stdout), "`sorbet contrast` and check-contrast.ts print different things");
      assert.equal(cli!.stderr, tool!.stderr);
    });

    if (all === broken) {
      for (const gate of GATES) {
        test(`${gate.name}, on ${what}: exits 1, names the gate's pairs, does not crash, writes nothing`, () => {
          const expected = Object.values(all).flatMap(checkPreset);
          const run = gate.run(tree);
          assert.ok(!crashed(run.stderr), `${gate.name} crashed:\n${run.stderr}`);
          assert.equal(run.status, 1, `${gate.name} exited ${run.status}`);
          assert.ok(run.stderr.includes(`✗ ${expected.length} contrast failure(s):`), run.stderr);
          const printed = run.stderr.split("\n").filter((line) => /^ {2}\w+\/(light|dark): \S+ on \S+ .*\(needs [\d.]+\)$/.test(line));
          assert.deepEqual(printed.map((line) => line.trim()), expected.map(gateRow));
          assert.ok(run.stderr.includes("  sorbet/light: link-hover on bg = 4.499 (needs 4.5)\n"), `${gate.name} should print the hair-under pair as what it is`);
          assert.ok(!gate.wrote(tree), `${gate.name} wrote its output after failing`);
        });
      }
    }
  }

  // ── nothing to measure ─────────────────────────────────────────────────
  {
    const tree = plant("empty", "\n// test-contrast.ts: every preset removed, in a temporary copy.\nfor (const name of Object.keys(presets)) {\n  delete (presets as Record<string, unknown>)[name];\n}\n");
    for (const surface of [...REPORTS, ...GATES]) {
      test(`${surface.name}, with no presets: measuring nothing is not a pass`, () => {
        const run = surface.run(tree);
        assert.ok(!crashed(run.stderr), `${surface.name} crashed:\n${run.stderr}`);
        assert.equal(run.status, 1, `${surface.name} exited ${run.status}:\n${run.stdout}`);
        assert.doesNotMatch(run.stdout, /holds/, `${surface.name} said the contract holds, over no presets`);
        assert.match(run.stderr, /measured nothing|nothing was measured/, run.stderr);
      });
    }
    for (const gate of GATES) {
      test(`${gate.name}, with no presets: writes nothing`, () => {
        assert.ok(!gate.wrote(tree), `${gate.name} wrote its output`);
      });
    }
  }

  // ── the numbers typed by hand ──────────────────────────────────────────
  test("README.md states the contract's true size", () => {
    const readme = readFileSync(join(repoRoot, "README.md"), "utf8").replace(/\s+/g, " ");
    const both = RULES.filter((rule) => rule.mode === undefined).length;
    const only = (mode: Mode) => RULES.filter((rule) => rule.mode === mode).length;
    const perMode = both + only("light");
    assert.equal(both + only("dark"), perMode, "light and dark no longer apply the same number of rules: reword the README's paragraph, then this test");
    assert.ok(RULES.every((rule) => rule.mode === undefined || rule.fg.startsWith("chart-")), "a per-mode rule that is not a chart mark: the README calls them all chart marks");
    const phrases = [
      `${RULES.length} entries`,
      `${perMode} apply in each mode`,
      `${both} hold in both modes`,
      `${only("light") + only("dark")} chart-mark entries`,
      `${only("light")} in light and ${only("dark")} in dark`,
      `measures all ${perMode}`,
    ];
    const missing = phrases.filter((phrase) => !readme.includes(phrase));
    assert.deepEqual(missing, [], "README.md, \"The accessibility contract\": these are RULES' figures today, and the paragraph does not say them");

    // …and says no other. A true sentence beside a stale one ("declares 47 contrast pairings") is still a stale README.
    const section = /## The accessibility contract(.*?)(?= ## |$)/.exec(readme)?.[1];
    assert.ok(section, "README.md no longer has a section called \"The accessibility contract\"");
    const figures = new Set([RULES.length, perMode, both, only("light") + only("dark")]);
    const stray = [...section.matchAll(/(\d+)\s+(?:contrast\s+|chart-mark\s+)?(?:pairings?|entries|checks|rules)\b/g)].filter((m) => !figures.has(Number(m[1]))).map((m) => m[0]);
    assert.deepEqual(stray, [], "README.md, \"The accessibility contract\", counts something the contract does not have");
  });

  test("the playground counts its checks instead of typing them", () => {
    const typed = sources(join(repoRoot, "apps", "playground", "src"))
      .filter((file) => /\d[\d,]*\s+checks\b/.test(code(file)))
      .map((file) => relative(repoRoot, file));
    assert.deepEqual(typed, [], "a typed number of checks (it read \"790 checks\" long after the contract changed size) — use CONTRAST_CHECKS from contrast-checks.ts");
    const counted = body(join(repoRoot, "apps", "playground", "src", "contrast-checks.ts"));
    assert.match(counted, /\bmeasureColors\(/, "contrast-checks.ts no longer counts from measureColors()");
  });
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failed.length > 0) {
  console.error(styleText("red", `\n✗ ${failed.length} of ${ran} contrast-contract checks failed: something measures, counts or reports the contract on its own again.`));
  process.exit(1);
}
// A run that tested nothing must not read as a pass.
if (ran < 40) {
  console.error(styleText("red", `\n✗ only ${ran} contrast-contract checks ran`));
  process.exit(1);
}
console.log(styleText("green", `✓ one measurement, and every surface reports it: ${ran} checks`));
