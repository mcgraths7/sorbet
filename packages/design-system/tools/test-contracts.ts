/**
 * Proof that "which contract a preset is held to" is data, and that making it
 * data changed nothing. `pnpm test:contracts`; part of `pnpm test`, and a step
 * of CI's build job.
 *
 * WHAT THIS EXISTS TO CATCH. The contrast contract used to be one list where
 * every rule carried its own number. It is now three things: the rules (which
 * pairs), the tiers (which rules owe the same floor) and a contract (what each
 * tier's floor is), with every preset declaring the contract it is held to.
 * Every way that move can go wrong is silent — the build stays green and the
 * themes stay byte-identical while the thing that judges them has changed:
 *
 *   - a rule lands in the wrong tier, or a floor is retyped as a different
 *     number, and a pair is held to less than it was;
 *   - a rule is dropped or added in the re-expression, and nothing counts;
 *   - a mistyped tier, an unknown contract name or a bad declaration on a
 *     preset reads as "the contract does not hold this" — which is a pass;
 *   - a contract that lists nothing passes everything;
 *   - a default contract quietly decides for a caller that forgot to say;
 *   - the shared colour instruments (APCA, OKLab, the colour-blindness
 *     simulation) differ from the published values or from the chart gate's
 *     own arithmetic, and a later contract is calibrated on wrong numbers.
 *
 * And, since the correction of 2026-10-04 (section M10: what two audits of
 * the built increment found):
 *
 *   - a contract that is itself wrong — a tier key mistyped (`txet`), a floor
 *     of exactly 1, a bad half of a per-mode floor, a name that is not its key
 *     — is used anyway, holds less than it says, and every gate prints its
 *     success line;
 *   - a rule with a mode that is not a mode, or a mistyped tier on a rule of
 *     the other mode, is silently never measured;
 *   - a report prints other presets' verdicts ahead of the error, or measures
 *     every preset with a constant while still calling contractOf() somewhere;
 *   - the chart gate returns a number for a colour it cannot read or a
 *     deficiency it has no view for, or the simulation loses its upper clamp.
 *
 * So the answers the OLD code gave are kept as fixtures, recorded by running
 * commit 2d3b765 (tools/fixtures/contracts/, see its README), and the new code
 * is held to them: the 70 [fg, bg, floor] triples of each mode in order, and
 * all 700 measurements of the shipped presets. Nothing in a fixture was
 * computed by the code it checks. The simulation's fixture was computed in
 * another language (simulate_cvd.py) from the specification's text alone, and
 * so was the clamp's (separation-clamp.json).
 *
 * Each test's name starts with the statement of the specification it holds
 * ("M6.4 …" is section M6, item 4, of the contract-mechanism spec).
 *
 * The exported RULES and contracts are mutated in process to prove the checks
 * bite, and put back; the last test proves they were. Planted copies of the
 * sources live in a temporary directory. Nothing here writes inside the
 * repository.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { stripVTControlCharacters, styleText } from "node:util";

// Namespaces, not named imports: a name that is not exported yet is then one
// failing test that says so, not a module that will not load.
import * as color from "../src/tokens/color.ts";
import * as tokens from "../src/tokens/index.ts";

import * as chartGate from "./check-cvd.ts";

import type { Contract, ContractName, Measurement, Mode, Preset, Rule, SemanticColors, Tier } from "../src/tokens/index.ts";

const { checkColors, checkPreset, contractOf, CONTRACT_NAMES, contracts, floorFor, manifest, measureColors, presets, RULES, themeCss, TIER_KIND, TIERS } = tokens;
const { apcaLc, oklabOf, separation, simulateCvd } = color;

const pkgRoot = join(import.meta.dirname, "..");
const repoRoot = join(pkgRoot, "..", "..");
const cliRoot = join(repoRoot, "packages", "cli");
const fixtures = join(pkgRoot, "tools", "fixtures", "contracts");
// The space is deliberate, as in test-golden.ts: every path below goes through it.
const tmp = mkdtempSync(join(tmpdir(), "sorbet contracts "));

const MODES: Mode[] = ["light", "dark"];
const WCAG: ContractName = "wcag-aa";
const shipped: Record<string, Preset> = presets;

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

// ── the fixtures: what commit 2d3b765 answered ──────────────────────────────

type Triple = [fg: string, bg: string, floor: number];
interface Recorded {
  preset: string;
  mode: Mode;
  fg: string;
  bg: string;
  floor: number;
  actual: number;
  holds: boolean;
}
const json = (name: string) => JSON.parse(readFileSync(join(fixtures, name), "utf8")) as unknown;
const TRIPLES = json("wcag-aa.triples.json") as Record<Mode, Triple[]>;
const RECORDED = (json("wcag-aa.measurements.json") as { measurements: Recorded[] }).measurements;
const RULE_ORDER = (json("rules.order.json") as { rules: [string, string, Mode | null][] }).rules;
const SIMULATED = (json("simulate-cvd.json") as { simulated: { color: string; kind: string; hex: string }[] }).simulated;

// ── specification M4, typed in from its table (not read from the code) ──────

const M4: { tier: Tier; kind: string; floor: Record<Mode, number>; perMode: number }[] = [
  { tier: "text", kind: "text", floor: { light: 4.5, dark: 4.5 }, perMode: 42 },
  { tier: "text-subtle", kind: "text", floor: { light: 3, dark: 3 }, perMode: 2 },
  { tier: "scrim", kind: "text", floor: { light: 4.5, dark: 4.5 }, perMode: 2 },
  { tier: "control-border", kind: "shape", floor: { light: 3, dark: 3 }, perMode: 2 },
  { tier: "shape", kind: "shape", floor: { light: 3, dark: 3 }, perMode: 4 },
  { tier: "focus", kind: "focus", floor: { light: 3, dark: 3 }, perMode: 2 },
  { tier: "chart", kind: "chart", floor: { light: 3, dark: 2.25 }, perMode: 16 },
];
const M4_TIERS = M4.map((row) => row.tier);
const rowOf = (tier: Tier) => M4.find((row) => row.tier === tier)!;

/**
 * The tier M4's "The pairs" column puts a pair in. `floor` is the pair's floor
 * AT 2d3b765 (from the fixture): the `text` tier is defined as "every rule
 * whose min is 4.5 at commit 2d3b765, except the two scrim pairs".
 */
function tierOfPair(fg: string, bg: string, floor: number): Tier {
  const onPage = bg === "bg" || bg === "surface";
  if (bg === "scrim" && (fg === "on-scrim" || fg === "on-scrim-muted")) {
    return "scrim";
  }
  if (fg === "text-subtle" && onPage) {
    return "text-subtle";
  }
  if (fg === "border-strong" && onPage) {
    return "control-border";
  }
  if (fg === "focus-ring" && onPage) {
    return "focus";
  }
  if ((fg === "primary-solid" && onPage) || ((fg === "secondary-solid" || fg === "accent-solid") && bg === "bg")) {
    return "shape";
  }
  if (/^chart-[1-8]$/.test(fg) && onPage) {
    return "chart";
  }
  assert.equal(floor, 4.5, `${fg} on ${bg} had a floor of ${floor} at 2d3b765 and is in none of M4's named tiers`);
  return "text";
}
const pairKey = (fg: string, bg: string) => `${fg} on ${bg}`;
const FLOOR_AT_2D3B765 = new Map([...TRIPLES.light, ...TRIPLES.dark].map(([fg, bg, floor]) => [pairKey(fg, bg), floor]));
/** The tier each recorded triple belongs to, per mode, in order. */
const EXPECTED_TIERS: Record<Mode, Tier[]> = {
  light: TRIPLES.light.map(([fg, bg, floor]) => tierOfPair(fg, bg, floor)),
  dark: TRIPLES.dark.map(([fg, bg, floor]) => tierOfPair(fg, bg, floor)),
};

// ── helpers ─────────────────────────────────────────────────────────────────

const colorsOf = (mode: Mode, preset = "sorbet") => shipped[preset]!.colors[mode];
const triplesOf = (pairs: Measurement[]) => pairs.map((pair) => [pair.fg, pair.bg, pair.min]);
const near = (a: number | null | undefined, b: number, eps: number) => typeof a === "number" && Math.abs(a - b) <= eps;
const shown = (value: unknown) => JSON.stringify(value) ?? String(value);

/** A TypeError — not merely an error — whose message contains every one of `words`. */
function throwsTypeError(fn: () => unknown, words: string[], what: string) {
  let thrown: unknown;
  let returned: unknown;
  try {
    returned = fn();
  } catch(error) {
    thrown = error;
  }
  assert.ok(thrown !== undefined, `${what}: it did not throw (it returned ${shown(returned)?.slice(0, 200)})`);
  assert.ok(thrown instanceof TypeError, `${what}: it threw ${String(thrown)}, which is not a TypeError`);
  // "x is not a function" is a TypeError too: a function that does not exist must not pass for one that refuses.
  assert.doesNotMatch(thrown.message, /is not a function|is not iterable|Cannot read properties of|Cannot convert undefined or null/, `${what}: the call itself failed`);
  for (const word of words) {
    assert.ok(thrown.message.includes(word), `${what}: the TypeError does not say "${word}": ${thrown.message}`);
  }
}

/** Check 5 (M4): each mode's ordered [fg, bg, floor] list is the one recorded from 2d3b765. */
function check5() {
  for (const mode of MODES) {
    for (const preset of Object.values(shipped)) {
      assert.deepEqual(triplesOf(measureColors(mode, preset.colors[mode], WCAG)), TRIPLES[mode], `${preset.name}/${mode}: not the 70 triples of 2d3b765, in order`);
    }
    assert.deepEqual(triplesOf(measureColors(mode, undefined, WCAG)), TRIPLES[mode], `${mode}, with no colours at all`);
  }
}

/** The 700 (M4, M9.2): floor, verdict and order exactly; each ratio to 1e-9. */
function check700() {
  const now = Object.values(shipped).flatMap((preset) =>
    MODES.flatMap((mode) => measureColors(mode, preset.colors[mode], WCAG).map((pair) => ({ preset: preset.name, mode, ...pair }))));
  assert.equal(now.length, RECORDED.length, "the number of measurements over the shipped presets");
  now.forEach((pair, i) => {
    const was = RECORDED[i]!;
    const where = `#${i} ${was.preset}/${was.mode}: ${was.fg} on ${was.bg}`;
    assert.deepEqual(
      { preset: pair.preset, mode: pair.mode, fg: pair.fg, bg: pair.bg, floor: pair.min, holds: pair.holds },
      { preset: was.preset, mode: was.mode, fg: was.fg, bg: was.bg, floor: was.floor, holds: was.holds },
      where,
    );
    assert.ok(near(pair.actual, was.actual, 1e-9), `${where}: measured ${pair.actual}, and 2d3b765 measured ${was.actual}`);
  });
}

type Book = Record<string, Contract>;
const book = contracts as unknown as Book;
type Floors = Record<string, { metric: unknown; min: unknown; why: string; retire: string }>;
const floor = (min: unknown) => ({ metric: "ratio" as unknown, min, why: "A probe floor.", retire: "When the test that planted it ends." });

/** Run `fn` with one more contract in the book, then take it out again. */
function withContract(name: string, tiers: Floors, fn: (name: ContractName) => void) {
  assert.ok(!Object.hasOwn(book, name), `a contract called ${name} already exists`);
  book[name] = { name, calibratedFor: "Nobody: a probe planted by test-contracts.ts.", tiers } as unknown as Contract;
  try {
    fn(name as ContractName);
  } finally {
    delete book[name];
  }
}
/** Run `fn` with wcag-aa's tier map changed, then put the very same objects back. */
function withTiers(change: (tiers: Floors) => void, fn: () => void) {
  const tiers = book[WCAG]!.tiers as unknown as Floors;
  const saved = Object.entries(tiers).map(([tier, entry]) => [tier, entry, structuredClone(entry)] as const);
  try {
    change(tiers);
    fn();
  } finally {
    for (const key of Object.keys(tiers)) {
      delete tiers[key];
    }
    for (const [tier, entry, copy] of saved) {
      Object.assign(entry, copy);
      for (const key of Object.keys(entry)) {
        if (!Object.hasOwn(copy, key)) {
          delete (entry as Record<string, unknown>)[key];
        }
      }
      tiers[tier] = entry;
    }
  }
}
/** Run `fn` with RULES changed in place, then put the very same entries back. */
function withRules(change: (rules: Rule[]) => void, fn: () => void) {
  const saved = [...RULES];
  try {
    change(RULES);
    fn();
  } finally {
    RULES.length = 0;
    RULES.push(...saved);
  }
}
/** A copy of a shipped preset under another name, with its `contract` replaced (or removed: pass REMOVE). */
const REMOVE = Symbol("remove");
function declaring(contract: unknown, name = "probe-preset"): Preset {
  const copy = { ...structuredClone(shipped.ocean!), name } as unknown as Record<string, unknown>;
  if (contract === REMOVE) {
    delete copy.contract;
  } else {
    copy.contract = contract;
  }
  return copy as unknown as Preset;
}

// ── planted copies, for what only a real run can show ───────────────────────

interface Tree {
  ds: string;
  cli: string;
  app: string;
}
/**
 * The sources as three projects hold them — test-contrast.ts's layout — with `append` added to the end of each
 * presets.ts (a string), or to each presets.ts and each contracts.ts (M10.1, M10.7).
 */
