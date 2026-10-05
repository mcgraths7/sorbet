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
 * And, for PR 2's second contract (docs/pastel-legibility-evidence/legibility-spec.md, step 2.1, tests first):
 *
 *   - a measurement that reads plausibly and is wrong: Lc with its sign, text and background swapped, the
 *     simulated hex not used, the largest view taken, a see-through background composited over white, an inset
 *     edge blended over the backdrop, a term of edge presence left out, a fallback read as a colour;
 *   - a rule that cannot be measured turning into a skip, a pass, a 0 or a throw;
 *   - a floor, a tier, a view or a check of the member mistyped, rounded up or left out;
 *   - a report or a gate that names the wrong contract, miscounts what it leaves unheld, or loses a failure.
 *
 *   Its expected values are the spec's: transcribed into legibility-values.json and legibility-appendix-a.json
 *   by a script that reads only the spec, recorded from e24df74 where they are today's behaviour, or typed in.
 *   Where a test needs arithmetic, it is this file's own, written from the spec's words and first held to every
 *   figure the spec prints.
 *
 * Each test's name starts with the statement of the specification it holds
 * ("M6.4 …" is section M6, item 4, of the contract-mechanism spec; "L61 …" is statement 61 of the legibility spec,
 * "2.1 #4 …" item 4 of its step 2.1's acceptance list).
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

const { checkColors, checkPreset, contractOf, CONTRACT_NAMES, contracts, floorFor, generatedScss, manifest, measureColors, presets, ratioText, RULES, SEMANTIC_COLOR_NAMES, themeCss, TIER_KIND, TIERS } = tokens;
const { apcaLc, oklabOf, separation, simulateCvd, worstCaseContrast } = color;

// src/tokens/seams.ts is new in PR 2, step 2.1 (legibility-spec.md L15). It is loaded here rather than imported
// above: a file that does not exist yet is then one failing test that says so, not a module that will not load.
let seamsModule: Record<string, unknown> | undefined;
let seamsMissing = "";
try {
  seamsModule = (await import("../src/tokens/seams.ts")) as Record<string, unknown>;
} catch(error) {
  seamsMissing = (error as Error).message;
}

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
/** How many tests the legibility section (PR 2, step 2.1) ran: a section that tested nothing must not read as a pass. */
let legibilityCount: number | undefined;
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

// ── PR 2, step 2.1: the legibility spec, typed in or transcribed from it (never read from the code) ──
//
// docs/pastel-legibility-evidence/legibility-spec.md, revision 3.1. "L61" below is its statement 61, "R087" its
// rule 87 (appendix A), "2.1 #4" item 4 of step 2.1's acceptance list (L101), "L105 #12" entry 12 of the list
// of PR-1 assertions it makes false.

const SPEC = "legibility-spec.md";
const LEG = "legibility" as ContractName;
const VIEWS = ["typical", "protan", "deutan", "tritan"] as const;
type View = (typeof VIEWS)[number];
type Metric = "ratio" | "lc" | "sep" | "presence";
type ColorRecord = Record<string, string>;
interface Layer {
  inset: boolean;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  alpha: number;
}
interface Recipe {
  fill: string;
  rest: Layer[];
  hover?: Layer[];
  press?: Layer[];
}
type Edges = Record<string, Recipe>;
type Fallback = { fallback: string } | { css: string };
interface SpecFloor {
  tier: Tier;
  kind: string;
  metric: Metric;
  rules: number;
  light: number;
  dark: number;
}
interface SpecCell {
  actual: number;
  view: View;
  fg?: string;
  bg?: string;
}
interface SpecRule {
  n: string;
  fg: string;
  bg: string;
  tier: Tier;
  light: SpecCell;
  dark: SpecCell;
  pair: string;
  for: string;
}
interface SpecEdgeRow {
  n: string;
  fg: string;
  bg: string;
  mode: Mode;
  fill: string;
  backdrop: string;
  fillStep: number;
  pixel: string;
  pixelFromBackdrop: number;
  pixelFromFill: number;
  presence: number;
  view: View;
}
interface ButtonLabel {
  px: number;
  smallPx: number;
  weight: number;
}

/** §3 (L12, L15, L19) and §5.2 (L45), transcribed from the spec by transcribe-legibility-spec.mjs.txt. */
const VALUES = json("legibility-values.json") as { colors: Record<Mode, ColorRecord>; seams: { name: string; fallback: Fallback }[]; edges: Record<Mode, Edges>; buttonLabel: ButtonLabel };
/** L61's floors, appendix A's 191 rules with what each measures, appendix B's breakdown. Transcribed the same way. */
const APPENDIX = json("legibility-appendix-a.json") as { floors: SpecFloor[]; rules: SpecRule[]; edgeDetail: SpecEdgeRow[] };
/** L81: sorbet as main ships it (recorded from e24df74), with the container edge of L81's table. */
const KNOWN_BAD = json("sorbet-as-shipped.json") as { recordedFrom: string; colors: Record<Mode, ColorRecord>; edges: Record<Mode, Edges> };
/** L1, L2: wcag-aa and the first 86 rules as e24df74 has them, recorded by running it. */
const AT_E24DF74 = json("wcag-aa.at-e24df74.json") as { recordedFrom: string; contract: Contract; rules: { fg: string; bg: string; tier: string; why: string; mode: Mode | null }[] };

/** L22, L23: the 20 tiers the legibility member adds, in order, with the kind L23 gives each. */
const NEW_TIERS: [tier: Tier, kind: string][] = [
  ["body", "text"], ["secondary", "text"], ["on-wash", "text"], ["tinted", "text"], ["label", "text"], ["placeholder", "text"],
  ["mark-area", "shape"], ["mark-line", "shape"], ["divider", "shape"],
  ["focus-visible", "focus"],
  ["tell-apart", "distinction"], ["palette", "distinction"],
  ["chart-mark", "chart"],
  ["edge-container", "edge"], ["edge-floating", "edge"], ["edge-field", "edge"], ["edge-sunken", "edge"], ["edge-quiet", "edge"], ["edge-filled", "edge"], ["edge-status", "edge"],
].map(([tier, kind]) => [tier as Tier, kind!]);
/** L22's CheckName, in the order L57 lists them. */
const CHECKS = ["roles-complete", "hierarchy", "edge-not-fill", "fills-steady", "edge-direction", "label-type"];
/** L24's EdgeElement, in the order §4.1 writes it (L53 emits in this order). */
const ELEMENTS = ["container", "floating", "field", "sunken", "quiet", "filled-primary", "filled-secondary", "filled-accent", "filled-danger", "status-success", "status-warning", "status-danger", "status-info"];
/** L61. */
const LEG_FLOOR = new Map(APPENDIX.floors.map((row) => [row.tier, row]));
const floorIn = (tier: Tier, mode: Mode) => LEG_FLOOR.get(tier)![mode];
/** L62: the four floors written as one number; every other is { light, dark }. */
const ONE_NUMBER = new Set(["scrim", "label", "tell-apart", "palette"]);
/** L88: the word each metric prints before its value. The ratio prints none, as today. */
const WORD: Record<Metric, string> = { ratio: "", lc: "Lc", sep: "separation", presence: "edge presence" };
/** 2.1 #2: the two scrim rules, as ratios at the worst case, to 1e-4. */
const SCRIM_RATIO: Record<string, number> = { "on-scrim": 5.5562, "on-scrim-muted": 4.6844 };
/** L58 and §11: the counts, as the spec states them (each is also counted below, never only typed). */
const APPLYING = 261;
const HELD_BY_LEGIBILITY = 193;

// What step 2.1 must expose, read off the namespace: a name that is not exported yet is one failing test.
type Fn = (...args: unknown[]) => unknown;
const lib = tokens as unknown as Record<string, unknown>;
function api(name: string): Fn {
  const fn = lib[name];
  assert.equal(typeof fn, "function", `src/tokens/index.ts does not export ${name}() (${SPEC})`);
  return fn as Fn;
}
interface Measured {
  fg: string;
  bg: string;
  tier: string;
  kind: string;
  metric: string;
  min: number;
  actual: number | null;
  view: string | null;
  holds: boolean;
}
interface Failed {
  preset: string;
  mode: Mode;
  fg: string;
  bg: string;
  min: number;
  actual: number | null;
  tier: string;
  metric: string;
  view: string | null;
}
interface StructureFailure {
  preset: string;
  mode: Mode;
  check: string;
  detail: string;
}
/** L24: measureColors(mode, colors, contract, edges?). */
const measure = (mode: Mode, colors: unknown, contract: string, edges?: unknown) => (measureColors as unknown as Fn)(mode, colors, contract, edges) as Measured[];
/** L24: checkColors(preset, mode, colors, contract, edges?). */
const failuresOf = (preset: string, mode: Mode, colors: unknown, contract: string, edges?: unknown) => (checkColors as unknown as Fn)(preset, mode, colors, contract, edges) as Failed[];
/** contracts.legibility, or a failing assertion that says it is not there. */
function legibility(): Contract & { views?: unknown; checks?: unknown } {
  const member = (contracts as unknown as Record<string, Contract>)[LEG];
  assert.ok(member !== undefined, "contracts has no \"legibility\" member (L57)");
  return member;
}

// ── the arithmetic of §4.2 to §5.4, written again from the spec's words ────
// It calls only the four instruments PR 1 already holds to published values (M7) and the scrim's worst case
// (PR 1's), and is checked below against every figure appendices A and B print. Its own functions are not named
// after the instruments: the M7 caller scan matches a call by its name (L105 #43).

const SEAM_FALLBACK = new Map(VALUES.seams.map((seam) => [seam.name, seam.fallback]));
const bytesOf = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hexOf = (bytes: number[]) => `#${bytes.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
/** L48: straight alpha compositing, channel by channel, rounded to a whole number. */
const blendOver = (hex: string, alpha: number, under: string) => {
  const below = bytesOf(under);
  return hexOf(bytesOf(hex).map((c, i) => Math.round(c * alpha + below[i]! * (1 - alpha))));
};
/** The spellings the fixtures use: #rrggbb, withAlpha()'s rgb(r g b / a), and `transparent`. Anything else is unreadable here. */
function rgbaOf(value: string | null): { hex: string; alpha: number } | null {
  if (value === null) {
    return null;
  }
  if (/^#[0-9a-f]{6}$/.test(value)) {
    return { hex: value, alpha: 1 };
  }
  const fn = /^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/.exec(value);
  if (fn) {
    return { hex: hexOf([Number(fn[1]), Number(fn[2]), Number(fn[3])]), alpha: Number(fn[4]) };
  }
  return value === "transparent" ? { hex: "#000000", alpha: 0 } : null;
}
/** L37: what var(--sb-N, var(--sb-fallback)) computes. A css fallback is no value. */
function valueOf(name: string, record: ColorRecord): string | null {
  const own = Object.hasOwn(record, name) ? record[name] : undefined;
  if (typeof own === "string" && own.trim() !== "") {
    return own.trim();
  }
  const fallback = SEAM_FALLBACK.get(name);
  if (fallback !== undefined && "fallback" in fallback) {
    const role = Object.hasOwn(record, fallback.fallback) ? record[fallback.fallback] : undefined;
    return typeof role === "string" && role.trim() !== "" ? role.trim() : null;
  }
  return null;
}
/** L47: reaches every side alike — no offset, a positive spread. */
const allRound = (layer: Layer) => layer.x === 0 && layer.y === 0 && layer.spread > 0;
/** L27, L29, L30: the size of Lc; under a simulation, of the two 8-bit hexes simulateCvd returns. */
const lcIn = (view: View, text: string, ground: string) => Math.abs((view === "typical" ? apcaLc(text, ground) : apcaLc(simulateCvd(text, view), simulateCvd(ground, view)))!);
/** L27: separation in a view. */
const sepIn = (view: View, a: string, b: string) => (view === "typical" ? separation(a, b) : separation(a, b, view))!;
/** L31: the smallest value among the views, and the FIRST view in the contract's order that reaches it. */
function worstOf(views: readonly View[], at: (view: View) => number): { actual: number; view: View } {
  let worst = { actual: Infinity, view: views[0]! as View };
  for (const view of views) {
    const value = at(view);
    if (value < worst.actual) {
      worst = { actual: value, view };
    }
  }
  return worst;
}
/** L52: an edge used as a colour — only an element with exactly one all-round layer, and that one inset. */
function edgePixelOf(recipe: Recipe | undefined, record: ColorRecord): string | null {
  const layers = recipe?.rest.filter(allRound) ?? [];
  const fill = rgbaOf(recipe === undefined ? null : valueOf(recipe.fill, record));
  if (layers.length !== 1 || !layers[0]!.inset || fill === null || fill.alpha !== 1) {
    return null;
  }
  return blendOver(layers[0]!.color, layers[0]!.alpha, fill.hex);
}
/** L49, L107: an element's presence on a backdrop. */
function presenceOf(recipe: Recipe | undefined, backdrop: string, record: ColorRecord, views: readonly View[]): { actual: number; view: View } | null {
  const k = rgbaOf(valueOf(backdrop, record));
  if (recipe === undefined || k === null || k.alpha !== 1) {
    return null;
  }
  const f = recipe.fill === "backdrop" ? k : rgbaOf(valueOf(recipe.fill, record));
  if (f === null || f.alpha !== 1) {
    return null;
  }
  const pixels = recipe.rest.filter(allRound).map((layer) => blendOver(layer.color, layer.alpha, layer.inset ? f.hex : k.hex));
  return worstOf(views, (view) => Math.max(sepIn(view, f.hex, k.hex), ...pixels.map((p) => sepIn(view, p, k.hex)), ...pixels.map((p) => sepIn(view, p, f.hex))));
}
/** L37, L38, L52: the two opaque colours an lc or sep rule compares — a see-through fg blended over the bg — or null where it cannot be measured. */
function sidesOf(rule: { fg: string; bg: string }, record: ColorRecord, edges: Partial<Edges> | undefined): { fg: string; bg: string } | null {
  const side = (name: string) => (name.startsWith("edge:") ? edgePixelOf(edges?.[name.slice("edge:".length)], record) : valueOf(name, record));
  const b = rgbaOf(side(rule.bg));
  const f = rgbaOf(side(rule.fg));
  if (b === null || b.alpha !== 1 || f === null) {
    return null;
  }
  return { fg: f.alpha === 1 ? f.hex : blendOver(f.hex, f.alpha, b.hex), bg: b.hex };
}
/** What a rule measures under a metric (L27, L37, L38, L49, L52), or null where the spec says it cannot be measured (L39). */
function expectedOf(rule: { fg: string; bg: string }, metric: Metric, record: ColorRecord, edges: Partial<Edges> | undefined, views: readonly View[] = VIEWS): { actual: number; view: View } | null {
  if (metric === "presence") {
    return presenceOf(edges?.[rule.fg.slice("edge:".length)], rule.bg, record, views);
  }
  if (metric === "ratio") {
    const actual = worstCaseContrast(valueOf(rule.fg, record) ?? "", valueOf(rule.bg, record) ?? "");
    return actual === null ? null : { actual, view: "typical" };
  }
  const sides = sidesOf(rule, record, edges);
  if (sides === null) {
    return null;
  }
  return worstOf(views, (view) => (metric === "lc" ? lcIn(view, sides.fg, sides.bg) : sepIn(view, sides.fg, sides.bg)));
}
const metricOfTier = (tier: Tier) => LEG_FLOOR.get(tier)!.metric;
/** 2.1 #2: the 193 a legibility mode measures, in RULES order — the two scrim rules (among the first 86), then appendix A's 191. */
const LEGIBILITY_ORDER: { fg: string; bg: string; tier: Tier }[] = [
  ...AT_E24DF74.rules.filter((rule) => rule.tier === "scrim").map(({ fg, bg }) => ({ fg, bg, tier: "scrim" as Tier })),
  ...APPENDIX.rules.map(({ fg, bg, tier }) => ({ fg, bg, tier })),
];
/** The rules a planted legibility preset without `edges` cannot measure (L39, 2.1 #8): the 22 edge rules, and R224 and R227. */
const NEEDS_EDGES = APPENDIX.rules.filter((rule) => rule.tier.startsWith("edge-") || rule.bg.startsWith("edge:"));
const ruleNamed = (n: string) => APPENDIX.rules.find((rule) => rule.n === n)!;
const pick = (pairs: Measured[], rule: { fg: string; bg: string }) => {
  const found = pairs.filter((pair) => pair.fg === rule.fg && pair.bg === rule.bg);
  assert.equal(found.length, 1, `${rule.fg} on ${rule.bg}: ${found.length} measurements`);
  return found[0]!;
};
const fresh = () => structuredClone(VALUES.colors);
const freshEdges = () => structuredClone(VALUES.edges);

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
/**
 * A preset for the legibility tests: ocean's fonts, radii and shadow, with these colours, edges, button label and
 * declaration. Pass `null` to leave edges or buttonLabel out altogether.
 */
function legiblePreset(parts: { name?: string; colors?: Record<Mode, ColorRecord>; edges?: Partial<Record<Mode, Partial<Edges>>> | null; buttonLabel?: ButtonLabel | null; contract?: Record<Mode, string> }): Preset {
  const copy = { ...structuredClone(shipped.ocean!), name: parts.name ?? "probe-legible" } as unknown as Record<string, unknown>;
  copy.colors = parts.colors ?? fresh();
  copy.contract = parts.contract ?? { light: LEG, dark: LEG };
  if (parts.edges !== null) {
    copy.edges = parts.edges ?? freshEdges();
  }
  if (parts.buttonLabel !== null) {
    copy.buttonLabel = parts.buttonLabel ?? { ...VALUES.buttonLabel };
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
    // legibility-spec.md L105 #1 (L2): the last index removed is the last of the first 86, which was
    // `RULES.length - 1`. RULES now ends with R283, which wcag-aa does not hold, so removing it changes nothing
    // check 5 sees.
    for (const at of [0, 12, 21, 53, 54, 85]) {
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
  // legibility-spec.md L105 #2 (L8, L23): TIERS was the seven; it is the seven, then the 20 of L23, in that order.
  test("M3 L8 L23 TIERS is every tier: the seven of the M4 table in their order, then the 20 of L22 in theirs", () => {
    assert.deepEqual([...TIERS], [...M4_TIERS, ...NEW_TIERS.map(([tier]) => tier)]);
  });

  // L105 #3 (L8, L23): TIER_KIND was the seven kinds; it is the seven, plus the 20 with the kinds L23 gives.
  test("M4 L23 every tier has the kind the tables state — M4's seven, and L23's 20 — and TIER_KIND names no other tier", () => {
    assert.deepEqual({ ...TIER_KIND }, Object.fromEntries([...M4.map((row) => [row.tier, row.kind]), ...NEW_TIERS]));
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

  // legibility-spec.md L105 #4 (L2, L67): "every rule of RULES is a pair of the 2d3b765 fixture, in the tier M4
  // puts it" holds for RULES.slice(0, 86); every later rule equals appendix A's row (fg, bg, tier), in R order.
  // L105 #5 (L2, L58): "70 apply in each mode" is counted over RULES.slice(0, 86); over all of RULES, 261 apply.
  test("M4 L2 L67 every rule is in the tier its table puts it in — the first 86 by M4, the rest by appendix A in R order — and every tier has its table's count in each mode", () => {
    for (const rule of RULES.slice(0, 86)) {
      const at = pairKey(rule.fg, rule.bg);
      assert.ok(FLOOR_AT_2D3B765.has(at), `${at} was not a rule at 2d3b765`);
      assert.equal(rule.tier, tierOfPair(rule.fg, rule.bg, FLOOR_AT_2D3B765.get(at)!), at);
    }
    assert.deepEqual(RULES.slice(86).map((rule) => [rule.fg, rule.bg, rule.tier]), APPENDIX.rules.map((rule) => [rule.fg, rule.bg, rule.tier]), "RULES after the first 86 is not appendix A's 191 rules, in R order (R280 to R283 last)");
    for (const mode of MODES) {
      const applying = RULES.slice(0, 86).filter((rule) => rule.mode === undefined || rule.mode === mode);
      assert.equal(applying.length, 70, `${mode}: rules of the first 86 that apply`);
      for (const row of M4) {
        assert.equal(applying.filter((rule) => rule.tier === row.tier).length, row.perMode, `${mode}: rules in ${row.tier}`);
      }
      assert.equal(RULES.filter((rule) => rule.mode === undefined || rule.mode === mode).length, APPLYING, `${mode}: rules that apply, over all of RULES`);
    }
  });

  // L105 #6 (L2, L67): RULES.slice(0, 86) equals the fixture; the length is 277; 245 / 16 / 16 by mode.
  test("M4 L2 L67 RULES keeps its first 86 entries in the order of 2d3b765, with the same fg, bg and mode on each, and is 277 long: 245 with no mode, 16 light-only, 16 dark-only", () => {
    assert.deepEqual(RULES.slice(0, 86).map((rule) => [rule.fg, rule.bg, rule.mode ?? null]), RULE_ORDER);
    assert.equal(RULES.length, 277);
    const count = (mode: Mode | undefined) => RULES.filter((rule) => rule.mode === mode).length;
    assert.deepEqual([count(undefined), count("light"), count("dark")], [245, 16, 16]);
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

  // legibility-spec.md L105 #7 (L8, L57): the contracts were ["wcag-aa"]; they are ["wcag-aa", "legibility"].
  test("M9.3 CONTRACT_NAMES equals the keys of contracts; L8 L57 there are two contracts, wcag-aa and then legibility", () => {
    assert.deepEqual([...CONTRACT_NAMES], Object.keys(contracts));
    assert.deepEqual(Object.keys(contracts), ["wcag-aa", "legibility"]);
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

  // legibility-spec.md L105 #8 (L7): a measurement's keys were the seven of PR 1; they are those seven plus
  // `metric` and `view`. L105 #9 (L7): a failure's keys were the six of PR 1; they are those six plus `tier`,
  // `metric` and `view`.
  test("M3 L7 a measurement carries its tier, its tier's kind, the contract's floor, its metric and its view — and nothing else; a failure gains tier, metric and view", () => {
    for (const mode of MODES) {
      const pairs = measureColors(mode, colorsOf(mode), WCAG);
      pairs.forEach((pair, i) => {
        assert.deepEqual(Object.keys(pair).sort(), ["actual", "bg", "fg", "holds", "kind", "metric", "min", "tier", "view"], `${mode} #${i}`);
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
      assert.deepEqual(Object.keys(failure).sort(), ["actual", "bg", "fg", "metric", "min", "mode", "preset", "tier", "view"]);
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
  // legibility-spec.md L105 #10 (L2, L58): wcag-aa's 70 were "every rule that applies in the mode"; they are every
  // rule that applies in the mode whose tier wcag-aa lists, in RULES order.
  test("M6.1 L58 wcag-aa measures every rule that applies in the mode and whose tier it lists — all 70 — in RULES order", () => {
    for (const mode of MODES) {
      const applying = RULES.filter((rule) => (rule.mode === undefined || rule.mode === mode) && M4_TIERS.includes(rule.tier));
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
  // legibility-spec.md L105 #11 (L86, L91): the fixture is NOT re-recorded (its README forbids it). The expected
  // text is the fixture transformed as L86 and L91 say, written here from the spec's sentences: each mode line
  // gains " — wcag-aa; 191 rules not held", and the last line names every declared contract.
  test("M6.8 L86 L91 the report prints what it printed at 2d3b765, with each mode line naming its contract and the rules it leaves unheld, and a last line that lists the declared contracts", () => {
    const run = node(["tools/check-contrast.ts"], pkgRoot);
    assert.equal(run.stderr, "");
    assert.equal(run.status, 0);
    const recorded = readFileSync(join(fixtures, "check-contrast.report.txt"), "utf8");
    const expected = recorded
      .replace(/^( {2}(?:light|dark) +all 70 pairings pass.*)$/gm, "$1 — wcag-aa; 191 rules not held")
      .replace(/^✓ WCAG AA contract holds for every preset in both modes \(700 pairings measured\)$/m, "✓ every declared contract holds for every preset in both modes (700 pairings measured): wcag-aa × 10");
    assert.notEqual(expected, recorded, "the transformation changed nothing: the fixture is not the one it was written against");
    assert.equal(run.stdout, expected);
  });

  // L105 #12 (L25): each of the five measuring surfaces matched `measureColors(`/`checkColors(` and `contractOf(`;
  // each now matches `measurePreset(` and matches neither `measureColors(` nor `checkColors(`.
  test("M6.8 L25 the reports, check-cli and the playground module measure a preset with measurePreset() and nothing else; no file but Token Studio names a contract to the measurement", () => {
    for (const file of [
      "packages/design-system/tools/check-contrast.ts",
      "packages/cli/src/index.ts",
      "packages/cli/scaffold/tools/check-contrast.ts",
      "tools/check-cli.ts",
      "apps/playground/src/contrast-checks.ts",
    ]) {
      const text = body(join(repoRoot, file));
      assert.match(text, /\bmeasurePreset\(/, `${file} does not measure through measurePreset(preset, mode) (L25)`);
      assert.doesNotMatch(text, /\b(?:measureColors|checkColors)\(/, `${file} measures a preset itself: a surface that calls measureColors on a preset can forget the edges (L25)`);
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

  // legibility-spec.md L105 #43 (L24, L27, L101): MAY_CALL gains rules.ts and edges.ts, the two files step 2.1 makes
  // measure with the instruments, and the name loses "in this increment". This file's own arithmetic (the
  // legibility section) calls them too; it was already on the list.
  test("M7 L105 #43 the instruments are called only by this file, the chart gate, and the legibility measurement (rules.ts, edges.ts)", () => {
    const MAY_CALL = new Set([
      "packages/design-system/src/tokens/color.ts", // defines them (separation simulates through its own code)
      "packages/design-system/src/tokens/rules.ts", // L27: lc and sep
      "packages/design-system/src/tokens/edges.ts", // §5.3: the edge pixel and presence
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

  // legibility-spec.md L105 #13 (L25): these two made at least one measureColors(/checkColors( call, each passing a
  // contractOf result; each now calls measurePreset( and makes no measureColors(/checkColors( call —
  // measurePreset takes the preset itself, so there is no contract argument left to check.
  for (const file of ["tools/check-cli.ts", "apps/playground/src/contrast-checks.ts"]) {
    test(`M10.7 L25 ${file}: it measures through measurePreset(preset, mode), and makes no measureColors( or checkColors( call of its own`, () => {
      const text = body(join(repoRoot, file));
      assert.match(text, /\bmeasurePreset\(/, `${file} no longer measures through measurePreset(preset, mode) (L25)`);
      const calls = measuringCalls(text);
      assert.deepEqual(calls.map(({ fn, args }) => `${fn}(${args.join(", ")})`), [], `${file} still measures a preset itself (L25): it can forget the edges`);
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
  // legibility-spec.md L105 #14 (L8): CONTRACT_NAMES was ["wcag-aa"] at the three places this test reads it; it is
  // ["wcag-aa", "legibility"].
  test("M10.11 CONTRACT_NAMES is the list of names at module load; what decides is `contracts` itself — a contract added later is honoured, a name only on the list is not", () => {
    assert.deepEqual([...CONTRACT_NAMES], ["wcag-aa", "legibility"]);
    // In `contracts` and not on the list: honoured everywhere a contract is decided.
    withContract("probe-late", wcagTiers(), (name) => {
      assert.deepEqual([...CONTRACT_NAMES], ["wcag-aa", "legibility"], "CONTRACT_NAMES follows `contracts`: it is the list at module load");
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
    assert.deepEqual([...CONTRACT_NAMES], ["wcag-aa", "legibility"]);
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

  // ══ PR 2, step 2.1: the legibility member — legibility-spec.md, revision 3.1 ═════════════════════════════
  //
  // Tests first (the spec's §12, L101): written from the spec before any of it was built. Every expected number
  // is the spec's — transcribed into legibility-values.json and legibility-appendix-a.json, recorded from e24df74
  // where it is today's behaviour, or typed in here — or this file's own arithmetic from the spec's words, which
  // the first tests below hold to every figure the spec prints.
  const legibilityFrom = ran;

  // ── the fixtures, against the spec and against themselves (no product code is measured here) ──
  /** D6: the 11 roles that move a fill, each with the fill it must equal. */
  const FILL_ROLES: [moving: string, rest: string][] = [
    ["primary-hover", "primary"], ["primary-active", "primary"], ["secondary-hover", "secondary"], ["secondary-active", "secondary"],
    ["accent-hover", "accent"], ["accent-active", "accent"], ["success-hover", "success"], ["warning-hover", "warning"],
    ["danger-hover", "danger"], ["danger-active", "danger"], ["info-hover", "info"],
  ];
  const HUES = ["primary", "secondary", "accent", "success", "warning", "danger", "info"];
  const ROLE_NAMES = SEMANTIC_COLOR_NAMES as readonly string[];

  test("2.1 #2 (fixture) L12 L14 L15 the §3 fixture holds the 69 roles in SEMANTIC_COLOR_NAMES order, then the 20 optional tokens in L15's order, in both modes — and D1 to D12 hold of it", () => {
    assert.equal(ROLE_NAMES.length, 69, "the builder no longer names 69 roles (L11)");
    assert.equal(VALUES.seams.length, 20, "L15 has 20 optional tokens");
    const names = [...ROLE_NAMES, ...VALUES.seams.map((seam) => seam.name)];
    for (const mode of MODES) {
      const c = VALUES.colors[mode];
      assert.deepEqual(Object.keys(c), names, `${mode}: not L14's order`);
      for (const [name, value] of Object.entries(c)) {
        assert.ok(rgbaOf(value) !== null, `${mode}: ${name} is ${value}`);
      }
      assert.equal(c["bg-subtle"], c["surface-sunken"], `${mode}: D1`);
      assert.equal(c["on-scrim"], VALUES.colors.light.surface, `${mode}: D2`);
      assert.equal(c["on-scrim-muted"], VALUES.colors.dark.text, `${mode}: D3`);
      assert.equal(c["text-inverse"], c.bg, `${mode}: D4`);
      assert.equal(c["border-subtle"], c.border, `${mode}: D5`);
      for (const [moving, rest] of FILL_ROLES) {
        assert.equal(c[moving], c[rest], `${mode}: D6, ${moving}`);
      }
      for (const hue of HUES) {
        assert.equal(c[`${hue}-subtle`], blendOver(c[hue]!, mode === "light" ? 0.5 : 0.2, c.surface!), `${mode}: D7, ${hue}-subtle`);
      }
      assert.equal(c["primary-text"], mode === "light" ? "#472400" : c.text, `${mode}: D8`);
      for (const hue of HUES.slice(1)) {
        assert.equal(c[`${hue}-text`], c.text, `${mode}: D9, ${hue}-text`);
      }
      assert.equal(c["link-hover"], c.link, `${mode}: D12`);
      assert.equal(c["selected-wash"], c["primary-subtle"], `${mode}: L15, selected-wash equals primary-subtle`);
    }
    assert.equal(VALUES.colors.dark.link, VALUES.colors.dark.primary, "D11");
    assert.deepEqual(VALUES.buttonLabel, { px: 16, smallPx: 14, weight: 600 }, "L19");
  });

  test("2.1 #2 (fixture) L42 L45 L46 L52 the §5.2 fixture: 13 elements a mode in EdgeElement order, each layer well formed and one all-round, hover and press on the four filled elements only, danger sharing secondary's recipe", () => {
    for (const mode of MODES) {
      const edges = VALUES.edges[mode];
      assert.deepEqual(Object.keys(edges), ELEMENTS, mode);
      for (const [element, recipe] of Object.entries(edges)) {
        assert.ok(ROLE_NAMES.includes(recipe.fill) || SEAM_FALLBACK.has(recipe.fill), `${mode} ${element}: fill ${recipe.fill}`);
        for (const layer of [...recipe.rest, ...(recipe.hover ?? []), ...(recipe.press ?? [])]) {
          assert.ok(/^#[0-9a-f]{6}$/.test(layer.color) && layer.alpha > 0 && layer.alpha <= 1 && layer.blur >= 0 && [layer.x, layer.y, layer.spread].every(Number.isFinite), `${mode} ${element}: ${shown(layer)}`);
        }
        assert.equal(recipe.hover !== undefined && recipe.press !== undefined, element.startsWith("filled-"), `${mode} ${element}: hover and press`);
        assert.equal(recipe.rest.filter(allRound).length, 1, `${mode} ${element}: L45 marks one all-round layer`);
      }
      const { fill: _danger, ...danger } = edges["filled-danger"]!;
      const { fill: _secondary, ...secondary } = edges["filled-secondary"]!;
      assert.deepEqual(danger, secondary, `${mode}: L46, danger uses the recipe of secondary`);
      assert.equal(edges.quiet!.fill, "quiet-fill", `${mode}: L46, L106`);
    }
    assert.equal(edgePixelOf(VALUES.edges.light.field, VALUES.colors.light), "#e1d5bf", "L52, light");
    assert.equal(edgePixelOf(VALUES.edges.dark.field, VALUES.colors.dark), "#64594d", "L52, dark");
  });

  test("2.1 #2 (fixture) appendix A, appendix B: every figure the spec prints for the 191 rules in both modes is this file's arithmetic on the §3 and §5.2 fixture — to the two decimals printed, in the view printed, every one at or over its floor", () => {
    let cells = 0;
    for (const mode of MODES) {
      for (const rule of APPENDIX.rules) {
        const cell = rule[mode];
        const metric = metricOfTier(rule.tier);
        const got = expectedOf(rule, metric, VALUES.colors[mode], VALUES.edges[mode]);
        const where = `${rule.n} ${mode}, ${rule.fg} on ${rule.bg}`;
        assert.ok(got !== null, `${where}: cannot be measured from the fixture`);
        assert.ok(Math.abs(got.actual - cell.actual) <= 0.005 + 1e-9 && got.view === cell.view, `${where}: ${got.actual} (${got.view}), and the spec prints ${cell.actual} (${cell.view})`);
        assert.ok(got.actual >= floorIn(rule.tier, mode), `${where}: under its own floor`);
        if (cell.fg !== undefined) {
          assert.deepEqual(sidesOf(rule, VALUES.colors[mode], VALUES.edges[mode]), { fg: cell.fg, bg: cell.bg }, `${where}: the colours measured`);
        }
        cells++;
      }
    }
    assert.equal(cells, 382);
    assert.equal(APPENDIX.edgeDetail.length, 44, "appendix B: 22 rules × 2 modes");
    for (const row of APPENDIX.edgeDetail) {
      const recipe = VALUES.edges[row.mode][row.fg.slice("edge:".length)]!;
      const colors = VALUES.colors[row.mode];
      const k = valueOf(row.bg, colors)!;
      const f = valueOf(recipe.fill, colors)!;
      const layer = recipe.rest.find(allRound)!;
      const p = blendOver(layer.color, layer.alpha, layer.inset ? f : k);
      const where = `appendix B, ${row.n} ${row.mode}`;
      assert.deepEqual([f, k, p], [row.fill, row.backdrop, row.pixel], `${where}: fill, backdrop, edge pixel`);
      for (const [got, printed, what] of [[worstOf(VIEWS, (v) => sepIn(v, f, k)).actual, row.fillStep, "fill step"], [worstOf(VIEWS, (v) => sepIn(v, p, k)).actual, row.pixelFromBackdrop, "pixel from backdrop"], [worstOf(VIEWS, (v) => sepIn(v, p, f)).actual, row.pixelFromFill, "pixel from fill"]] as const) {
        assert.ok(Math.abs(got - printed) <= 0.005 + 1e-9, `${where}: ${what} ${got}, printed ${printed}`);
      }
      const presence = presenceOf(recipe, row.bg, colors, VIEWS)!;
      assert.ok(Math.abs(presence.actual - row.presence) <= 0.005 + 1e-9 && presence.view === row.view, `${where}: presence ${presence.actual} (${presence.view}), printed ${row.presence} (${row.view})`);
    }
  });

  /** L50's table, typed in: per view, typical / protan / deutan / tritan. */
  const WORKED: { n: string; mode: Mode; what: string; pixel: string; fillStep: number[]; fromBackdrop: number[]; fromFill: number[]; presence: number; view: View }[] = [
    { n: "R252", mode: "light", what: "the light card on the page", pixel: "#dbc19b", fillStep: [2.77, 3.00, 2.68, 2.36], fromBackdrop: [14.76, 15.54, 14.52, 14.40], fromFill: [17.10, 18.17, 16.73, 16.70], presence: 16.70, view: "tritan" },
    { n: "R256", mode: "light", what: "the light field on a card", pixel: "#e1d5bf", fillStep: [0, 0, 0, 0], fromBackdrop: [11.32, 11.72, 11.17, 11.03], fromFill: [11.32, 11.72, 11.17, 11.03], presence: 11.03, view: "tritan" },
    { n: "R252", mode: "dark", what: "the dark card on the page", pixel: "#493c2f", fillStep: [7.06, 6.93, 7.09, 7.09], fromBackdrop: [16.07, 16.23, 16.06, 16.07], fromFill: [9.03, 9.31, 8.98, 9.03], presence: 16.06, view: "deutan" },
    { n: "R256", mode: "dark", what: "the dark field on a card", pixel: "#64594d", fillStep: [12.24, 12.04, 12.31, 12.28], fromBackdrop: [19.53, 19.99, 19.44, 19.51], fromFill: [31.73, 32.00, 31.71, 31.73], presence: 31.71, view: "deutan" },
  ];

  test("2.1 #6 (fixture) L48 L49 L50 the four worked examples' every column, view by view, is this file's arithmetic on the fixture: the edge pixel, and the three steps whose largest is presence", () => {
    for (const row of WORKED) {
      const rule = ruleNamed(row.n);
      const recipe = VALUES.edges[row.mode][rule.fg.slice("edge:".length)]!;
      const colors = VALUES.colors[row.mode];
      const k = valueOf(rule.bg, colors)!;
      const f = valueOf(recipe.fill, colors)!;
      const layer = recipe.rest.find(allRound)!;
      const p = blendOver(layer.color, layer.alpha, layer.inset ? f : k);
      assert.equal(p, row.pixel, `${row.what}: P`);
      VIEWS.forEach((view, i) => {
        for (const [got, printed, what] of [[sepIn(view, f, k), row.fillStep[i]!, "backdrop to fill"], [sepIn(view, p, k), row.fromBackdrop[i]!, "edge pixel to backdrop"], [sepIn(view, p, f), row.fromFill[i]!, "edge pixel to fill"]] as const) {
          assert.ok(Math.abs(got - printed) <= 0.005 + 1e-9, `${row.what}, ${view}: ${what} ${got}, printed ${printed}`);
        }
      });
      assert.deepEqual(presenceOf(recipe, rule.bg, colors, VIEWS)?.view, row.view);
    }
  });

  test("2.1 #6 (fixture) L29 L30 the two worked examples of §4.2 are the instruments' answers: Lc is signed and not symmetric, and under a simulation it is taken on simulateCvd's 8-bit hexes", () => {
    assert.ok(near(apcaLc("#693800", "#fef4dc"), 85.84, 0.005) && near(apcaLc("#fef4dc", "#693800"), -89.44, 0.005), "L29: 85.84 and −89.44");
    const dark = VIEWS.map((view) => (view === "typical" ? apcaLc("#f3e7ce", "#211409")! : apcaLc(simulateCvd("#f3e7ce", view), simulateCvd("#211409", view))!));
    [-91.87, -90.87, -92.45, -91.84].forEach((lc, i) => assert.ok(near(dark[i], lc, 0.005), `L29: ${VIEWS[i]} is ${lc}, and it is ${dark[i]}`));
    assert.deepEqual(worstOf(VIEWS, (view) => lcIn(view, "#f3e7ce", "#211409")).view, "protan");
    assert.deepEqual([simulateCvd("#693800", "tritan"), simulateCvd("#fef4dc", "tritan")], ["#742d2f", "#fff0ed"], "L30");
    [85.84, 87.79, 85.18, 84.86].forEach((lc, i) => assert.ok(near(lcIn(VIEWS[i]!, "#693800", "#fef4dc"), lc, 0.005), `L30: ${VIEWS[i]}`));
  });

  /** L81's table, typed in. */
  const L81_CONTAINER: Record<Mode, Recipe> = {
    light: { fill: "surface", rest: [{ inset: true, x: 0, y: 0, blur: 0, spread: 1, color: "#f1eeeb", alpha: 1 }, { inset: false, x: 0, y: 1, blur: 3, spread: 0, color: "#26231f", alpha: 0.09 }, { inset: false, x: 0, y: 1, blur: 2, spread: 0, color: "#26231f", alpha: 0.05 }] },
    dark: { fill: "surface", rest: [{ inset: true, x: 0, y: 0, blur: 0, spread: 1, color: "#38342f", alpha: 1 }, { inset: false, x: 0, y: 1, blur: 3, spread: 0, color: "#000000", alpha: 0.216 }, { inset: false, x: 0, y: 1, blur: 2, spread: 0, color: "#000000", alpha: 0.12 }] },
  };

  test("2.1 #4 (fixture) L81 L82 the known-bad fixture is sorbet as e24df74 ships it — 68 roles a mode, no danger-active, no optional token — with L81's container edge; L82's figures in all four views are this file's arithmetic on it, to 1e-4", () => {
    assert.equal(KNOWN_BAD.recordedFrom, "e24df74");
    for (const mode of MODES) {
      assert.deepEqual(Object.keys(KNOWN_BAD.colors[mode]).sort(), ROLE_NAMES.filter((name) => name !== "danger-active").sort(), `${mode}: the 68 roles main emits (in main's own order)`);
      assert.deepEqual(KNOWN_BAD.edges[mode], { container: L81_CONTAINER[mode] }, `${mode}: L81's container`);
    }
    const four = (at: (view: View) => number) => VIEWS.map(at);
    const close4 = (got: number[], printed: number[], what: string) => printed.forEach((value, i) => assert.ok(near(got[i], value, 1e-4), `${what}, ${VIEWS[i]}: ${got[i]}, printed ${value}`));
    const d = KNOWN_BAD.colors.dark;
    const l = KNOWN_BAD.colors.light;
    assert.deepEqual([d.surface, d.bg], ["#38342f", "#26231f"], "L82: the dark card's fill and backdrop");
    close4(four((v) => presenceOf(KNOWN_BAD.edges.dark.container, "bg", d, [v])!.actual), [6.9482, 6.8958, 6.9633, 6.9571], "R252 dark");
    assert.deepEqual([l["primary-solid"], valueOf("switch-off", l)], ["#008289", "#777168"], "L82: the light switch reads border-strong for switch-off");
    close4(four((v) => sepIn(v, "#008289", "#777168")), [10.3232, 5.2781, 5.7253, 11.1071], "R179 light");
    assert.deepEqual([l["on-primary"], valueOf("control-checked", l)], ["#26231f", "#008289"], "L82: the light tick reads primary-solid for control-checked");
    close4(four((v) => lcIn(v, "#26231f", "#008289")), [29.1918, 31.9755, 26.3547, 31.3363], "R171 light");
    assert.deepEqual([simulateCvd("#26231f", "deutan"), simulateCvd("#008289", "deutan")], ["#25241f", "#677089"], "L82: the tick under deutan");
  });

  test("2.1 #2 (fixture) the two transcribed fixtures are still what legibility-spec.md says (transcribe-legibility-spec.mjs.txt --check)", () => {
    const script = readFileSync(join(fixtures, "transcribe-legibility-spec.mjs.txt"), "utf8");
    const run = spawnSync(process.execPath, ["--input-type=module", "-", repoRoot, "--check"], { input: script, encoding: "utf8" });
    assert.equal(run.status, 0, `the spec and its transcription differ:\n${run.stdout}${run.stderr}`);
  });

  // ── the member (§4.1, §6) ─────────────────────────────────────────────
  test("L57 contracts.legibility: its name, a calibratedFor that says it was calibrated for one reader on 2026-10-03, the four views in order, the six checks in order, and exactly the 21 tiers of L61", () => {
    const member = legibility();
    assert.equal(member.name, "legibility");
    assert.ok(typeof member.calibratedFor === "string" && member.calibratedFor.includes("one reader") && member.calibratedFor.includes("2026-10-03"), `calibratedFor reads: ${shown(member.calibratedFor)}`);
    assert.deepEqual(member.views, [...VIEWS]);
    assert.deepEqual(member.checks, CHECKS);
    assert.deepEqual(Object.keys(member.tiers).sort(), APPENDIX.floors.map((row) => row.tier).sort(), "a mistyped tier, or one too many or too few");
  });

  test("L61 L62 L63 L26 every legibility floor is L61's number per mode — written { light, dark } except scrim, label, tell-apart and palette, which are one number — and floorFor answers it; none is rounded up", () => {
    const member = legibility();
    assert.equal(APPENDIX.floors.length, 21);
    for (const row of APPENDIX.floors) {
      const entry = member.tiers[row.tier] as unknown as { min: unknown };
      assert.ok(entry !== undefined, `legibility does not list ${row.tier}`);
      if (ONE_NUMBER.has(row.tier)) {
        assert.equal(row.light, row.dark);
        assert.equal(entry.min, row.light, `${row.tier}: one number (L62)`);
      } else {
        assert.deepEqual(entry.min, { light: row.light, dark: row.dark }, `${row.tier}: { light, dark } (L62)`);
      }
      for (const mode of MODES) {
        assert.equal(floorFor(LEG, row.tier, mode), row[mode], `floorFor(legibility, ${row.tier}, ${mode})`);
      }
    }
    // L63: the two cells where the unrounded weakest pair matters.
    assert.deepEqual([floorFor(LEG, "secondary", "light"), floorFor(LEG, "edge-floating", "dark")], [74.2, 20.4]);
  });

  test("L61 L23 L34 each legibility tier has the kind and the metric L61 states, and TIER_KIND agrees", () => {
    const member = legibility();
    const kinds = new Map<string, string>([...M4.map((row) => [row.tier, row.kind] as [string, string]), ...NEW_TIERS]);
    for (const row of APPENDIX.floors) {
      assert.equal(kinds.get(row.tier), row.kind, `${row.tier}: L61 and L23 disagree (the fixture)`);
      assert.equal((member.tiers[row.tier] as unknown as { metric: string }).metric, row.metric, `${row.tier}: metric`);
      assert.equal(TIER_KIND[row.tier], row.kind, `${row.tier}: TIER_KIND`);
    }
  });

  test("L58 L66 legibility's scrim tier is wcag-aa's, copied: the same metric, floor, why and retire", () => {
    assert.deepEqual(legibility().tiers.scrim, contracts[WCAG].tiers.scrim);
  });

  test("L65 L115 the label tier requires { buttonLabelPx: 16, buttonLabelSmallPx: 14, buttonLabelWeight: 600 }; no other tier of either contract carries `requires`", () => {
    for (const [name, contract] of Object.entries(contracts)) {
      for (const [tier, entry] of Object.entries(contract.tiers)) {
        const requires = (entry as unknown as { requires?: unknown }).requires;
        if (name === LEG && tier === "label") {
          assert.deepEqual(requires, { buttonLabelPx: 16, buttonLabelSmallPx: 14, buttonLabelWeight: 600 });
        } else {
          assert.equal(requires, undefined, `${name}, ${tier} carries requires`);
        }
      }
    }
    assert.ok(Object.hasOwn(legibility().tiers, "label"));
  });

  test("L66 every legibility tier has a why and a retire that are not empty after trimming", () => {
    for (const [tier, entry] of Object.entries(legibility().tiers)) {
      assert.ok(typeof entry.why === "string" && entry.why.trim() !== "", `${tier}: why is ${shown(entry.why)}`);
      assert.ok(typeof entry.retire === "string" && entry.retire.trim() !== "", `${tier}: retire is ${shown(entry.retire)}`);
    }
    assert.equal(Object.keys(legibility().tiers).length, 21);
  });

  test("L1 wcag-aa is unchanged from e24df74, key for key and character for character: its name, calibratedFor and seven tiers — and it gains no views and no checks", () => {
    assert.equal(AT_E24DF74.recordedFrom, "e24df74");
    assert.deepEqual(JSON.parse(JSON.stringify(contracts[WCAG])), AT_E24DF74.contract);
    assert.ok(!Object.hasOwn(contracts[WCAG], "views") && !Object.hasOwn(contracts[WCAG], "checks"), "wcag-aa gained views or checks");
  });

  test("L2 the first 86 rules keep the fg, bg, tier, why and mode they have at e24df74, in order", () => {
    assert.deepEqual(RULES.slice(0, 86).map((rule) => ({ fg: rule.fg, bg: rule.bg, tier: rule.tier, why: rule.why, mode: rule.mode ?? null })), AT_E24DF74.rules);
  });

  test("L67 L68 the 191 rules after them apply in both modes (no `mode`) and each says why it is in the contract; R280 to R283 come last", () => {
    const added = RULES.slice(86);
    assert.equal(added.length, 191);
    for (const [i, rule] of added.entries()) {
      const n = APPENDIX.rules[i]?.n;
      assert.ok(!Object.hasOwn(rule, "mode") || rule.mode === undefined, `${n}: restricted to ${rule.mode}`);
      assert.ok(typeof rule.why === "string" && rule.why.trim() !== "", `${n}: why is ${shown(rule.why)}`);
    }
    assert.deepEqual(added.slice(-4).map((rule) => [rule.fg, rule.bg]), [["success-mark", "surface-raised"], ["warning-mark", "surface-raised"], ["danger-mark", "surface-raised"], ["info-mark", "surface-raised"]]);
  });

  test("L24 L108 applyingCount(mode) is how many rules apply in a mode, whatever any contract holds: 261 in each; counted from RULES as it stands; a mode that is not a mode is refused", () => {
    const applyingCount = api("applyingCount");
    for (const mode of MODES) {
      assert.equal(applyingCount(mode), APPLYING, mode);
      assert.equal(applyingCount(mode), RULES.filter((rule) => rule.mode === undefined || rule.mode === mode).length);
    }
    withRules((rules) => rules.push({ fg: "chart-1", bg: "surface", tier: "chart", mode: "dark", why: "A rule planted by test-contracts.ts." }), () => {
      assert.deepEqual([applyingCount("light"), applyingCount("dark")], [APPLYING, APPLYING + 1], "one dark-only rule more");
    });
    for (const mode of ["system", "Light", "", undefined, null]) {
      throwsTypeError(() => applyingCount(mode), [], `applyingCount(${shown(mode)})`);
    }
  });

  test("L24 L36 metricFor(contract, tier) is the metric a contract measures a tier with — undefined for a known tier it does not list — and refuses what floorFor refuses", () => {
    const metricFor = api("metricFor");
    for (const row of APPENDIX.floors) {
      assert.equal(metricFor(LEG, row.tier), row.metric, `legibility, ${row.tier}`);
    }
    for (const tier of M4_TIERS) {
      assert.equal(metricFor(WCAG, tier), "ratio", `wcag-aa, ${tier}`);
      if (tier !== "scrim") {
        assert.equal(metricFor(LEG, tier), undefined, `legibility does not list ${tier}`);
      }
    }
    for (const [tier] of NEW_TIERS) {
      assert.equal(metricFor(WCAG, tier), undefined, `wcag-aa does not list ${tier}`);
    }
    for (const tier of ["txet", "Body", "edge", "toString", "", undefined, null]) {
      throwsTypeError(() => metricFor(LEG, tier), [], `metricFor(legibility, ${shown(tier)})`);
      throwsTypeError(() => floorFor(LEG, tier as Tier, "light"), [], `floorFor(legibility, ${shown(tier)}, light)`);
    }
    for (const name of ["wcag-aaa", "Legibility", "apca", "toString", "__proto__"]) {
      throwsTypeError(() => metricFor(name, "body"), [name], `metricFor(${name}, body)`);
    }
    // The same contracts as floorFor: one with a key that is not a tier (M10.1) …
    const stray = { ...wcagTiers(), txet: floor(4.5) };
    withContract("probe-stray-key", stray, (name) => {
      throwsTypeError(() => metricFor(name, "text"), [name, "txet"], "metricFor, a stray key");
      throwsTypeError(() => floorFor(name, "text", "light"), [name, "txet"], "floorFor, a stray key");
    });
    // … and one whose floor is unusable (M10.2).
    withContract("probe-one", { text: floor(1) }, (name) => {
      throwsTypeError(() => metricFor(name, "text"), [name], "metricFor, a floor of 1");
    });
  });

  test("M3 L24 L79 L15 L119 the public barrel exports what step 2.1 adds: measurePreset, metricFor, applyingCount, checkStructure and SEAMS", () => {
    for (const name of ["measurePreset", "metricFor", "applyingCount", "checkStructure"]) {
      assert.equal(typeof lib[name], "function", `src/tokens/index.ts does not export ${name}()`);
    }
    assert.ok(lib.SEAMS !== undefined, "src/tokens/index.ts does not export SEAMS");
    assert.equal(lib.SEAMS, seamsModule?.SEAMS, "the barrel's SEAMS is not seams.ts's");
  });

  test("L15 SEAMS, a new export of src/tokens/seams.ts, is exactly L15's 20 optional tokens, in order, each with its fallback: a role, or css text", () => {
    assert.ok(seamsModule !== undefined, `src/tokens/seams.ts does not load: ${seamsMissing}`);
    const seams = seamsModule.SEAMS as Record<string, unknown> | undefined;
    assert.ok(seams !== undefined && typeof seams === "object", "src/tokens/seams.ts does not export SEAMS");
    assert.deepEqual(Object.entries(seams).map(([name, fallback]) => [name, JSON.parse(JSON.stringify(fallback)) as unknown]), VALUES.seams.map((seam) => [seam.name, seam.fallback]));
    for (const seam of VALUES.seams) {
      if ("fallback" in seam.fallback) {
        assert.ok(ROLE_NAMES.includes(seam.fallback.fallback), `${seam.name}: a role fallback is always a role (L37)`);
      }
    }
  });

  // ── what a contract may say (§4.3) ────────────────────────────────────
  const tierFloor = (metric: unknown, min: unknown, more: object = {}) => ({ metric, min, why: "A probe floor.", retire: "When the test that planted it ends.", ...more });
  /** A legibility-shaped probe registered under `key`: views and checks as given (absent when undefined), and the tiers. */
  function shaped(key: string, tiers: Record<string, unknown>, extra: { views?: unknown; checks?: unknown } = { views: [...VIEWS] }) {
    return { name: key, calibratedFor: "Nobody: a probe planted by test-contracts.ts.", ...extra, tiers } as unknown as Contract;
  }
  /** Accepted: floorFor, metricFor and measureColors answer, and the measurement is the rules of the listed tiers. */
  function accepted(key: string, tiers: Record<string, unknown>, extra: { views?: unknown; checks?: unknown } | undefined, what: string) {
    withRaw(key, shaped(key, tiers, extra), (name) => {
      for (const [tier, entry] of Object.entries(tiers)) {
        const min = (entry as { min: unknown }).min;
        assert.equal(api("metricFor")(name, tier), (entry as { metric: unknown }).metric, `${what}: metricFor(${tier})`);
        for (const mode of MODES) {
          assert.equal(floorFor(name, tier as Tier, mode), typeof min === "number" ? min : (min as Record<Mode, number>)[mode], `${what}: floorFor(${tier}, ${mode})`);
        }
      }
      for (const mode of MODES) {
        const pairs = measure(mode, VALUES.colors[mode], name, VALUES.edges[mode]);
        const listed = RULES.filter((rule) => (rule.mode === undefined || rule.mode === mode) && Object.hasOwn(tiers, rule.tier));
        assert.deepEqual(pairs.map((pair) => [pair.fg, pair.bg]), listed.map((rule) => [rule.fg, rule.bg]), `${what}: measureColors(${mode})`);
      }
    });
  }
  /** Refused by every way in, with a TypeError naming the key it was reached by (L33 to L36; M10.1, M10.13). */
  function refused(key: string, tiers: Record<string, unknown>, extra: { views?: unknown; checks?: unknown } | undefined, words: string[], what: string) {
    withRaw(key, shaped(key, tiers, extra), (name) => {
      refusedEverywhere(name, words, what);
      for (const tier of ["body", "text", "scrim", ...Object.keys(tiers)]) {
        throwsTypeError(() => api("metricFor")(name, tier), [key, ...words], `${what}: metricFor(${tier}) (L36)`);
      }
      for (const mode of MODES) {
        throwsTypeError(() => measure(mode, VALUES.colors[mode], name, VALUES.edges[mode]), [key, ...words], `${what}: measureColors(${mode}) with the §3 colours and edges`);
      }
    });
  }
  const SOUND = { body: tierFloor("lc", 50) };

  test("L33 L34 L35 a contract may use any of the four metrics, each on a tier of a kind it suits, with views, checks and requires well formed: floorFor, metricFor and measureColors answer it", () => {
    accepted("probe-sound", {
      scrim: tierFloor("ratio", 4.5),
      body: tierFloor("lc", 50),
      secondary: tierFloor("ratio", 3), // ratio on a text tier
      label: tierFloor("lc", { light: 0.5, dark: 60 }, { requires: { buttonLabelPx: 16, buttonLabelSmallPx: 14, buttonLabelWeight: 600 } }),
      "mark-area": tierFloor("sep", 5), // sep on a shape tier
      "mark-line": tierFloor("ratio", 1.5), // ratio on a shape tier
      "focus-visible": tierFloor("sep", 0.01), // sep on a focus tier: anything greater than 0
      focus: tierFloor("sep", 3),
      palette: tierFloor("sep", 1), // sep on a distinction tier
      "chart-mark": tierFloor("ratio", 1.2), // ratio on a chart tier
      chart: tierFloor("sep", { light: 5, dark: 6 }), // sep on a chart tier
      "edge-status": tierFloor("presence", 1), // presence on an edge tier
    }, { views: [...VIEWS], checks: [...CHECKS] }, "one tier of every kind");
    accepted("probe-no-views", SOUND, {}, "no views and no checks (L22: typical only; none)");
    accepted("probe-some-views", SOUND, { views: ["tritan", "typical"], checks: [] }, "two views; an empty checks list");
    accepted("probe-one-check", SOUND, { views: ["deutan"], checks: ["label-type"] }, "one view; one check");
  });

  test("L33 a tier's metric must be one of the four: anything else refuses the contract, naming its key", () => {
    accepted("probe-metric", SOUND, undefined, "the probe, sound");
    for (const metric of ["apca", "Lc", "LC", "separation", "presence ", "contrast", "", null, undefined, 3]) {
      refused("probe-metric", { ...SOUND, palette: tierFloor(metric, 5) }, undefined, [], `metric ${shown(metric)}`);
    }
  });

  test("L33 L126 an lc, sep or presence floor must be a finite number greater than 0 — in each mode of a per-mode floor; a ratio floor, greater than 1 (unchanged)", () => {
    const cases: [metric: string, tier: string][] = [["lc", "placeholder"], ["sep", "mark-area"], ["presence", "edge-container"]];
    for (const [metric, tier] of cases) {
      accepted("probe-floor", { ...SOUND, [tier]: tierFloor(metric, 0.0001) }, undefined, `${metric} at 0.0001`);
      accepted("probe-floor", { ...SOUND, [tier]: tierFloor(metric, { light: 0.5, dark: 200 }) }, undefined, `${metric} per mode`);
      for (const min of [0, -0, -1, -0.0001, NaN, Infinity, -Infinity, null, undefined, "50", "", true, [50], {}, { light: 50 }, { dark: 50 }, { light: 50, dark: 0 }, { light: -1, dark: 50 }, { light: 50, dark: "50" }]) {
        refused("probe-floor", { ...SOUND, [tier]: tierFloor(metric, min) }, undefined, [], `${metric} on ${tier}, a floor of ${shown(min)}`);
      }
    }
    accepted("probe-floor", { ...SOUND, scrim: tierFloor("ratio", 1.0001) }, undefined, "ratio at 1.0001");
    for (const min of [1, 0.5, 0, { light: 4.5, dark: 1 }]) {
      refused("probe-floor", { ...SOUND, scrim: tierFloor("ratio", min) }, undefined, [], `ratio on scrim, a floor of ${shown(min)}`);
    }
  });

  test("L34 the metric must suit the tier's kind: lc on text only; presence only on an edge tier, and an edge tier only presence; sep on shape, focus, chart, distinction; ratio on text, shape, focus, chart", () => {
    const KIND_TIER: Record<string, string[]> = {
      text: ["body", "placeholder", "text"], shape: ["mark-area", "divider", "shape"], focus: ["focus-visible", "focus"], chart: ["chart-mark", "chart"],
      distinction: ["tell-apart", "palette"], edge: ["edge-container", "edge-filled"],
    };
    const SUITS: Record<Metric, string[]> = { lc: ["text"], presence: ["edge"], sep: ["shape", "focus", "chart", "distinction"], ratio: ["text", "shape", "focus", "chart"] };
    const MIN: Record<Metric, number> = { lc: 50, presence: 5, sep: 5, ratio: 3 };
    for (const [metric, kinds] of Object.entries(SUITS) as [Metric, string[]][]) {
      for (const [kind, tiers] of Object.entries(KIND_TIER)) {
        for (const tier of tiers) {
          const entry = { [tier]: tierFloor(metric, MIN[metric]) };
          if (kinds.includes(kind)) {
            accepted("probe-kind", tier === "body" ? entry : { ...SOUND, ...entry }, undefined, `${metric} on ${tier} (${kind})`);
          } else {
            refused("probe-kind", tier === "body" ? entry : { ...SOUND, ...entry }, undefined, [], `${metric} on ${tier} (${kind})`);
          }
        }
      }
    }
  });

  test("L35 `views`, when present, is a non-empty array of distinct View names; a wrong name is refused, not ignored", () => {
    for (const views of [[], ["typical", "typical"], ["protan", "deutan", "protan"], ["protanopia"], ["Typical"], ["typical", "normal"], ["typical", null], "typical", { 0: "typical" }, 4]) {
      refused("probe-views", SOUND, { views }, [], `views ${shown(views)}`);
    }
  });

  test("L35 `checks`, when present, is an array of distinct CheckNames; a wrong name is refused, not ignored", () => {
    for (const checks of [["roles-complete", "roles-complete"], ["role-complete"], ["Hierarchy"], ["hierarchy", "edge-not-fill", "hierarchy"], ["label-type", null], ["C1"], "hierarchy", { 0: "hierarchy" }]) {
      refused("probe-checks", SOUND, { views: [...VIEWS], checks }, [], `checks ${shown(checks)}`);
    }
  });

  test("L35 `requires`, when present, has three finite positive numbers: buttonLabelPx, buttonLabelSmallPx, buttonLabelWeight", () => {
    const good = { buttonLabelPx: 16, buttonLabelSmallPx: 14, buttonLabelWeight: 600 };
    for (const requires of [{ ...good, buttonLabelPx: 0 }, { ...good, buttonLabelSmallPx: -14 }, { ...good, buttonLabelWeight: NaN }, { ...good, buttonLabelPx: Infinity }, { ...good, buttonLabelPx: "16" }, { buttonLabelPx: 16, buttonLabelSmallPx: 14 }, { buttonLabelPx: 16, buttonLabelWeight: 600 }, {}, null, 16, [16, 14, 600]]) {
      // checks list label-type, so the refusal is L35's and not L137's.
      refused("probe-requires", { ...SOUND, label: tierFloor("lc", 60, { requires }) }, { views: [...VIEWS], checks: [...CHECKS] }, [], `requires ${shown(requires)}`);
    }
  });

  test("L125 L35 `views`, `checks` and `requires` are present when an own key holds anything but undefined: null is present, and refused as malformed; an own key holding undefined is absent", () => {
    const requires = { buttonLabelPx: 16, buttonLabelSmallPx: 14, buttonLabelWeight: 600 };
    // Absent: an own key holding undefined is no key at all (views absent means typical only; no checks; no requirement).
    accepted("probe-undefined", { ...SOUND, label: tierFloor("lc", 60, { requires: undefined }) }, { views: undefined, checks: undefined }, "views, checks and requires each an own key holding undefined");
    accepted("probe-present", { ...SOUND, label: tierFloor("lc", 60, { requires }) }, { views: [...VIEWS], checks: [...CHECKS] }, "the same three, well formed");
    refused("probe-null", SOUND, { views: null }, [], "views: null");
    refused("probe-null", SOUND, { views: [...VIEWS], checks: null }, [], "checks: null");
    refused("probe-null", { ...SOUND, label: tierFloor("lc", 60, { requires: null }) }, { views: [...VIEWS], checks: [...CHECKS] }, [], "requires: null (label-type listed, so this is L125's refusal and not L137's)");
  });

  test("L41 M6.4 stands: a legibility-shaped contract that yields no measurement in a mode throws, naming it — and one whose every measurement cannot be measured does not", () => {
    withRaw("probe-status-only", shaped("probe-status-only", { "edge-status": tierFloor("presence", 5) }), (name) => {
      const pairs = measure("light", VALUES.colors.light, name, undefined);
      assert.equal(pairs.length, 4, "four status edges, none measurable without edges (L39): that is a result, not nothing");
      assert.ok(pairs.every((pair) => pair.actual === null && pair.holds === false));
      withRules((rules) => {
        const kept = rules.filter((rule) => rule.tier !== "edge-status");
        rules.length = 0;
        rules.push(...kept);
      }, () => {
        for (const mode of MODES) {
          throwsTypeError(() => measure(mode, VALUES.colors[mode], name, VALUES.edges[mode]), ["probe-status-only"], `no rule of its one tier, ${mode}`);
        }
      });
    });
  });

  // ── the measurement (§4.2, §4.4, §5.3, §5.4) ──────────────────────────
  test("2.1 #2 L27 L58 the §3 fixture passes legibility: 193 measurements a mode in RULES order — on-scrim and on-scrim-muted on scrim, ratios at the worst case, 5.5562 and 4.6844 to 1e-4 (typical), then appendix A's 191, each to 0.01 in the view it states — and every one holds", () => {
    for (const mode of MODES) {
      const pairs = measure(mode, VALUES.colors[mode], LEG, VALUES.edges[mode]);
      assert.deepEqual(pairs.map((pair) => [pair.fg, pair.bg, pair.tier]), LEGIBILITY_ORDER.map((rule) => [rule.fg, rule.bg, rule.tier]), `${mode}: not the 193, in RULES order`);
      assert.equal(pairs.length, HELD_BY_LEGIBILITY);
      pairs.forEach((pair, i) => {
        const tier = LEGIBILITY_ORDER[i]!.tier;
        const where = `${mode}: ${i < 2 ? "" : `${APPENDIX.rules[i - 2]!.n} `}${pair.fg} on ${pair.bg}`;
        assert.deepEqual([pair.kind, pair.metric, pair.min], [LEG_FLOOR.get(tier)!.kind, LEG_FLOOR.get(tier)!.metric, floorIn(tier, mode)], `${where}: kind, metric, floor`);
        if (i < 2) {
          assert.ok(near(pair.actual, SCRIM_RATIO[pair.fg]!, 1e-4), `${where}: ${pair.actual}, and the spec says ${SCRIM_RATIO[pair.fg]}`);
          assert.equal(pair.view, "typical", `${where}: a ratio is typical vision only (L32)`);
        } else {
          const cell = APPENDIX.rules[i - 2]![mode];
          assert.ok(near(pair.actual, cell.actual, 0.01), `${where}: ${pair.actual}, and appendix A says ${cell.actual}`);
          assert.equal(pair.view, cell.view, `${where}: the view`);
        }
        assert.equal(pair.holds, true, `${where}: does not hold`);
      });
      assert.deepEqual(failuresOf("probe", mode, VALUES.colors[mode], LEG, VALUES.edges[mode]), [], `${mode}: checkColors`);
    }
  });

  test("2.1 #2 L27 L29 L30 L31 L38 L49 L129 each of the 193 is exactly the spec's arithmetic, to 1e-9, in the first view that reaches it: Lc unsigned on simulateCvd's hexes, separation as floats, presence over the all-round layers alone", () => {
    for (const mode of MODES) {
      const pairs = measure(mode, VALUES.colors[mode], LEG, VALUES.edges[mode]);
      for (const [i, pair] of pairs.entries()) {
        const rule = LEGIBILITY_ORDER[i]!;
        const want = expectedOf(rule, metricOfTier(rule.tier), VALUES.colors[mode], VALUES.edges[mode])!;
        assert.ok(near(pair.actual, want.actual, 1e-9) && pair.view === want.view, `${mode}: ${rule.fg} on ${rule.bg} measured ${pair.actual} (${pair.view}); by the spec's arithmetic ${want.actual} (${want.view})`);
      }
    }
  });

  test("2.1 #6 L29 an lc rule's fg is the text and goes first; actual is the SIZE of Lc: dark body text on the dark page is 90.87 (protan) — never −90.87, and never the page measured on the text", () => {
    const pairs = measure("dark", VALUES.colors.dark, LEG, VALUES.edges.dark);
    const text = pick(pairs, { fg: "text", bg: "bg" });
    assert.ok(near(text.actual, 90.87, 0.005) && text.view === "protan", `R087 dark: ${text.actual} (${text.view})`);
    assert.ok(near(text.actual, Math.abs(apcaLc(simulateCvd("#f3e7ce", "protan"), simulateCvd("#211409", "protan"))!), 1e-9));
    // The other order is another rule, with another figure (R100: the tooltip, the page colour on the ink).
    const tooltip = pick(pairs, { fg: "bg", bg: "text" });
    assert.ok(near(tooltip.actual, 90.21, 0.005) && tooltip.view === "protan", `R100 dark: ${tooltip.actual} (${tooltip.view})`);
    const light = measure("light", VALUES.colors.light, LEG, VALUES.edges.light);
    assert.ok(near(pick(light, { fg: "bg", bg: "text" }).actual, 88.39, 0.005), "R100 light: #fef4dc on #693800");
  });

  test("2.1 #6 L30 Lc under a simulation is taken on the 8-bit hexes simulateCvd returns: the ink on the cream under tritan is #742d2f on #fff0ed, Lc 84.86 — the smallest of 85.84 / 87.79 / 85.18 / 84.86", () => {
    const ink = pick(measure("light", VALUES.colors.light, LEG, VALUES.edges.light), { fg: "text", bg: "bg" });
    assert.equal(ink.view, "tritan");
    assert.ok(near(ink.actual, apcaLc("#742d2f", "#fff0ed")!, 1e-9), `R087 light: ${ink.actual}, and Lc of #742d2f on #fff0ed is ${apcaLc("#742d2f", "#fff0ed")}`);
    assert.ok(near(ink.actual, 84.86, 0.005));
  });

  /** A copy of the legibility member under another key, changed by `change`. */
  function withLegibilityAs(key: string, change: (copy: Record<string, unknown>) => void, fn: (name: ContractName) => void) {
    const copy = { ...structuredClone(legibility()), name: key } as unknown as Record<string, unknown>;
    change(copy);
    withRaw(key, copy, fn);
  }

  test("L31 `view` is the FIRST view, in the order the contract lists them, at which the smallest value is reached", () => {
    const colors = fresh();
    colors.light["switch-ring"] = colors.light["switch-off"]!; // R191: one colour on itself, 0 in every view
    const ring = { fg: "switch-ring", bg: "switch-off" };
    const tied = pick(measure("light", colors.light, LEG, VALUES.edges.light), ring);
    assert.deepEqual([tied.actual, tied.view], [0, "typical"], "a tie in every view: legibility lists typical first");
    for (const views of [["deutan", "tritan", "typical", "protan"], ["tritan", "protan"]]) {
      withLegibilityAs("probe-order", (copy) => {
        copy.views = views;
      }, (name) => {
        const reordered = pick(measure("light", colors.light, name, VALUES.edges.light), ring);
        assert.deepEqual([reordered.actual, reordered.view], [0, views[0]], `views ${shown(views)}: a tie goes to the first listed`);
        // Not a tie: the smallest is the smallest, whatever the order (R087 light is smallest under tritan).
        const ink = pick(measure("light", VALUES.colors.light, name, VALUES.edges.light), { fg: "text", bg: "bg" });
        const want = expectedOf({ fg: "text", bg: "bg" }, "lc", VALUES.colors.light, VALUES.edges.light, views as View[])!;
        assert.ok(near(ink.actual, want.actual, 1e-9) && ink.view === want.view, `views ${shown(views)}: R087 light ${ink.actual} (${ink.view}), and ${want.actual} (${want.view})`);
      });
    }
  });

  test("L22 L27 a contract with no `views` measures lc, sep and presence in typical vision only; one with views, in those — the worst view is never the largest", () => {
    const cases: [rule: { fg: string; bg: string }, metric: Metric][] = [[{ fg: "text", bg: "bg" }, "lc"], [{ fg: "border-strong", bg: "surface" }, "sep"], [{ fg: "edge:container", bg: "bg" }, "presence"]];
    for (const views of [undefined, ["typical"], ["protan"], ["protan", "deutan"]] as (View[] | undefined)[]) {
      withLegibilityAs("probe-views", (copy) => {
        if (views === undefined) {
          delete copy.views;
        } else {
          copy.views = views;
        }
      }, (name) => {
        const pairs = measure("light", VALUES.colors.light, name, VALUES.edges.light);
        for (const [rule, metric] of cases) {
          const got = pick(pairs, rule);
          const want = expectedOf(rule, metric, VALUES.colors.light, VALUES.edges.light, views ?? ["typical"])!;
          assert.ok(near(got.actual, want.actual, 1e-9) && got.view === want.view, `views ${shown(views)}: ${rule.fg} on ${rule.bg} ${got.actual} (${got.view}), and ${want.actual} (${want.view})`);
        }
      });
    }
    // The four views of legibility: never the largest of them.
    const pairs = measure("light", VALUES.colors.light, LEG, VALUES.edges.light);
    for (const [rule, metric] of cases) {
      const largest = Math.max(...VIEWS.map((view) => expectedOf(rule, metric, VALUES.colors.light, VALUES.edges.light, [view])!.actual));
      assert.ok(pick(pairs, rule).actual! < largest, `${rule.fg} on ${rule.bg}: the largest view was taken`);
    }
  });

  test("L32 S6 ratio rules are measured in typical vision only, under every contract: a coloured scrim pair is its worst case as written, view typical", () => {
    const colors = fresh();
    colors.light.scrim = "rgb(200 0 0 / 0.6)";
    colors.light["on-scrim"] = "#00c000";
    const want = worstCaseContrast("#00c000", "rgb(200 0 0 / 0.6)")!;
    for (const views of [[...VIEWS], ["tritan"], ["protan", "deutan"]]) {
      withLegibilityAs("probe-ratio", (copy) => {
        copy.views = views;
      }, (name) => {
        const pair = pick(measure("light", colors.light, name, VALUES.edges.light), { fg: "on-scrim", bg: "scrim" });
        assert.ok(near(pair.actual, want, 1e-9) && pair.view === "typical" && pair.metric === "ratio", `views ${shown(views)}: ${pair.actual} (${pair.view}); typical, as written, is ${want}`);
      });
    }
  });

  test("L28 holds is `actual !== null && actual >= min` for every metric: a value exactly on its floor holds, a floor a hair above it does not", () => {
    const pairs = measure("light", VALUES.colors.light, LEG, VALUES.edges.light);
    for (const [tier, rule] of [["body", { fg: "text", bg: "bg" }], ["mark-area", { fg: "control-checked", bg: "field-fill" }], ["edge-sunken", { fg: "edge:sunken", bg: "surface" }]] as const) {
      const actual = pick(pairs, rule).actual!;
      for (const [min, holds] of [[actual, true], [actual * (1 + 1e-12), false]] as const) {
        withLegibilityAs("probe-holds", (copy) => {
          (copy.tiers as Record<string, { min: unknown }>)[tier]!.min = min;
        }, (name) => {
          const pair = pick(measure("light", VALUES.colors.light, name, VALUES.edges.light), rule);
          assert.deepEqual([pair.min, pair.holds], [min, holds], `${tier}: ${actual} against a floor of ${min}`);
        });
      }
    }
  });

  /** L39: these rules come back null, null, false — and checkColors lists each, with its tier and metric. */
  function unmeasurable(mode: Mode, colors: unknown, edges: unknown, rules: { fg: string; bg: string; tier?: string }[], what: string, contract = LEG): Measured[] {
    let pairs: Measured[] = [];
    assert.doesNotThrow(() => {
      pairs = measure(mode, colors, contract, edges);
    }, `${what}: a rule that cannot be measured is a named failure, never a throw (L39)`);
    if (contract === LEG) {
      assert.equal(pairs.length, HELD_BY_LEGIBILITY, `${what}: a rule was dropped`);
    }
    const failures = failuresOf("probe", mode, colors, contract, edges);
    for (const rule of rules) {
      const pair = pick(pairs, rule);
      assert.deepEqual({ actual: pair.actual, view: pair.view, holds: pair.holds }, { actual: null, view: null, holds: false }, `${what}: ${rule.fg} on ${rule.bg}`);
      const failed = failures.filter((f) => f.fg === rule.fg && f.bg === rule.bg);
      assert.equal(failed.length, 1, `${what}: checkColors does not list ${rule.fg} on ${rule.bg}`);
      assert.deepEqual({ actual: failed[0]!.actual, view: failed[0]!.view, tier: failed[0]!.tier, metric: failed[0]!.metric }, { actual: null, view: null, tier: pair.tier, metric: pair.metric }, `${what}: ${rule.fg} on ${rule.bg}, as a failure`);
    }
    return pairs;
  }
  const rulesNamed = (...numbers: string[]) => numbers.map(ruleNamed);
  /** The rules of the §3 fixture that name `token` on either side. */
  const naming = (token: string) => APPENDIX.rules.filter((rule) => rule.fg === token || rule.bg === token);

  test("L37 an optional token that is absent, empty or blank reads its role fallback, as var(--sb-N, var(--sb-role)) does: text-strong reads text; control-checked reads primary-solid", () => {
    const base = measure("light", VALUES.colors.light, LEG, VALUES.edges.light);
    for (const value of [undefined, "", "   ", "\n\t"]) {
      const colors = fresh();
      for (const token of ["text-strong", "control-checked"]) {
        if (value === undefined) {
          delete colors.light[token];
        } else {
          colors.light[token] = value;
        }
      }
      const pairs = measure("light", colors.light, LEG, VALUES.edges.light);
      const what = `text-strong and control-checked ${value === undefined ? "absent" : shown(value)}`;
      assert.deepEqual([pick(pairs, { fg: "text-strong", bg: "bg" }).actual, pick(pairs, { fg: "text-strong", bg: "bg" }).view], [pick(base, { fg: "text", bg: "bg" }).actual, pick(base, { fg: "text", bg: "bg" }).view], `${what}: R091 is text on bg`);
      for (const rule of rulesNamed("R171", "R181")) {
        const want = expectedOf(rule, metricOfTier(rule.tier), colors.light, VALUES.edges.light)!;
        const got = pick(pairs, rule);
        assert.ok(near(got.actual, want.actual, 1e-9) && got.view === want.view, `${what}: ${rule.n} reads primary-solid — ${got.actual} (${got.view}), and ${want.actual}`);
      }
    }
  });

  test("2.1 #5 L37 L39 an optional token whose fallback is css has no value until a theme defines it: without switch-ring R191 cannot be measured, without selected-wash R135 cannot — null and a failure, not 0 and not a pass", () => {
    for (const [token, numbers] of [["switch-ring", ["R191"]], ["selected-wash", ["R135", "R138", "R194", "R195"]], ["heading-ink", ["R094", "R095", "R096"]], ["slider-track", ["R180"]]] as const) {
      assert.deepEqual(naming(token).map((rule) => rule.n), numbers, `the rules that read ${token}`);
      // Absent, empty, or a theme writing the css fallback itself: none is a colour the measurement can read.
      for (const value of [undefined, "", "inherit", "color-mix(in oklab, currentColor, transparent 80%)"]) {
        const colors = fresh();
        if (value === undefined) {
          delete colors.light[token];
        } else {
          colors.light[token] = value;
        }
        unmeasurable("light", colors.light, VALUES.edges.light, rulesNamed(...numbers), `${token} ${value === undefined ? "absent" : shown(value)}`);
      }
    }
  });

  test("L37 L39 a ROLE with no value, or an empty one, cannot be measured: a role has no fallback", () => {
    for (const value of [undefined, "", "  "]) {
      const colors = fresh();
      if (value === undefined) {
        delete colors.dark.text;
      } else {
        colors.dark.text = value;
      }
      // text-strong, heading-ink and text-caption are defined in the §3 record, so they do not fall back to text here.
      unmeasurable("dark", colors.dark, VALUES.edges.dark, naming("text"), `dark text ${value === undefined ? "absent" : shown(value)}`);
    }
  });

  test("L38 a see-through foreground of an lc or sep rule is blended over the rule's background, rounded per channel; `transparent` included — so it measures, it is not refused", () => {
    const colors = fresh();
    colors.light["text-muted"] = "rgb(132 77 22 / 0.5)";
    colors.light["border-strong"] = "transparent";
    colors.light["heading-ink"] = "rgb(71 36 0 / 0.75)";
    const pairs = measure("light", colors.light, LEG, VALUES.edges.light);
    for (const rule of [...naming("text-muted"), ...naming("border-strong").filter((rule) => rule.fg === "border-strong"), ...naming("heading-ink")]) {
      const want = expectedOf(rule, metricOfTier(rule.tier), colors.light, VALUES.edges.light)!;
      const got = pick(pairs, rule);
      assert.ok(want !== null && near(got.actual, want.actual, 1e-9) && got.view === want.view, `${rule.n} ${rule.fg} on ${rule.bg}: ${got.actual} (${got.view}); blended over its background, ${want?.actual}`);
    }
    assert.equal(pick(pairs, { fg: "border-strong", bg: "surface" }).actual, 0, "transparent over the card is the card: 0, and it fails");
    // The dark divider, as the spec measures it (R234): rgb(254 244 220 / 0.14) over #342417 is #504133.
    const divider = pick(measure("dark", VALUES.colors.dark, LEG, VALUES.edges.dark), { fg: "border", bg: "surface" });
    assert.ok(near(divider.actual, sepIn("deutan", "#504133", "#342417"), 1e-9) && divider.view === "deutan", `R234 dark: ${divider.actual}`);
  });

  test("2.1 #5 L38 L39 a see-through BACKGROUND of an lc or sep rule, or a see-through fill or backdrop of a presence rule, cannot be measured — never composited over white or black", () => {
    const colors = fresh();
    colors.light.surface = "rgb(255 251 241 / 0.5)";
    unmeasurable("light", colors.light, VALUES.edges.light, rulesNamed("R088", "R103", "R187", "R192", "R234", "R252", "R253", "R254", "R256", "R276"), "a see-through surface");
    const quiet = fresh();
    quiet.light["quiet-fill"] = "transparent"; // a see-through fill — not "backdrop" (L107)
    unmeasurable("light", quiet.light, VALUES.edges.light, rulesNamed("R260", "R261"), "a transparent quiet-fill");
  });

  test("2.1 #5 L38 L39 a value parseColor cannot read is unmeasurable on either side: oklch(), var(), color-mix(), a word", () => {
    for (const [token, value] of [["link", "oklch(0.5 0.1 300)"], ["focus-ring", "var(--sb-primary)"], ["primary-solid", "color-mix(in oklab, #b096d7, white)"], ["success-subtle", "lilac"], ["surface-sunken", "#fffbf"]] as const) {
      const colors = fresh();
      colors.light[token] = value;
      const rules = naming(token);
      assert.ok(rules.length > 0, token);
      unmeasurable("light", colors.light, VALUES.edges.light, rules, `${token} = ${value}`);
    }
  });

  test("L38 a ratio rule is measured as PR 1 measures it: a see-through scrim at its worst case, a see-through foreground not at all", () => {
    const colors = fresh();
    colors.dark["on-scrim"] = "rgb(255 255 255 / 0.5)";
    unmeasurable("dark", colors.dark, VALUES.edges.dark, [{ fg: "on-scrim", bg: "scrim" }], "a see-through on-scrim");
  });

  test("2.1 #5 L39 L44 an element the edge data leaves out — or no edge data at all — makes every rule that reads it a named unmeasurable failure: never a skip, never a throw", () => {
    for (const element of ["container", "field", "filled-danger"]) {
      for (const mode of MODES) {
        const edges = freshEdges()[mode];
        delete edges[element];
        const rules = APPENDIX.rules.filter((rule) => rule.fg === `edge:${element}` || rule.bg === `edge:${element}`);
        const pairs = unmeasurable(mode, VALUES.colors[mode], edges, rules, `${mode} without ${element}`);
        assert.equal(pairs.filter((pair) => pair.actual === null).length, rules.length, `${mode} without ${element}: only its rules`);
      }
    }
    for (const edges of [undefined, {}]) {
      for (const mode of MODES) {
        const pairs = unmeasurable(mode, VALUES.colors[mode], edges, NEEDS_EDGES, `${mode}, edges ${shown(edges) ?? "not passed"}`);
        assert.equal(NEEDS_EDGES.length, 24);
        assert.deepEqual(pairs.filter((pair) => pair.actual === null).map((pair) => `${pair.fg} on ${pair.bg}`), NEEDS_EDGES.map((rule) => `${rule.fg} on ${rule.bg}`), "the 22 edge rules and R224 and R227, in RULES order, and nothing else");
        assert.deepEqual(failuresOf("probe", mode, VALUES.colors[mode], LEG, edges).map((f) => `${f.fg} on ${f.bg}`), NEEDS_EDGES.map((rule) => `${rule.fg} on ${rule.bg}`), "checkColors: exactly those 24");
      }
    }
  });

  test("L40 §17 item 17 a rule that names a colour that is no role, no optional token and no edge element is a TypeError naming it — under either contract — where PR 1 returned actual: null", () => {
    const planted = (fg: string, bg: string, tier: string) => ({ fg, bg, tier, why: "A rule planted by test-contracts.ts." }) as unknown as Rule;
    for (const [fg, bg, tier, named] of [["txet", "bg", "body", "txet"], ["text", "surfce", "body", "surfce"], ["edge:filled-success", "surface", "edge-filled", "filled-success"], ["edge:card", "bg", "edge-container", "card"], ["focus-ring", "edge:", "tell-apart", "edge:"]] as const) {
      withRules((rules) => rules.push(planted(fg, bg, tier)), () => {
        for (const mode of MODES) {
          throwsTypeError(() => measure(mode, VALUES.colors[mode], LEG, VALUES.edges[mode]), [named], `${fg} on ${bg} (${tier}), legibility, ${mode}`);
        }
      });
    }
    withRules((rules) => rules.push(planted("txet", "bg", "text")), () => {
      for (const mode of MODES) {
        throwsTypeError(() => measureColors(mode, colorsOf(mode), WCAG), ["txet"], `txet on bg (text), wcag-aa, ${mode}`);
      }
    });
    // The probe is sound: optional tokens and edges are names a rule may use.
    const sound = [{ fg: "text-strong", bg: "surface-sunken", tier: "body" as Tier }, { fg: "focus-ring", bg: "edge:field", tier: "focus-visible" as Tier }, { fg: "edge:field", bg: "bg", tier: "mark-line" as Tier }];
    withRules((rules) => rules.push(...sound.map((rule) => planted(rule.fg, rule.bg, rule.tier))), () => {
      const pairs = measure("light", VALUES.colors.light, LEG, VALUES.edges.light);
      assert.equal(pairs.length, HELD_BY_LEGIBILITY + 3);
      pairs.slice(-3).forEach((pair, i) => {
        const rule = sound[i]!;
        const want = expectedOf(rule, metricOfTier(rule.tier), VALUES.colors.light, VALUES.edges.light)!;
        assert.ok(pair.fg === rule.fg && pair.bg === rule.bg && near(pair.actual, want.actual, 1e-9), `${rule.fg} on ${rule.bg}: ${pair.actual}, and ${want.actual}`);
      });
    });
  });

  test("L40 an edge: name where it cannot stand is a TypeError: as the bg of a presence rule, as the fg of an lc rule; and a presence rule whose fg is not an edge:", () => {
    const planted = (fg: string, bg: string, tier: string) => ({ fg, bg, tier, why: "A rule planted by test-contracts.ts." }) as unknown as Rule;
    // The probe is sound: where an edge: name may stand — either side of a sep rule (L52), the fg of a presence rule — it is measured.
    withRules((rules) => rules.push(planted("edge:field", "surface-sunken", "mark-line"), planted("danger-mark", "edge:field", "tell-apart"), planted("edge:quiet", "surface-sunken", "edge-quiet")), () => {
      for (const mode of MODES) {
        const pairs = measure(mode, VALUES.colors[mode], LEG, VALUES.edges[mode]);
        assert.equal(pairs.length, HELD_BY_LEGIBILITY + 3, mode);
        assert.ok(pairs.slice(-3).every((pair) => pair.actual !== null), `${mode}: ${shown(pairs.slice(-3))}`);
      }
    });
    for (const [fg, bg, tier, what] of [["edge:container", "edge:field", "edge-container", "edge: as a presence rule's bg"], ["edge:field", "bg", "body", "edge: as an lc rule's fg"], ["surface", "bg", "edge-container", "a presence rule whose fg is a role"], ["field-fill", "bg", "edge-field", "a presence rule whose fg is an optional token"]] as const) {
      withRules((rules) => rules.push(planted(fg, bg, tier)), () => {
        for (const mode of MODES) {
          throwsTypeError(() => measure(mode, VALUES.colors[mode], LEG, VALUES.edges[mode]), [], `${what}, ${mode}`);
        }
      });
    }
  });

  /** Malformed edge data (L43), planted at the third layer of the light container: position 3, counting from 1 in `rest` (L122). */
  const MALFORMED: [key: keyof Layer, value: unknown][] = [
    ["x", NaN], ["y", Infinity], ["spread", "-8px"], ["blur", -1], ["blur", -Infinity],
    ["alpha", 0], ["alpha", 1.01], ["alpha", -0.26], ["alpha", NaN],
    ["color", "#a63"], ["color", "#a16e3242"], ["color", "rgb(161 110 50)"], ["color", "a16e32"],
  ];
  const BAD_FILLS: unknown[] = ["nonsense", "edge:field", "", "transparent", "Surface", null, 3];
  const BAD_RESTS: unknown[] = ["0 0 6px 1px #a16e32", null, {}, 3];

  test("L43 L122 malformed edge data is a TypeError when it is MEASURED, naming the element and the layer's position counted from 1: a number that is not finite, blur below 0, alpha outside (0, 1], a colour that is not six-digit hex", () => {
    for (const [key, value] of MALFORMED) {
      const what = `${key} is ${String(value)}`;
      const edges = freshEdges();
      (edges.light.container!.rest[2] as unknown as Record<string, unknown>)[key] = value;
      // L122 (revision 3.2): the position counts from 1 in the element's rest list, so the third layer is 3. (Revision 3.1 left the base open; this accepted 2 or 3.)
      const says = (message: string) => message.includes("container") && /\b3(rd)?\b/.test(message);
      for (const call of [() => measure("light", VALUES.colors.light, LEG, edges.light), () => failuresOf("probe", "light", VALUES.colors.light, LEG, edges.light)]) {
        throwsTypeError(call, ["container"], `${what}: measured`);
        try {
          call();
        } catch(error) {
          assert.ok(says((error as Error).message), `${what}: the TypeError does not name the layer's position (the third: 3, counting from 1, L122): ${(error as Error).message}`);
        }
      }
    }
  });

  test("L43 a fill that is no role, no optional token and not \"backdrop\", or a rest that is not an array, is a TypeError naming the element — never read as a weak edge", () => {
    for (const fill of BAD_FILLS) {
      const edges = freshEdges();
      (edges.dark.quiet as unknown as Record<string, unknown>).fill = fill;
      throwsTypeError(() => measure("dark", VALUES.colors.dark, LEG, edges.dark), ["quiet"], `fill ${shown(fill)}`);
    }
    for (const rest of BAD_RESTS) {
      const edges = freshEdges();
      (edges.dark.quiet as unknown as Record<string, unknown>).rest = rest;
      throwsTypeError(() => measure("dark", VALUES.colors.dark, LEG, edges.dark), ["quiet"], `rest ${shown(rest)}`);
    }
    const edges = freshEdges();
    delete (edges.dark.quiet as unknown as Record<string, unknown>).rest;
    throwsTypeError(() => measure("dark", VALUES.colors.dark, LEG, edges.dark), ["quiet"], "no rest at all");
  });

  test("L123 L44 an edge-data key that is not one of the thirteen elements is malformed — the withdrawn filled-success, filled-warning and filled-info included — and refused, naming it, when measured and when emitted", () => {
    // The probe is sound: the thirteen are accepted, measured and emitted.
    assert.equal(measure("light", VALUES.colors.light, LEG, VALUES.edges.light).length, HELD_BY_LEGIBILITY);
    assert.ok(themeCss(legiblePreset({})).includes("--sb-edge-status-info:"));
    for (const key of ["filled-success", "filled-warning", "filled-info", "card", "Container", "filled-primary-hover", "edge:container", ""]) {
      for (const mode of MODES) {
        const edges = freshEdges();
        (edges[mode] as Record<string, Recipe>)[key] = structuredClone(edges[mode]["filled-secondary"]!);
        const named = key === "" ? [] : [key];
        throwsTypeError(() => measure(mode, VALUES.colors[mode], LEG, edges[mode]), named, `${mode} edges with a key ${shown(key)}: measured`);
        throwsTypeError(() => failuresOf("probe", mode, VALUES.colors[mode], LEG, edges[mode]), named, `${mode} edges with a key ${shown(key)}: checkColors`);
        throwsTypeError(() => themeCss(legiblePreset({ edges })), ["probe-legible", ...named], `${mode} edges with a key ${shown(key)}: emitted`);
      }
    }
  });

  test("L43 an EMPTY rest is valid — an element with no shadow: its presence is the fill step alone, measured and judged", () => {
    const edges = freshEdges();
    edges.light.container!.rest = [];
    const pair = pick(measure("light", VALUES.colors.light, LEG, edges.light), { fg: "edge:container", bg: "bg" });
    const want = expectedOf({ fg: "edge:container", bg: "bg" }, "presence", VALUES.colors.light, edges.light)!;
    assert.ok(near(pair.actual, want.actual, 1e-9) && near(pair.actual, 2.36, 0.005), `R252 light with no shadow: ${pair.actual}, the fill step is ${want.actual}`);
    assert.equal(pair.holds, false);
  });

  test("L47 a layer is all-round only with no offset and a positive spread — computed, never flagged: take the spread from the field's inset line and the field has no edge pixel; blur counts for nothing", () => {
    for (const [key, value] of [["spread", 0], ["spread", -1], ["x", 1], ["y", -1]] as const) {
      const what = `${key} ${value}`;
      const edges = freshEdges();
      edges.light.field!.rest.find(allRound)![key] = value;
      const pairs = unmeasurable("light", VALUES.colors.light, edges.light, rulesNamed("R224", "R227"), `the field's inset line with ${what}: L52`);
      const field = pick(pairs, { fg: "edge:field", bg: "surface" });
      assert.deepEqual([field.actual, field.holds], [0, false], `the field with ${what} on a card: the fill step alone, which is 0`);
    }
    for (const blur of [0, 60]) {
      const edges = freshEdges();
      edges.light.container!.rest[0]!.blur = blur;
      assert.ok(near(pick(measure("light", VALUES.colors.light, LEG, edges.light), { fg: "edge:container", bg: "bg" }).actual, 16.70, 0.005), `L48: blur ${blur} is ignored`);
    }
  });

  test("L48 an outside layer is blended over the backdrop and an inset one over the element's own fill, each alone: the other layers are not stacked on it", () => {
    const edges = freshEdges();
    for (const layer of edges.light.container!.rest.filter((layer) => !allRound(layer))) {
      Object.assign(layer, { color: "#000000", alpha: 1 });
    }
    edges.light.container!.rest.push({ inset: false, x: 0, y: 6, blur: 0, spread: 0, color: "#000000", alpha: 1 });
    const pair = pick(measure("light", VALUES.colors.light, LEG, edges.light), { fg: "edge:container", bg: "bg" });
    assert.ok(near(pair.actual, 16.70, 0.005) && pair.view === "tritan", `R252 light with black offset layers: ${pair.actual} — they are not all-round, and not stacked`);
    const field = pick(measure("dark", VALUES.colors.dark, LEG, VALUES.edges.dark), { fg: "edge:field", bg: "surface" });
    assert.ok(near(field.actual, 31.71, 0.005) && field.view === "deutan", `R256 dark: the inset line over the field's own fill #140903 — ${field.actual} (${field.view})`);
  });

  test("L52 edge:field is the field's one inset all-round layer blended over its own fill (#e1d5bf light, #64594d dark); with that layer outside, or a second all-round layer, it cannot be measured", () => {
    for (const mode of MODES) {
      const pairs = measure(mode, VALUES.colors[mode], LEG, VALUES.edges[mode]);
      for (const rule of rulesNamed("R224", "R227")) {
        const got = pick(pairs, rule);
        assert.ok(near(got.actual, rule[mode].actual, 0.01) && got.view === rule[mode].view, `${rule.n} ${mode}: ${got.actual}`);
        assert.equal(rule[mode].bg, mode === "light" ? "#e1d5bf" : "#64594d");
      }
    }
    const outside = freshEdges();
    outside.light.field!.rest.find(allRound)!.inset = false;
    unmeasurable("light", VALUES.colors.light, outside.light, rulesNamed("R224", "R227"), "the field's all-round layer drawn outside");
    const twice = freshEdges();
    twice.dark.field!.rest.push({ inset: true, x: 0, y: 0, blur: 0, spread: 2, color: "#fef4dc", alpha: 0.1 });
    unmeasurable("dark", VALUES.colors.dark, twice.dark, rulesNamed("R224", "R227"), "two all-round layers on the field");
  });

  test("2.1 #6 L107 a recipe whose fill is \"backdrop\" paints no fill of its own: the light quiet button on the page is 15.8798 (tritan), where with quiet-fill it is 18.1794", () => {
    const quiet = { fg: "edge:quiet", bg: "bg" };
    const painted = pick(measure("light", VALUES.colors.light, LEG, VALUES.edges.light), quiet);
    assert.ok(near(painted.actual, 18.1794, 1e-4) && painted.view === "tritan", `with quiet-fill: ${painted.actual} (${painted.view})`);
    const edges = freshEdges();
    edges.light.quiet!.fill = "backdrop";
    const bare = pick(measure("light", VALUES.colors.light, LEG, edges.light), quiet);
    assert.ok(near(bare.actual, 15.8798, 1e-4) && bare.view === "tritan", `with fill "backdrop": ${bare.actual} (${bare.view}) — read as the backdrop, not as quiet-fill`);
    // The fill step is 0 and an inset layer is blended over K: on a card, F = K.
    const dark = freshEdges();
    dark.dark.quiet!.fill = "backdrop";
    for (const rule of rulesNamed("R260", "R261")) {
      const want = expectedOf(rule, "presence", VALUES.colors.dark, dark.dark)!;
      const got = pick(measure("dark", VALUES.colors.dark, LEG, dark.dark), rule);
      assert.ok(near(got.actual, want.actual, 1e-9) && got.view === want.view, `${rule.n} dark, backdrop: ${got.actual}, and ${want.actual}`);
    }
  });

  test("2.1 #6 L50 the four worked examples of §5.3, measured: the light card on the page 16.70 (tritan), the light field on a card 11.03 (tritan), the dark card on the page 16.06 (deutan), the dark field on a card 31.71 (deutan)", () => {
    for (const row of WORKED) {
      const got = pick(measure(row.mode, VALUES.colors[row.mode], LEG, VALUES.edges[row.mode]), ruleNamed(row.n));
      assert.ok(near(got.actual, row.presence, 0.005) && got.view === row.view, `${row.what}: ${got.actual} (${got.view})`);
    }
  });

  // ── the known-bad fixture (§10) ───────────────────────────────────────
  test("2.1 #4 C6 L82 the known-bad fixture — sorbet as main ships it — fails legibility on the three rules of §10, to 1e-4: the dark card edge 6.8958 (protan), the light switch 5.2781 (protan), the light tick 26.3547 (deutan)", () => {
    const THREE: { mode: Mode; n: string; actual: number; view: View; min: number }[] = [
      { mode: "dark", n: "R252", actual: 6.8958, view: "protan", min: 15.2 },
      { mode: "light", n: "R179", actual: 5.2781, view: "protan", min: 12.4 },
      { mode: "light", n: "R171", actual: 26.3547, view: "deutan", min: 68.9 },
    ];
    for (const { mode, n, actual, view, min } of THREE) {
      const rule = ruleNamed(n);
      const pairs = measure(mode, KNOWN_BAD.colors[mode], LEG, KNOWN_BAD.edges[mode]);
      const got = pick(pairs, rule);
      assert.ok(near(got.actual, actual, 1e-4) && got.view === view && got.min === min && got.holds === false, `${n} ${mode}: ${got.actual} (${got.view}) against ${got.min}, holds ${got.holds}`);
      const failed = failuresOf("sorbet", mode, KNOWN_BAD.colors[mode], LEG, KNOWN_BAD.edges[mode]).filter((f) => f.fg === rule.fg && f.bg === rule.bg);
      assert.equal(failed.length, 1, `${n} ${mode}: not among the failures`);
      assert.ok(near(failed[0]!.actual, actual, 1e-4) && failed[0]!.view === view && failed[0]!.min === min, `${n} ${mode}, as a failure`);
    }
  });

  // ── one way to measure a preset (L24, L25) ────────────────────────────
  const oceanDark = () => structuredClone(shipped.ocean!.colors.dark) as unknown as ColorRecord;
  /** The planted preset of 2.1 #8: the §3 light colours and buttonLabel, legibility in light, no edges at all. */
  const withoutEdges = () => legiblePreset({ edges: null, contract: { light: LEG, dark: WCAG }, colors: { light: fresh().light, dark: oceanDark() } });

  test("L24 L25 measurePreset(preset, mode) is measureColors(mode, preset.colors[mode], contractOf(preset, mode), preset.edges?.[mode]): for the shipped presets, a legibility preset, one per mode, and one without edges", () => {
    const measurePreset = api("measurePreset");
    const cases = [
      ...Object.values(shipped),
      legiblePreset({}),
      legiblePreset({ edges: null }),
      withoutEdges(),
      legiblePreset({ contract: { light: WCAG, dark: LEG }, colors: { light: structuredClone(shipped.ocean!.colors.light) as unknown as ColorRecord, dark: fresh().dark }, edges: { dark: freshEdges().dark } }),
    ];
    for (const preset of cases) {
      for (const mode of MODES) {
        const edges = (preset as unknown as { edges?: Partial<Record<Mode, unknown>> }).edges?.[mode];
        assert.deepEqual(measurePreset(preset, mode), measure(mode, preset.colors[mode], contractOf(preset, mode), edges), `${preset.name}/${mode}`);
      }
    }
    assert.equal((measurePreset(legiblePreset({}), "dark") as Measured[]).length, HELD_BY_LEGIBILITY);
    throwsTypeError(() => measurePreset(declaring({ light: "wcag-aa", dark: "wcag-aaa" }), "dark"), ["probe-preset", "wcag-aaa"], "a bad declaration, through measurePreset");
  });

  test("2.1 #8 L117 L25 L39 S17 checkPreset is the failures of measurePreset: a preset declaring legibility with the §3 colours and buttonLabel and NO edges fails by name on 24 rules — the 22 edge rules, and R224 and R227 — and has no structure failure", () => {
    const preset = withoutEdges();
    const failures = checkPreset(preset) as unknown as Failed[];
    assert.deepEqual(
      failures.map((f) => [f.preset, f.mode, f.fg, f.bg, f.actual, f.view, f.tier, f.metric, f.min]),
      NEEDS_EDGES.map((rule) => [preset.name, "light", rule.fg, rule.bg, null, null, rule.tier, metricOfTier(rule.tier), floorIn(rule.tier, "light")]),
    );
    assert.deepEqual(api("checkStructure")(preset), [], "C3 (b) and C8 read the elements edges defines, and it defines none");
    for (const each of [legiblePreset({}), ...Object.values(shipped)]) {
      const fromMeasurement = MODES.flatMap((mode) => (api("measurePreset")(each, mode) as Measured[]).filter((pair) => !pair.holds).map(({ fg, bg, min, actual, tier, metric, view }) => ({ preset: each.name, mode, fg, bg, min, actual, tier, metric, view })));
      assert.deepEqual(checkPreset(each), fromMeasurement, each.name);
    }
  });

  // ── the checks with no number (§9) ─────────────────────────────────────
  const structureOf = (preset: Preset) => api("checkStructure")(preset) as StructureFailure[];
  const shapeOf = (failure: StructureFailure, preset: string) => {
    assert.deepEqual(Object.keys(failure).sort(), ["check", "detail", "mode", "preset"], "a structure failure is { preset, mode, check, detail }");
    assert.ok(failure.preset === preset && CHECKS.includes(failure.check) && typeof failure.detail === "string" && failure.detail.trim() !== "", shown(failure));
  };

  test("2.1 #7 L79 L80 checkStructure passes the §3 fixture in both modes, edges and button label included; and it holds no wcag-aa mode to anything: the five shipped presets have no structure failure", () => {
    assert.deepEqual(structureOf(legiblePreset({})), []);
    for (const preset of Object.values(shipped)) {
      assert.deepEqual(structureOf(preset), [], preset.name);
    }
  });

  /** 2.1 #7: the one way each check is broken, applied to one mode's copy of the §3 fixture. */
  const BREAKS: { check: string; what: string; apply: (colors: Record<Mode, ColorRecord>, edges: Record<Mode, Edges>, mode: Mode) => void }[] = [
    {
      check: "roles-complete",
      what: "danger-active is removed (C1)",
      apply: (colors, _edges, mode) => {
        delete colors[mode]["danger-active"];
      },
    },
    {
      check: "hierarchy",
      what: "text-muted is set to text's hex (C2: text > text-muted is false, in both modes)",
      apply: (colors, _edges, mode) => {
        colors[mode]["text-muted"] = colors[mode].text!;
      },
    },
    {
      check: "edge-not-fill",
      what: "border is set to surface's hex (C3 (a))",
      apply: (colors, _edges, mode) => {
        colors[mode].border = colors[mode].surface!;
      },
    },
    {
      check: "fills-steady",
      what: "primary-hover is darkened (C7)",
      apply: (colors, _edges, mode) => {
        colors[mode]["primary-hover"] = blendOver("#000000", 0.2, colors[mode].primary!);
      },
    },
    {
      check: "edge-direction",
      what: "the card's rim is turned the wrong way — darker than the page in dark, lighter in light (C8)",
      apply: (_colors, edges, mode) => {
        edges[mode].container!.rest.find(allRound)!.color = mode === "dark" ? "#05020a" : "#ffffff";
      },
    },
  ];
  for (const { check, what, apply } of BREAKS) {
    test(`2.1 #7 L79 L128 ${check} fails when ${what} — by name, in each mode it is broken in — and the mode left alone has no structure failure`, () => {
      for (const mode of MODES) {
        const colors = fresh();
        const edges = freshEdges();
        apply(colors, edges, mode);
        const failures = structureOf(legiblePreset({ colors, edges }));
        const here = failures.filter((failure) => failure.mode === mode);
        assert.ok(here.some((failure) => failure.check === check), `${mode}: ${check} did not fail: ${shown(failures)}`);
        here.forEach((failure) => shapeOf(failure, "probe-legible"));
        assert.deepEqual(failures.filter((failure) => failure.mode !== mode), [], `broken in ${mode}, and the other mode fails`);
      }
    });
  }

  test("2.1 #7 L65 L115 C9 label-type holds the preset's buttonLabel to the label tier's requires: px 14 fails and smallPx 12 fails, each alone — and weight 500, and no buttonLabel at all; in each legibility mode and no wcag-aa one", () => {
    const at = (failures: StructureFailure[]) => failures.map((failure) => `${failure.mode}:${failure.check}`).sort();
    for (const [what, label] of [["px 14", { ...VALUES.buttonLabel, px: 14 }], ["smallPx 12", { ...VALUES.buttonLabel, smallPx: 12 }], ["weight 500", { ...VALUES.buttonLabel, weight: 500 }], ["no buttonLabel", null]] as const) {
      assert.deepEqual(at(structureOf(legiblePreset({ buttonLabel: label }))), ["dark:label-type", "light:label-type"], `${what}, legibility in both modes`);
      const lightOnly = legiblePreset({ buttonLabel: label, contract: { light: LEG, dark: WCAG }, colors: { light: fresh().light, dark: oceanDark() }, edges: { light: freshEdges().light } });
      assert.deepEqual(at(structureOf(lightOnly)), ["light:label-type"], `${what}, legibility in light only`);
    }
    assert.deepEqual(structureOf(legiblePreset({ buttonLabel: { px: 18, smallPx: 16, weight: 700 } })), [], "larger and heavier than required passes");
  });

  test("L80 L114 a legibility mode made of a WCAG preset's colours fails C1 (68 roles), C2 (heading-ink has no value) and C3 (switch-ring has no value) by name — a name with no value fails the check that reads it, never a skip and never a pass", () => {
    const failures = structureOf(legiblePreset({ colors: structuredClone(shipped.ocean!.colors) as unknown as Record<Mode, ColorRecord>, edges: null }));
    for (const mode of MODES) {
      const here = failures.filter((failure) => failure.mode === mode);
      here.forEach((failure) => shapeOf(failure, "probe-legible"));
      for (const check of ["roles-complete", "hierarchy", "edge-not-fill"]) {
        assert.ok(here.some((failure) => failure.check === check), `${mode}: ${check} did not fail: ${shown(here)}`);
      }
      assert.ok(here.some((failure) => failure.check === "hierarchy" && failure.detail.includes("heading-ink")), `${mode}: C2's detail does not name heading-ink`);
      assert.ok(here.some((failure) => failure.check === "edge-not-fill" && failure.detail.includes("switch-ring")), `${mode}: C3's detail does not name switch-ring`);
      assert.ok(!here.some((failure) => failure.check === "label-type"), `${mode}: it has a buttonLabel`);
    }
  });

  test("L114 C2 and C3 resolve what they compare as L37 does: a §3 record without heading-ink fails C2, without switch-ring fails C3 — each naming it; without switch-off, C3 reads border-strong, the ring's own hex, and fails", () => {
    for (const [token, check] of [["heading-ink", "hierarchy"], ["switch-ring", "edge-not-fill"], ["switch-off", "edge-not-fill"]] as const) {
      for (const mode of MODES) {
        const colors = fresh();
        delete colors[mode][token];
        const failures = structureOf(legiblePreset({ colors })).filter((failure) => failure.mode === mode);
        assert.ok(failures.some((failure) => failure.check === check && failure.detail.includes(token)), `${mode} without ${token}: ${shown(failures)}`);
      }
    }
  });

  test("L79 C3 (b) every element in a mode's edges has an all-round layer in rest: an empty rest fails edge-not-fill; and C8 says nothing of an element with no data (its rules already fail by name)", () => {
    const empty = freshEdges();
    empty.light.container!.rest = [];
    assert.ok(structureOf(legiblePreset({ edges: empty })).some((failure) => failure.mode === "light" && failure.check === "edge-not-fill"), "an element with no all-round layer");
    const missing = freshEdges();
    delete missing.dark.container;
    assert.deepEqual(structureOf(legiblePreset({ edges: missing })), [], "no container in dark: not a structure failure");
  });

  test("L79 checkStructure runs the checks the mode's contract lists, and only those", () => {
    withLegibilityAs("probe-checks", (copy) => {
      copy.checks = ["label-type"];
    }, (name) => {
      const failures = structureOf(legiblePreset({ colors: structuredClone(shipped.ocean!.colors) as unknown as Record<Mode, ColorRecord>, edges: null, buttonLabel: null, contract: { light: name, dark: name } }));
      assert.deepEqual(failures.map((failure) => `${failure.mode}:${failure.check}`).sort(), ["dark:label-type", "light:label-type"]);
    });
  });

  // ── what is emitted (§3.3, §5.5) ──────────────────────────────────────
  /** The declaration lines of each block of a theme file, trimmed: the light :root block, then the two dark blocks. */
  function blocksOf(css: string): { light: string[]; dark: string[][] } {
    const blocks: string[][] = [];
    let current: string[] | null = null;
    for (const line of css.split("\n")) {
      if (/\{\s*$/.test(line) && !line.trimStart().startsWith("@media")) {
        current = [];
        blocks.push(current);
      } else if (line.trim() === "}") {
        current = null;
      } else if (current !== null && line.trim() !== "") {
        current.push(line.trim());
      }
    }
    assert.equal(blocks.length, 3, "a theme file has a light block and two dark blocks");
    return { light: blocks[0]!, dark: blocks.slice(1) };
  }
  /** L53: a layer as `[inset ]<x> <y> <blur> <spread> <colour>`, each length `0` or `<n>px`, the colour as withAlpha writes it. */
  const lengthOf = (n: number) => (n === 0 ? "0" : `${n}px`);
  const layerText = (layer: Layer) => `${layer.inset ? "inset " : ""}${[layer.x, layer.y, layer.blur, layer.spread].map(lengthOf).join(" ")} rgb(${bytesOf(layer.color).join(" ")} / ${layer.alpha})`;
  const layersText = (layers: Layer[]) => (layers.length === 0 ? "none" : layers.map(layerText).join(", "));
  /** L53, L54: one line per element in EdgeElement order, then its -hover and -press where it has them. */
  const edgeLines = (edges: Partial<Edges>) => ELEMENTS.filter((element) => edges[element] !== undefined).flatMap((element) => {
    const recipe = edges[element]!;
    return [
      `--sb-edge-${element}: ${layersText(recipe.rest)};`,
      ...(recipe.hover ? [`--sb-edge-${element}-hover: ${layersText(recipe.hover)};`] : []),
      ...(recipe.press ? [`--sb-edge-${element}-press: ${layersText(recipe.press)};`] : []),
    ];
  });
  const colourLines = (record: ColorRecord) => Object.entries(record).map(([name, value]) => `--sb-${name}: ${value};`);
  const afterShadows = (lines: string[]) => {
    const at = lines.findIndex((line) => line.startsWith("--sb-shadow-xl:"));
    assert.ok(at >= 0, "no --sb-shadow-xl line");
    return lines.slice(at + 1);
  };

  test("L53 (fixture) this file's layer text reproduces L53's two examples exactly", () => {
    assert.equal(`  --sb-edge-container: ${layersText(VALUES.edges.light.container!.rest)};`, "  --sb-edge-container: 0 0 6px 1px rgb(161 110 50 / 0.38), 0 2px 4px 0 rgb(161 110 50 / 0.18), 0 10px 28px -8px rgb(161 110 50 / 0.26);");
    assert.equal(`  --sb-edge-field: ${layersText(VALUES.edges.dark.field!.rest)};`, "  --sb-edge-field: inset 0 1px 3px 0 rgb(5 2 10 / 0.7), inset 0 0 0 1px rgb(254 244 220 / 0.34), 0 1px 0 0 rgb(254 244 220 / 0.12);");
  });

  test("L16 L19 L53 a preset with the §3 colours, edges and buttonLabel emits its 89 colour tokens in record order; after the shadow lines, in light, --sb-button-font-size: 1rem and -sm: 0.875rem, then one line per edge element in EdgeElement order with its -hover and -press; in dark, the dark edges and nothing else", () => {
    const css = themeCss(legiblePreset({}));
    assert.ok(css.includes("\n  --sb-edge-container: 0 0 6px 1px rgb(161 110 50 / 0.38), 0 2px 4px 0 rgb(161 110 50 / 0.18), 0 10px 28px -8px rgb(161 110 50 / 0.26);\n"), "L53's first example, as written");
    assert.ok(css.includes("\n  --sb-edge-field: inset 0 1px 3px 0 rgb(5 2 10 / 0.7), inset 0 0 0 1px rgb(254 244 220 / 0.34), 0 1px 0 0 rgb(254 244 220 / 0.12);\n"), "L53's second example, as written");
    const { light, dark } = blocksOf(css);
    const firstColour = (lines: string[]) => lines.findIndex((line) => line.startsWith("--sb-bg:"));
    assert.deepEqual(light.slice(firstColour(light), firstColour(light) + 89), colourLines(VALUES.colors.light), "light: the 89 colour lines, in record order (L16)");
    assert.deepEqual(afterShadows(light), ["--sb-button-font-size: 1rem;", "--sb-button-font-size-sm: 0.875rem;", ...edgeLines(VALUES.edges.light)], "light, after the shadow lines (L19, L53)");
    assert.equal(edgeLines(VALUES.edges.light).length, 21, "13 rest, 4 hover, 4 press");
    for (const block of dark) {
      assert.deepEqual(block.slice(firstColour(block), firstColour(block) + 89), colourLines(VALUES.colors.dark), "dark: the 89 colour lines, in record order");
      assert.deepEqual(afterShadows(block), edgeLines(VALUES.edges.dark), "dark, after the shadow lines: the edges, no button size (L55: it is not reset), and no reset (dark defines everything)");
    }
    assert.equal(css.split("--sb-button-font-size:").length - 1, 1, "--sb-button-font-size is emitted once (L19)");
  });

  test("L19 the button label's sizes are px/16 rem, emitted once, in light, and never reset in dark", () => {
    const css = themeCss(legiblePreset({ buttonLabel: { px: 18, smallPx: 13, weight: 600 } }));
    const { light, dark } = blocksOf(css);
    assert.deepEqual(afterShadows(light).slice(0, 2), ["--sb-button-font-size: 1.125rem;", "--sb-button-font-size-sm: 0.8125rem;"]);
    for (const block of dark) {
      assert.ok(!block.some((line) => line.includes("button-font-size")), "a dark block mentions the button label's size");
    }
  });

  test("L55 a dark block resets, with `initial`, every property the light block emits from optional data and it does not: the 20 optional tokens and the 21 edge properties — 41 lines, after everything else, in the light block's order", () => {
    const preset = legiblePreset({ colors: { light: fresh().light, dark: oceanDark() }, edges: { light: freshEdges().light }, contract: { light: LEG, dark: WCAG } });
    const { dark } = blocksOf(themeCss(preset));
    const resets = [...VALUES.seams.map((seam) => `--sb-${seam.name}: initial;`), ...edgeLines(VALUES.edges.light).map((line) => `${line.slice(0, line.indexOf(":"))}: initial;`)];
    assert.equal(resets.length, 41);
    for (const block of dark) {
      assert.deepEqual(afterShadows(block), resets, "each dark block ends with the 41 resets (danger-active is a role, not optional data: it is not reset)");
    }
  });

  test("L55 the unit is the emitted property, never the element: a dark recipe with rest and no hover still resets the light -hover property", () => {
    const edges = freshEdges();
    delete edges.dark["filled-primary"]!.hover;
    const { dark } = blocksOf(themeCss(legiblePreset({ edges })));
    for (const block of dark) {
      assert.deepEqual(afterShadows(block), [...edgeLines(edges.dark), "--sb-edge-filled-primary-hover: initial;"]);
    }
    const colors = fresh();
    delete colors.dark["quiet-fill"];
    for (const block of blocksOf(themeCss(legiblePreset({ colors }))).dark) {
      assert.equal(afterShadows(block).at(-1), "--sb-quiet-fill: initial;", "an optional token light defines and dark does not");
    }
  });

  test("L54 an element with an empty rest emits --sb-edge-<element>: none;", () => {
    const edges = freshEdges();
    edges.light.sunken!.rest = [];
    assert.ok(blocksOf(themeCss(legiblePreset({ edges }))).light.includes("--sb-edge-sunken: none;"));
  });

  test("L43 L122 L124 malformed edge data is a TypeError when it is EMITTED too, naming the preset and the element — a hover layer included", () => {
    const rest = freshEdges();
    rest.light.container!.rest[2]!.alpha = 2;
    throwsTypeError(() => themeCss(legiblePreset({ edges: rest })), ["probe-legible", "container"], "a rest layer with alpha 2");
    const hover = freshEdges();
    hover.dark["filled-accent"]!.hover![1]!.color = "#f5e3a";
    throwsTypeError(() => themeCss(legiblePreset({ edges: hover })), ["probe-legible", "filled-accent"], "a hover layer with a five-digit colour");
  });

  test("L5 L17 L56 the absence of the data is the whole switch: no shipped preset defines an optional token, edges or buttonLabel; a legibility declaration alone changes no byte; a wcag-aa preset WITH the data emits it", () => {
    const seamNames = VALUES.seams.map((seam) => seam.name);
    for (const preset of Object.values(shipped)) {
      for (const mode of MODES) {
        assert.deepEqual(Object.keys(preset.colors[mode]).filter((name) => seamNames.includes(name)), [], `${preset.name}/${mode}`);
      }
      assert.ok(!Object.hasOwn(preset, "edges") && !Object.hasOwn(preset, "buttonLabel"), `${preset.name} has edges or a buttonLabel`);
    }
    assert.equal(themeCss(declaring({ light: LEG, dark: LEG })), themeCss(declaring({ light: WCAG, dark: WCAG })), "declaring legibility, with no data, changed the theme file");
    const css = themeCss(legiblePreset({ contract: { light: WCAG, dark: WCAG } }));
    for (const line of ["--sb-field-fill: #fffbf1;", "--sb-button-font-size: 1rem;", "--sb-edge-container: 0 0 6px 1px rgb(161 110 50 / 0.38)"]) {
      assert.ok(css.includes(line), `a wcag-aa preset with the data does not emit ${line}`);
    }
  });

  test("L101 L71 generatedScss() writes a $seams map of the 20 optional tokens with their fallbacks and a list of the 13 edge elements; the committed _generated.scss is its output", () => {
    const scss = generatedScss();
    assert.equal(readFileSync(join(pkgRoot, "src", "styles", "abstracts", "_generated.scss"), "utf8"), scss, "_generated.scss is not what generatedScss() writes: it is build output, regenerated and committed with the step (L101)");
    const seams = /^\$seams\s*:([\s\S]*?);[ \t]*$/m.exec(scss)?.[1];
    assert.ok(seams !== undefined, "no $seams declaration");
    for (const seam of VALUES.seams) {
      const fallback = "fallback" in seam.fallback ? seam.fallback.fallback : seam.fallback.css;
      assert.ok(seams.includes(seam.name) && seams.includes(fallback), `$seams does not carry ${seam.name} with its fallback ${fallback}`);
    }
    const word = (text: string, name: string) => new RegExp(`(^|[^\\w-])${name}([^\\w-]|$)`).test(text);
    const lists = [...scss.matchAll(/^\$[\w-]+\s*:([\s\S]*?);[ \t]*$/gm)].map((m) => m[1]!);
    assert.ok(lists.some((text) => ELEMENTS.every((element) => word(text, element))), "no declaration lists the 13 edge elements");
  });

  // ── the reports and the gates (§11.1, §11.2; 2.1 #8, #9) ──────────────
  /** The source appended to a copy of presets.ts that gives sorbet these fields. */
  const plantedSorbet = (parts: Record<string, unknown>) => `\n// test-contracts.ts: legibility-spec.md step 2.1, in a temporary copy.\n{\n  const sorbet = presets.sorbet as unknown as Record<string, unknown>;\n${Object.entries(parts).map(([key, value]) => `  sorbet[${JSON.stringify(key)}] = ${JSON.stringify(value)};`).join("\n")}\n}\n`;
  /** The same preset, in this process. */
  const twinOf = (parts: Record<string, unknown>) => Object.assign(structuredClone(shipped.sorbet!), structuredClone(parts)) as unknown as Preset;
  const PLANTED: Record<string, Record<string, unknown>> = {
    shipped: {},
    "as-step-2-6": { colors: VALUES.colors, edges: VALUES.edges, buttonLabel: VALUES.buttonLabel, contract: { light: LEG, dark: LEG } },
    "without-edges": { colors: { light: VALUES.colors.light, dark: shipped.sorbet!.colors.dark }, buttonLabel: VALUES.buttonLabel, contract: { light: LEG, dark: WCAG } },
    "known-bad": { edges: KNOWN_BAD.edges, contract: { light: LEG, dark: LEG } },
  };
  const plantedTrees = new Map(Object.entries(PLANTED).map(([name, parts]) => {
    const tree = plant(`legibility-${name}`, Object.keys(parts).length === 0 ? "" : plantedSorbet(parts));
    // A gate that passes goes on to write: the package's _generated.scss beside its partials, the app's into src/styles.
    cpSync(join(pkgRoot, "src", "styles"), join(tree.ds, "src", "styles"), { recursive: true });
    mkdirSync(join(tree.app, "src", "styles", "abstracts"), { recursive: true });
    return [name, tree];
  }));
  const plantedRuns = new Map<string, Ran>();
  const runOn = (tree: string, surface: (typeof RUNS)[number]) => {
    const key = `${tree} ${surface.name}`;
    if (!plantedRuns.has(key)) {
      plantedRuns.set(key, surface.run(plantedTrees.get(tree)!));
    }
    return plantedRuns.get(key)!;
  };
  /** What check-contrast.report.txt says of each wcag-aa preset-mode at 2d3b765, with L91's suffix. */
  const RECORDED_LINES = new Map<string, string>();
  {
    let preset = "";
    for (const line of readFileSync(join(fixtures, "check-contrast.report.txt"), "utf8").split("\n")) {
      const mode = /^ {2}(light|dark) +(.+)$/.exec(line);
      if (headings.has(line)) {
        preset = headings.get(line)!;
      } else if (mode) {
        RECORDED_LINES.set(`${preset}/${mode[1]}`, `${mode[2]} — wcag-aa; ${APPLYING - 70} rules not held`);
      }
    }
  }
  const withoutMargin = (text: string) => text.replace(/ \(tightest margin ×[\d.]+\)/, "");
  interface Reported {
    preset: string;
    mode: Mode;
    summary: string;
    rows: string[];
    notes: string[];
    /** The ✗ rows and why / retire lines under the mode line, in the order printed (L139). */
    order: { kind: "row" | "note"; text: string }[];
  }
  /** A report read back: each mode line, the ✗ rows under it (4 spaces), and the why / retire lines (6 spaces, L89). */
  function readReport(stdout: string): Reported[] {
    const out: Reported[] = [];
    let preset = "";
    for (const line of stdout.split("\n")) {
      const mode = /^ {2}(light|dark) +(.+)$/.exec(line);
      const row = /^ {4}✗ (.+)$/.exec(line);
      const note = /^ {6}((?:why|retire) \(.+)$/.exec(line);
      if (headings.has(line)) {
        preset = headings.get(line)!;
      } else if (mode) {
        out.push({ preset, mode: mode[1] as Mode, summary: mode[2]!, rows: [], notes: [], order: [] });
      } else if (row) {
        assert.ok(out.length > 0, `a ✗ row before any mode line: ${line}`);
        out.at(-1)!.rows.push(row[1]!);
        out.at(-1)!.order.push({ kind: "row", text: row[1]! });
      } else if (note) {
        assert.ok(out.length > 0, `a why/retire line before any mode line: ${line}`);
        out.at(-1)!.notes.push(note[1]!);
        out.at(-1)!.order.push({ kind: "note", text: note[1]! });
      }
    }
    return out;
  }
  /** A gate's stderr read back: its `  <preset>/<mode>: …` rows, and the why / retire lines under the rows of each preset-mode. */
  function readGate(stderr: string): { rows: { at: string; text: string }[]; notes: { at: string; text: string }[] } {
    const rows: { at: string; text: string }[] = [];
    const notes: { at: string; text: string }[] = [];
    for (const line of stderr.split("\n")) {
      const row = /^ {2}([a-z][\w-]*\/(?:light|dark)): (.+)$/.exec(line);
      const note = /^ {6}((?:why|retire) \(.+)$/.exec(line);
      if (row) {
        rows.push({ at: row[1]!, text: row[2]! });
      } else if (note) {
        assert.ok(rows.length > 0, `a why/retire line before any row: ${line}`);
        notes.push({ at: rows.at(-1)!.at, text: note[1]! });
      }
    }
    return { rows, notes };
  }
  /** L88: a failing measurement as a report prints it. */
  function reportRowOf(pair: Measured): string {
    const word = WORD[pair.metric as Metric];
    if (pair.actual === null) {
      return `${pair.fg} on ${pair.bg}: could not be measured (needs ${word === "" ? "" : `${word} `}${pair.min})`;
    }
    return pair.metric === "ratio"
      ? `${pair.fg} on ${pair.bg}: ${ratioText(pair.actual, pair.min)} < ${pair.min}`
      : `${pair.fg} on ${pair.bg}: ${word} ${ratioText(pair.actual, pair.min)} < ${pair.min} (${pair.view} view)`;
  }
  /** L88: a failing measurement as a gate prints it — or, for one that could not be measured, whatever its metric, the start of it (L118). */
  function gateRowOf(pair: Measured): { exact: string } | { starts: string } {
    const word = WORD[pair.metric as Metric];
    if (pair.actual === null) {
      return { starts: `${pair.fg} on ${pair.bg} ` };
    }
    return { exact: pair.metric === "ratio" ? `${pair.fg} on ${pair.bg} = ${ratioText(pair.actual, pair.min)} (needs ${pair.min})` : `${pair.fg} on ${pair.bg} = ${word} ${ratioText(pair.actual, pair.min)} (needs ${pair.min}, ${pair.view} view)` };
  }
  /** L89: each failing tier's why and retire, once, in the order the tiers first fail. */
  const notesFor = (failing: { tier: string }[]) => [...new Set(failing.map((pair) => pair.tier))].flatMap((tier) => {
    const entry = legibility().tiers[tier as Tier]!;
    return [`why (${tier}): ${entry.why}`, `retire (${tier}): ${entry.retire}`];
  });
  const sortedNotes = (notes: string[]) => [...notes].sort();
  const REPORT_MARGIN = [true, false, true]; // check-contrast.ts, sorbet contrast (no margin, as today), the scaffold's

  RUNS.slice(0, 3).forEach((report, i) => {
    test(`2.1 #9 L86 L91 ${report.name}, on the shipped presets (all declaring wcag-aa): every mode line ends " — wcag-aa; 191 rules not held", and the last line is "✓ every declared contract holds for every preset in both modes (700 pairings measured): wcag-aa × 10"`, () => {
      const run = runOn("shipped", report);
      assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
      const said = readReport(run.stdout);
      assert.deepEqual(said.map((p) => `${p.preset}/${p.mode}`), [...RECORDED_LINES.keys()]);
      for (const p of said) {
        const want = RECORDED_LINES.get(`${p.preset}/${p.mode}`)!;
        assert.equal(p.summary, REPORT_MARGIN[i] ? want : withoutMargin(want), `${p.preset}/${p.mode}`);
        assert.deepEqual([p.rows, p.notes], [[], []]);
      }
      assert.equal(run.stdout.trimEnd().split("\n").at(-1), "✓ every declared contract holds for every preset in both modes (700 pairings measured): wcag-aa × 10");
    });

    test(`2.1 #9 L86 L91 ${report.name}, with sorbet as step 2.6 will make it (the §3 values and edges, legibility in both modes): its lines read "all 193 pairings pass${REPORT_MARGIN[i] ? " (tightest margin ×1.02)" : ""} — legibility; 68 rules not held", and the last "(946 pairings measured): wcag-aa × 8, legibility × 2"`, () => {
      const run = runOn("as-step-2-6", report);
      assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
      for (const p of readReport(run.stdout)) {
        const want = p.preset === "sorbet" ? `all ${HELD_BY_LEGIBILITY} pairings pass (tightest margin ×1.02) — legibility; ${APPLYING - HELD_BY_LEGIBILITY} rules not held` : RECORDED_LINES.get(`${p.preset}/${p.mode}`)!;
        assert.equal(p.summary, REPORT_MARGIN[i] ? want : withoutMargin(want), `${p.preset}/${p.mode}`);
        assert.deepEqual([p.rows, p.notes], [[], []], `${p.preset}/${p.mode}`);
      }
      assert.equal(run.stdout.trimEnd().split("\n").at(-1), "✓ every declared contract holds for every preset in both modes (946 pairings measured): wcag-aa × 8, legibility × 2");
      assert.doesNotMatch(`${run.stdout}${run.stderr}`, /structure failure/);
    });

    test(`2.1 #8 L117 L39 L88 L89 L90 L91 L120 ${report.name}, on a preset declaring legibility in light with the §3 colours and buttonLabel and no edges: it fails by name on the 24 — the 22 edge rules, R224, R227 — with each failing tier's why and retire once, "✗ 24 contrast failure(s)", and no structure failure`, () => {
      const run = runOn("without-edges", report);
      assert.ok(run.status !== 0 && run.status !== null, `${report.name} exited ${run.status}`);
      assert.doesNotMatch(run.stderr, /TypeError|ReferenceError|SyntaxError/, run.stderr);
      const said = readReport(run.stdout);
      for (const p of said) {
        if (p.preset === "sorbet" && p.mode === "light") {
          assert.equal(p.summary, `24 failing (${HELD_BY_LEGIBILITY - 24} measured, 24 could not be measured) — legibility; ${APPLYING - HELD_BY_LEGIBILITY} rules not held`);
          assert.deepEqual(p.rows, NEEDS_EDGES.map((rule) => `${rule.fg} on ${rule.bg}: could not be measured (needs ${WORD[metricOfTier(rule.tier)]} ${floorIn(rule.tier, "light")})`));
          const tiers = [...new Set(NEEDS_EDGES.map((rule) => rule.tier))];
          assert.equal(tiers.length, 8, "the seven edge tiers and tell-apart");
          assert.deepEqual(p.notes.map((note) => /^(why|retire) \(([^)]+)\)/.exec(note)?.slice(1).join(" ")).sort(), tiers.flatMap((tier) => [`why ${tier}`, `retire ${tier}`]).sort(), "each failing tier's why and retire, once (L89)");
          assert.deepEqual(sortedNotes(p.notes), sortedNotes(notesFor(NEEDS_EDGES)), "the why and retire are the tier's own sentences");
        } else {
          const want = RECORDED_LINES.get(`${p.preset}/${p.mode}`)!;
          assert.equal(p.summary, REPORT_MARGIN[i] ? want : withoutMargin(want), `${p.preset}/${p.mode}`);
          assert.deepEqual([p.rows, p.notes], [[], []], `${p.preset}/${p.mode}`);
        }
      }
      assert.ok(run.stderr.includes("✗ 24 contrast failure(s)"), run.stderr);
      assert.doesNotMatch(`${run.stdout}${run.stderr}`, /structure failure/);
      assert.doesNotMatch(run.stdout, /holds for every preset/);
    });

    test(`2.1 #9 L88 L89 L90 L91 L120 L139 ${report.name}, on sorbet as main ships it declaring legibility with its card edge: it prints L88's four example lines as written, every failure in L88's form, each failing tier's why and retire once a mode, its structure failures as "✗ <check>: <detail>", and both counts`, () => {
      const run = runOn("known-bad", report);
      assert.ok(run.status !== 0 && run.status !== null, `${report.name} exited ${run.status}`);
      assert.doesNotMatch(run.stderr, /TypeError|ReferenceError|SyntaxError/, run.stderr);
      const twin = twinOf(PLANTED["known-bad"]!);
      const said = readReport(run.stdout).filter((p) => p.preset === "sorbet");
      assert.deepEqual(said.map((p) => p.mode), MODES);
      let contrast = 0;
      const structure = structureOf(twin);
      for (const p of said) {
        const pairs = measure(p.mode, twin.colors[p.mode], LEG, KNOWN_BAD.edges[p.mode]);
        const failing = pairs.filter((pair) => !pair.holds);
        contrast += failing.length;
        const measured = pairs.filter((pair) => pair.actual !== null).length;
        const unmeasured = pairs.length - measured;
        assert.equal(p.summary, `${failing.length} failing (${measured} measured${unmeasured > 0 ? `, ${unmeasured} could not be measured` : ""}) — legibility; ${APPLYING - pairs.length} rules not held`, `sorbet/${p.mode}`);
        const isStructure = (row: string) => CHECKS.some((check) => row.startsWith(`${check}: `));
        assert.deepEqual(p.rows.filter((row) => !isStructure(row)), failing.map(reportRowOf), `sorbet/${p.mode}: the failure rows`);
        assert.deepEqual(sortedNotes(p.notes), sortedNotes(notesFor(failing)), `sorbet/${p.mode}: each failing tier's why and retire, once (L89)`);
        // L139 (replaces L121): this mode's structure rows, and only this mode's, follow its failure rows and its why/retire lines.
        assert.deepEqual(p.rows.filter(isStructure).sort(), structure.filter((f) => f.mode === p.mode).map((f) => `${f.check}: ${f.detail}`).sort(), `sorbet/${p.mode}: its own structure rows, under its own mode line (L139)`);
        const kinds = p.order.map((item) => (item.kind === "note" ? "note" : isStructure(item.text) ? "structure" : "failure"));
        const rank = { failure: 0, note: 1, structure: 2 };
        assert.ok(kinds.every((kind, i) => i === 0 || rank[kinds[i - 1] as keyof typeof rank] <= rank[kind as keyof typeof rank]), `sorbet/${p.mode}: failure rows, then why/retire lines, then structure rows (L139): ${kinds.join(", ")}`);
      }
      // L88's examples, as the spec writes them.
      const rows = (mode: Mode) => said.find((p) => p.mode === mode)!.rows;
      for (const line of ["on-primary on control-checked: Lc 26.35 < 68.9 (deutan view)", "primary-solid on switch-off: separation 5.28 < 12.4 (protan view)", "heading-ink on bg: could not be measured (needs Lc 82.8)"]) {
        assert.ok(rows("light").includes(line), `light does not print "    ✗ ${line}"`);
      }
      assert.ok(rows("dark").includes("edge:container on bg: edge presence 6.90 < 15.2 (protan view)"), "dark does not print L88's card edge");
      // L90: the structure failures, by their own line and count.
      assert.ok(structure.length > 0 && ["roles-complete", "hierarchy", "label-type"].every((check) => MODES.every((mode) => structure.some((f) => f.check === check && f.mode === mode))), `C1, C2 and C9 fail in both modes (L80): ${shown(structure)}`);
      const all = `${run.stdout}${run.stderr}`;
      assert.ok(run.stderr.includes(`✗ ${contrast} contrast failure(s)`), `contrast count ${contrast}:\n${run.stderr}`);
      assert.ok(all.includes(`✗ ${structure.length} structure failure(s)`), `structure count ${structure.length}`);
    });
  });

  RUNS.slice(3).forEach((gate) => {
    test(`2.1 #9 L87 ${gate.name}, on the shipped presets: "✓ every preset holds the contract it declares: wcag-aa × 10"`, () => {
      const run = runOn("shipped", gate);
      assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
      assert.ok(run.stdout.split("\n").includes("✓ every preset holds the contract it declares: wcag-aa × 10"), run.stdout);
    });

    test(`2.1 #9 L87 L79 ${gate.name}, with sorbet as step 2.6 will make it: "✓ every preset holds the contract it declares: wcag-aa × 8, legibility × 2", and no contrast or structure failure (the golden may still object: sorbet's file changed)`, () => {
      const run = runOn("as-step-2-6", gate);
      assert.ok(run.stdout.split("\n").includes("✓ every preset holds the contract it declares: wcag-aa × 8, legibility × 2"), `${run.stdout}\n${run.stderr}`);
      assert.doesNotMatch(run.stderr, /contrast failure|structure failure|TypeError/, run.stderr);
      assert.deepEqual(readGate(run.stderr).rows.filter((row) => /^\w+\/(light|dark)$/.test(row.at)), []);
    });

    test(`2.1 #8 L117 L118 L88 L89 L90 L120 ${gate.name}, on the preset declaring legibility with no edges: it fails, naming sorbet/light and the 24 in order, each failing tier's why and retire once, "✗ 24 contrast failure(s)", no structure failure — and writes nothing`, () => {
      const run = runOn("without-edges", gate);
      assert.ok(run.status !== 0 && run.status !== null, `${gate.name} exited ${run.status}`);
      assert.doesNotMatch(run.stderr, /TypeError|ReferenceError|SyntaxError/, run.stderr);
      const { rows, notes } = readGate(run.stderr);
      assert.deepEqual(rows.map((row) => row.at), new Array(24).fill("sorbet/light"), `the rows:\n${run.stderr}`);
      rows.forEach((row, i) => {
        const rule = NEEDS_EDGES[i]!;
        assert.ok(row.text.startsWith(`${rule.fg} on ${rule.bg} `) && row.text.includes("could not be measured"), `row ${i}: ${row.text}`);
      });
      assert.ok(notes.every((note) => note.at === "sorbet/light"));
      assert.deepEqual(sortedNotes(notes.map((note) => note.text)), sortedNotes(notesFor(NEEDS_EDGES)), "each failing tier's why and retire, once (L89)");
      assert.ok(run.stderr.includes("✗ 24 contrast failure(s)"), run.stderr);
      assert.doesNotMatch(`${run.stdout}${run.stderr}`, /structure failure/);
      assert.ok(!gate.wrote(plantedTrees.get("without-edges")!), `${gate.name} wrote its output`);
    });

    test(`2.1 #9 L88 L89 L90 L118 L120 L139 ${gate.name}, on sorbet as main ships it declaring legibility: "  sorbet/dark: edge:container on bg = edge presence 6.90 (needs 15.2, protan view)", every failure in that form, the structure failures as "<preset>/<mode>: <check>: <detail>", each failing tier's why and retire once a mode, both counts — and nothing written`, () => {
      const run = runOn("known-bad", gate);
      assert.ok(run.status !== 0 && run.status !== null, `${gate.name} exited ${run.status}`);
      assert.doesNotMatch(run.stderr, /TypeError|ReferenceError|SyntaxError/, run.stderr);
      assert.ok(run.stderr.split("\n").includes("  sorbet/dark: edge:container on bg = edge presence 6.90 (needs 15.2, protan view)"), `L88's gate line:\n${run.stderr}`);
      const twin = twinOf(PLANTED["known-bad"]!);
      const structure = structureOf(twin);
      const { rows, notes } = readGate(run.stderr);
      let contrast = 0;
      for (const mode of MODES) {
        const at = `sorbet/${mode}`;
        const failing = measure(mode, twin.colors[mode], LEG, KNOWN_BAD.edges[mode]).filter((pair) => !pair.holds);
        contrast += failing.length;
        const isStructure = (text: string) => CHECKS.some((check) => text.startsWith(`${check}: `));
        const contrastRows = rows.filter((row) => row.at === at && !isStructure(row.text)).map((row) => row.text);
        assert.equal(contrastRows.length, failing.length, `${at}: the failure rows`);
        failing.forEach((pair, i) => {
          const want = gateRowOf(pair);
          assert.ok("exact" in want ? contrastRows[i] === want.exact : contrastRows[i]!.startsWith(want.starts) && contrastRows[i]!.includes("could not be measured"), `${at} row ${i}: "${contrastRows[i]}", and ${shown(want)}`);
        });
        assert.deepEqual(rows.filter((row) => row.at === at && isStructure(row.text)).map((row) => row.text).sort(), structure.filter((f) => f.mode === mode).map((f) => `${f.check}: ${f.detail}`).sort(), `${at}: the structure rows`);
        assert.deepEqual(sortedNotes(notes.filter((note) => note.at === at).map((note) => note.text)), sortedNotes(notesFor(failing)), `${at}: each failing tier's why and retire, once (L89)`);
      }
      assert.ok(run.stderr.includes(`✗ ${contrast} contrast failure(s)`), `contrast count ${contrast}`);
      assert.ok(run.stderr.includes(`✗ ${structure.length} structure failure(s)`), `structure count ${structure.length}`);
      assert.ok(!gate.wrote(plantedTrees.get("known-bad")!), `${gate.name} wrote its output`);
    });
  });

  test("L100 §11.6 the build checks a partial's --sb- assignments against the names EVERY theme emits, not the first theme's: field-fill defined by ocean alone (the second theme) is legal; defined by none, it is flagged", () => {
    const tree = (name: string, append: string) => {
      const root = join(tmp, name);
      for (const part of [join("src", "tokens"), join("src", "styles"), "tools"]) {
        cpSync(join(pkgRoot, part), join(root, part), { recursive: true });
      }
      writeFileSync(join(root, "package.json"), JSON.stringify({ type: "module" }));
      appendFileSync(join(root, "src", "styles", "atoms", "_button.scss"), "\n.probe-l100 { --sb-field-fill: red; }\n");
      appendFileSync(join(root, "src", "tokens", "presets.ts"), append);
      return root;
    };
    // A line that names the property without assigning it: the token-name gate's, not a golden diff's "--sb-field-fill: …".
    const flagged = (stderr: string) => stderr.split("\n").some((line) => /--sb-field-fill(?!:)/.test(line));
    const none = node(["tools/build-tokens.ts"], tree("l100-none", ""));
    assert.ok(flagged(none.stderr), `the probe is unsound: a name no theme emits was not flagged:\n${none.stderr}`);
    const second = node(["tools/build-tokens.ts"], tree("l100-second", "\n// test-contracts.ts: L100, in a temporary copy.\n(presets.ocean.colors.light as Record<string, string>)[\"field-fill\"] = \"#ffffff\";\n"));
    assert.ok(!flagged(second.stderr), `the second theme emits --sb-field-fill and the gate still calls it unknown:\n${second.stderr}`);
  });

  // ══ revision 3.3 (§12.2, L130 to L142): what step 2.1's audits found ═══════════════════════════════════════
  /** L130's refusals: present, and not a string parseColor reads. */
  const UNUSABLE: unknown[] = [null, "", "   ", 0, true, {}, "not-a-colour", "red; } body { color: red"];

  test("L130 a present optional-token value in a preset's record must be a string parseColor reads: null, blank, a non-string, unreadable text is a TypeError naming the preset, the mode and the token — when emitted and when measured", () => {
    // The probe is sound: the §3 values, `transparent` included, are emitted and measured.
    assert.doesNotThrow(() => themeCss(legiblePreset({})));
    assert.deepEqual(structureOf(legiblePreset({})), []);
    for (const value of UNUSABLE) {
      for (const [mode, token] of [["light", "field-fill"], ["dark", "container-line"], ["light", "text-strong"], ["dark", "switch-ring"]] as const) {
        const colors = fresh();
        colors[mode][token] = value as string;
        const preset = legiblePreset({ colors });
        const what = `${mode} ${token} = ${shown(value)}`;
        throwsTypeError(() => themeCss(preset), ["probe-legible", mode, token], `${what}: emitted`);
        throwsTypeError(() => api("measurePreset")(preset, mode), [mode, token], `${what}: measurePreset`);
        throwsTypeError(() => checkPreset(preset), [mode, token], `${what}: checkPreset`);
        throwsTypeError(() => api("checkStructure")(preset), [mode, token], `${what}: checkStructure`);
      }
    }
  });

  test("L130 L55 an own key holding undefined is absent: not emitted, measured as its fallback, and the dark block still resets a token light defines", () => {
    const colors = fresh();
    colors.dark["field-fill"] = undefined as unknown as string;
    colors.light["quiet-fill"] = undefined as unknown as string;
    const preset = legiblePreset({ colors });
    const css = themeCss(preset);
    assert.ok(!css.includes("undefined"), "a value of undefined reached the theme file");
    const { light, dark } = blocksOf(css);
    assert.ok(!light.some((line) => line.startsWith("--sb-quiet-fill:")), "light emitted quiet-fill, which it holds as undefined");
    for (const block of dark) {
      assert.equal(afterShadows(block).at(-1), "--sb-field-fill: initial;", "light defines field-fill and dark holds it as undefined: dark resets it (L55)");
      assert.ok(!block.includes("--sb-quiet-fill: initial;") && block.includes("--sb-quiet-fill: #463425;"), "dark defines quiet-fill: no reset");
    }
    const absent = fresh();
    delete absent.dark["field-fill"];
    const pairs = api("measurePreset")(preset, "dark") as Measured[];
    for (const rule of naming("field-fill")) {
      const want = expectedOf(rule, metricOfTier(rule.tier), absent.dark, VALUES.edges.dark);
      const got = pick(pairs, rule);
      assert.ok(want === null ? got.actual === null : near(got.actual, want.actual, 1e-9) && got.view === want.view, `${rule.n} dark: ${got.actual}, measured as field-fill's fallback ${want?.actual}`);
    }
  });

  test("L131 measureColors keeps L37 for a record handed to it, as Token Studio reads one off a page: a blank optional token is unset — measured as its fallback, never refused", () => {
    for (const blank of ["", "   "]) {
      const colors = fresh();
      colors.light["field-fill"] = blank;
      const absent = fresh();
      delete absent.light["field-fill"];
      let pairs: Measured[] = [];
      assert.doesNotThrow(() => {
        pairs = measure("light", colors.light, LEG, VALUES.edges.light);
      }, `field-fill ${shown(blank)} handed to measureColors`);
      for (const rule of naming("field-fill")) {
        const want = expectedOf(rule, metricOfTier(rule.tier), absent.light, VALUES.edges.light)!;
        assert.ok(near(pick(pairs, rule).actual, want.actual, 1e-9), `${rule.n}: blank field-fill reads surface`);
      }
    }
  });

  /** L132: hostile shapes for edge data, each with where it must be refused. */
  class Bag {}
  const strip = (layer: Layer, key: keyof Layer) => Object.fromEntries(Object.entries(layer).filter(([name]) => name !== key));
  const holeIn = <T>(list: T[], at: number): T[] => {
    const copy = [...list];
    delete copy[at];
    return copy;
  };
  const HOSTILE_EDGES: { what: string; mode: Mode; element?: string; measured: boolean; build: (edges: Record<Mode, Edges>) => unknown }[] = [
    { what: "preset.edges inherits light", mode: "light", measured: true, build: (e) => Object.assign(Object.create({ light: e.light }) as object, { dark: e.dark }) },
    { what: "edges.light inherits container", mode: "light", element: "container", measured: true, build: (e) => ({ ...e, light: Object.assign(Object.create({ container: e.light.container }) as object, Object.fromEntries(Object.entries(e.light).filter(([name]) => name !== "container"))) }) },
    { what: "edges.light is a class instance", mode: "light", measured: true, build: (e) => ({ ...e, light: Object.assign(new Bag(), e.light) }) },
    { what: "edges.dark is a Map", mode: "dark", measured: true, build: (e) => ({ ...e, dark: new Map(Object.entries(e.dark)) }) },
    { what: "the container's recipe is all inherited", mode: "light", element: "container", measured: true, build: (e) => ({ ...e, light: { ...e.light, container: Object.create(e.light.container!) as Recipe } }) },
    { what: "a layer is all inherited", mode: "dark", element: "field", measured: true, build: (e) => ({ ...e, dark: { ...e.dark, field: { ...e.dark.field!, rest: [Object.create(e.dark.field!.rest[0]!) as Layer, ...e.dark.field!.rest.slice(1)] } } }) },
    { what: "a layer inherits blur -6 (the audit's case)", mode: "light", element: "container", measured: true, build: (e) => ({ ...e, light: { ...e.light, container: { ...e.light.container!, rest: [Object.assign(Object.create({ blur: -6 }) as object, strip(e.light.container!.rest[0]!, "blur")) as Layer, ...e.light.container!.rest.slice(1)] } } }) },
    { what: "a layer is a class instance", mode: "light", element: "sunken", measured: true, build: (e) => ({ ...e, light: { ...e.light, sunken: { ...e.light.sunken!, rest: e.light.sunken!.rest.map((layer) => Object.assign(new Bag(), layer) as unknown as Layer) } } }) },
    { what: "rest has a hole", mode: "dark", element: "container", measured: true, build: (e) => ({ ...e, dark: { ...e.dark, container: { ...e.dark.container!, rest: holeIn(e.dark.container!.rest, 1) } } }) },
    { what: "hover has a hole", mode: "light", element: "filled-accent", measured: false, build: (e) => ({ ...e, light: { ...e.light, "filled-accent": { ...e.light["filled-accent"]!, hover: holeIn(e.light["filled-accent"]!.hover!, 1) } } }) },
    { what: "hover is inherited", mode: "dark", element: "filled-primary", measured: false, build: (e) => ({ ...e, dark: { ...e.dark, "filled-primary": Object.assign(Object.create({ hover: e.dark["filled-primary"]!.hover }) as object, { fill: e.dark["filled-primary"]!.fill, rest: e.dark["filled-primary"]!.rest, press: e.dark["filled-primary"]!.press }) } }) },
  ];

  test("L132 edge data is read through own keys of plain objects and dense arrays only: an inherited mode, element, recipe or layer field, a class instance, a Map, a hole is a TypeError — at emission, and (L124) at measurement for what is measured", () => {
    // The probe is sound: a recipe whose prototype is null is plain.
    const nullProto = freshEdges();
    nullProto.light.container = Object.assign(Object.create(null) as Recipe, nullProto.light.container);
    assert.equal(measure("light", VALUES.colors.light, LEG, nullProto.light).length, HELD_BY_LEGIBILITY);
    assert.doesNotThrow(() => themeCss(legiblePreset({ edges: nullProto })), "a null-prototype recipe is a plain object");
    for (const { what, mode, element, measured, build } of HOSTILE_EDGES) {
      const edges = build(freshEdges()) as Record<Mode, Edges>;
      const preset = legiblePreset({ edges });
      const named = element === undefined ? [] : [element];
      throwsTypeError(() => themeCss(preset), named, `${what}: emitted`);
      if (measured) {
        throwsTypeError(() => api("measurePreset")(preset, mode), named, `${what}: measurePreset`);
        throwsTypeError(() => checkPreset(preset), named, `${what}: checkPreset`);
        if (what !== "preset.edges inherits light") {
          throwsTypeError(() => measure(mode, VALUES.colors[mode], LEG, (edges as unknown as Record<Mode, unknown>)[mode]), named, `${what}: measureColors`);
        }
      }
    }
  });

  test("L133 C3 (c) in a legibility mode whose edges define the elements a line token serves, the record defines the token and it parses with alpha 0 — a visible line, a half-transparent one or none fails edge-not-fill, naming the token", () => {
    const SERVES: [token: string, elements: string[]][] = [["container-line", ["container", "floating"]], ["field-line", ["field"]], ["filled-line", ["filled-primary", "filled-secondary", "filled-accent", "filled-danger"]]];
    const ABSENT = Symbol("absent");
    for (const [token, elements] of SERVES) {
      for (const mode of MODES) {
        for (const value of ["#000000", "rgb(0 0 0 / 0.5)", undefined, ABSENT] as const) {
          const colors = fresh();
          if (value === ABSENT) {
            delete colors[mode][token];
          } else {
            colors[mode][token] = value as string;
          }
          const failures = structureOf(legiblePreset({ colors }));
          const what = `${mode} ${token} ${value === ABSENT ? "absent" : shown(value)}`;
          assert.ok(failures.some((f) => f.mode === mode && f.check === "edge-not-fill" && f.detail.includes(token) && (typeof value !== "string" || f.detail.includes(value))), `${what}: ${shown(failures)}`);
          assert.deepEqual(failures.filter((f) => f.mode !== mode), [], `${what}: the other mode`);
        }
        const clear = fresh();
        clear[mode][token] = "rgb(255 0 0 / 0)";
        assert.deepEqual(structureOf(legiblePreset({ colors: clear })), [], `${mode} ${token}: any colour at alpha 0 is transparent`);
        // A mode whose edges define none of the token's elements is not held by (c): its edge rules fail by name (L39).
        const black = fresh();
        black[mode][token] = "#000000";
        const edges = freshEdges();
        for (const element of elements) {
          delete edges[mode][element];
        }
        assert.deepEqual(structureOf(legiblePreset({ colors: black, edges })), [], `${mode} ${token} black, with none of ${elements.join(", ")} defined`);
      }
    }
  });

  /** An array with a hole at `at`, the rest as given. */
  const sparse = (values: unknown[], at: number) => {
    const list: unknown[] = [];
    values.forEach((value, i) => {
      if (i !== at) {
        list[i] = value;
      }
    });
    list.length = values.length;
    return list;
  };

  test("L134 L35 `views` and `checks`, when present, are dense: a hole is refused as malformed, naming the contract's key", () => {
    accepted("probe-dense", SOUND, { views: ["tritan", "typical"], checks: ["label-type"] }, "dense lists");
    refused("probe-holes", SOUND, { views: sparse(["typical", "tritan"], 0) }, [], "views [ , tritan]");
    refused("probe-holes", SOUND, { views: sparse(["typical", "protan", "deutan"], 1) }, [], "views [typical, , deutan]");
    refused("probe-holes", SOUND, { views: sparse(["typical", "protan"], 1) }, [], "views [typical, ] (a trailing hole)");
    refused("probe-holes", SOUND, { views: [...VIEWS], checks: sparse(["roles-complete", "hierarchy"], 0) }, [], "checks [ , hierarchy]");
    refused("probe-holes", SOUND, { views: [...VIEWS], checks: sparse(["hierarchy", "label-type"], 1) }, [], "checks [hierarchy, ]");
  });

  test("L135 L123 a recipe holds only fill, rest, hover and press, fill and rest required; a layer exactly its seven keys — anything else is a TypeError naming the element, at emission and at measurement", () => {
    const RECIPE: [what: string, change: (recipe: Record<string, unknown>) => void][] = [
      ["a key hovr", (recipe) => Object.assign(recipe, { hovr: recipe.hover })],
      ["a key Rest", (recipe) => Object.assign(recipe, { Rest: recipe.rest })],
      ["a key extra", (recipe) => Object.assign(recipe, { extra: 1 })],
      ["no fill", (recipe) => Reflect.deleteProperty(recipe, "fill")],
    ];
    for (const [what, change] of RECIPE) {
      for (const mode of MODES) {
        const edges = freshEdges();
        change(edges[mode]["filled-primary"] as unknown as Record<string, unknown>);
        throwsTypeError(() => measure(mode, VALUES.colors[mode], LEG, edges[mode]), ["filled-primary"], `${mode} filled-primary, ${what}: measured`);
        throwsTypeError(() => themeCss(legiblePreset({ edges })), ["probe-legible", "filled-primary"], `${mode} filled-primary, ${what}: emitted`);
      }
    }
    const LAYER: [what: string, change: (layer: Record<string, unknown>) => void][] = [
      ["a key colour", (layer) => Object.assign(layer, { colour: "#000000" })],
      ["a key spreadd", (layer) => Object.assign(layer, { spreadd: 1 })],
      ["no inset", (layer) => Reflect.deleteProperty(layer, "inset")],
      ["no alpha", (layer) => Reflect.deleteProperty(layer, "alpha")],
    ];
    for (const [what, change] of LAYER) {
      const edges = freshEdges();
      change(edges.light.container!.rest[2] as unknown as Record<string, unknown>);
      throwsTypeError(() => measure("light", VALUES.colors.light, LEG, edges.light), ["container"], `the container's third layer, ${what}: measured`);
      try {
        measure("light", VALUES.colors.light, LEG, edges.light);
      } catch(error) {
        assert.match((error as Error).message, /\b3(rd)?\b/, `the container's third layer, ${what}: the position, counted from 1 (L122)`);
      }
      throwsTypeError(() => themeCss(legiblePreset({ edges })), ["probe-legible", "container"], `the container's third layer, ${what}: emitted`);
      // A hover layer is emitted, not measured (L124).
      const hover = freshEdges();
      change(hover.dark["filled-secondary"]!.hover![0] as unknown as Record<string, unknown>);
      throwsTypeError(() => themeCss(legiblePreset({ edges: hover })), ["probe-legible", "filled-secondary"], `a hover layer, ${what}: emitted`);
    }
  });

  test("L136 a key of a preset's colour record that is neither a role nor an optional token is a TypeError naming the preset, the mode and the key — when emitted and when measured, whatever the contract", () => {
    for (const [mode, key] of [["light", "feild-fill"], ["dark", "Surface"], ["light", "edge-container"], ["dark", "shadow-sm"]] as const) {
      for (const contract of [{ light: LEG, dark: LEG }, { light: WCAG, dark: WCAG }]) {
        const colors = fresh();
        colors[mode][key] = "#fffbf1";
        const preset = legiblePreset({ colors, contract });
        const what = `${mode} ${key}, ${contract.light}`;
        throwsTypeError(() => themeCss(preset), ["probe-legible", mode, key], `${what}: emitted`);
        throwsTypeError(() => api("measurePreset")(preset, mode), [mode, key], `${what}: measurePreset`);
        throwsTypeError(() => checkPreset(preset), [mode, key], `${what}: checkPreset`);
        throwsTypeError(() => api("checkStructure")(preset), [mode, key], `${what}: checkStructure`);
      }
    }
  });

  test("L137 a contract whose tier carries `requires` must list label-type in its checks: otherwise it is refused whole, naming its key and the tier", () => {
    const requires = { buttonLabelPx: 16, buttonLabelSmallPx: 14, buttonLabelWeight: 600 };
    accepted("probe-requires", { ...SOUND, label: tierFloor("lc", 60, { requires }) }, { views: [...VIEWS], checks: ["label-type"] }, "label-type listed");
    for (const extra of [{ views: [...VIEWS] }, { views: [...VIEWS], checks: [] }, { views: [...VIEWS], checks: ["hierarchy", "edge-not-fill"] }]) {
      refused("probe-requires", { ...SOUND, label: tierFloor("lc", 60, { requires }) }, extra, ["label"], `requires on label, checks ${shown(extra.checks) ?? "absent"}`);
    }
    refused("probe-requires", { body: tierFloor("lc", 50, { requires }) }, { views: [...VIEWS], checks: ["hierarchy"] }, ["body"], "requires on body, no label-type");
  });

  // ── step 2.1 acceptance #10 (L140): structure failures alone fail every surface ──
  /** The step-2.6 shape with buttonLabel.px 14: every rule holds, and C9 fails in each legibility mode. */
  const STRUCTURE_ONLY: Record<string, Record<string, unknown>> = {
    // L140's tree. Both modes declare legibility, so C9 fails twice (C9 runs per legibility mode: L79, and the C9 test above).
    "structure-only": { ...PLANTED["as-step-2-6"]!, buttonLabel: { ...VALUES.buttonLabel, px: 14 } },
    // The same in light only, which gives L140's literal "✗ 1 structure failure(s)".
    "structure-only-light": { colors: { light: VALUES.colors.light, dark: shipped.sorbet!.colors.dark }, edges: { light: VALUES.edges.light }, buttonLabel: { ...VALUES.buttonLabel, px: 14 }, contract: { light: LEG, dark: WCAG } },
  };
  const structureTrees = new Map(Object.entries(STRUCTURE_ONLY).map(([name, parts]) => {
    const tree = plant(`legibility-${name}`, plantedSorbet(parts));
    cpSync(join(pkgRoot, "src", "styles"), join(tree.ds, "src", "styles"), { recursive: true });
    mkdirSync(join(tree.app, "src", "styles", "abstracts"), { recursive: true });
    // Sorbet's golden is the planted theme, so the golden gate passes and the structure check is the only failure.
    writeFileSync(join(tree.ds, "tools", "golden", "sorbet.css"), themeCss(twinOf(parts)));
    return [name, tree];
  }));
  for (const [name, parts] of Object.entries(STRUCTURE_ONLY)) {
    const twin = twinOf(parts);
    const tree = structureTrees.get(name)!;
    const expected = () => {
      const failures = structureOf(twin);
      const contrast = Object.values({ ...shipped, sorbet: twin }).flatMap((preset) => checkPreset(preset));
      assert.deepEqual(contrast, [], `${name}: the probe is unsound — a contrast failure`);
      assert.ok(failures.length > 0 && failures.every((f) => f.check === "label-type"), `${name}: the probe is unsound — ${shown(failures)}`);
      return failures;
    };
    RUNS.slice(0, 3).forEach((report, i) => {
      test(`2.1 #10 L140 L139 ${report.name}, when only structure checks fail (${name}): a non-zero exit, "✗ ${name === "structure-only" ? 2 : 1} structure failure(s)", no success line, and each structure row directly under its mode line`, () => {
        const failures = expected();
        assert.equal(failures.length, name === "structure-only" ? 2 : 1);
        const run = report.run(tree);
        assert.doesNotMatch(run.stderr, /TypeError|ReferenceError|SyntaxError/, run.stderr);
        assert.ok(run.status !== 0 && run.status !== null, `${report.name} exited ${run.status} with a structure failure:\n${run.stdout}\n${run.stderr}`);
        const all = `${run.stdout}${run.stderr}`;
        assert.ok(all.includes(`✗ ${failures.length} structure failure(s)`), `the structure count:\n${all}`);
        assert.doesNotMatch(all, /✓ every declared contract holds|contrast failure\(s\)/, "a success line, or a contrast count, on a run whose only failures are structural");
        for (const p of readReport(run.stdout)) {
          const here = p.preset === "sorbet" ? failures.filter((f) => f.mode === p.mode) : [];
          if (p.preset === "sorbet" && contractOf(twin, p.mode) === LEG) {
            const want = `all ${HELD_BY_LEGIBILITY} pairings pass (tightest margin ×1.02) — legibility; ${APPLYING - HELD_BY_LEGIBILITY} rules not held`;
            assert.equal(p.summary, REPORT_MARGIN[i] ? want : withoutMargin(want), `sorbet/${p.mode}`);
          } else {
            const want = RECORDED_LINES.get(`${p.preset}/${p.mode}`)!;
            assert.equal(p.summary, REPORT_MARGIN[i] ? want : withoutMargin(want), `${p.preset}/${p.mode}`);
          }
          assert.deepEqual(p.order, here.map((f) => ({ kind: "row", text: `${f.check}: ${f.detail}` })), `${p.preset}/${p.mode}: its structure rows directly under its mode line (L139), and nothing else`);
        }
      });
    });
    RUNS.slice(3).forEach((gate) => {
      test(`2.1 #10 L140 ${gate.name}, when only structure checks fail (${name}): a non-zero exit, "✗ ${name === "structure-only" ? 2 : 1} structure failure(s)", no success line — and nothing written`, () => {
        const failures = expected();
        const run = gate.run(tree);
        assert.doesNotMatch(run.stderr, /TypeError|ReferenceError|SyntaxError/, run.stderr);
        assert.ok(run.status !== 0 && run.status !== null, `${gate.name} exited ${run.status} with a structure failure:\n${run.stdout}\n${run.stderr}`);
        const all = `${run.stdout}${run.stderr}`;
        assert.ok(all.includes(`✗ ${failures.length} structure failure(s)`), `the structure count:\n${all}`);
        assert.doesNotMatch(all, /✓ every preset holds the contract it declares|contrast failure\(s\)|golden-file failure/, "a success line, a contrast count or a golden failure: the structure check must be the only thing failing");
        assert.deepEqual(readGate(run.stderr).rows.map((row) => `${row.at}: ${row.text}`).sort(), failures.map((f) => `${f.preset}/${f.mode}: ${f.check}: ${f.detail}`).sort(), "the gate's rows are the structure failures");
        assert.ok(!gate.wrote(tree), `${gate.name} wrote its output on a run that failed a structure check`);
      });
    });
  }

  legibilityCount = ran - legibilityFrom;

  // ── last: everything mutated above was put back ─────────────────────────
  // legibility-spec.md L105 #15 (L8): the contracts and CONTRACT_NAMES were ["wcag-aa"] after the mutations; they are
  // ["wcag-aa", "legibility"]. L105 #16 (L2): RULES equalled the 86 of the fixture; RULES.slice(0, 86) does, and
  // RULES.length is 277. (The legibility member and the 191 are also checked whole: the step-2.1 tests above mutate them.)
  test("M9 the exported RULES and contracts are as they were before this file mutated them", () => {
    assert.deepEqual(Object.keys(contracts), ["wcag-aa", "legibility"]);
    assert.deepEqual([...CONTRACT_NAMES], ["wcag-aa", "legibility"]);
    assert.equal(contracts[WCAG].name, "wcag-aa");
    assert.deepEqual(Object.keys(contracts[WCAG].tiers).sort(), [...M4_TIERS].sort());
    assert.deepEqual(RULES.slice(0, 86).map((rule) => [rule.fg, rule.bg, rule.mode ?? null]), RULE_ORDER);
    assert.equal(RULES.length, 277);
    assert.deepEqual(RULES.slice(86).map((rule) => [rule.fg, rule.bg, rule.tier, rule.mode ?? null]), APPENDIX.rules.map((rule) => [rule.fg, rule.bg, rule.tier, null]));
    assert.equal(legibility().name, "legibility");
    assert.deepEqual(Object.keys(legibility().tiers).sort(), APPENDIX.floors.map((row) => row.tier).sort());
    for (const row of APPENDIX.floors) {
      for (const mode of MODES) {
        assert.equal(floorFor(LEG, row.tier, mode), row[mode], `legibility, ${row.tier}, ${mode}`);
      }
    }
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
if ((legibilityCount ?? 0) < 90) {
  console.error(styleText("red", `\n✗ only ${legibilityCount ?? 0} checks of the legibility member (PR 2, step 2.1) ran`));
  process.exit(1);
}
console.log(styleText("green", `✓ every preset is held to the contract it declares, and that contract is the one 2d3b765 enforced: ${ran} checks`));