function plant(name: string, append: string | { presets?: string; contracts?: string }): Tree {
  const appended = typeof append === "string" ? { presets: append } : append;
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
    appendFileSync(join(project, "src", "tokens", "presets.ts"), appended.presets ?? "");
    appendFileSync(join(project, "src", "tokens", "contracts.ts"), appended.contracts ?? "");
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

const RUNS: { name: string; run: (tree: Tree) => Ran; wrote: (tree: Tree) => boolean }[] = [
  { name: "check-contrast.ts", run: (tree) => node(["tools/check-contrast.ts"], tree.ds), wrote: () => false },
  { name: "sorbet contrast", run: (tree) => node(["src/index.ts", "contrast"], tree.cli), wrote: () => false },
  { name: "the scaffold's check-contrast.ts", run: (tree) => node(["src/tools/check-contrast.ts"], tree.app), wrote: () => false },
  { name: "build-tokens.ts", run: (tree) => node(["tools/build-tokens.ts"], tree.ds), wrote: (tree) => existsSync(join(tree.ds, "dist")) },
  {
    name: "the scaffold's build-tokens.ts",
    run: (tree) => node(["src/tools/build-tokens.ts", "public/themes"], tree.app),
    wrote: (tree) => existsSync(join(tree.app, "public")),
  },
];

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
/** Source with its comments removed … */
const code = (file: string) => readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
/** … and with its import statements removed too. */
const body = (file: string) => code(file).replace(/^import\b[\s\S]*?;[ \t]*$/gm, "");
const posix = (file: string) => relative(repoRoot, file).split(sep).join("/");

console.log(styleText("bold", "the contract a preset is held to, as data:"));

try {
  // ── the fixtures themselves ─────────────────────────────────────────────
  test("M4 the fixtures are the contract M4 describes: 70 triples a mode, 700 measurements, and its table's count in every tier", () => {
    assert.equal((json("wcag-aa.triples.json") as { recordedFrom: string }).recordedFrom, "2d3b765");
    assert.equal((json("wcag-aa.measurements.json") as { recordedFrom: string }).recordedFrom, "2d3b765");
    for (const mode of MODES) {
      assert.equal(TRIPLES[mode].length, 70, `${mode}: triples`);
      for (const row of M4) {
        const at = EXPECTED_TIERS[mode].flatMap((tier, i) => (tier === row.tier ? [TRIPLES[mode][i]!] : []));
        assert.equal(at.length, row.perMode, `${mode}: M4 puts ${row.perMode} rules in ${row.tier}`);
        assert.deepEqual([...new Set(at.map(([, , min]) => min))], [row.floor[mode]], `${mode}: every ${row.tier} pair had the floor M4 states, at 2d3b765`);
      }
    }
    assert.equal(RECORDED.length, 700);
    assert.equal(RULE_ORDER.length, 86);
    assert.ok(RECORDED.every((row) => typeof row.actual === "number" && row.holds === true), "2d3b765 measured every pair of every shipped preset, and each held");
    // The measurements were recorded in the triples' order, five presets × two modes.
    const names = [...new Set(RECORDED.map((row) => row.preset))];
    assert.equal(names.length, 5);
    assert.deepEqual(
      RECORDED.map((row) => [row.preset, row.mode, row.fg, row.bg, row.floor]),
      names.flatMap((preset) => MODES.flatMap((mode) => TRIPLES[mode].map(([fg, bg, min]) => [preset, mode, fg, bg, min]))),
    );
  });

  // ── M9.1: check 5 ───────────────────────────────────────────────────────
  test("M4 check 5: each mode's [fg, bg, floor] list under wcag-aa is the list 2d3b765 produced — the same 70, in the same order, and nothing else", check5);

  test("M9.1 check 5 fails when a pair is added to RULES", () => {
    const extra = { fg: "link-hover", bg: "surface", tier: "text", why: "A pair planted by test-contracts.ts." } as Rule;
    for (const at of [0, 20, RULES.length]) {
      withRules((rules) => rules.splice(at, 0, extra), () => assert.throws(check5, `a pair inserted at ${at} went unnoticed`));
    }
    // … in one mode only: the other mode's list must still be caught as different, and is not.
    withRules((rules) => rules.push({ ...extra, mode: "dark" }), () => {
      assert.throws(check5, "a dark-only pair went unnoticed");
      assert.deepEqual(triplesOf(measureColors("light", colorsOf("light"), WCAG)), TRIPLES.light, "a dark-only rule changed light");
    });
    check5();
  });

  test("M9.1 check 5 fails when a pair is removed from RULES", () => {
    for (const at of [0, 12, 21, 53, 54, RULES.length - 1]) {
      withRules((rules) => rules.splice(at, 1), () => assert.throws(check5, `RULES[${at}] removed, and nothing noticed`));
    }
    check5();
  });

  test("M9.1 check 5 fails when one floor is changed in contracts — for every tier, so every floor is read from the contract", () => {
    for (const row of M4) {
      for (const mode of MODES) {
        withTiers((tiers) => {
          const entry = tiers[row.tier]!;
          const min = entry.min as number | Record<Mode, number>;
          entry.min = typeof min === "number" ? min + 0.1 : { ...min, [mode]: min[mode] + 0.1 };
        }, () => assert.throws(check5, `${row.tier}'s floor was raised by 0.1 (${mode}) and nothing noticed`));
      }
    }
    check5();
  });

  // ── M9.2: the 700 ───────────────────────────────────────────────────────
  test("M4 the 700 measurements of the shipped presets are the ones 2d3b765 took: floor, verdict and order exactly, each ratio to 1e-9", check700);

  // ── M9.3: the tiers, the rules, the contract's words ────────────────────
  test("M3 TIERS is every tier, in the order of the M4 table", () => {
    assert.deepEqual([...TIERS], M4_TIERS);
  });

  test("M4 every tier has the kind the table states, and TIER_KIND names no other tier", () => {
    assert.deepEqual({ ...TIER_KIND }, Object.fromEntries(M4.map((row) => [row.tier, row.kind])));
  });

  test("M4 every tier has the floor the table states, in both modes (M6.7: one number is that number in both; chart is 3 light, 2.25 dark)", () => {
    for (const row of M4) {
      for (const mode of MODES) {
        assert.equal(floorFor(WCAG, row.tier, mode), row.floor[mode], `${row.tier}, ${mode}`);
      }
    }
    assert.equal(floorFor("wcag-aa", "chart", "light"), 3);
    assert.equal(floorFor("wcag-aa", "chart", "dark"), 2.25);
  });

  test("M4 wcag-aa lists exactly the seven tiers; chart's floor is written per mode, every other tier's is one number; each metric is the ratio", () => {
    const wcag = contracts[WCAG];
    assert.equal(wcag.name, "wcag-aa");
    assert.deepEqual(Object.keys(wcag.tiers).sort(), [...M4_TIERS].sort());
    for (const row of M4) {
      const entry = wcag.tiers[row.tier]!;
      assert.equal(entry.metric, "ratio", row.tier);
      if (row.tier === "chart") {
        assert.deepEqual(entry.min, { light: 3, dark: 2.25 });
      } else {
        assert.equal(entry.min, row.floor.light, row.tier);
      }
    }
  });

  test("M4 every rule is in the tier the table puts its pair in, and every tier has the table's count in each mode", () => {
    for (const rule of RULES) {
      const at = pairKey(rule.fg, rule.bg);
      assert.ok(FLOOR_AT_2D3B765.has(at), `${at} was not a rule at 2d3b765`);
      assert.equal(rule.tier, tierOfPair(rule.fg, rule.bg, FLOOR_AT_2D3B765.get(at)!), at);
    }
    for (const mode of MODES) {
      const applying = RULES.filter((rule) => rule.mode === undefined || rule.mode === mode);
      assert.equal(applying.length, 70, `${mode}: rules that apply`);
      for (const row of M4) {
        assert.equal(applying.filter((rule) => rule.tier === row.tier).length, row.perMode, `${mode}: rules in ${row.tier}`);
      }
    }
  });

  test("M4 RULES keeps its 86 entries in the order of 2d3b765, with the same fg, bg and mode on each: 54 with no mode, 16 light-only, 16 dark-only", () => {
    assert.deepEqual(RULES.map((rule) => [rule.fg, rule.bg, rule.mode ?? null]), RULE_ORDER);
    assert.equal(RULES.length, 86);
    const count = (mode: Mode | undefined) => RULES.filter((rule) => rule.mode === mode).length;
    assert.deepEqual([count(undefined), count("light"), count("dark")], [54, 16, 16]);
  });

  test("M3 no rule carries a number or a kind: no `min` and no `kind` on any entry of RULES", () => {
    for (const rule of RULES) {
      assert.ok(!("min" in rule) && !("kind" in rule), `${pairKey(rule.fg, rule.bg)} still carries ${Object.keys(rule).filter((key) => key === "min" || key === "kind").join(" and ")}`);
    }
  });

  test("M9.3 every rule says why it is in the contract: a `why` that is not empty after trimming", () => {
    for (const rule of RULES) {
      assert.ok(typeof rule.why === "string" && rule.why.trim() !== "", `${pairKey(rule.fg, rule.bg)}: why is ${shown(rule.why)}`);
    }
  });

  test("M9.3 every floor of every contract has a `why` and a `retire`, and every contract says who it was calibrated for", () => {
    assert.ok(Object.keys(contracts).length > 0, "there are no contracts");
    for (const [name, contract] of Object.entries(contracts)) {
      assert.equal(contract.name, name, "a contract's name is its key");
      assert.ok(typeof contract.calibratedFor === "string" && contract.calibratedFor.trim() !== "", `${name}: calibratedFor is ${shown(contract.calibratedFor)}`);
      assert.ok(Object.keys(contract.tiers).length > 0, `${name} lists no tier`);
      for (const [tier, entry] of Object.entries(contract.tiers)) {
        assert.ok(typeof entry.why === "string" && entry.why.trim() !== "", `${name}, ${tier}: why is ${shown(entry.why)}`);
        assert.ok(typeof entry.retire === "string" && entry.retire.trim() !== "", `${name}, ${tier}: retire is ${shown(entry.retire)}`);
      }
    }
  });

  test("M9.3 CONTRACT_NAMES equals the keys of contracts; M8 there is one contract, and it is wcag-aa", () => {
    assert.deepEqual([...CONTRACT_NAMES], Object.keys(contracts));
    assert.deepEqual(Object.keys(contracts), ["wcag-aa"]);
  });

  test("M3 contracts is a plain, mutable object, as RULES is", () => {
    assert.ok(!Object.isFrozen(contracts) && !Object.isSealed(contracts), "contracts is frozen or sealed");
    assert.ok(!Object.isFrozen(contracts[WCAG].tiers), "wcag-aa's tier map is frozen");
    assert.ok(Array.isArray(RULES) && !Object.isFrozen(RULES), "RULES is frozen");
  });

  test("M3 the public barrel exports the contract mechanism: the values, and the types by name", () => {
    for (const name of ["contracts", "CONTRACT_NAMES", "TIERS", "TIER_KIND", "floorFor", "contractOf", "RULES", "measureColors", "checkColors", "checkPreset", "tally", "ratioText"]) {
      assert.ok((tokens as Record<string, unknown>)[name] !== undefined, `src/tokens/index.ts does not export ${name}`);
    }
    // Types leave nothing behind at run time, so their half is read off the source.
    const barrel = code(join(pkgRoot, "src", "tokens", "index.ts"));
    const exported = [...barrel.matchAll(/\bexport\s+(type\s+)?\{([^}]*)\}/g)].flatMap((m) =>
      m[2]!.split(",").map((part) => part.trim()).filter(Boolean).map((part) => ({ name: part.replace(/^type\s+/, "").split(/\s+as\s+/).at(-1)!, isType: Boolean(m[1]) || part.startsWith("type ") })));
    for (const name of ["Kind", "Tier", "ContractName", "TierFloor", "Contract", "Rule"]) {
      assert.ok(exported.some((entry) => entry.name === name && entry.isType), `src/tokens/index.ts does not export the type ${name}`);
    }
  });

  test("M3 a measurement carries its tier, its tier's kind and the contract's floor — and nothing else new; a failure gains neither", () => {
    for (const mode of MODES) {
      const pairs = measureColors(mode, colorsOf(mode), WCAG);
      pairs.forEach((pair, i) => {
        assert.deepEqual(Object.keys(pair).sort(), ["actual", "bg", "fg", "holds", "kind", "min", "tier"], `${mode} #${i}`);
        const tier = EXPECTED_TIERS[mode][i]!;
        assert.equal(pair.tier, tier, `${mode}: ${pairKey(pair.fg, pair.bg)}`);
        assert.equal(pair.kind, rowOf(tier).kind, `${mode}: ${pairKey(pair.fg, pair.bg)}`);
        assert.equal(pair.kind, TIER_KIND[pair.tier]);
        assert.equal(pair.min, rowOf(tier).floor[mode], `${mode}: ${pairKey(pair.fg, pair.bg)}`);
      });
    }
    const failures = checkColors("probe", "light", { ...colorsOf("light"), text: "#ffffff" }, WCAG);
    assert.ok(failures.length > 0, "white text should fail on a light page");
    for (const failure of failures) {
      assert.deepEqual(Object.keys(failure).sort(), ["actual", "bg", "fg", "min", "mode", "preset"]);
    }
  });

  // ── M9.4 ────────────────────────────────────────────────────────────────
  test("M5 all five presets declare wcag-aa in both modes, and contractOf says so", () => {
    assert.deepEqual(Object.keys(shipped), ["sorbet", "ocean", "forest", "noir", "midnight"]);
    for (const preset of Object.values(shipped)) {
      assert.deepEqual(preset.contract, { light: "wcag-aa", dark: "wcag-aa" }, preset.name);
      for (const mode of MODES) {
        assert.equal(contractOf(preset, mode), "wcag-aa", `${preset.name}/${mode}`);
      }
    }
  });

  // ── M9.5: a bad declaration ─────────────────────────────────────────────
  const BAD_DECLARATIONS: { what: string; contract: unknown; mode: Mode; says: string[] }[] = [
    { what: "`contract` absent", contract: REMOVE, mode: "light", says: [] },
    { what: "`contract` absent", contract: REMOVE, mode: "dark", says: [] },
    { what: "`contract` undefined", contract: undefined, mode: "light", says: [] },
    { what: "`contract` null", contract: null, mode: "light", says: [] },
    { what: "`contract` null", contract: null, mode: "dark", says: [] },
    { what: "`contract` not an object: a contract's name", contract: "wcag-aa", mode: "light", says: [] },
    { what: "`contract` not an object: a number", contract: 42, mode: "dark", says: [] },
    { what: "`contract` not an object: true", contract: true, mode: "light", says: [] },
    { what: "the asked mode missing from it", contract: { light: "wcag-aa" }, mode: "dark", says: [] },
    { what: "the asked mode missing from it", contract: { dark: "wcag-aa" }, mode: "light", says: [] },
    { what: "the asked mode missing from it: an empty object", contract: {}, mode: "light", says: [] },
    { what: "the value not the name of a contract", contract: { light: "wcag-aa", dark: "wcag-aaa" }, mode: "dark", says: ["wcag-aaa"] },
    { what: "the value not the name of a contract: another case", contract: { light: "WCAG-AA", dark: "wcag-aa" }, mode: "light", says: ["WCAG-AA"] },
    { what: "the value not the name of a contract: an inherited property", contract: { light: "toString", dark: "wcag-aa" }, mode: "light", says: ["toString"] },
    { what: "the value not the name of a contract: __proto__", contract: { light: "wcag-aa", dark: "__proto__" }, mode: "dark", says: ["__proto__"] },
    { what: "the value not the name of a contract: constructor", contract: { light: "constructor", dark: "wcag-aa" }, mode: "light", says: ["constructor"] },
    { what: "the value not the name of a contract: the empty string", contract: { light: "", dark: "wcag-aa" }, mode: "light", says: [] },
    { what: "the value not the name of a contract: a number", contract: { light: 4.5, dark: "wcag-aa" }, mode: "light", says: ["4.5"] },
    { what: "the value not the name of a contract: null", contract: { light: "wcag-aa", dark: null }, mode: "dark", says: [] },
    { what: "the value not the name of a contract: a contract object", contract: { light: { name: "wcag-aa" }, dark: "wcag-aa" }, mode: "light", says: [] },
  ];

  test("M5 contractOf throws a TypeError containing the preset's name for each bad declaration, and a rendering of the bad value", () => {
    for (const { what, contract, mode, says } of BAD_DECLARATIONS) {
      throwsTypeError(() => contractOf(declaring(contract), mode), ["probe-preset", ...says], `${what} (${shown(contract === REMOVE ? "(absent)" : contract)}, asked for ${mode})`);
    }
    // The name in the message is the preset's own.
    throwsTypeError(() => contractOf(declaring({ light: "nope", dark: "nope" }, "another-name"), "light"), ["another-name", "nope"], "a preset called another-name");
  });

  test("M5 a declaration that is good for one mode answers for that mode and still throws for the other", () => {
    assert.equal(contractOf(declaring({ light: "wcag-aa", dark: "wcag-aaa" }), "light"), "wcag-aa");
    assert.equal(contractOf(declaring({ light: "wcag-aa" }), "light"), "wcag-aa");
    throwsTypeError(() => contractOf(declaring({ light: "wcag-aa", dark: "wcag-aaa" }), "dark"), ["probe-preset"], "the dark half");
    // A mode that does not exist still throws. M10.5 (CORRECTION 2026-10-04) changed WHAT it says: the TypeError
    // "names the mode as not being a mode, and does not blame the preset" — this assertion used to require the
    // preset's name in the message. The message is held by the M10.5 tests below.
    throwsTypeError(() => contractOf(shipped.sorbet!, "system" as Mode), ["system"], "contractOf(sorbet, \"system\")");
  });

  test("M5 checkPreset meets a bad declaration as the same TypeError — never \"no failures\", never some other contract", () => {
    for (const { what, contract, says } of BAD_DECLARATIONS) {
      throwsTypeError(() => checkPreset(declaring(contract)), ["probe-preset", ...says], `checkPreset, ${what} (${shown(contract === REMOVE ? "(absent)" : contract)})`);
    }
  });

  test("M3 checkPreset measures each mode against the contract the preset declares for THAT mode", () => {
    const strict = structuredClone(contracts[WCAG].tiers) as unknown as Floors;
    strict.text!.min = 21.5;
    withContract("probe-strict", strict, (name) => {
      const preset = declaring({ light: "wcag-aa", dark: name });
      assert.equal(contractOf(preset, "dark"), name);
      const failures = checkPreset(preset);
      assert.deepEqual(failures, checkColors("probe-preset", "dark", preset.colors.dark, name), "its failures are dark's under the dark contract, and light's under wcag-aa (none)");
      assert.equal(failures.length, 42, "no ratio reaches 21.5: all 42 text pairs fail, in dark only");
      assert.ok(failures.every((failure) => failure.mode === "dark" && failure.min === 21.5));
      const mirrored = checkPreset(declaring({ light: name, dark: "wcag-aa" }));
      assert.ok(mirrored.length === 42 && mirrored.every((failure) => failure.mode === "light" && failure.min === 21.5), "… and the other way round");
    });
    assert.deepEqual(Object.values(shipped).flatMap(checkPreset), [], "the shipped presets, under the contracts they declare");
  });

  /** The planted copies whose declaration is bad; M10.6 runs the reports over them again. */
  const BAD_TREES: { name: string; says: readonly string[]; tree: Tree }[] = [];
  for (const [name, append, says] of [
    ["an unknown contract name", "\n(presets.forest as { contract: unknown }).contract = { light: \"wcag-aa\", dark: \"wcag-aaa\" };\n", ["forest", "wcag-aaa"]],
    ["no declaration at all", "\ndelete (presets.noir as { contract?: unknown }).contract;\n", ["noir"]],
  ] as const) {
    const tree = plant(name.replaceAll(" ", "-"), `\n// test-contracts.ts: a bad declaration, in a temporary copy.${append}`);
    BAD_TREES.push({ name, says, tree });
    for (const surface of RUNS) {
      test(`M5 ${surface.name}, on a preset with ${name}: a non-zero exit and that TypeError — no verdict, nothing written`, () => {
        const run = surface.run(tree);
        assert.ok(run.status !== 0 && run.status !== null, `${surface.name} exited ${run.status}:\n${run.stdout}\n${run.stderr}`);
        for (const word of ["TypeError", ...says]) {
          assert.ok(run.stderr.includes(word), `${surface.name}'s error does not say "${word}":\n${run.stderr}`);
        }
        assert.doesNotMatch(run.stdout, /holds/, `${surface.name} said the contract holds`);
        assert.doesNotMatch(run.stderr, /contrast failure\(s\)/, `${surface.name} reported contrast failures: it measured the preset against something`);
        assert.ok(!surface.wrote(tree), `${surface.name} wrote its output`);
      });
    }
  }

  // ── M9.5: M6.1 to M6.7 ──────────────────────────────────────────────────
  test("M6.1 wcag-aa measures every rule that applies in the mode — all 70 — in RULES order", () => {
    for (const mode of MODES) {
      const applying = RULES.filter((rule) => rule.mode === undefined || rule.mode === mode);
      const pairs = measureColors(mode, colorsOf(mode), WCAG);
      assert.equal(pairs.length, 70, mode);
      assert.deepEqual(pairs.map((pair) => [pair.fg, pair.bg, pair.tier]), applying.map((rule) => [rule.fg, rule.bg, rule.tier]), mode);
    }
  });

  test("M6.1 a rule whose KNOWN tier the contract does not list produces no measurement, and that is not a failure", () => {
    for (const row of M4) {
      withTiers((tiers) => delete tiers[row.tier], () => {
        for (const mode of MODES) {
          const kept = TRIPLES[mode].filter((_, i) => EXPECTED_TIERS[mode][i] !== row.tier);
          assert.equal(kept.length, 70 - row.perMode);
          for (const preset of Object.values(shipped)) {
            const pairs = measureColors(mode, preset.colors[mode], WCAG);
            assert.deepEqual(triplesOf(pairs), kept, `${preset.name}/${mode} without ${row.tier}: the other tiers' pairs, in order, and none of its`);
            assert.ok(pairs.every((pair) => pair.tier !== row.tier));
            assert.deepEqual(checkColors(preset.name, mode, preset.colors[mode], WCAG), [], `${preset.name}/${mode} without ${row.tier}: an unheld rule is not a failure`);
          }
          assert.equal(floorFor(WCAG, row.tier, mode), undefined, `floorFor, ${row.tier} unlisted`);
        }
        assert.deepEqual(Object.values(shipped).flatMap(checkPreset), []);
      });
    }
    // A contract may hold one tier only.
    withContract("probe-focus-only", { focus: floor(3) }, (name) => {
      for (const mode of MODES) {
        assert.deepEqual(triplesOf(measureColors(mode, colorsOf(mode), name)), [["focus-ring", "bg", 3], ["focus-ring", "surface", 3]], mode);
      }
    });
    check5();
  });

  test("M6.1 what the measurement did before still holds: an unreadable pair is null and false, no record is every pair unmeasurable, a bad mode throws", () => {
    for (const mode of MODES) {
      for (const record of [undefined, {}]) {
        const pairs = measureColors(mode, record, WCAG);
        assert.equal(pairs.length, 70);
        assert.ok(pairs.every((pair) => pair.actual === null && pair.holds === false), `${mode}, record ${shown(record)}`);
      }
      const pairs = measureColors(mode, { ...colorsOf(mode), "focus-ring": "oklch(0.5 0.1 200)" } as Partial<SemanticColors>, WCAG);
      const hit = pairs.filter((pair) => pair.fg === "focus-ring");
      assert.equal(hit.length, 2);
      assert.ok(hit.every((pair) => pair.actual === null && pair.holds === false && pair.min === 3));
      assert.ok(pairs.filter((pair) => pair.fg !== "focus-ring").every((pair) => pair.holds), "the pairs that do not name it are untouched");
    }
    for (const mode of ["system", "Light", "", undefined, null]) {
      throwsTypeError(() => measureColors(mode as Mode, colorsOf("light"), WCAG), [], `measureColors, mode ${shown(mode)}`);
      throwsTypeError(() => checkColors("probe", mode as Mode, colorsOf("light"), WCAG), [], `checkColors, mode ${shown(mode)}`);
    }
  });

  test("M6.2 a rule whose tier is not one of TIERS makes measureColors throw a TypeError naming its fg, bg and the bad tier — never \"not held\"", () => {
    for (const tier of ["txet", "Text", "text ", "border", "toString", "constructor", "__proto__", "hasOwnProperty", ""]) {
      const rule = { fg: "link-hover", bg: "surface-raised", tier, why: "A rule planted by test-contracts.ts with a tier that does not exist." } as unknown as Rule;
      for (const at of [0, RULES.length]) {
        withRules((rules) => rules.splice(at, 0, rule), () => {
          for (const mode of MODES) {
            throwsTypeError(() => measureColors(mode, colorsOf(mode), WCAG), ["link-hover", "surface-raised", ...(tier.trim() === "" ? [] : [tier])], `tier ${shown(tier)} at RULES[${at}], ${mode}`);
            throwsTypeError(() => checkColors("probe", mode, colorsOf(mode), WCAG), [], `checkColors, tier ${shown(tier)}`);
          }
          throwsTypeError(() => checkPreset(shipped.ocean!), [], `checkPreset, tier ${shown(tier)}`);
        });
      }
    }
    for (const tier of [undefined, null, 3, ["text"]]) {
      const rule = { fg: "link-hover", bg: "surface-raised", tier, why: "A rule planted by test-contracts.ts with no tier." } as unknown as Rule;
      withRules((rules) => rules.push(rule), () => {
        throwsTypeError(() => measureColors("light", colorsOf("light"), WCAG), ["link-hover", "surface-raised"], `tier ${shown(tier)}`);
      });
    }
    // An existing rule, mistyped where it stands.
    withRules((rules) => {
      rules[10] = { ...rules[10]!, tier: "text-subtel" as Tier };
    }, () => {
      throwsTypeError(() => measureColors("dark", colorsOf("dark"), WCAG), [RULES[10]!.fg, RULES[10]!.bg, "text-subtel"], "RULES[10] mistyped");
    });
    check5();
  });

  test("M6.3 an unknown contract name throws a TypeError that contains the name, in measureColors, checkColors and floorFor alike — never treated as wcag-aa", () => {
    for (const name of ["wcag-aaa", "WCAG-AA", "wcag-aa ", "apca", "toString", "constructor", "__proto__", "hasOwnProperty"]) {
      const bad = name as ContractName;
      throwsTypeError(() => measureColors("light", colorsOf("light"), bad), [name], `measureColors, contract ${shown(name)}`);
      throwsTypeError(() => measureColors("dark", undefined, bad), [name], `measureColors with no colours, contract ${shown(name)}`);
      throwsTypeError(() => checkColors("probe", "dark", colorsOf("dark"), bad), [name], `checkColors, contract ${shown(name)}`);
      for (const tier of M4_TIERS) {
        throwsTypeError(() => floorFor(bad, tier, "light"), [name], `floorFor, contract ${shown(name)}, ${tier}`);
      }
    }
    for (const name of ["", undefined, null, 0, contracts[WCAG]]) {
      const bad = name as ContractName;
      throwsTypeError(() => measureColors("light", colorsOf("light"), bad), [], `measureColors, contract ${shown(name)?.slice(0, 40)}`);
      throwsTypeError(() => checkColors("probe", "light", colorsOf("light"), bad), [], `checkColors, contract ${shown(name)?.slice(0, 40)}`);
      throwsTypeError(() => floorFor(bad, "text", "light"), [], `floorFor, contract ${shown(name)?.slice(0, 40)}`);
    }
  });

  test("M3 the contract argument is required: there is no default", () => {
    const measure = measureColors as unknown as (mode: Mode, colors: unknown) => unknown;
    const check = checkColors as unknown as (preset: string, mode: Mode, colors: unknown) => unknown;
    for (const mode of MODES) {
      throwsTypeError(() => measure(mode, colorsOf(mode)), [], `measureColors(${mode}, colors) with no contract`);
      throwsTypeError(() => check("probe", mode, colorsOf(mode)), [], `checkColors("probe", ${mode}, colors) with no contract`);
    }
  });

  test("M6.4 a contract that yields nothing in a mode throws a TypeError naming the contract: a contract over nothing would pass everything", () => {
    // An empty tier map.
    withContract("probe-empty", {}, (name) => {
      for (const mode of MODES) {
        throwsTypeError(() => measureColors(mode, colorsOf(mode), name), ["probe-empty"], `an empty tier map, ${mode}`);
        throwsTypeError(() => measureColors(mode, undefined, name), ["probe-empty"], `an empty tier map and no colours, ${mode}`);
        throwsTypeError(() => checkColors("probe", mode, colorsOf(mode), name), ["probe-empty"], `checkColors, an empty tier map, ${mode}`);
      }
      throwsTypeError(() => checkPreset(declaring({ light: name, dark: name })), ["probe-empty"], "checkPreset, a preset declaring an empty contract");
    });
    withTiers((tiers) => {
      for (const tier of Object.keys(tiers)) {
        delete tiers[tier];
      }
    }, () => {
      throwsTypeError(() => measureColors("light", colorsOf("light"), WCAG), ["wcag-aa"], "wcag-aa with every tier removed");
      throwsTypeError(() => Object.values(shipped).flatMap(checkPreset), ["wcag-aa"], "the gate, with wcag-aa emptied");
    });
    // One that lists no tier any rule uses.
    withContract("probe-focus-only", { focus: floor(3) }, (name) => {
      assert.equal(measureColors("light", colorsOf("light"), name).length, 2);
      withRules((rules) => {
        const kept = rules.filter((rule) => rule.tier !== "focus");
        rules.length = 0;
        rules.push(...kept);
      }, () => {
        for (const mode of MODES) {
          throwsTypeError(() => measureColors(mode, colorsOf(mode), name), ["probe-focus-only"], `a contract listing only a tier no rule uses, ${mode}`);
        }
      });
    });
    // … in ONE mode: the chart rules belong to a mode each.
    withContract("probe-chart-only", { chart: floor({ light: 3, dark: 2.25 }) }, (name) => {
      withRules((rules) => {
        const kept = rules.filter((rule) => rule.mode !== "dark");
        rules.length = 0;
        rules.push(...kept);
      }, () => {
        assert.equal(measureColors("light", colorsOf("light"), name).length, 16, "light still has its 16 chart pairs");
        throwsTypeError(() => measureColors("dark", colorsOf("dark"), name), ["probe-chart-only"], "nothing applies in dark");
      });
    });
    check5();
  });

  test("M6.5 when both the mode and the contract are bad, the mode's TypeError is the one thrown", () => {
    const messageOf = (fn: () => unknown): string => {
      try {
        fn();
      } catch(error) {
        assert.ok(error instanceof TypeError, `it threw ${String(error)}`);
        return error.message;
      }
      return assert.fail("it did not throw");
    };
    for (const mode of ["system", "Light", undefined]) {
      const modeAlone = messageOf(() => measureColors(mode as Mode, colorsOf("light"), WCAG));
      assert.equal(messageOf(() => measureColors(mode as Mode, colorsOf("light"), "no-such-contract" as ContractName)), modeAlone, `measureColors, mode ${shown(mode)}`);
      assert.ok(!modeAlone.includes("no-such-contract"));
      const viaCheck = messageOf(() => checkColors("probe", mode as Mode, colorsOf("light"), WCAG));
      assert.equal(messageOf(() => checkColors("probe", mode as Mode, colorsOf("light"), "no-such-contract" as ContractName)), viaCheck, `checkColors, mode ${shown(mode)}`);
    }
  });

  test("M6.6 holds is `actual !== null && actual >= min`, with min the CONTRACT's floor for the rule's tier in that mode", () => {
    // Under wcag-aa, against the ratios 2d3b765 measured.
    let at = 0;
    for (const preset of Object.values(shipped)) {
      for (const mode of MODES) {
        for (const pair of measureColors(mode, preset.colors[mode], WCAG)) {
          const was = RECORDED[at++]!;
          assert.equal(pair.min, floorFor(WCAG, pair.tier, mode));
          assert.equal(pair.holds, was.actual >= rowOf(pair.tier).floor[mode], `${preset.name}/${mode}: ${pairKey(pair.fg, pair.bg)}`);
        }
      }
    }
    // Raise one tier's floor: its pairs are judged by the new number, and only its pairs.
    for (const raised of [7, 21.5]) {
      withTiers((tiers) => {
        tiers.text!.min = raised;
      }, () => {
        let i = 0;
        let fell = 0;
        for (const preset of Object.values(shipped)) {
          for (const mode of MODES) {
            for (const pair of measureColors(mode, preset.colors[mode], WCAG)) {
              const was = RECORDED[i++]!;
              const min = pair.tier === "text" ? raised : was.floor;
              assert.equal(pair.min, min, `${preset.name}/${mode}: ${pairKey(pair.fg, pair.bg)} with text at ${raised}`);
              assert.equal(pair.holds, pair.actual !== null && pair.actual >= min, `${preset.name}/${mode}: ${pairKey(pair.fg, pair.bg)} at ${pair.actual} against ${min}`);
              assert.equal(pair.holds, was.actual >= min, `${preset.name}/${mode}: ${pairKey(pair.fg, pair.bg)}, by the ratio 2d3b765 measured`);
              fell += pair.holds ? 0 : 1;
            }
          }
        }
        assert.ok(fell > 0, `no pair fell when text was raised to ${raised}`);
        assert.equal(Object.values(shipped).flatMap(checkPreset).length, fell, "the gate fails exactly those");
      });
    }
    // A per-mode floor is read for the mode asked.
    withTiers((tiers) => {
      tiers.chart!.min = { light: 3, dark: 21.5 };
    }, () => {
      assert.ok(measureColors("light", colorsOf("light"), WCAG).every((pair) => pair.holds));
      assert.deepEqual(measureColors("dark", colorsOf("dark"), WCAG).filter((pair) => !pair.holds).map((pair) => pair.tier), new Array(16).fill("chart"));
    });
    // The comparison is ≥: a ratio exactly on its floor holds; the floor a hair above it does not.
    const ring = measureColors("light", colorsOf("light"), WCAG).find((pair) => pair.fg === "focus-ring" && pair.bg === "bg")!;
    const ringNow = () => measureColors("light", colorsOf("light"), WCAG).find((pair) => pair.fg === "focus-ring" && pair.bg === "bg")!;
    assert.ok(typeof ring.actual === "number" && ring.actual > 1);
    withTiers((tiers) => {
      tiers.focus!.min = ring.actual;
    }, () => assert.deepEqual([ringNow().min, ringNow().holds], [ring.actual, true], "a ratio exactly on its floor"));
    withTiers((tiers) => {
      tiers.focus!.min = ring.actual! * (1 + 1e-12);
    }, () => assert.equal(ringNow().holds, false, "a floor a hair above the ratio"));
    // A pair that was not measured never holds, whatever the floor. (M10.2: "A floor must be finite and GREATER
    // than 1" — this used a floor of exactly 1, which is now refused; the least floor is a hair above it.)
    withTiers((tiers) => {
      tiers.text!.min = 1.000001;
    }, () => assert.ok(measureColors("light", {}, WCAG).every((pair) => pair.actual === null && pair.holds === false)));
    check5();
  });

  test("M6.7 floorFor: a known tier the contract does not list is undefined; a per-mode floor is the mode's number", () => {
    // M10.2: "A floor must be finite and GREATER than 1." This probe used to list `text: floor(1)` and expect 1
    // back ("1 is a ratio that can exist"); a floor of exactly 1 is now refused (the M10.2 test below), so the
    // probe lists a hair above it.
    withContract("probe-partial", { focus: floor(3), chart: floor({ light: 4, dark: 2 }), text: floor(1.000001) }, (name) => {
      for (const mode of MODES) {
        assert.equal(floorFor(name, "focus", mode), 3);
        assert.equal(floorFor(name, "text", mode), 1.000001, "anything greater than 1 is a floor");
        for (const tier of ["text-subtle", "scrim", "control-border", "shape"] as Tier[]) {
          assert.equal(floorFor(name, tier, mode), undefined, `${tier}, ${mode}`);
        }
      }
      assert.equal(floorFor(name, "chart", "light"), 4);
      assert.equal(floorFor(name, "chart", "dark"), 2);
    });
  });

  test("M6.7 floorFor throws a TypeError on a mode that is neither light nor dark — for every tier", () => {
    for (const mode of ["system", "Light", "", undefined, null]) {
      for (const tier of M4_TIERS) {
        throwsTypeError(() => floorFor(WCAG, tier, mode as Mode), [], `floorFor(wcag-aa, ${tier}, ${shown(mode)})`);
      }
      withContract("probe-partial", { focus: floor(3) }, (name) => {
        throwsTypeError(() => floorFor(name, "focus", mode as Mode), [], `a listed tier, mode ${shown(mode)}`);
        throwsTypeError(() => floorFor(name, "text", mode as Mode), [], `a tier the contract does not list, mode ${shown(mode)}`);
      });
    }
  });

  test("M6.7 floorFor throws a TypeError on a tier that is not one of TIERS", () => {
    for (const tier of ["txet", "Text", "border", "toString", "constructor", "__proto__", "", undefined, null]) {
      for (const mode of MODES) {
        throwsTypeError(() => floorFor(WCAG, tier as Tier, mode), [], `floorFor(wcag-aa, ${shown(tier)}, ${mode})`);
      }
    }
    // … even when a contract lists it: it is still not a tier.
    withContract("probe-stray", { focus: floor(3), txet: floor(4.5) }, (name) => {
      throwsTypeError(() => floorFor(name, "txet" as Tier, "light"), [], "a tier a contract invents");
    });
  });

  test("M6.7 floorFor throws a TypeError when a per-mode floor lacks the asked mode", () => {
    // M10.1: "any listed tier's floor is unusable in either mode, whichever mode was asked (a per-mode floor must
    // carry a usable number for both light and dark)". This used to expect the half that IS there to answer
    // (chart light 3, focus dark 3); the contract is now refused whole, so both of those throw too.
    withContract("probe-half", { chart: floor({ light: 3 }), focus: floor({ dark: 3 }), shape: floor({}) }, (name) => {
      throwsTypeError(() => floorFor(name, "chart", "light"), [], "chart has a light floor and no dark one, asked for light");
      throwsTypeError(() => floorFor(name, "chart", "dark"), [], "chart has no dark floor");
      throwsTypeError(() => floorFor(name, "focus", "dark"), [], "focus has a dark floor and no light one, asked for dark");
      throwsTypeError(() => floorFor(name, "focus", "light"), [], "focus has no light floor");
      throwsTypeError(() => floorFor(name, "shape", "light"), [], "shape has neither");
    });
  });

  test("M6.7 floorFor throws a TypeError when the tier's metric is not the ratio", () => {
    withContract("probe-metric", { text: floor(4.5) }, (name) => assert.equal(floorFor(name, "text", "light"), 4.5, "the probe is sound when its metric is the ratio"));
    for (const metric of ["apca", "Ratio", "", undefined, null]) {
      // Spread, not floor()'s second argument: `undefined` there would fall back to "ratio".
      withContract("probe-metric", { text: { ...floor(4.5), metric }, chart: { ...floor({ light: 3, dark: 2.25 }), metric } }, (name) => {
        for (const mode of MODES) {
          throwsTypeError(() => floorFor(name, "text", mode), [], `metric ${shown(metric)}`);
          throwsTypeError(() => floorFor(name, "chart", mode), [], `metric ${shown(metric)}, a per-mode floor`);
        }
      });
    }
  });

  // M10.2: "A floor must be finite and GREATER than 1. This replaces 'at least 1' in M6.6 and M6.7." So 1 joins the
  // refused floors here, and a floor that reaches a verdict is > 1 where this said ≥ 1.
  test("M6.7 floorFor throws a TypeError when the floor is not a finite number > 1 (M10.2) — and no such floor ever reaches a verdict", () => {
    for (const min of [null, undefined, 0, -3, 0.99, 1, "4.5", "", NaN, Infinity, -Infinity, true, [4.5]]) {
      for (const tiers of [{ text: floor(min) }, { text: floor({ light: min, dark: min }) }]) {
        withContract("probe-floor", tiers, (name) => {
          for (const mode of MODES) {
            throwsTypeError(() => floorFor(name, "text", mode), [], `a floor of ${String(min)} (${typeof tiers.text.min === "object" && !Array.isArray(tiers.text.min) && tiers.text.min !== null ? "per mode" : "one number"}), ${mode}`);
            // "…would otherwise pass every pair": whatever measureColors does with it, it must not judge by it.
            let pairs: Measurement[] = [];
            try {
              pairs = measureColors(mode, colorsOf(mode), name);
            } catch(error) {
              // Refusing is one way not to judge by it. The specification names the error for floorFor only.
              assert.ok(error instanceof Error, `measureColors threw ${String(error)}`);
            }
            for (const pair of pairs) {
              assert.ok(typeof pair.min === "number" && Number.isFinite(pair.min) && pair.min > 1, `measureColors judged ${pairKey(pair.fg, pair.bg)} against a floor of ${String(pair.min)}`);
            }
          }
        });
      }
    }
    // One mode's number bad. M10.1: "any listed tier's floor is unusable in either mode, whichever mode was asked"
    // — this used to expect the good mode to answer still (dark, 2.25); it is refused with the bad one.
    withContract("probe-floor", { chart: floor({ light: 0, dark: 2.25 }) }, (name) => {
      throwsTypeError(() => floorFor(name, "chart", "light"), [], "light is 0");
      throwsTypeError(() => floorFor(name, "chart", "dark"), [], "light is 0, asked for dark");
    });
  });

  // ── M6.8: the callers ───────────────────────────────────────────────────
  test("M6.8 the report prints exactly what it printed at 2d3b765", () => {
    const run = node(["tools/check-contrast.ts"], pkgRoot);
    assert.equal(run.stderr, "");
    assert.equal(run.status, 0);
    assert.equal(run.stdout, readFileSync(join(fixtures, "check-contrast.report.txt"), "utf8"));
  });

  test("M6.8 the reports, check-cli and the playground module pass contractOf(preset, mode); no file but Token Studio names a contract to the measurement", () => {
    for (const file of [
      "packages/design-system/tools/check-contrast.ts",
      "packages/cli/src/index.ts",
      "packages/cli/scaffold/tools/check-contrast.ts",
      "tools/check-cli.ts",
      "apps/playground/src/contrast-checks.ts",
    ]) {
      const text = body(join(repoRoot, file));
      assert.match(text, /\b(?:measureColors|checkColors)\(/, `${file} no longer measures: take it out of this list`);
      assert.match(text, /\bcontractOf\(/, `${file} measures a preset without asking contractOf() which contract it declares`);
    }
    const ALLOWED = new Set([
      "packages/component-library/src/organisms/token-studio.tsx", // M6.8: it does not yet know which preset is loaded
      "packages/design-system/tools/test-contrast.ts", // M9: every call there passes "wcag-aa"
      "packages/design-system/tools/test-contracts.ts", // this file
    ]);
    const literal = sources(repoRoot)
      .filter((file) => /\b(?:measureColors|checkColors|floorFor)\([^;]*?["'`]wcag-aa["'`]/.test(body(file)))
      .map(posix)
      .filter((path) => !ALLOWED.has(path));
    assert.deepEqual(literal, [], "a caller that decides the contract for itself: it must pass contractOf(preset, mode), so that a preset's declaration is the one place that decides");
  });

  test("M6.8 Token Studio passes the literal \"wcag-aa\", under a comment that says it does not yet know which preset is loaded", () => {
    const lines = readFileSync(join(repoRoot, "packages/component-library/src/organisms/token-studio.tsx"), "utf8").split("\n");
    const call = "setFailures(checkColors(\"studio\", mode, colors, \"wcag-aa\"));";
    const at = lines.flatMap((line, i) => (line.trim() === call ? [i] : []));
    assert.equal(at.length, 1, `token-studio.tsx should hold exactly one line reading: ${call}`);
    const above: string[] = [];
    for (let i = at[0]! - 1; i >= 0 && /^\s*(\/\/|\/\*|\*)/.test(lines[i]!); i--) {
      above.unshift(lines[i]!.replace(/^\s*(\/\/+|\/\*+|\*+\/?)\s?/, "").replace(/\*\/\s*$/, "").trim());
    }
    assert.ok(above.length > 0, "there is no comment directly above the call");
    assert.ok(above.join(" ").replace(/\s+/g, " ").includes("does not yet know which preset is loaded"), `the comment directly above the call reads: ${above.join(" ")}`);
  });

  // ── M9.7, M6.9: what is emitted ─────────────────────────────────────────
  test("M6.9 the manifest carries each preset's contract as the LAST key of its entry, after the five it had", () => {
    const entries = JSON.parse(manifest(shipped)) as Record<string, unknown>[];
    assert.equal(entries.length, 5);
    entries.forEach((entry, i) => {
      const preset = Object.values(shipped)[i]!;
      assert.deepEqual(Object.keys(entry), ["name", "label", "tagline", "defaultMode", "radiusStyle", "contract"], preset.name);
      assert.deepEqual(entry, {
        name: preset.name, label: preset.label, tagline: preset.tagline, defaultMode: preset.defaultMode, radiusStyle: preset.radiusStyle,
        contract: { light: "wcag-aa", dark: "wcag-aa" },
      });
      assert.deepEqual(Object.keys(entry.contract as object), ["light", "dark"]);
    });
    // The preset's OWN declaration, not a constant.
    withContract("probe-other", structuredClone(contracts[WCAG].tiers) as unknown as Floors, (name) => {
      const [entry] = JSON.parse(manifest({ probe: declaring({ light: "wcag-aa", dark: name }) })) as Record<string, unknown>[];
      assert.deepEqual(entry!.contract, { light: "wcag-aa", dark: name });
      assert.equal(Object.keys(entry!).at(-1), "contract");
    });
  });

  test("M6.9 no theme file changes: every preset's CSS is its golden file, byte for byte", () => {
    for (const preset of Object.values(shipped)) {
      assert.equal(themeCss(preset), readFileSync(join(pkgRoot, "tools", "golden", `${preset.name}.css`), "utf8"), preset.name);
      assert.ok(!themeCss(preset).includes("wcag-aa"), `${preset.name}: the contract's name reached the theme file`);
    }
  });

  test("M8 the list of frozen themes in check-golden.ts is not derived from a preset's contract", () => {
    assert.doesNotMatch(code(join(pkgRoot, "tools", "check-golden.ts")), /\bcontractOf\b|\.contract\b|\bcontracts\b/);
  });

  // ── M9.6: the instruments ───────────────────────────────────────────────
  test("M7 apcaLc: the eight published values, to 1e-9 — positive for dark text on light, negative for light on dark", () => {
    const published: [text: string, background: string, lc: number][] = [
      ["#888", "#fff", 63.056469930209424],
      ["#fff", "#888", -68.54146436644962],
      ["#000", "#aaa", 58.146262578561334],
      ["#aaa", "#000", -56.24113336839742],
      ["#123", "#def", 91.66830811481631],
      ["#def", "#123", -93.06770049484275],
      ["#123", "#444", 8.32326136957393],
      ["#444", "#123", -7.526878460278154],
    ];
    for (const [text, background, lc] of published) {
      assert.ok(near(apcaLc(text, background), lc, 1e-9), `${text} on ${background} is ${lc}, and it said ${apcaLc(text, background)}`);
    }
  });

  test("M7 apcaLc: the two zero cases, and the reverse of the first, which is not zero", () => {
    assert.ok(apcaLc("#888", "#999") === 0, `#888 on #999 is 0, and it said ${apcaLc("#888", "#999")}`);
    assert.ok(apcaLc("#777", "#777") === 0, `#777 on #777 is 0, and it said ${apcaLc("#777", "#777")}`);
    assert.ok(near(apcaLc("#999", "#888"), -7.849647529091758, 1e-9), `#999 on #888 is −7.849647529091758, and it said ${apcaLc("#999", "#888")}`);
  });

  test("M7 oklabOf: the five published values, to 1e-6", () => {
    const published: [color: string, lab: [number, number, number]][] = [
      ["#ff0000", [0.627955, 0.224863, 0.125846]],
      ["#00ff00", [0.866440, -0.233888, 0.179498]],
      ["#0000ff", [0.452014, -0.032457, -0.311528]],
      ["#000000", [0, 0, 0]],
      ["#ffffff", [1, 0, 0]],
    ];
    for (const [value, lab] of published) {
      const got = oklabOf(value);
      assert.ok(Array.isArray(got) && got.length === 3, `oklabOf(${value}) is ${shown(got)}`);
      lab.forEach((component, i) => assert.ok(near(got[i], component, 1e-6), `${value}: ${"Lab"[i]} is ${component}, and it said ${got[i]}`));
    }
  });

  const SEPARATIONS: [a: string, b: string, none: number, protan: number, deutan: number, tritan: number][] = [
    ["#008289", "#9e6400", 19.472571036629873, 14.61818592879111, 15.742857549545816, 21.169819272558314],
    ["#ec5198", "#8a6f00", 26.53416007752937, 16.89457050891632, 15.850368872011622, 19.410368065524125],
    ["#0f70d5", "#e8672e", 35.36055657939406, 26.220374004871775, 33.59562229960631, 32.90604947566381],
  ];
  const KINDS = ["protan", "deutan", "tritan"] as const;

  test("M7 separation: the twelve check values, to 1e-9 — the simulated colours go to OKLab as floats, never through the 8-bit hex", () => {
    for (const [a, b, none, ...viewed] of SEPARATIONS) {
      assert.ok(near(separation(a, b), none, 1e-9), `${a} and ${b}: ${none}, and it said ${separation(a, b)}`);
      KINDS.forEach((kind, i) => {
        assert.ok(near(separation(a, b, kind), viewed[i]!, 1e-9), `${a} and ${b} under ${kind}: ${viewed[i]}, and it said ${separation(a, b, kind)}`);
      });
    }
  });

  test("M7 separation is symmetric, and 0 for identical colours — with a view and without", () => {
    for (const view of [undefined, ...KINDS]) {
      for (const [a, b] of SEPARATIONS) {
        assert.equal(separation(a, b, view), separation(b, a, view), `${a} and ${b}, view ${view}`);
        assert.ok(separation(a, a, view) === 0 && separation(b, b, view) === 0, `${a} with itself, view ${view}: ${separation(a, a, view)}`);
      }
    }
  });

  test("M7 separation is the Euclidean distance in OKLab, times 100", () => {
    const lab: Record<string, [number, number, number]> = {
      "#ff0000": [0.627955, 0.224863, 0.125846], "#00ff00": [0.866440, -0.233888, 0.179498], "#0000ff": [0.452014, -0.032457, -0.311528], "#000000": [0, 0, 0], "#ffffff": [1, 0, 0],
    };
    const names = Object.keys(lab);
    for (const a of names) {
      for (const b of names) {
        const published = Math.hypot(lab[a]![0] - lab[b]![0], lab[a]![1] - lab[b]![1], lab[a]![2] - lab[b]![2]) * 100;
        assert.ok(near(separation(a, b), published, 1e-3), `${a} and ${b}: ${published} from the published OKLab values, and it said ${separation(a, b)}`);
        const [p, q] = [oklabOf(a)!, oklabOf(b)!];
        assert.ok(near(separation(a, b), Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) * 100, 1e-9), `${a} and ${b}: not the distance between what oklabOf says they are`);
      }
    }
  });

  test("M7 the instruments read a colour as parseColor does: any spelling of the same colour is the same colour", () => {
    for (const [plain, respelled] of [["#ff0000", "red"], ["#ff0000", "#F00"], ["#ff0000", " rgb(255, 0, 0) "], ["#0000ff", "rgb(0 0 255 / 100%)"], ["#ffffff", "#ffffffff"]] as const) {
      assert.deepEqual(oklabOf(respelled), oklabOf(plain), `oklabOf(${shown(respelled)})`);
      assert.equal(apcaLc(respelled, "#808080"), apcaLc(plain, "#808080"), `apcaLc(${shown(respelled)}, …)`);
      assert.equal(apcaLc("#808080", respelled), apcaLc("#808080", plain), `apcaLc(…, ${shown(respelled)})`);
      assert.equal(separation(respelled, "#008289"), separation(plain, "#008289"), `separation(${shown(respelled)}, …)`);
      for (const kind of KINDS) {
        assert.equal(simulateCvd(respelled, kind), simulateCvd(plain, kind), `simulateCvd(${shown(respelled)}, ${kind})`);
        assert.equal(separation("#008289", respelled, kind), separation("#008289", plain, kind), `separation(…, ${shown(respelled)}, ${kind})`);
      }
    }
  });

  // What parseColor cannot read, what is not opaque, and what is not a string at all.
  const UNREADABLE: unknown[] = ["nope", "", "#ff", "#ggg", "oklch(0.5 0.1 200)", "hsl(0 0% 0%)", "var(--sb-text)", "rgb(256 0 0)", "rgb(0 0 0 / 0.5)", "#ffffff80", "#fff8", "transparent", undefined, null, 42, {}, ["#ffffff"]];

  test("M7 bad input: a colour that cannot be read, is not opaque or is not a string is null for oklabOf, apcaLc and separation — in either seat, with a view or without", () => {
    for (const value of UNREADABLE) {
      const bad = value as string;
      const what = shown(value);
      assert.equal(oklabOf(bad), null, `oklabOf(${what})`);
      assert.equal(apcaLc(bad, "#ffffff"), null, `apcaLc(${what}, #ffffff)`);
      assert.equal(apcaLc("#000000", bad), null, `apcaLc(#000000, ${what})`);
      assert.equal(apcaLc(bad, bad), null, `apcaLc(${what}, ${what})`);
      assert.equal(separation(bad, "#ffffff"), null, `separation(${what}, #ffffff)`);
      assert.equal(separation("#000000", bad), null, `separation(#000000, ${what})`);
      for (const kind of KINDS) {
        assert.equal(separation(bad, "#ffffff", kind), null, `separation(${what}, #ffffff, ${kind}): null, not a throw`);
        assert.equal(separation("#000000", bad, kind), null, `separation(#000000, ${what}, ${kind}): null, not a throw`);
      }
    }
  });

  test("M7 bad input: simulateCvd throws a TypeError on a value that is not an opaque colour parseColor can read", () => {
    for (const value of UNREADABLE) {
      for (const kind of KINDS) {
        throwsTypeError(() => simulateCvd(value as string, kind), [], `simulateCvd(${shown(value)}, ${kind})`);
      }
    }
  });

  test("M7 bad input: a kind or view that is not protan, deutan or tritan throws a TypeError naming it, in simulateCvd and separation alike", () => {
    for (const kind of ["protanopia", "deuteranopia", "tritanopia", "Protan", "protan ", "normal", "toString"]) {
      throwsTypeError(() => simulateCvd("#008289", kind as color.CvdKind), [kind], `simulateCvd(…, ${shown(kind)})`);
      throwsTypeError(() => separation("#008289", "#9e6400", kind as color.CvdKind), [kind], `separation(…, …, ${shown(kind)})`);
    }
    for (const kind of ["", null, 0, 1, {}]) {
      throwsTypeError(() => simulateCvd("#008289", kind as color.CvdKind), [], `simulateCvd(…, ${shown(kind)})`);
      throwsTypeError(() => separation("#008289", "#9e6400", kind as color.CvdKind), [], `separation(…, …, ${shown(kind)})`);
    }
    throwsTypeError(() => simulateCvd("#008289", undefined as unknown as color.CvdKind), [], "simulateCvd with no kind");
  });

  test("M7 simulateCvd is the simulation an independent implementation computes: twelve colours under each of the three kinds, as 6-digit lower-case hex", () => {
    assert.ok(new Set(SIMULATED.map((row) => row.color)).size >= 3, "the fixture holds fewer than three colours");
    assert.deepEqual([...new Set(SIMULATED.map((row) => row.kind))].sort(), [...KINDS].sort(), "the fixture does not cover the three kinds");
    assert.ok(SIMULATED.some((row) => row.hex !== row.color), "the fixture's simulation changes nothing: it proves nothing");
    for (const { color: value, kind, hex } of SIMULATED) {
      const got = simulateCvd(value, kind as color.CvdKind);
      assert.match(String(got), /^#[0-9a-f]{6}$/, `simulateCvd(${value}, ${kind}) is ${shown(got)}`);
      assert.equal(got, hex, `${value} under ${kind}`);
    }
  });

  test("M7 the simulation fixture is still what its script produces (python3; skipped where there is none)", () => {
    const run = spawnSync("python3", [join(fixtures, "simulate_cvd.py"), "--check"], { encoding: "utf8" });
    if (run.error) {
      console.log(`      (python3 is not here: ${run.error.message})`);
      return;
    }
    assert.equal(run.status, 0, `simulate-cvd.json is not what simulate_cvd.py writes:\n${run.stdout}${run.stderr}`);
  });

  test("M7 the four instruments are exported from color.ts and are NOT on the public barrel", () => {
    for (const name of ["oklabOf", "apcaLc", "simulateCvd", "separation"]) {
      assert.equal(typeof (color as Record<string, unknown>)[name], "function", `color.ts does not export ${name}()`);
      assert.ok(!(name in tokens), `src/tokens/index.ts exports ${name}: not in this increment`);
    }
  });

  test("M7 in this increment the instruments are called only by this file and by the chart gate", () => {
    const MAY_CALL = new Set([
      "packages/design-system/src/tokens/color.ts", // defines them (separation simulates through its own code)
      "packages/design-system/tools/check-cvd.ts",
      "packages/design-system/tools/test-contracts.ts",
    ]);
    const callers = sources(repoRoot)
      .filter((file) => /\b(?:oklabOf|apcaLc|simulateCvd|separation)\(/.test(code(file)))
      .map(posix)
      .filter((path) => !MAY_CALL.has(path));
    assert.deepEqual(callers, [], "a caller the specification does not name: the contract that uses these instruments is a later pull request");
  });

  test("M7 the chart gate's report is identical, character for character, to the report at 2d3b765", () => {
    const run = node(["tools/check-cvd.ts"], pkgRoot);
    assert.equal(run.stderr, "");
    assert.equal(run.status, 0);
    assert.equal(run.stdout, readFileSync(join(fixtures, "check-cvd.report.txt"), "utf8"));
    assert.deepEqual(chartGate.checkCvd(), [], "the chart gate fails a shipped palette");
  });

  test("M7 the chart gate carries no copy of the simulation or of OKLab: cvdDeltaE is separation with a view, under the gate's own names", () => {
    const source = code(join(pkgRoot, "tools", "check-cvd.ts"));
    assert.match(source, /\bseparation\(/, "check-cvd.ts does not call separation()");
    assert.doesNotMatch(source, /0\.152286|0\.367322|0\.4122214708|0\.2104542553|Math\.cbrt|0\.04045/, "check-cvd.ts still carries a matrix, the OKLab conversion or the sRGB decode of its own");
    for (const [a, b, , protan, deutan] of SEPARATIONS) {
      assert.equal(chartGate.cvdDeltaE(a, b, "protanopia"), separation(a, b, "protan"), `${a} and ${b}: the gate's protanopia is the shared protan`);
      assert.equal(chartGate.cvdDeltaE(a, b, "deuteranopia"), separation(a, b, "deutan"), `${a} and ${b}: the gate's deuteranopia is the shared deutan`);
      assert.ok(near(chartGate.cvdDeltaE(a, b, "protanopia"), protan, 1e-9) && near(chartGate.cvdDeltaE(a, b, "deuteranopia"), deutan, 1e-9), `${a} and ${b}: the gate no longer measures what it measured at 2d3b765`);
    }
  });

  // ══ M10: the correction of 2026-10-04 — what two audits of the built increment found ══

  /** M10.1: every way in refuses the contract `name`, with a TypeError that names it and says `words`. */
  function refusedEverywhere(name: ContractName, words: string[], what: string) {
    const says = [String(name), ...words];
    for (const mode of MODES) {
      const other: Mode = mode === "light" ? "dark" : "light";
      for (const tier of M4_TIERS) {
        throwsTypeError(() => floorFor(name, tier, mode), says, `${what}: floorFor(${name}, ${tier}, ${mode})`);
      }
      throwsTypeError(() => measureColors(mode, colorsOf(mode), name), says, `${what}: measureColors(${mode})`);
      throwsTypeError(() => measureColors(mode, undefined, name), says, `${what}: measureColors(${mode}) with no colours`);
      throwsTypeError(() => checkColors("probe", mode, colorsOf(mode), name), says, `${what}: checkColors(${mode})`);
      const preset = declaring({ [mode]: name, [other]: name === WCAG ? name : "wcag-aa" });
      throwsTypeError(() => contractOf(preset, mode), says, `${what}: contractOf(a preset declaring it for ${mode})`);
      throwsTypeError(() => checkPreset(preset), says, `${what}: checkPreset(a preset declaring it for ${mode} only)`);
    }
  }
  /** Run `fn` with `contract` planted under `key` exactly as given: its name and its tiers are whatever they are. */
  function withRaw(key: string, contract: unknown, fn: (name: ContractName) => void) {
    assert.ok(!Object.hasOwn(book, key), `a contract called ${key} already exists`);
    book[key] = contract as Contract;
    try {
      fn(key as ContractName);
    } finally {
      delete book[key];
    }
  }
  const wcagTiers = () => structuredClone(contracts[WCAG].tiers) as unknown as Floors;

  // ── M10.1: a contract is validated whole before it is used ──────────────
  test("M10.1 a contract whose `tiers` is not a non-null, non-array object is refused by floorFor, measureColors, checkColors, checkPreset and contractOf: a TypeError naming the contract", () => {
    for (const tiers of [null, undefined, [], [floor(4.5)], "text", 42, true]) {
      withRaw("probe-tiers", { name: "probe-tiers", calibratedFor: "Nobody: a probe.", tiers }, (name) => refusedEverywhere(name, [], `tiers is ${shown(tiers)}`));
    }
    withRaw("probe-tiers", { name: "probe-tiers", calibratedFor: "Nobody: a probe." }, (name) => refusedEverywhere(name, [], "no `tiers` at all"));
    // wcag-aa itself, where a gate would meet it.
    const wcag = book[WCAG] as unknown as { tiers: unknown };
    const saved = wcag.tiers;
    try {
      wcag.tiers = [saved];
      refusedEverywhere(WCAG, [], "wcag-aa's tiers wrapped in an array");
      throwsTypeError(() => Object.values(shipped).flatMap(checkPreset), ["wcag-aa"], "the gate");
    } finally {
      wcag.tiers = saved;
    }
    check5();
  });

  test("M10.1 a contract whose tier map has a key that is not one of TIERS is refused everywhere, by a TypeError naming the contract and the key — `txet` for `text` never measures 28 pairs", () => {
    // The critical finding, as it was found: a copy of wcag-aa whose map says `txet` where it means `text`.
    const mistyped = wcagTiers();
    mistyped.txet = mistyped.text!;
    delete mistyped.text;
    withContract("probe-txet", mistyped, (name) => {
      for (const mode of MODES) {
        let pairs: Measurement[] | undefined;
        try {
          pairs = measureColors(mode, colorsOf(mode), name);
        } catch {
          // Refusing is the behaviour; the error itself is examined below.
        }
        assert.equal(pairs, undefined, `${mode}: a contract that says txet for text measured ${pairs?.length} pairs (70 − 42 is 28) instead of refusing`);
        assert.throws(() => checkColors("probe", mode, colorsOf(mode), name), `${mode}: checkColors reported on it — "no failures", over the 28 pairs that are not text`);
      }
      refusedEverywhere(name, ["txet"], "txet for text");
    });
    // A stray key beside all seven good ones is refused just the same: a key that is not a tier is never legitimate.
    for (const key of ["txet", "Text", "text ", "border", "texts", "toString", "constructor", "hasOwnProperty", ""]) {
      withContract("probe-stray-key", { ...wcagTiers(), [key]: floor(4.5) }, (name) => refusedEverywhere(name, key.trim() === "" ? [] : [key], `a stray key ${shown(key)}`));
    }
    withContract("probe-stray-key", { focus: floor(3), border: floor(3) }, (name) => {
      // Asked only about the tier that IS good: the contract is validated whole.
      throwsTypeError(() => floorFor(name, "focus", "light"), ["probe-stray-key", "border"], "floorFor of the good tier beside a stray key");
    });
    // In wcag-aa itself: no gate may print its success line.
    withTiers((tiers) => {
      tiers.txet = tiers.text!;
      delete tiers.text;
    }, () => {
      refusedEverywhere(WCAG, ["txet"], "wcag-aa with text respelled txet");
      throwsTypeError(() => Object.values(shipped).flatMap(checkPreset), ["wcag-aa", "txet"], "the gate, wcag-aa with text respelled txet");
      for (const preset of Object.values(shipped)) {
        throwsTypeError(() => contractOf(preset, "light"), ["wcag-aa", "txet"], `contractOf(${preset.name})`);
      }
    });
    // A tier a contract does NOT list is still legitimate, and means "not held".
    withContract("probe-focus-only", { focus: floor(3) }, (name) => {
      assert.equal(measureColors("light", colorsOf("light"), name).length, 2);
      assert.equal(floorFor(name, "text", "light"), undefined);
      assert.equal(contractOf(declaring({ light: name, dark: name }), "light"), name);
    });
    check5();
  });

  {
    const tree = plant("a-mistyped-tier-key", {
      contracts: "\n// test-contracts.ts: wcag-aa says `txet` where it means `text`, in a temporary copy.\n{\n  const tiers = contracts[\"wcag-aa\"].tiers as Record<string, unknown>;\n  tiers.txet = tiers.text;\n  delete tiers.text;\n}\n",
    });
    for (const surface of RUNS) {
      test(`M10.1 ${surface.name}, when wcag-aa's tier map says txet for text: a non-zero exit and a TypeError naming wcag-aa and txet — no success line, nothing written`, () => {
        const run = surface.run(tree);
        assert.ok(run.status !== 0 && run.status !== null, `${surface.name} exited ${run.status} over a contract that holds 28 pairs of 70:\n${run.stdout}\n${run.stderr}`);
        // A failure that is not this TypeError is a surface that got PAST the contract (a gate, as far as writing into a copy with nowhere to write).
        for (const word of ["TypeError", "wcag-aa", "txet"]) {
          assert.ok(run.stderr.includes(word), `${surface.name} did not refuse the contract: it failed, and not with a TypeError that says "${word}":\n${run.stderr.slice(0, 600)}`);
        }
        assert.doesNotMatch(run.stdout, /holds/, `${surface.name} said the contract holds`);
        assert.doesNotMatch(`${run.stdout}${run.stderr}`, /\b28\b/, `${surface.name} measured 28 pairings`);
        assert.ok(!surface.wrote(tree), `${surface.name} wrote its output`);
      });
    }
  }

  test("M10.1 a contract whose `name` is not the key it is registered under is refused everywhere, by a TypeError naming the contract", () => {
    for (const named of ["wcag-aa", "Probe-alias", "probe-alias ", "", undefined, null, 42]) {
      withRaw("probe-alias", { name: named, calibratedFor: "Nobody: a probe.", tiers: wcagTiers() }, (name) => refusedEverywhere(name, [], `registered as probe-alias, named ${shown(named)}`));
    }
    withRaw("probe-alias", { calibratedFor: "Nobody: a probe.", tiers: wcagTiers() }, (name) => refusedEverywhere(name, [], "registered as probe-alias, with no name"));
    // The probe is sound: the same contract under its own name is accepted.
    withRaw("probe-alias", { name: "probe-alias", calibratedFor: "Nobody: a probe.", tiers: wcagTiers() }, (name) => {
      assert.equal(measureColors("light", colorsOf("light"), name).length, 70);
      assert.equal(contractOf(declaring({ light: name, dark: name }), "dark"), name);
    });
    const wcag = book[WCAG] as unknown as { name: unknown };
    try {
      wcag.name = "wcag-aaa";
      refusedEverywhere(WCAG, [], "wcag-aa renamed in place");
    } finally {
      wcag.name = "wcag-aa";
    }
    check5();
  });

  test("M10.1 a per-mode floor must carry a usable number for BOTH modes: a bad half refuses the contract whichever mode is asked, and whichever tier", () => {
    const ABSENT = Symbol("absent");
    for (const bad of [ABSENT, undefined, null, 0, 1, 0.5, -3, "2.25", NaN, Infinity]) {
      for (const badMode of MODES) {
        const goodMode: Mode = badMode === "light" ? "dark" : "light";
        const min: Record<string, unknown> = { [goodMode]: 3 };
        if (bad !== ABSENT) {
          min[badMode] = bad;
        }
        const what = `chart's ${badMode} floor is ${bad === ABSENT ? "absent" : String(bad)}`;
        withContract("probe-half", { text: floor(4.5), chart: floor(min) }, (name) => {
          // The new part: asked only for the mode whose half is good — and for a tier that is good in both.
          throwsTypeError(() => floorFor(name, "chart", goodMode), ["probe-half"], `${what}: floorFor(chart, ${goodMode})`);
          throwsTypeError(() => floorFor(name, "text", goodMode), ["probe-half"], `${what}: floorFor(text, ${goodMode})`);
          throwsTypeError(() => measureColors(goodMode, colorsOf(goodMode), name), ["probe-half"], `${what}: measureColors(${goodMode})`);
          throwsTypeError(() => checkPreset(declaring({ [goodMode]: name, [badMode]: "wcag-aa" })), ["probe-half"], `${what}: checkPreset of a preset that declares it for ${goodMode} only`);
          refusedEverywhere(name, [], what);
        });
      }
    }
    // In wcag-aa itself: a caller that measures only light must see the bad dark half.
    withTiers((tiers) => {
      tiers.chart!.min = { light: 3 };
    }, () => {
      throwsTypeError(() => measureColors("light", colorsOf("light"), WCAG), ["wcag-aa"], "wcag-aa with no dark chart floor, measuring light");
      throwsTypeError(() => floorFor(WCAG, "text", "light"), ["wcag-aa"], "wcag-aa with no dark chart floor, floorFor(text, light)");
      refusedEverywhere(WCAG, [], "wcag-aa with no dark chart floor");
    });
    check5();
  });

  test("M10.1 any listed tier's unusable floor refuses the WHOLE contract: asking about a good tier does not get past a bad one", () => {
    const unusable: [what: string, entry: unknown][] = [
      ["a floor of 0", floor(0)],
      ["a floor of null", floor(null)],
      ["a floor that is a string", floor("3")],
      ["a floor that is NaN", floor(NaN)],
      ["a floor with neither mode", floor({})],
      ["a metric that is not the ratio", { ...floor(3), metric: "apca" }],
      ["no floor object at all: null", null],
      ["no floor object at all: a bare number", 3],
    ];
    for (const [what, entry] of unusable) {
      withContract("probe-one-bad", { text: floor(4.5), focus: entry } as unknown as Floors, (name) => {
        throwsTypeError(() => floorFor(name, "text", "light"), ["probe-one-bad"], `focus has ${what}: floorFor(text, light)`);
        refusedEverywhere(name, [], `focus has ${what}`);
      });
    }
    check5();
  });

  // ── M10.2: a floor must be finite and greater than 1 ────────────────────
  test("M10.2 a floor of exactly 1 is refused — it passes every pair, which is the reason 0 is refused; anything greater than 1 is a floor", () => {
    for (const min of [1, { light: 1, dark: 1 }, { light: 1, dark: 3 }, { light: 3, dark: 1 }]) {
      withContract("probe-one", { text: floor(min) }, (name) => refusedEverywhere(name, [], `a text floor of ${shown(min)}`));
    }
    // What it is for: with text at 1, text the colour of its own page (a ratio of exactly 1) would hold.
    withTiers((tiers) => {
      tiers.text!.min = 1;
    }, () => {
      const blank = { ...colorsOf("light"), text: colorsOf("light").bg };
      let failures: unknown;
      try {
        failures = checkColors("probe", "light", blank, WCAG);
      } catch {
        // Refusing is the behaviour.
      }
      assert.equal(failures, undefined, `text the colour of its page was judged against a floor of 1: ${shown(failures)?.slice(0, 200)}`);
      refusedEverywhere(WCAG, [], "wcag-aa with text at 1");
      throwsTypeError(() => Object.values(shipped).flatMap(checkPreset), ["wcag-aa"], "the gate, wcag-aa with text at 1");
    });
    // Greater than 1, by however little, is a floor: "not held" is said by leaving the tier out, and this is not that.
    for (const min of [1 + Number.EPSILON, 1.000001, 1.5]) {
      withContract("probe-just-over", { text: floor(min), chart: floor({ light: min, dark: 2.25 }) }, (name) => {
        for (const mode of MODES) {
          assert.equal(floorFor(name, "text", mode), min, `a floor of ${min}, ${mode}`);
          const pairs = measureColors(mode, colorsOf(mode), name);
          assert.equal(pairs.length, 58);
          assert.ok(pairs.filter((pair) => pair.tier === "text").every((pair) => pair.min === min && pair.holds));
        }
        assert.equal(floorFor(name, "chart", "light"), min);
      });
    }
    check5();
  });

  // ── M10.3: a rule's mode ────────────────────────────────────────────────
  test("M10.3 a rule whose `mode` is present and is neither \"light\" nor \"dark\" makes measureColors throw a TypeError naming its fg, bg and the bad mode — never silently unmeasured", () => {
    const planted = (mode: unknown) => ({ fg: "link-hover", bg: "surface-raised", tier: "text", why: "A rule planted by test-contracts.ts with a mode that does not exist.", mode }) as unknown as Rule;
    for (const bad of ["Dark", "both", "LIGHT", "dark ", "system", "toString", "", null, 0, true, ["dark"]]) {
      const named = typeof bad === "string" && bad.trim() !== "" ? [bad] : [];
      for (const at of [0, RULES.length]) {
        withRules((rules) => rules.splice(at, 0, planted(bad)), () => {
          for (const mode of MODES) {
            let pairs: Measurement[] | undefined;
            try {
              pairs = measureColors(mode, colorsOf(mode), WCAG);
            } catch {
              // Refusing is the behaviour; the error itself is examined below.
            }
            assert.equal(pairs, undefined, `a rule with mode ${shown(bad)} at RULES[${at}]: measureColors(${mode}) returned ${pairs?.length} measurements — the rule was silently never measured`);
            throwsTypeError(() => measureColors(mode, colorsOf(mode), WCAG), ["link-hover", "surface-raised", ...named], `a rule with mode ${shown(bad)} at RULES[${at}], measuring ${mode}`);
            throwsTypeError(() => checkColors("probe", mode, colorsOf(mode), WCAG), ["link-hover", "surface-raised", ...named], `checkColors, a rule with mode ${shown(bad)}`);
          }
          throwsTypeError(() => checkPreset(shipped.ocean!), ["link-hover", "surface-raised", ...named], `checkPreset, a rule with mode ${shown(bad)}`);
        });
      }
    }
    // An existing rule, respelled where it stands: the first dark-only chart pair becomes "Dark".
    const at = RULES.findIndex((rule) => rule.mode === "dark");
    assert.ok(at >= 0, "RULES has no dark-only rule");
    const { fg, bg } = RULES[at]!;
    withRules((rules) => {
      rules[at] = { ...rules[at]!, mode: "Dark" as Mode };
    }, () => {
      for (const mode of MODES) {
        throwsTypeError(() => measureColors(mode, colorsOf(mode), WCAG), [fg, bg, "Dark"], `RULES[${at}] with mode "Dark", measuring ${mode}`);
      }
      throwsTypeError(() => Object.values(shipped).flatMap(checkPreset), [fg, bg, "Dark"], "the gate");
    });
    // The two real modes, and no mode at all, are what they were.
    withRules((rules) => rules.push({ ...planted("light"), mode: "light" }), () => {
      assert.equal(measureColors("light", colorsOf("light"), WCAG).length, 71);
      assert.equal(measureColors("dark", colorsOf("dark"), WCAG).length, 70);
    });
    check5();
  });

  // ── M10.4: a mistyped tier, on a rule of the other mode ─────────────────
  test("M10.4 a mistyped tier on a rule throws whichever mode is being measured — including a rule restricted to the OTHER mode", () => {
    for (const ruleMode of MODES) {
      const measured: Mode = ruleMode === "light" ? "dark" : "light";
      for (const tier of ["txet", "Text", "border", "toString", ""]) {
        const rule = { fg: "link-hover", bg: "surface-raised", tier, mode: ruleMode, why: "A rule planted by test-contracts.ts: one mode only, and a tier that does not exist." } as unknown as Rule;
        const named = tier.trim() === "" ? [] : [tier];
        for (const at of [0, RULES.length]) {
          withRules((rules) => rules.splice(at, 0, rule), () => {
            throwsTypeError(() => measureColors(measured, colorsOf(measured), WCAG), ["link-hover", "surface-raised", ...named], `a ${ruleMode}-only rule with tier ${shown(tier)} at RULES[${at}], measuring ${measured}`);
            throwsTypeError(() => checkColors("probe", measured, colorsOf(measured), WCAG), ["link-hover", "surface-raised", ...named], `checkColors(${measured}), a ${ruleMode}-only rule with tier ${shown(tier)}`);
            throwsTypeError(() => measureColors(ruleMode, colorsOf(ruleMode), WCAG), ["link-hover", "surface-raised", ...named], `… and measuring ${ruleMode}, its own mode`);
          });
        }
      }
      // An existing chart rule of that mode, mistyped where it stands.
      const at = RULES.findIndex((entry) => entry.mode === ruleMode);
      assert.ok(at >= 0, `RULES has no ${ruleMode}-only rule`);
      const { fg, bg } = RULES[at]!;
      withRules((rules) => {
        rules[at] = { ...rules[at]!, tier: "chrat" as Tier };
      }, () => {
        throwsTypeError(() => measureColors(measured, colorsOf(measured), WCAG), [fg, bg, "chrat"], `RULES[${at}] (${ruleMode}-only) mistyped, measuring ${measured}`);
      });
    }
    check5();
  });

  // ── M10.5: a declaration's modes are own properties; a mode that is not a mode ─
  const inheriting = (proto: object, own: object = {}) => Object.assign(Object.create(proto) as object, own);

  test("M10.5 contractOf refuses a declaration that only INHERITS light or dark: a TypeError containing the preset's name, as for any bad declaration", () => {
    const both = declaring(inheriting({ light: "wcag-aa", dark: "wcag-aa" }));
    assert.equal((both.contract as Record<string, unknown>).light, "wcag-aa", "the probe is unsound: the declaration does not inherit light");
    for (const mode of MODES) {
      throwsTypeError(() => contractOf(both, mode), ["probe-preset"], `both modes inherited, asked for ${mode}`);
    }
    throwsTypeError(() => checkPreset(both), ["probe-preset"], "checkPreset, both modes inherited");
    // One mode its own, the other inherited: the own one answers, the inherited one is refused.
    for (const mode of MODES) {
      const other: Mode = mode === "light" ? "dark" : "light";
      const half = declaring(inheriting({ [mode]: "wcag-aa" }, { [other]: "wcag-aa" }));
      assert.equal(contractOf(half, other), "wcag-aa", `${other} is its own`);
      throwsTypeError(() => contractOf(half, mode), ["probe-preset"], `${mode} inherited, ${other} own`);
      throwsTypeError(() => checkPreset(half), ["probe-preset"], `checkPreset, ${mode} inherited`);
    }
    // A class instance whose prototype carries the modes is the same case.
    class Declared {
      get light() {
        return "wcag-aa";
      }

      get dark() {
        return "wcag-aa";
      }
    }
    throwsTypeError(() => contractOf(declaring(new Declared()), "light"), ["probe-preset"], "modes that are getters on a prototype");
  });

  test("M10.5 asked for a mode that is neither \"light\" nor \"dark\", contractOf throws a TypeError that names the mode as not being a mode — and does not blame the preset", () => {
    const blameless = declaring({ light: "wcag-aa", dark: "wcag-aa" }, "blameless-probe");
    for (const mode of ["system", "Light", "DARK", "dark ", "both", "constructor", "toString", "__proto__", "", undefined, null, 0]) {
      const what = `contractOf(a sound preset, ${shown(mode)})`;
      let thrown: unknown;
      try {
        contractOf(blameless, mode as Mode);
      } catch(error) {
        thrown = error;
      }
      assert.ok(thrown instanceof TypeError, `${what}: ${thrown === undefined ? "it did not throw" : `it threw ${String(thrown)}`}`);
      assert.doesNotMatch(thrown.message, /is not a function|Cannot read properties of/, `${what}: the call itself failed`);
      assert.ok(!thrown.message.includes("blameless-probe"), `${what}: the declaration is sound and the TypeError blames the preset: ${thrown.message}`);
      if (typeof mode === "string" && mode.trim() !== "") {
        assert.ok(thrown.message.includes(mode), `${what}: the TypeError does not name the mode: ${thrown.message}`);
      }
      assert.match(thrown.message, /\bmode\b/i, `${what}: the TypeError does not say it is not a mode: ${thrown.message}`);
    }
    // … for a shipped preset too.
    for (const preset of Object.values(shipped)) {
      let message = "";
      try {
        contractOf(preset, "system" as Mode);
      } catch(error) {
        assert.ok(error instanceof TypeError);
        ({ message } = error);
      }
      assert.ok(message.includes("system"), `contractOf(${preset.name}, "system") ${message === "" ? "did not throw" : `says: ${message}`}`);
      assert.ok(!message.includes(preset.name) && !message.includes(preset.label), `contractOf(${preset.name}, "system") blames the preset: ${message}`);
    }
  });

  // ── M10.6: a report prints nothing before the error ─────────────────────
  BAD_TREES.push({
    name: "a declaration that only inherits its modes (the last preset, midnight)",
    says: ["midnight"],
    tree: plant("an-inherited-declaration", "\n// test-contracts.ts: a declaration that only inherits its modes (M10.5), on the last preset, in a temporary copy.\n(presets.midnight as { contract: unknown }).contract = Object.create({ light: \"wcag-aa\", dark: \"wcag-aa\" });\n"),
  });
  for (const bad of BAD_TREES) {
    for (const report of RUNS.slice(0, 3)) {
      test(`M10.6 ${report.name}, on a preset with ${bad.name}: stdout is EMPTY — no preset's verdict is printed ahead of the error`, () => {
        const run = report.run(bad.tree);
        assert.ok(run.status !== 0 && run.status !== null, `${report.name} exited ${run.status}:\n${run.stdout}\n${run.stderr}`);
        for (const word of ["TypeError", ...bad.says]) {
          assert.ok(run.stderr.includes(word), `${report.name}'s error does not say "${word}":\n${run.stderr}`);
        }
        assert.equal(run.stdout, "", `${report.name} printed this before the error`);
      });
    }
  }
  for (const gate of RUNS.slice(3)) {
    test(`M10.5 ${gate.name}, on a preset whose declaration only inherits its modes: a non-zero exit and the TypeError naming it — nothing written`, () => {
      const bad = BAD_TREES.at(-1)!;
      const run = gate.run(bad.tree);
      assert.ok(run.status !== 0 && run.status !== null, `${gate.name} exited ${run.status}:\n${run.stdout}\n${run.stderr}`);
      for (const word of ["TypeError", ...bad.says]) {
        assert.ok(run.stderr.includes(word), `${gate.name}'s error does not say "${word}":\n${run.stderr}`);
      }
      assert.ok(!gate.wrote(bad.tree), `${gate.name} wrote its output`);
    });
  }

  // ── M10.7: the declaration is what decides, shown by behaviour ──────────
  // A second contract — wcag-aa with a text floor no pair can reach (no ratio exceeds 21) — planted AFTER the module's
  // own statements, so it is in `contracts` and was not there when CONTRACT_NAMES was made (M10.11).
  const SECOND_CONTRACT = "\n// test-contracts.ts: a second contract, in a temporary copy.\n{\n  const strict = structuredClone(contracts[\"wcag-aa\"]) as unknown as { name: string; tiers: Record<string, { min: unknown }> };\n  strict.name = \"probe-strict\";\n  strict.tiers.text!.min = 21.5;\n  (contracts as Record<string, unknown>)[\"probe-strict\"] = strict;\n}\n";
  const headings = new Map(Object.values(shipped).map((preset) => [`${preset.label} — ${preset.tagline}`, preset.name]));
  /** A report's stdout, read back: what it says of each preset in each mode, and the failure rows under that. */
  function verdicts(stdout: string): { preset: string; mode: string; summary: string; rows: string[] }[] {
    const out: { preset: string; mode: string; summary: string; rows: string[] }[] = [];
    let preset = "";
    for (const line of stdout.split("\n")) {
      const mode = /^\s+(light|dark)\s+(.*)$/.exec(line);
      if (headings.has(line.trim())) {
        preset = headings.get(line.trim())!;
      } else if (mode) {
        out.push({ preset, mode: mode[1]!, summary: mode[2]!, rows: [] });
      } else if (line.includes("✗") && out.length > 0 && /^\s{3,}/.test(line)) {
        out.at(-1)!.rows.push(line.trim());
      }
    }
    return out;
  }
  for (const [declarer, declaredMode] of [["ocean", "dark"], ["noir", "light"]] as const) {
    const otherMode = declaredMode === "light" ? "dark" : "light";
    const tree = plant(`a-second-contract-${declarer}-${declaredMode}`, {
      contracts: SECOND_CONTRACT,
      presets: `\n// test-contracts.ts: ONE preset declares the second contract for ONE mode, in a temporary copy.\n(presets.${declarer} as { contract: unknown }).contract = { ${otherMode}: "wcag-aa", ${declaredMode}: "probe-strict" };\n`,
    });
    for (const report of RUNS.slice(0, 3)) {
      test(`M10.7 ${report.name}, when ${declarer} alone declares a second contract for ${declaredMode}: it fails, naming ${declarer}/${declaredMode} and no other preset or mode`, () => {
        const run = report.run(tree);
        assert.doesNotMatch(run.stderr, /TypeError|ReferenceError|SyntaxError/, `${report.name} crashed on the planted contract (the plant, or a surface that decides by CONTRACT_NAMES — M10.11):\n${run.stderr}`);
        assert.ok(run.status !== 0 && run.status !== null, `${report.name} exited ${run.status}: it judged ${declarer}/${declaredMode} by something other than the contract ${declarer} declares\n${run.stdout}`);
        assert.doesNotMatch(run.stdout, /holds/, `${report.name} said the contract holds`);
        const said = verdicts(run.stdout);
        assert.deepEqual(said.map(({ preset, mode }) => `${preset}/${mode}`), Object.keys(shipped).flatMap((name) => MODES.map((mode) => `${name}/${mode}`)), `${report.name}: a verdict for each preset in each mode\n${run.stdout}`);
        for (const { preset, mode, summary, rows } of said) {
          if (preset === declarer && mode === declaredMode) {
            assert.doesNotMatch(summary, /\bpass\b/, `${report.name}: ${preset}/${mode} is held to a text floor of 21.5 and passes`);
            assert.match(summary, /\b42\b/, `${report.name}: ${preset}/${mode} should fail its 42 text pairs, and says: ${summary}`);
            assert.equal(rows.length, 42, `${report.name}: ${preset}/${mode} failure rows`);
            assert.ok(rows.every((row) => row.includes("21.5")), `${report.name}: a failure row of ${preset}/${mode} not against 21.5:\n${rows.join("\n")}`);
          } else {
            assert.match(summary, /^all 70 pairings pass\b/, `${report.name}: ${preset}/${mode} declares wcag-aa and holds it, and the report says: ${summary}`);
            assert.deepEqual(rows, [], `${report.name}: ${preset}/${mode}`);
          }
        }
      });
    }
    for (const gate of RUNS.slice(3)) {
      test(`M10.7 ${gate.name}, when ${declarer} alone declares a second contract for ${declaredMode}: it fails, naming ${declarer}/${declaredMode} and no other preset or mode — nothing written`, () => {
        const run = gate.run(tree);
        assert.doesNotMatch(run.stderr, /TypeError|ReferenceError|SyntaxError/, `${gate.name} crashed on the planted contract (the plant, or a surface that decides by CONTRACT_NAMES — M10.11):\n${run.stderr}`);
        assert.ok(run.status !== 0 && run.status !== null, `${gate.name} exited ${run.status}: it judged ${declarer}/${declaredMode} by something other than the contract ${declarer} declares\n${run.stdout}\n${run.stderr}`);
        const named = [...run.stderr.matchAll(/^\s*([a-z]+)\/(light|dark): .*$/gm)];
        assert.equal(named.length, 42, `${gate.name}: the 42 text pairs of ${declarer}/${declaredMode}\n${run.stderr}`);
        assert.deepEqual([...new Set(named.map((row) => `${row[1]}/${row[2]}`))], [`${declarer}/${declaredMode}`], `${gate.name} names another preset or mode`);
        assert.ok(named.every((row) => row[0].includes("21.5")), `${gate.name}: a failure not against 21.5`);
        assert.ok(run.stderr.includes("42 contrast failure(s)"), run.stderr);
        assert.ok(!gate.wrote(tree), `${gate.name} wrote its output`);
      });
    }
  }

  /** The arguments of every call of measureColors( or checkColors( in `text`, split at top-level commas. */
  function measuringCalls(text: string): { fn: string; args: string[] }[] {
    const calls: { fn: string; args: string[] }[] = [];
    for (const match of text.matchAll(/\b(measureColors|checkColors)\(/g)) {
      const args: string[] = [];
      let depth = 0;
      let quote = "";
      let current = "";
      let i = match.index + match[0].length;
      for (; i < text.length; i++) {
        const ch = text[i]!;
        if (quote !== "") {
          current += ch;
          if (ch === "\\") {
            current += text[++i] ?? "";
          } else if (ch === quote) {
            quote = "";
          }
        } else if (ch === "\"" || ch === "'" || ch === "`") {
          quote = ch;
          current += ch;
        } else if (ch === ")" && depth === 0) {
          break;
        } else if (ch === "," && depth === 0) {
          args.push(current.trim());
          current = "";
        } else {
          depth += "([{".includes(ch) ? 1 : ")]}".includes(ch) ? -1 : 0;
          current += ch;
        }
      }
      assert.ok(i < text.length, `an unclosed call of ${match[1]}(`);
      if (current.trim() !== "") {
        args.push(current.trim());
      }
      calls.push({ fn: match[1]!, args });
    }
    return calls;
  }
  /** Whether `expr` is one call of contractOf(…) and nothing else: no operator after it, no comma expression around it. */
  function isContractOfCall(expr: string): boolean {
    const text = expr.trim();
    if (!/^contractOf\(/.test(text)) {
      return false;
    }
    let depth = 0;
    for (let i = "contractOf".length; i < text.length; i++) {
      depth += text[i] === "(" ? 1 : text[i] === ")" ? -1 : 0;
      if (depth === 0) {
        return i === text.length - 1;
      }
    }
    return false;
  }
  /** M10.7's text rule: the contract argument is the contractOf(…) call itself, or a name assigned from one (and from nothing else). */
  function decidedByDeclaration(arg: string | undefined, text: string): string | null {
    if (arg === undefined || arg === "") {
      return "it passes no contract";
    }
    if (isContractOfCall(arg)) {
      return null;
    }
    if (!/^[A-Za-z_$][\w$]*$/.test(arg)) {
      return `its contract argument is \`${arg}\`: neither the contractOf(…) call itself nor a name`;
    }
    const assigned = [...text.matchAll(new RegExp(`\\b(const|let|var)\\s+${arg.replaceAll("$", "\\$")}\\s*(?::[^=;]+)?=(?!=)\\s*([^;]*);`, "g"))];
    if (assigned.length === 0) {
      return `its contract argument \`${arg}\` is not a name assigned from contractOf(…) in this file`;
    }
    for (const [, keyword, initial] of assigned) {
      if (keyword !== "const" || !isContractOfCall(initial!)) {
        return `its contract argument \`${arg}\` is declared \`${keyword} ${arg} = ${initial!.trim()}\`: not a constant assigned from one contractOf(…) call`;
      }
    }
    return null;
  }

  test("M10.7 the text rule itself tells a declaration from a constant, however the constant is spelled (the two surfaces below cannot be run with a second contract)", () => {
    const verdict = (source: string) => measuringCalls(source).map(({ fn, args }) => decidedByDeclaration(args[fn === "measureColors" ? 2 : 3], source));
    for (const good of [
      "const pairs = measureColors(mode, preset.colors[mode], contractOf(preset, mode));",
      "const held = contractOf(preset, mode);\nfor (const f of checkColors(preset.name, mode, colors, held)) {}",
      "const contract: ContractName = contractOf(presets[name]!, mode);\nmeasureColors(mode, read(page, [\"a,b\"]), contract);",
    ]) {
      assert.deepEqual(verdict(good), [null], good);
    }
    for (const bad of [
      "measureColors(mode, colors, \"wcag-aa\");",
      "const HELD_TO = \"wcag-aa\";\ncontractOf(preset, mode);\nmeasureColors(mode, colors, HELD_TO);",
      "const FIRST = CONTRACT_NAMES[0];\nmeasureColors(mode, colors, (contractOf(preset, mode), FIRST));",
      "measureColors(mode, colors, contractOf(preset, mode) && FIRST);",
      "let held = contractOf(preset, mode);\nheld = \"wcag-aa\";\ncheckColors(name, mode, colors, held);",
      "const held = contractOf(preset, mode) ?? \"wcag-aa\";\ncheckColors(name, mode, colors, held);",
      "measureColors(mode, colors, CONTRACT_NAMES[0]);",
      "measureColors(mode, colors, preset.contract[mode]);",
      "measureColors(mode, colors);",
    ]) {
      const [said] = verdict(bad);
      assert.ok(typeof said === "string", `the rule accepts: ${bad}`);
    }
  });

  for (const file of ["tools/check-cli.ts", "apps/playground/src/contrast-checks.ts"]) {
    test(`M10.7 ${file}: the contract argument of every measuring call is the contractOf(…) call itself or a name assigned from one`, () => {
      const text = body(join(repoRoot, file));
      const calls = measuringCalls(text);
      assert.ok(calls.length > 0, `${file} no longer measures: take it out of this list`);
      for (const { fn, args } of calls) {
        const said = decidedByDeclaration(args[fn === "measureColors" ? 2 : 3], text);
        assert.equal(said, null, `${file} calls ${fn}(${args.join(", ")}): ${said}. A preset's declaration must be what decides the contract; a constant, however it is spelled, is not`);
      }
    });
  }

  // ── M10.8: the manifest validates ───────────────────────────────────────
  test("M10.8 manifest() gets each preset's contract through contractOf: it throws that TypeError on a bad declaration, and never publishes one", () => {
    for (const { what, contract, says } of BAD_DECLARATIONS) {
      throwsTypeError(() => manifest({ probe: declaring(contract) }), ["probe-preset", ...says], `manifest, ${what} (${shown(contract === REMOVE ? "(absent)" : contract)})`);
    }
    // One bad preset among good ones, wherever it stands.
    throwsTypeError(() => manifest({ ...shipped, probe: declaring({ light: "wcag-aa", dark: "wcag-aaa" }) }), ["probe-preset", "wcag-aaa"], "manifest, a bad declaration after the five shipped presets");
    throwsTypeError(() => manifest({ probe: declaring({ light: "wcag-aa" }), ...shipped }), ["probe-preset"], "manifest, a declaration with no dark before the five shipped presets");
    // M10.5, through the manifest: a declaration that only inherits its modes.
    throwsTypeError(() => manifest({ probe: declaring(inheriting({ light: "wcag-aa", dark: "wcag-aa" })) }), ["probe-preset"], "manifest, an inherited declaration");
    assert.equal((JSON.parse(manifest(shipped)) as unknown[]).length, 5, "the shipped presets still have a manifest");
  });

  test("M10.1 through M10.8: manifest() refuses a declared contract that is itself unusable — contractOf validates the contract it reaches", () => {
    withTiers((tiers) => {
      tiers.txet = tiers.text!;
      delete tiers.text;
    }, () => throwsTypeError(() => manifest(shipped), ["wcag-aa", "txet"], "manifest, when the declared contract has a key that is not a tier"));
    withTiers((tiers) => {
      tiers.focus!.min = 1;
    }, () => throwsTypeError(() => manifest(shipped), ["wcag-aa"], "manifest, when the declared contract has a floor of 1 (M10.2)"));
    assert.equal((JSON.parse(manifest(shipped)) as unknown[]).length, 5, "the shipped presets still have a manifest");
  });

  // ── M10.9: the chart gate's refusals ────────────────────────────────────
  const cvdDeltaE = chartGate.cvdDeltaE as unknown as (a: unknown, b: unknown, deficiency: unknown) => unknown;
  /** It threw an Error — it did not return, and above all did not return a number. */
  function throwsNotANumber(fn: () => unknown, what: string) {
    let returned: unknown;
    let thrown: unknown;
    try {
      returned = fn();
    } catch(error) {
      thrown = error;
    }
    assert.ok(thrown !== undefined, `${what}: it did not throw — it returned ${String(returned)}`);
    assert.ok(thrown instanceof Error, `${what}: it threw ${String(thrown)}, which is not an Error`);
    assert.doesNotMatch(thrown.message, /is not a function/, `${what}: the call itself failed`);
  }

  test("M10.9 cvdDeltaE throws — never returns a number — for a colour that cannot be read, in either seat, under either deficiency", () => {
    assert.equal(typeof chartGate.cvdDeltaE, "function", "check-cvd.ts does not export cvdDeltaE()");
    for (const deficiency of ["protanopia", "deuteranopia"]) {
      assert.equal(typeof cvdDeltaE("#008289", "#9e6400", deficiency), "number", `the probe is unsound: two readable colours under ${deficiency}`);
      for (const value of UNREADABLE) {
        throwsNotANumber(() => cvdDeltaE(value, "#9e6400", deficiency), `cvdDeltaE(${shown(value)}, #9e6400, ${deficiency})`);
        throwsNotANumber(() => cvdDeltaE("#008289", value, deficiency), `cvdDeltaE(#008289, ${shown(value)}, ${deficiency})`);
        throwsNotANumber(() => cvdDeltaE(value, value, deficiency), `cvdDeltaE(${shown(value)} twice, ${deficiency})`);
      }
    }
  });

  test("M10.9 cvdDeltaE throws — never returns a number — for a deficiency it has no view for: it never falls through to the unsimulated distance", () => {
    for (const deficiency of ["tritanopia", "protan", "deutan", "tritan", "Protanopia", "protanopia ", "normal", "none", "toString", "constructor", "__proto__", "hasOwnProperty", "", undefined, null, 0]) {
      throwsNotANumber(() => cvdDeltaE("#008289", "#9e6400", deficiency), `cvdDeltaE(#008289, #9e6400, ${shown(deficiency)})`);
      throwsNotANumber(() => cvdDeltaE("#008289", "#008289", deficiency), `cvdDeltaE of one colour with itself, ${shown(deficiency)}`);
      // Whatever the colours are.
      throwsNotANumber(() => cvdDeltaE("nope", "#9e6400", deficiency), `cvdDeltaE(nope, #9e6400, ${shown(deficiency)})`);
    }
  });

  test("M10.9 cvdDeltaE reads any spelling parseColor reads, and every number it returns is the one it returned at 2d3b765", () => {
    for (const [plain, respelled] of [["#ff0000", "red"], ["#ff0000", "#F00"], ["#ff0000", " rgb(255, 0, 0) "], ["#0000ff", "rgb(0 0 255 / 100%)"], ["#ffffff", "#ffffffff"]] as const) {
      for (const deficiency of ["protanopia", "deuteranopia"]) {
        const want = cvdDeltaE(plain, "#008289", deficiency);
        assert.ok(typeof want === "number" && want > 0, `cvdDeltaE(${plain}, #008289, ${deficiency}) is ${String(want)}`);
        assert.equal(cvdDeltaE(respelled, "#008289", deficiency), want, `cvdDeltaE(${shown(respelled)}, #008289, ${deficiency})`);
        assert.equal(cvdDeltaE("#008289", respelled, deficiency), want, `cvdDeltaE(#008289, ${shown(respelled)}, ${deficiency})`);
      }
    }
    for (const [a, b, , protan, deutan] of SEPARATIONS) {
      assert.ok(near(cvdDeltaE(a, b, "protanopia") as number, protan, 1e-9) && near(cvdDeltaE(a, b, "deuteranopia") as number, deutan, 1e-9), `${a} and ${b}`);
    }
  });

  // ── M10.10: the instruments ─────────────────────────────────────────────
  test("M10.10 separation: a bad view is a TypeError naming it WHATEVER the colours are — unreadable, translucent, not strings, in either seat or both", () => {
    for (const view of ["protanopia", "deuteranopia", "tritanopia", "Protan", "protan ", "normal", "toString"]) {
      for (const value of UNREADABLE) {
        const bad = value as string;
        throwsTypeError(() => separation(bad, "#9e6400", view as color.CvdKind), [view], `separation(${shown(value)}, #9e6400, ${shown(view)})`);
        throwsTypeError(() => separation("#008289", bad, view as color.CvdKind), [view], `separation(#008289, ${shown(value)}, ${shown(view)})`);
        throwsTypeError(() => separation(bad, bad, view as color.CvdKind), [view], `separation(${shown(value)} twice, ${shown(view)})`);
      }
    }
    for (const view of ["", null, 0, 1, {}]) {
      throwsTypeError(() => separation("nope", "#9e6400", view as color.CvdKind), [], `separation(nope, #9e6400, ${shown(view)})`);
      throwsTypeError(() => separation(undefined as unknown as string, null as unknown as string, view as color.CvdKind), [], `separation(undefined, null, ${shown(view)})`);
    }
  });

  const CLAMPED = (json("separation-clamp.json") as { clamped: { a: string; b: string; view: string; over: number; separation: number; unclamped: number }[] }).clamped;

  test("M10.10 the simulation clamps each linear channel to 0..1 before OKLab: pairs whose simulated channel exceeds 1, against an independent implementation, to 1e-9", () => {
    assert.ok(CLAMPED.length >= 1, "the fixture is empty");
    assert.ok(CLAMPED.some((row) => row.a === "#00ff00" && row.b === "#ffffff" && row.view === "protan"), "the fixture lost the specification's own example: #00ff00 against #ffffff under protan");
    assert.deepEqual([...new Set(CLAMPED.map((row) => row.view))].sort(), [...KINDS].sort(), "the fixture does not exercise the clamp under each of the three kinds");
    for (const { a, b, view, over, separation: want, unclamped } of CLAMPED) {
      // The row can tell a clamped simulation from an unclamped one, or it pins nothing.
      assert.ok(over > 1 && Math.abs(want - unclamped) > 0.01, `${a} and ${b} under ${view}: the fixture row does not exercise the clamp`);
      const got = separation(a, b, view as color.CvdKind);
      assert.ok(!near(got, unclamped, 1e-6), `${a} and ${b} under ${view}: ${got} is the answer of a simulation that is NOT clamped at 1 (clamped, it is ${want})`);
      assert.ok(near(got, want, 1e-9), `${a} and ${b} under ${view}: ${want} by the independent implementation, and it said ${got}`);
      assert.equal(separation(b, a, view as color.CvdKind), got, `${a} and ${b} under ${view}: not symmetric`);
    }
  });

  test("M10.10 an explicitly passed `undefined` view remains \"no view\": the unsimulated distance, and null for a colour that cannot be read", () => {
    for (const [a, b, none] of SEPARATIONS) {
      assert.ok(near(separation(a, b, undefined), none, 1e-9), `${a} and ${b} with view undefined: ${none}, and it said ${separation(a, b, undefined)}`);
      assert.equal(separation(a, b, undefined), separation(a, b));
    }
    for (const value of UNREADABLE) {
      assert.equal(separation(value as string, "#ffffff", undefined), null, `separation(${shown(value)}, #ffffff, undefined)`);
    }
  });

  // ── M10.11: CONTRACT_NAMES decides nothing ──────────────────────────────
  test("M10.11 CONTRACT_NAMES is the list of names at module load; what decides is `contracts` itself — a contract added later is honoured, a name only on the list is not", () => {
    assert.deepEqual([...CONTRACT_NAMES], ["wcag-aa"]);
    // In `contracts` and not on the list: honoured everywhere a contract is decided.
    withContract("probe-late", wcagTiers(), (name) => {
      assert.deepEqual([...CONTRACT_NAMES], ["wcag-aa"], "CONTRACT_NAMES follows `contracts`: it is the list at module load");
      const preset = declaring({ light: name, dark: name });
      for (const mode of MODES) {
        assert.equal(contractOf(preset, mode), name, `contractOf, ${mode}`);
        assert.equal(floorFor(name, "text", mode), 4.5);
        assert.equal(measureColors(mode, colorsOf(mode), name).length, 70);
        assert.deepEqual(checkColors("probe", mode, colorsOf(mode), name), []);
      }
      assert.deepEqual(checkPreset(preset), []);
      assert.deepEqual((JSON.parse(manifest({ probe: preset })) as { contract: unknown }[])[0]!.contract, { light: name, dark: name });
    });
    // On the list and not in `contracts`: refused everywhere. (Where the list is frozen, this half has nothing to do.)
    const list = CONTRACT_NAMES as unknown as string[];
    const saved = [...list];
    let listed = false;
    try {
      list.push("probe-listed");
      listed = list.includes("probe-listed");
    } catch {
      // A frozen list cannot be made to lie.
    }
    try {
      if (listed) {
        const name = "probe-listed" as ContractName;
        throwsTypeError(() => contractOf(declaring({ light: name, dark: name }), "light"), ["probe-preset", "probe-listed"], "contractOf, a name on CONTRACT_NAMES that is not in contracts");
        throwsTypeError(() => measureColors("light", colorsOf("light"), name), ["probe-listed"], "measureColors, a name on CONTRACT_NAMES that is not in contracts");
        throwsTypeError(() => floorFor(name, "text", "light"), ["probe-listed"], "floorFor, a name on CONTRACT_NAMES that is not in contracts");
      }
    } finally {
      if (listed) {
        list.length = 0;
        list.push(...saved);
      }
    }
    // Off the list and in `contracts`: wcag-aa still decides when the list is emptied.
    let emptied = false;
    try {
      list.length = 0;
      emptied = list.length === 0;
    } catch {
      // Frozen.
    }
    try {
      if (emptied) {
        assert.deepEqual(Object.values(shipped).flatMap(checkPreset), [], "the gate, with CONTRACT_NAMES emptied");
        assert.equal(contractOf(shipped.sorbet!, "light"), "wcag-aa");
        check5();
      }
    } finally {
      if (emptied) {
        list.push(...saved);
      }
    }
    assert.deepEqual([...CONTRACT_NAMES], ["wcag-aa"]);
  });

  test("M10.11 nothing decides by CONTRACT_NAMES: no source asks whether a name is on the list", () => {
    const DECIDES = /\bCONTRACT_NAMES\s*\.\s*(?:includes|indexOf|lastIndexOf|some|every|find|findIndex|findLast|filter|at)\s*\(|\bCONTRACT_NAMES\s*\[|new\s+Set\s*(?:<[^>]*>)?\s*\(\s*CONTRACT_NAMES\b|\bin\s+CONTRACT_NAMES\b/;
    const deciding = sources(repoRoot)
      .filter((file) => posix(file) !== "packages/design-system/tools/test-contracts.ts")
      .filter((file) => DECIDES.test(code(file)))
      .map(posix);
    assert.deepEqual(deciding, [], "CONTRACT_NAMES is for showing and typing; whether a name is a contract is asked of `contracts` itself");
  });

  // ── M10.12: the recorder is committed ───────────────────────────────────
  test("M10.12 the script that recorded the fixtures from 2d3b765 is committed beside them, in a form pnpm lint and the tests ignore", () => {
    const recorder = join(fixtures, "record-fixtures.mts.txt");
    assert.ok(existsSync(recorder), "tools/fixtures/contracts/record-fixtures.mts.txt is not there");
    const script = readFileSync(recorder, "utf8");
    for (const word of ["2d3b765", "measureColors(", "wcag-aa.triples.json", "wcag-aa.measurements.json", "rules.order.json", "check-cvd.report.txt", "check-contrast.report.txt"]) {
      assert.ok(script.includes(word), `the recorder does not mention ${word}: it is not the script that recorded the fixtures`);
    }
    // Ignored: eslint.config.js lints **/*.{js,mjs,cjs,ts,tsx}, and every scan this file and test-contrast.ts make reads the same extensions.
    assert.doesNotMatch(recorder, /\.(js|mjs|cjs|ts|tsx|mts|cts)$/, "the recorder has an extension the linter or the type checker would pick up");
    assert.ok(!sources(repoRoot).some((file) => file.includes("record-fixtures")), "the recorder is among the sources the tests scan: it calls measureColors without a contract, as 2d3b765 did");
    const readme = readFileSync(join(fixtures, "README.md"), "utf8");
    assert.ok(readme.includes("record-fixtures.mts.txt"), "the fixtures' README does not say how to use the recorder");
  });

  // ── last: everything mutated above was put back ─────────────────────────
  test("M9 the exported RULES and contracts are as they were before this file mutated them", () => {
    assert.deepEqual(Object.keys(contracts), ["wcag-aa"]);
    assert.deepEqual([...CONTRACT_NAMES], ["wcag-aa"]);
    assert.equal(contracts[WCAG].name, "wcag-aa");
    assert.deepEqual(Object.keys(contracts[WCAG].tiers).sort(), [...M4_TIERS].sort());
    assert.deepEqual(RULES.map((rule) => [rule.fg, rule.bg, rule.mode ?? null]), RULE_ORDER);
    for (const row of M4) {
      for (const mode of MODES) {
        assert.equal(floorFor(WCAG, row.tier, mode), row.floor[mode], `${row.tier}, ${mode}`);
      }
    }
    check5();
    check700();
  });
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failed.length > 0) {
  console.error(styleText("red", `\n✗ ${failed.length} of ${ran} contract checks failed: a preset is no longer held to exactly the contract it was held to at 2d3b765, or the mechanism lets a bad contract read as a pass.`));
  process.exit(1);
}
// A run that tested nothing must not read as a pass.
if (ran < 110) {
  console.error(styleText("red", `\n✗ only ${ran} contract checks ran`));
  process.exit(1);
}
console.log(styleText("green", `✓ every preset is held to the contract it declares, and that contract is the one 2d3b765 enforced: ${ran} checks`));
