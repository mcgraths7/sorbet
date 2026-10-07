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
import { createHash } from "node:crypto";
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { stripVTControlCharacters, styleText } from "node:util";

// Namespaces, not named imports: a name that is not exported yet is then one
// failing test that says so, not a module that will not load.
// stateDefinition is L153's one definition of a state and of the composed form, shared with the source stylelint
// rule and the e24df74 recorder (audit of 7a683fd, guards F9: there were four literal copies).
import * as stateDefinition from "../../../tools/stylelint/state-definition.js";
import * as color from "../src/tokens/color.ts";
import * as edgeTokens from "../src/tokens/edges.ts";
import * as tokens from "../src/tokens/index.ts";

import * as chartGate from "./check-cvd.ts";
import * as goldenGate from "./check-golden.ts";

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

// legibility-spec.md L105 #24 (L3): colorsOf's default preset was sorbet; it is ocean, which keeps every caller that
// measures the default under wcag-aa and expects a pass true once sorbet's light record is rebuilt (step 2.2).
const colorsOf = (mode: Mode, preset = "ocean") => shipped[preset]!.colors[mode];
/**
 * What each shipped preset declares (L101, L105 #26), typed in from the spec. Step 2.2: sorbet's light mode declares
 * legibility; step 2.6 makes its dark mode legibility too (L195 (c), rows 25 to 31 and 46: this one edit moves sorbet
 * dark out of every wcag-aa assertion that reads DECLARED, so check700 holds 560 measurements, 8 preset-modes × 70).
 */
const DECLARED: Record<string, Record<Mode, ContractName>> = {
  sorbet: { light: "legibility" as ContractName, dark: "legibility" as ContractName },
  ocean: { light: "wcag-aa", dark: "wcag-aa" },
  forest: { light: "wcag-aa", dark: "wcag-aa" },
  noir: { light: "wcag-aa", dark: "wcag-aa" },
  midnight: { light: "wcag-aa", dark: "wcag-aa" },
};
/** L105 #25: the preset-modes that still declare wcag-aa, in the fixture's order (preset, then light, then dark). */
const wcagModes = () => Object.values(shipped).flatMap((preset) => MODES.filter((mode) => DECLARED[preset.name]![mode] === "wcag-aa").map((mode) => ({ preset, mode })));
/** The fixture's 70 rows for one preset-mode. */
const recordedFor = (preset: string, mode: Mode) => RECORDED.filter((row) => row.preset === preset && row.mode === mode);
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

/**
 * The 700 (M4, M9.2): floor, verdict and order exactly; each ratio to 1e-9. legibility-spec.md L105 #25 (L3): the
 * rows of the preset-modes that still declare wcag-aa — 630 from step 2.2, 560 from step 2.6 — against the fixture's
 * rows of those preset-modes.
 */
function check700() {
  const held = wcagModes();
  const now = held.flatMap(({ preset, mode }) => measureColors(mode, preset.colors[mode], WCAG).map((pair) => ({ preset: preset.name, mode, ...pair })));
  const recorded = held.flatMap(({ preset, mode }) => recordedFor(preset.name, mode));
  assert.equal(recorded.length, 70 * held.length, "the fixture's rows of the wcag-aa preset-modes");
  assert.equal(now.length, recorded.length, "the number of measurements over the shipped presets' wcag-aa modes");
  now.forEach((pair, i) => {
    const was = recorded[i]!;
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
  // legibility-spec.md L105 #26 (L101, steps 2.2 and 2.6): all five declared wcag-aa in both modes; sorbet declared
  // { light: "legibility", dark: "wcag-aa" } from step 2.2, and from step 2.6 legibility in both (L195 (c)); the four
  // others are unchanged.
  test("M5 L101 L195 each preset declares what step 2.6 says — sorbet legibility in both modes, the four others wcag-aa in both — and contractOf says so", () => {
    assert.deepEqual(Object.keys(shipped), ["sorbet", "ocean", "forest", "noir", "midnight"]);
    for (const preset of Object.values(shipped)) {
      assert.deepEqual(preset.contract, DECLARED[preset.name], preset.name);
      for (const mode of MODES) {
        assert.equal(contractOf(preset, mode), DECLARED[preset.name]![mode], `${preset.name}/${mode}`);
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
          // legibility-spec.md L105 #27 (L3): over the preset-modes that declare wcag-aa.
          for (const preset of wcagModes().filter((held) => held.mode === mode).map((held) => held.preset)) {
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
    // Under wcag-aa, against the ratios 2d3b765 measured. legibility-spec.md L105 #28 (L3): over the fixture rows of
    // the preset-modes that still declare wcag-aa (#25).
    for (const { preset, mode } of wcagModes()) {
      const rows = recordedFor(preset.name, mode);
      measureColors(mode, preset.colors[mode], WCAG).forEach((pair, at) => {
        const was = rows[at]!;
        assert.equal(pair.min, floorFor(WCAG, pair.tier, mode));
        assert.equal(pair.holds, was.actual >= rowOf(pair.tier).floor[mode], `${preset.name}/${mode}: ${pairKey(pair.fg, pair.bg)}`);
      });
    }
    // Raise one tier's floor: its pairs are judged by the new number, and only its pairs.
    for (const raised of [7, 21.5]) {
      withTiers((tiers) => {
        tiers.text!.min = raised;
      }, () => {
        // legibility-spec.md L105 #29 (L3): over the rows of #25, and the gate's count against the failures of the
        // wcag-aa-declaring preset-modes only (sorbet's light mode is judged by legibility, which lists no text tier).
        let fell = 0;
        for (const { preset, mode } of wcagModes()) {
          const rows = recordedFor(preset.name, mode);
          {
            for (const [i, pair] of measureColors(mode, preset.colors[mode], WCAG).entries()) {
              const was = rows[i]!;
              const min = pair.tier === "text" ? raised : was.floor;
              assert.equal(pair.min, min, `${preset.name}/${mode}: ${pairKey(pair.fg, pair.bg)} with text at ${raised}`);
              assert.equal(pair.holds, pair.actual !== null && pair.actual >= min, `${preset.name}/${mode}: ${pairKey(pair.fg, pair.bg)} at ${pair.actual} against ${min}`);
              assert.equal(pair.holds, was.actual >= min, `${preset.name}/${mode}: ${pairKey(pair.fg, pair.bg)}, by the ratio 2d3b765 measured`);
              fell += pair.holds ? 0 : 1;
            }
          }
        }
        assert.ok(fell > 0, `no pair fell when text was raised to ${raised}`);
        assert.equal(Object.values(shipped).flatMap(checkPreset).filter((failure) => DECLARED[failure.preset]![failure.mode] === "wcag-aa").length, fell, "the gate fails exactly those");
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
    // legibility-spec.md L105 "#11 again" (step 2.2; L21, L86, L91): sorbet's heading carries its new tagline (L21: its
    // words are the implementer's, so the line is read off the preset), sorbet's light line is legibility's, with the
    // margin derived from this spec (84.8629 ÷ 82.8 = 1.0249, ×1.02). Step 2.6 (L105, L195 (c) row "11 again"):
    // sorbet's dark line is legibility's too (85.2412 ÷ 83.2 = 1.0245, ×1.02), and the last line counts 946:
    // wcag-aa × 8, legibility × 2.
    const lines = recorded
      .replace(/^( {2}(?:light|dark) +all 70 pairings pass.*)$/gm, "$1 — wcag-aa; 191 rules not held")
      .replace(/^✓ WCAG AA contract holds for every preset in both modes \(700 pairings measured\)$/m, "✓ every declared contract holds for every preset in both modes (946 pairings measured): wcag-aa × 8, legibility × 2")
      .split("\n");
    const heading = lines.findIndex((line) => line.startsWith("Sorbet — "));
    assert.ok(heading >= 0 && lines[heading + 1]!.startsWith("  light ") && lines[heading + 2]!.startsWith("  dark "), "the fixture's sorbet section");
    lines[heading] = `Sorbet — ${shipped.sorbet!.tagline}`;
    lines[heading + 1] = `  light all ${HELD_BY_LEGIBILITY} pairings pass (tightest margin ×1.02) — legibility; ${APPLYING - HELD_BY_LEGIBILITY} rules not held`;
    lines[heading + 2] = `  dark  all ${HELD_BY_LEGIBILITY} pairings pass (tightest margin ×1.02) — legibility; ${APPLYING - HELD_BY_LEGIBILITY} rules not held`;
    const expected = lines.join("\n");
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
        // legibility-spec.md L105 #30 (M6.9, L101): each preset's declaration (sorbet's as in #26), not wcag-aa for all.
        contract: DECLARED[preset.name],
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
      // legibility-spec.md L105 #46 (step 2.2, L57): it throws for each shipped preset and mode that declares wcag-aa, and
      // contractOf for a mode declaring legibility still returns "legibility".
      for (const preset of Object.values(shipped)) {
        for (const mode of MODES) {
          if (DECLARED[preset.name]![mode] === "wcag-aa") {
            throwsTypeError(() => contractOf(preset, mode), ["wcag-aa", "txet"], `contractOf(${preset.name}, ${mode})`);
          } else {
            assert.equal(contractOf(preset, mode), "legibility", `contractOf(${preset.name}, ${mode})`);
          }
        }
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
            // legibility-spec.md L105 #31 (L91): `all N pairings pass`, N being the declared contract's count — 193 for legibility.
            const n = DECLARED[preset]![mode as Mode] === "legibility" ? HELD_BY_LEGIBILITY : 70;
            assert.match(summary, new RegExp(`^all ${n} pairings pass\\b`), `${report.name}: ${preset}/${mode} declares ${DECLARED[preset]![mode as Mode]} and holds it, and the report says: ${summary}`);
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
        // legibility-spec.md L105 #32 (step 2.2): this asked sorbet, whose light mode now declares legibility; it asks ocean.
        assert.equal(contractOf(shipped.ocean!, "light"), "wcag-aa");
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
  // L146 (amends L54): an empty rest is the transparent zero shadow `0 0 #0000`, a valid item of a composed box-shadow list;
  // `none` is not (a list containing it is invalid, and paints nothing).
  const layersText = (layers: Layer[]) => (layers.length === 0 ? "0 0 #0000" : layers.map(layerText).join(", "));
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
  /**
   * How far each halo element rises while hovered, in px: the filled buttons 1 (`pressable(1px)`), the interactive card
   * 2 (`translate: 0 -2px`), the quiet button 0. This file's own copy; "2.4 L151 (lift)" reads both rises off the
   * compiled stylesheet and holds this copy and edges.ts's HOVER_LIFT to them.
   */
  const HOVER_RISE = { container: 2, quiet: 0, filled: 1 };
  /**
   * L151: the largest outward reach, max(|x|, |y|) + blur + spread, of any all-round outset layer in the rest, hover and
   * press of container, quiet and the four filled-* elements, plus the element's rise wherever it is hovered — a filled
   * element's hover recipe, the container's rest recipe (which is also its hover) — rounded up to a whole px. The rise
   * is the repair of 7a683fd (frozen lens F5): a hovered filled button reached 8 + 1 = 9px and a hovered interactive
   * card 7 + 2 = 9px, against a room of 8px that counted no rise.
   */
  const haloRoomOf = (edges: Partial<Edges>) => Math.ceil((["container", "quiet", "filled-primary", "filled-secondary", "filled-accent", "filled-danger"] as const)
    .flatMap((element) => {
      const rise = element === "container" ? HOVER_RISE.container : element === "quiet" ? HOVER_RISE.quiet : HOVER_RISE.filled;
      return [...(edges[element]?.rest ?? []).map((layer) => [layer, element === "container" ? rise : 0] as const), ...(edges[element]?.hover ?? []).map((layer) => [layer, rise] as const), ...(edges[element]?.press ?? []).map((layer) => [layer, 0] as const)];
    })
    // L197: every outset layer with no offset that reaches past the box (an all-round layer or a glow) counts, and the
    // room is never less than the focus ring's reach, 5px; with no such layer there is no room (a theme without edges).
    .filter(([layer]) => !layer.inset && layer.x === 0 && layer.y === 0 && layer.blur + layer.spread > 0)
    .map(([layer, rise]) => layer.blur + layer.spread + rise)
    .reduce((room, reach) => Math.max(room, reach, 5), 0));
  const haloLine = (edges: Partial<Edges>) => `--sb-halo-room: ${haloRoomOf(edges)}px;`;
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
    // L151 (revision 3.5): after the edge lines, the mode's --sb-halo-room.
    assert.deepEqual(afterShadows(light), ["--sb-button-font-size: 1rem;", "--sb-button-font-size-sm: 0.875rem;", ...edgeLines(VALUES.edges.light), haloLine(VALUES.edges.light)], "light, after the shadow lines (L19, L53, L151)");
    assert.equal(edgeLines(VALUES.edges.light).length, 21, "13 rest, 4 hover, 4 press");
    for (const block of dark) {
      assert.deepEqual(block.slice(firstColour(block), firstColour(block) + 89), colourLines(VALUES.colors.dark), "dark: the 89 colour lines, in record order");
      assert.deepEqual(afterShadows(block), [...edgeLines(VALUES.edges.dark), haloLine(VALUES.edges.dark)], "dark, after the shadow lines: the edges and the room (L151), no button size (L55: it is not reset), and no reset (dark defines everything)");
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

  // L151 (revision 3.5): the light block's --sb-halo-room is reset too, after the edge properties: 41 resets became 42.
  test("L55 L151 a dark block resets, with `initial`, every property the light block emits from optional data and it does not: the 20 optional tokens, the 21 edge properties and the halo room — 42 lines, after everything else, in the light block's order", () => {
    const preset = legiblePreset({ colors: { light: fresh().light, dark: oceanDark() }, edges: { light: freshEdges().light }, contract: { light: LEG, dark: WCAG } });
    const { dark } = blocksOf(themeCss(preset));
    const resets = [...VALUES.seams.map((seam) => `--sb-${seam.name}: initial;`), ...edgeLines(VALUES.edges.light).map((line) => `${line.slice(0, line.indexOf(":"))}: initial;`), "--sb-halo-room: initial;"];
    assert.equal(resets.length, 42);
    for (const block of dark) {
      assert.deepEqual(afterShadows(block), resets, "each dark block ends with the 42 resets (danger-active is a role, not optional data: it is not reset)");
    }
  });

  test("L55 the unit is the emitted property, never the element: a dark recipe with rest and no hover still resets the light -hover property", () => {
    const edges = freshEdges();
    delete edges.dark["filled-primary"]!.hover;
    const { dark } = blocksOf(themeCss(legiblePreset({ edges })));
    for (const block of dark) {
      assert.deepEqual(afterShadows(block), [...edgeLines(edges.dark), haloLine(edges.dark), "--sb-edge-filled-primary-hover: initial;"]); // L151: the room after the edges
    }
    const colors = fresh();
    delete colors.dark["quiet-fill"];
    for (const block of blocksOf(themeCss(legiblePreset({ colors }))).dark) {
      assert.equal(afterShadows(block).at(-1), "--sb-quiet-fill: initial;", "an optional token light defines and dark does not");
    }
  });

  // L146 (CORRECTION to L54, 2026-10-05): this expected `none`, which L54 said until L146; it now expects `0 0 #0000`.
  test("L54 L146 an element with an empty rest emits --sb-edge-<element>: 0 0 #0000; — never none", () => {
    const edges = freshEdges();
    edges.light.sunken!.rest = [];
    const light = blocksOf(themeCss(legiblePreset({ edges }))).light;
    assert.ok(light.includes("--sb-edge-sunken: 0 0 #0000;"), `the sunken element with an empty rest: ${light.find((line) => line.startsWith("--sb-edge-sunken:"))}`);
    assert.ok(!light.some((line) => line.startsWith("--sb-edge-") && / none;$/.test(line)), "an edge property emitted as none (L146)");
  });

  test("L43 L122 L124 malformed edge data is a TypeError when it is EMITTED too, naming the preset and the element — a hover layer included", () => {
    const rest = freshEdges();
    rest.light.container!.rest[2]!.alpha = 2;
    throwsTypeError(() => themeCss(legiblePreset({ edges: rest })), ["probe-legible", "container"], "a rest layer with alpha 2");
    const hover = freshEdges();
    hover.dark["filled-accent"]!.hover![1]!.color = "#f5e3a";
    throwsTypeError(() => themeCss(legiblePreset({ edges: hover })), ["probe-legible", "filled-accent"], "a hover layer with a five-digit colour");
  });

  // L17 says "No WCAG preset": the four frozen presets. (Written in step 2.1 over all five shipped presets, which was true
  // only while sorbet defined nothing: from step 2.2 sorbet defines all three. A misreading of L17 by this file, corrected.)
  test("L5 L17 L56 the absence of the data is the whole switch: no WCAG preset defines an optional token, edges or buttonLabel; a legibility declaration alone changes no byte; a wcag-aa preset WITH the data emits it", () => {
    const seamNames = VALUES.seams.map((seam) => seam.name);
    for (const preset of ["ocean", "forest", "noir", "midnight"].map((name) => shipped[name]!)) {
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
  // A part given as undefined removes the field: from step 2.2 the shipped sorbet carries edges and a buttonLabel.
  const plantedSorbet = (parts: Record<string, unknown>) => `\n// test-contracts.ts: legibility-spec.md step 2.1, in a temporary copy.\n{\n  const sorbet = presets.sorbet as unknown as Record<string, unknown>;\n${Object.entries(parts).map(([key, value]) => (value === undefined ? `  delete sorbet[${JSON.stringify(key)}];` : `  sorbet[${JSON.stringify(key)}] = ${JSON.stringify(value)};`)).join("\n")}\n}\n`;
  /** The same preset, in this process. */
  const twinOf = (parts: Record<string, unknown>) => {
    const twin = Object.assign(structuredClone(shipped.sorbet!), structuredClone(parts)) as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(parts)) {
      if (value === undefined) {
        delete twin[key];
      }
    }
    return twin as unknown as Preset;
  };
  const PLANTED: Record<string, Record<string, unknown>> = {
    shipped: {},
    "as-step-2-6": { colors: VALUES.colors, edges: VALUES.edges, buttonLabel: VALUES.buttonLabel, contract: { light: LEG, dark: LEG } },
    // L196 (a): a passing tree whose declaration is mixed, sorbet as step 2.2 left it (§3's light half, e24df74's dark
    // half, the light edges), so the "preset-modes" count of L86 and L87 is still tested once no shipped preset is mixed.
    "as-step-2-2": { colors: { light: VALUES.colors.light, dark: KNOWN_BAD.colors.dark }, edges: { light: VALUES.edges.light }, buttonLabel: VALUES.buttonLabel, contract: { light: LEG, dark: WCAG } },
    "without-edges": { colors: { light: VALUES.colors.light, dark: KNOWN_BAD.colors.dark }, edges: undefined, buttonLabel: VALUES.buttonLabel, contract: { light: LEG, dark: WCAG } },
    // Sorbet as main ships it (the known-bad fixture's colours, no buttonLabel), declaring legibility with its card edge.
    "known-bad": { colors: KNOWN_BAD.colors, edges: KNOWN_BAD.edges, buttonLabel: undefined, contract: { light: LEG, dark: LEG } },
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
    // By label, not by the whole heading: sorbet's tagline is rewritten in step 2.2 (L21) and the fixture keeps e24df74's.
    const labels = new Map(Object.values(shipped).map((preset) => [preset.label, preset.name]));
    let preset = "";
    for (const line of readFileSync(join(fixtures, "check-contrast.report.txt"), "utf8").split("\n")) {
      const mode = /^ {2}(light|dark) +(.+)$/.exec(line);
      const label = line.split(" — ")[0]!;
      if (!line.startsWith(" ") && labels.has(label)) {
        preset = labels.get(label)!;
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
    // Step 2.2 (as L105 "#11 again"): sorbet light declares legibility, so its line is legibility's. Step 2.6 (its
    // acceptance #6, L195 (c) row 52): sorbet dark declares legibility too, so both its lines are legibility's and the last
    // line counts 946 pairings, wcag-aa × 8 and legibility × 2. Derived from DECLARED, the spec's declarations; sorbet
    // dark's line is also checked as acceptance #6 types it.
    test(`2.6 #6 L86 L91 L195 ${report.name}, on the shipped presets: each mode line names the contract it declares (sorbet light and dark: "all 193 pairings pass${REPORT_MARGIN[i] ? " (tightest margin ×1.02)" : ""} — legibility; 68 rules not held"), and the last line is "✓ every declared contract holds for every preset in both modes (946 pairings measured): wcag-aa × 8, legibility × 2"`, () => {
      const run = runOn("shipped", report);
      assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
      const said = readReport(run.stdout);
      assert.deepEqual(said.map((p) => `${p.preset}/${p.mode}`), [...RECORDED_LINES.keys()]);
      for (const p of said) {
        const want = DECLARED[p.preset]![p.mode] === "legibility" ? `all ${HELD_BY_LEGIBILITY} pairings pass (tightest margin ×1.02) — legibility; ${APPLYING - HELD_BY_LEGIBILITY} rules not held` : RECORDED_LINES.get(`${p.preset}/${p.mode}`)!;
        assert.equal(p.summary, REPORT_MARGIN[i] ? want : withoutMargin(want), `${p.preset}/${p.mode}`);
        assert.deepEqual([p.rows, p.notes], [[], []]);
      }
      const dark = said.find((p) => p.preset === "sorbet" && p.mode === "dark");
      assert.equal(dark?.summary, REPORT_MARGIN[i] ? "all 193 pairings pass (tightest margin ×1.02) — legibility; 68 rules not held" : "all 193 pairings pass — legibility; 68 rules not held", "sorbet dark, as acceptance #6 gives it");
      assert.equal(run.stdout.trimEnd().split("\n").at(-1), "✓ every declared contract holds for every preset in both modes (946 pairings measured): wcag-aa × 8, legibility × 2");
    });

    test(`L196 (a) L86 L91 ${report.name}, with sorbet as step 2.2 left it (legibility in light, wcag-aa in dark): sorbet's lines are each its own contract's, and the last line counts the preset-modes, "(823 pairings measured): wcag-aa × 9, legibility × 1"`, () => {
      const run = runOn("as-step-2-2", report);
      assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
      const said = readReport(run.stdout);
      const want = (p: Reported) => (p.preset === "sorbet" && p.mode === "light" ? `all ${HELD_BY_LEGIBILITY} pairings pass (tightest margin ×1.02) — legibility; ${APPLYING - HELD_BY_LEGIBILITY} rules not held` : RECORDED_LINES.get(`${p.preset}/${p.mode}`)!);
      for (const p of said) {
        assert.equal(p.summary, REPORT_MARGIN[i] ? want(p) : withoutMargin(want(p)), `${p.preset}/${p.mode}`);
      }
      assert.equal(said.length, 10, "five presets, two modes");
      assert.equal(run.stdout.trimEnd().split("\n").at(-1), "✓ every declared contract holds for every preset in both modes (823 pairings measured): wcag-aa × 9, legibility × 1");
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
    // Step 2.6's acceptance #6, L195 (c) row 53: the gates' line, with no count.
    test(`2.6 #6 L87 L195 ${gate.name}, on the shipped presets: "✓ every preset holds the contract it declares: wcag-aa × 8, legibility × 2"`, () => {
      const run = runOn("shipped", gate);
      assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
      assert.ok(run.stdout.split("\n").includes("✓ every preset holds the contract it declares: wcag-aa × 8, legibility × 2"), run.stdout);
    });

    test(`L196 (a) L87 ${gate.name}, with sorbet as step 2.2 left it: "✓ every preset holds the contract it declares: wcag-aa × 9, legibility × 1"`, () => {
      const run = runOn("as-step-2-2", gate);
      assert.ok(run.stdout.split("\n").includes("✓ every preset holds the contract it declares: wcag-aa × 9, legibility × 1"), `${run.stdout}\n${run.stderr}`);
      assert.doesNotMatch(run.stderr, /contrast failure|structure failure|TypeError/, run.stderr);
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

  test("L194 (f) the five report surfaces end with process.exitCode, never process.exit(): exit() drops what is still queued for a pipe, so a failing report read through one (as every test above reads it) lost its tail at random", () => {
    const surfaces: [string, string][] = [
      [join(pkgRoot, "tools", "check-contrast.ts"), "check-contrast.ts"],
      [join(pkgRoot, "tools", "build-tokens.ts"), "build-tokens.ts"],
      [join(cliRoot, "scaffold", "tools", "check-contrast.ts"), "the scaffold's check-contrast.ts"],
      [join(cliRoot, "scaffold", "tools", "build-tokens.ts"), "the scaffold's build-tokens.ts"],
    ];
    for (const [file, name] of surfaces) {
      assert.doesNotMatch(code(file), /process\.exit\(/, `${name} calls process.exit()`);
    }
    // The CLI's other commands fail with one short line through fail(); `sorbet contrast` prints the whole report.
    const cli = code(join(cliRoot, "src", "index.ts"));
    const contrast = /\nasync function cmdContrast\(\)[^\n]*\n([\s\S]*?)\n\}\n/.exec(cli);
    assert.ok(contrast, "sorbet contrast's command function, cmdContrast, is found");
    assert.doesNotMatch(contrast[1]!, /process\.exit\(|\bfail\(/, "sorbet contrast calls process.exit() or fail()");
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
    // From step 2.2 sorbet, the first theme, defines every optional token: take field-fill out of it, so only the planted
    // theme can make the name legal.
    const withoutSorbets = "\n// test-contracts.ts: L100, in a temporary copy.\nfor (const mode of [\"light\", \"dark\"] as const) {\n  delete (presets.sorbet.colors[mode] as Record<string, string>)[\"field-fill\"];\n}\n";
    const none = node(["tools/build-tokens.ts"], tree("l100-none", withoutSorbets));
    assert.ok(flagged(none.stderr), `the probe is unsound: a name no theme emits was not flagged:\n${none.stderr}`);
    const second = node(["tools/build-tokens.ts"], tree("l100-second", `${withoutSorbets}(presets.ocean.colors.light as Record<string, string>)["field-fill"] = "#ffffff";\n`));
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
    "structure-only-light": { colors: { light: VALUES.colors.light, dark: KNOWN_BAD.colors.dark }, edges: { light: VALUES.edges.light }, buttonLabel: { ...VALUES.buttonLabel, px: 14 }, contract: { light: LEG, dark: WCAG } },
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

  // ══ PR 2, step 2.2: sorbet light (L101) — tests first for the values ═══════════════════════════════════════
  // Every expected value is the spec's: §3 and §5.2 from legibility-values.json, e24df74's sorbet from the recorded
  // fixtures (sorbet-as-shipped.json, goldens.at-e24df74.json), the rest typed in from L19, L20, L21, L97 and L105.
  const GOLDENS = json("goldens.at-e24df74.json") as { recordedFrom: string; sorbet: string; frozenSha256: Record<string, string> };
  const sorbetNow = () => shipped.sorbet! as unknown as Preset & { edges?: Partial<Record<Mode, Edges>>; buttonLabel?: unknown; shadowTint?: unknown };

  test("2.2 L12 L14 L15 presets.sorbet.colors.light is §3's light record, key for key and in order: the 69 roles in SEMANTIC_COLOR_NAMES order, then the 20 optional tokens in L15's", () => {
    assert.deepEqual(Object.entries(sorbetNow().colors.light), Object.entries(VALUES.colors.light));
  });

  // L195 (c) row 54 (step 2.6): this said the dark edges were undefined, waiting for step 2.6; they are L45's dark table
  // (step 2.6's acceptance #1), and the light half is unchanged.
  test("2.2 L45 L101 L195 presets.sorbet.edges is L45's: the light table, and from step 2.6 the dark table, each element for element in EdgeElement order", () => {
    const edges = sorbetNow().edges;
    assert.ok(edges !== undefined && edges.light !== undefined, "sorbet has no light edges");
    assert.deepEqual(Object.keys(edges.light), ELEMENTS);
    assert.deepEqual(JSON.parse(JSON.stringify(edges.light)), VALUES.edges.light);
    assert.ok(edges.dark !== undefined, "sorbet has no dark edges: step 2.6 writes L45's dark table");
    assert.deepEqual(Object.keys(edges.dark), ELEMENTS);
    assert.deepEqual(JSON.parse(JSON.stringify(edges.dark)), VALUES.edges.dark);
  });

  test("2.2 L19 L20 L21 sorbet's buttonLabel is { px: 16, smallPx: 14, weight: 600 }, its shadowTint the caramel #a16e32, and its tagline is rewritten to name lilac first and no blossom pink", () => {
    const sorbet = sorbetNow();
    assert.deepEqual(sorbet.buttonLabel, { px: 16, smallPx: 14, weight: 600 }, "L19");
    assert.equal(sorbet.shadowTint, "#a16e32", "L20");
    const before = GOLDENS.sorbet.split("\n")[0]!.split("sorbet — ")[1]!;
    const tagline = String(sorbet.tagline);
    assert.notEqual(tagline, before, "L21: the tagline is rewritten in step 2.2");
    const lower = tagline.toLowerCase();
    const lilac = lower.indexOf("lilac");
    assert.ok(lilac >= 0, `L21: the tagline does not name lilac: ${tagline}`);
    for (const word of ["blush", "butter", "robin", "cream", "milk", "cocoa", "caramel", "pink", "blue", "yellow", "purple", "lavender"]) {
      const at = lower.indexOf(word);
      assert.ok(at === -1 || at > lilac, `L21: "${word}" comes before lilac: ${tagline}`);
    }
    assert.ok(!lower.includes("blossom"), `L21: the tagline names blossom pink, the old secondary: ${tagline}`);
  });

  // Step 2.6 (§12 "2.6", L195 (c) row 55): "2.2 L101 L3 sorbet's dark record is still buildMode's" is retired, replaced
  // by acceptance #1. The expected values are §3's dark record and L45's dark table from legibility-values.json, as
  // acceptance #1 allows (revision 3.7's transcription, with L195 (a)'s two alphas).
  test("2.6 #1 L12 L14 L15 L45 L195 presets.sorbet.colors.dark is §3's dark record, key for key and in order — the 69 roles in SEMANTIC_COLOR_NAMES order, then the 20 optional tokens in L15's — and presets.sorbet.edges.dark is L45's dark table, element for element in EdgeElement order", () => {
    assert.deepEqual(Object.keys(VALUES.colors.dark), [...SEMANTIC_COLOR_NAMES, ...VALUES.seams.map((seam) => seam.name)], "the transcription's dark record is not in L14's order");
    assert.deepEqual(Object.entries(sorbetNow().colors.dark), Object.entries(VALUES.colors.dark), "sorbet's dark record is not §3's, key for key and in order");
    const dark = sorbetNow().edges?.dark;
    assert.ok(dark !== undefined, "sorbet has no dark edges");
    assert.deepEqual(Object.keys(dark), ELEMENTS);
    assert.deepEqual(JSON.parse(JSON.stringify(dark)), VALUES.edges.dark);
  });

  test("2.2 sorbet light passes legibility: its 193 measurements, through measurePreset, are the two scrim ratios and appendix A's 191, each in its view; every one holds; and none of the six checks fails", () => {
    const pairs = api("measurePreset")(shipped.sorbet!, "light") as Measured[];
    assert.deepEqual(pairs.map((pair) => [pair.fg, pair.bg, pair.tier]), LEGIBILITY_ORDER.map((rule) => [rule.fg, rule.bg, rule.tier]));
    pairs.forEach((pair, i) => {
      if (i < 2) {
        assert.ok(near(pair.actual, SCRIM_RATIO[pair.fg]!, 1e-4) && pair.view === "typical", `${pair.fg} on scrim: ${pair.actual}`);
      } else {
        const rule = APPENDIX.rules[i - 2]!;
        assert.ok(near(pair.actual, rule.light.actual, 0.01) && pair.view === rule.light.view, `${rule.n}: ${pair.actual} (${pair.view}), and appendix A says ${rule.light.actual} (${rule.light.view})`);
      }
      assert.equal(pair.holds, true, `${pair.fg} on ${pair.bg}`);
    });
    assert.deepEqual(checkPreset(shipped.sorbet!), [], "the gate");
    assert.deepEqual(structureOf(shipped.sorbet!), [], "the six checks");
  });

  // L195 (c) row 56: "2.2 L3 sorbet dark still passes wcag-aa" is retired, replaced by this test. (The new dark record
  // also holds wcag-aa, 70 of 70, but nothing declares it.) The form of step 2.2's light test.
  test("2.6 #2 L58 L61 L195 sorbet dark passes legibility: its 193 measurements, through measurePreset, are the two scrim ratios (5.5562 and 4.6844 to 1e-4, typical) and appendix A's 191 dark figures, each to 0.01 in the view it states; every one holds; and none of the six checks fails", () => {
    const pairs = api("measurePreset")(shipped.sorbet!, "dark") as Measured[];
    assert.equal(pairs.length, HELD_BY_LEGIBILITY, `sorbet dark: ${pairs.length} measurements, not legibility's 193`);
    assert.deepEqual(pairs.map((pair) => [pair.fg, pair.bg, pair.tier]), LEGIBILITY_ORDER.map((rule) => [rule.fg, rule.bg, rule.tier]));
    pairs.forEach((pair, i) => {
      const tier = LEGIBILITY_ORDER[i]!.tier;
      assert.deepEqual([pair.metric, pair.min], [LEG_FLOOR.get(tier)!.metric, floorIn(tier, "dark")], `${pair.fg} on ${pair.bg}: metric and L61's dark floor`);
      if (i < 2) {
        assert.ok(near(pair.actual, SCRIM_RATIO[pair.fg]!, 1e-4) && pair.view === "typical", `${pair.fg} on scrim: ${pair.actual} (${pair.view})`);
      } else {
        const rule = APPENDIX.rules[i - 2]!;
        assert.ok(near(pair.actual, rule.dark.actual, 0.01) && pair.view === rule.dark.view, `${rule.n} dark: ${pair.actual} (${pair.view}), and appendix A says ${rule.dark.actual} (${rule.dark.view})`);
      }
      assert.equal(pair.holds, true, `${pair.fg} on ${pair.bg}`);
    });
    assert.deepEqual(checkPreset(shipped.sorbet!), [], "the gate");
    assert.deepEqual(structureOf(shipped.sorbet!), [], "the six checks");
  });

  test("2.2 L105 (step 2.2) why #24 to #38 move off sorbet light: under wcag-aa, §3's light record fails exactly seven pairs, as the spec measures them", () => {
    const failing = measureColors("light", VALUES.colors.light, WCAG).filter((pair) => !pair.holds).map((pair) => [`${pair.fg} on ${pair.bg}`, Number(pair.actual!.toFixed(2))]);
    assert.deepEqual(failing.sort(), [
      ["border-strong on bg", 2.34], ["border-strong on surface", 2.48], ["primary-solid on bg", 2.34], ["primary-solid on surface", 2.48],
      ["secondary-solid on bg", 2.30], ["accent-solid on bg", 1.85], ["chart-6 on bg", 2.99],
    ].sort());
  });

  /** L97: sorbet's step-2.2 golden, built from e24df74's and the spec — below line 1, which carries the free tagline. */
  function expectedGolden22(): string {
    const out: string[] = [];
    let block: "none" | "light" | "dark" = "none";
    let replacing = false;
    for (const line of GOLDENS.sorbet.split("\n")) {
      const t = line.trim();
      if (/\{\s*$/.test(line) && !t.startsWith("@media")) {
        block = out.some((done) => done.startsWith(":root {")) ? "dark" : "light";
        out.push(line);
        continue;
      }
      if (t === "}" && block !== "none") {
        block = "none";
        out.push(line);
        continue;
      }
      if (block === "light" && t.startsWith("--sb-bg:")) {
        // L14, L16: the 89 colour tokens, in record order.
        replacing = true;
        out.push(...colourLines(VALUES.colors.light).map((decl) => `  ${decl}`));
      }
      if (replacing) {
        if (!t.startsWith("--sb-shadow-xs")) {
          continue;
        }
        replacing = false;
      }
      if (block === "light" && t.startsWith("--sb-shadow-")) {
        // L20: the five shadow lines tinted with the caramel #a16e32 (161 110 50), where e24df74's tint is #26231f.
        out.push(line.replaceAll("rgb(38 35 31 / ", "rgb(161 110 50 / "));
        if (t.startsWith("--sb-shadow-xl")) {
          // L19, then L53: the two button sizes, then the 21 edge lines.
          // L151 (revision 3.5): then the halo room.
          out.push("  --sb-button-font-size: 1rem;", "  --sb-button-font-size-sm: 0.875rem;", ...edgeLines(VALUES.edges.light).map((decl) => `  ${decl}`), `  ${haloLine(VALUES.edges.light)}`);
        }
        continue;
      }
      out.push(line);
      if (block === "dark" && t.startsWith("--sb-shadow-xl")) {
        // L55: the 42 resets (41 until L151 added the halo room), after everything else, in the light block's order.
        const indent = /^\s*/.exec(line)![0];
        out.push(...[...VALUES.seams.map((seam) => `--sb-${seam.name}: initial;`), ...edgeLines(VALUES.edges.light).map((decl) => `${decl.slice(0, decl.indexOf(":"))}: initial;`), "--sb-halo-room: initial;"].map((decl) => indent + decl));
      }
    }
    return out.join("\n");
  }

  /**
   * Step 2.6's acceptance #5 (L97's 2.6 row, L98, L195 (b)): step 2.2's golden as expectedGolden22 builds it, with each
   * dark block's lines replaced by, in the light block's order, `color-scheme: dark;`, the 69 roles and the 20 optional
   * tokens with §3's dark values, the five shadow lines unchanged, L45's 21 dark edge lines and `--sb-halo-room: 20px;` (L197; 3px before).
   */
  function expectedGolden26(): string {
    assert.deepEqual(Object.keys(VALUES.colors.dark), Object.keys(VALUES.colors.light), "the dark record's keys are not in the light block's order");
    const out: string[] = [];
    let inDark = false;
    let indent = "";
    let shadows: string[] = [];
    for (const line of expectedGolden22().split("\n")) {
      const t = line.trim();
      if (t === "color-scheme: dark;") {
        inDark = true;
        indent = /^\s*/.exec(line)![0];
        shadows = [];
        continue;
      }
      if (inDark && t === "}") {
        assert.equal(shadows.length, 5, "the five shadow lines of a dark block");
        out.push(...["color-scheme: dark;", ...colourLines(VALUES.colors.dark), ...shadows, ...edgeLines(VALUES.edges.dark), "--sb-halo-room: 20px;"].map((decl) => indent + decl));
        inDark = false;
        out.push(line);
        continue;
      }
      if (inDark) {
        // The five shadow lines are kept as they are; everything else in the block is replaced.
        if (t.startsWith("--sb-shadow-")) {
          shadows.push(t);
        }
        continue;
      }
      out.push(line);
    }
    return out.join("\n");
  }
  /** A file's line count, as `wc -l` gives it (L195 (b): "375 lines to 377"). */
  const lineCount = (text: string) => text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
  /**
   * L195 (d): a theme file's light block, the run of declarations from `color-scheme: light;` to the end of :root (the
   * fonts and radii above it hold in both modes), and its two dark blocks, each from `color-scheme: dark;` to its end.
   */
  function modeBlocks(css: string): { light: string[]; dark: string[][] } {
    const lines = css.split("\n").map((line) => line.trim());
    const from = (text: string) => lines.flatMap((line, i) => (line === text ? [i] : []));
    const run = (start: number) => {
      const end = lines.indexOf("}", start);
      assert.ok(end > start, `the block from line ${start + 1} does not end`);
      return lines.slice(start, end).filter((line) => line !== "");
    };
    const light = from("color-scheme: light;");
    const dark = from("color-scheme: dark;");
    assert.equal(light.length, 1, "one color-scheme: light; line");
    assert.equal(dark.length, 2, "two color-scheme: dark; lines");
    return { light: run(light[0]!), dark: dark.map(run) };
  }
  /** A block's --sb- declarations, as [name, value]. */
  const declsOf = (block: string[]) => block.filter((line) => line.startsWith("--sb-")).map((line) => [line.slice(0, line.indexOf(":")), line.slice(line.indexOf(":") + 1).trim().replace(/;$/, "")] as const);
  const sorbetFiles = () => [["tools/golden/sorbet.css", readFileSync(join(pkgRoot, "tools", "golden", "sorbet.css"), "utf8")], ["themeCss(presets.sorbet)", themeCss(shipped.sorbet!)]] as const;

  // L195 (c) row 57: this test expected the 42 resets at the end of each dark block (step 2.2's golden); it expects the
  // golden of step 2.6's acceptance #5: step 2.2's light block as expectedGolden22 states it, and each dark block as
  // acceptance #5 gives it.
  test("2.6 #5 L97 L98 L55 L151 L195 sorbet's golden is step 2.2's changed only inside the two dark blocks: each is, in the light block's order, color-scheme: dark;, the 69 roles, the 20 optional tokens, the five shadow lines unchanged, the 21 edge lines and --sb-halo-room: 3px; — 117 lines, where step 2.2's was 116; the file is 377 lines, where it was 375; and the four frozen goldens are unchanged", () => {
    assert.equal(GOLDENS.recordedFrom, "e24df74");
    const text = readFileSync(join(pkgRoot, "tools", "golden", "sorbet.css"), "utf8");
    const golden = text.split("\n");
    const was = expectedGolden22();
    const [first, ...rest] = expectedGolden26().split("\n");
    assert.equal(first, was.split("\n")[0], "line 1 is step 2.2's expectation's");
    assert.equal(golden[0], `/* Sorbet DS theme: sorbet — ${shipped.sorbet!.tagline}`, "line 1 is the header with the preset's own tagline");
    // The expectation itself: step 2.2's dark blocks were 116 lines (color-scheme, buildMode's 68 roles, five shadows,
    // 42 initial lines), and the file 375 lines.
    assert.deepEqual(modeBlocks(was).dark.map((block) => block.length), [116, 116], "step 2.2's dark blocks");
    assert.equal(lineCount(was), 375, "step 2.2's golden");
    assert.deepEqual(golden.slice(1), rest, "below line 1, sorbet's golden is not step 2.2's with each dark block as step 2.6's acceptance #5 gives it");
    assert.deepEqual(modeBlocks(text).dark.map((block) => block.length), [117, 117], "117 lines in each dark block");
    assert.equal(lineCount(text), 377, "the file is 377 lines");
    assert.equal(golden.filter((line) => line.endsWith(": initial;")).length, 0, "no reset is left");
    for (const [name, sha256] of Object.entries(GOLDENS.frozenSha256)) {
      assert.equal(createHash("sha256").update(readFileSync(join(pkgRoot, "tools", "golden", `${name}.css`), "utf8")).digest("hex"), sha256, `${name}: a frozen golden changed`);
    }
  });

  test("2.2 L4 L98 the four frozen goldens are byte for byte what e24df74 has", () => {
    for (const [name, sha256] of Object.entries(GOLDENS.frozenSha256)) {
      assert.equal(createHash("sha256").update(readFileSync(join(pkgRoot, "tools", "golden", `${name}.css`), "utf8")).digest("hex"), sha256, name);
    }
    assert.deepEqual(Object.keys(GOLDENS.frozenSha256), ["ocean", "forest", "noir", "midnight"]);
  });

  // ══ PR 2, step 2.6: sorbet dark (§12 "2.6", L195) — the theme file ═════════════════════════════════════════
  // Acceptance #1, #2 and #5 are above, in place of the step-2.2 tests L195 (c) retires or rewrites; #6 is with the
  // reports. Each is read both off the golden and off what themeCss emits for the shipped sorbet (M6.9 holds them equal).
  test("2.6 #3 L160 L19 L195 no name is left to leak: every --sb- name sorbet's light block declares (from color-scheme: light; to the end of :root), but --sb-button-font-size and -sm, is declared in each of the two dark blocks with a value that is not initial — 116 names each; no initial anywhere in the file; --sb-danger-active: #f9c3c6 in both dark blocks", () => {
    for (const [what, css] of sorbetFiles()) {
      const { light, dark } = modeBlocks(css);
      const names = declsOf(light).map(([name]) => name).filter((name) => name !== "--sb-button-font-size" && name !== "--sb-button-font-size-sm");
      assert.equal(names.length, 116, `${what}: the light block's names, but the two button sizes`);
      assert.equal(new Set(names).size, 116, `${what}: a name declared twice in the light block`);
      dark.forEach((block, i) => {
        const where = `${what}, dark block ${i + 1}`;
        const decls = declsOf(block);
        const values = new Map(decls);
        assert.deepEqual(names.filter((name) => !values.has(name)), [], `${where}: names the light block declares and this block does not`);
        assert.deepEqual(names.filter((name) => values.get(name) === "initial"), [], `${where}: names whose value is initial`);
        assert.equal(decls.length, 116, `${where}: 116 names`);
        assert.equal(values.size, 116, `${where}: 116 distinct names`);
        assert.equal(values.get("--sb-danger-active"), "#f9c3c6", `${where}: --sb-danger-active`);
      });
      assert.doesNotMatch(css, /\binitial\b/, `${what}: an initial is left in the file`);
    }
  });

  test("L196 (a) L86 L87 declaredContracts counts preset-modes, each mode's own declaration: a preset declaring legibility in light and wcag-aa in dark counts once for each, and contracts are listed in the order of contracts", () => {
    const declared = api("declaredContracts") as (all: Iterable<Preset>) => string;
    const mixed = { ...shipped.sorbet!, contract: { light: LEG, dark: WCAG } } as Preset;
    const flipped = { ...shipped.sorbet!, contract: { light: WCAG, dark: LEG } } as Preset;
    assert.equal(declared([mixed]), "wcag-aa × 1, legibility × 1");
    assert.equal(declared([flipped]), "wcag-aa × 1, legibility × 1");
    assert.equal(declared([mixed, flipped, shipped.ocean!]), "wcag-aa × 4, legibility × 2");
    assert.equal(declared([shipped.sorbet!]), "legibility × 2");
    assert.equal(declared(Object.values(shipped)), "wcag-aa × 8, legibility × 2");
  });

  test("L196 (b) L85 §10 the known-bad fixture is unchanged: its colour record, both modes, is e24df74's sorbet as that commit's golden emits it, entry for entry", () => {
    assert.equal(GOLDENS.recordedFrom, "e24df74");
    const block = (selector: string) => {
      const from = GOLDENS.sorbet.indexOf(`${selector} {`);
      assert.ok(from !== -1, `e24df74's sorbet golden has no ${selector} block`);
      const body = GOLDENS.sorbet.slice(from, GOLDENS.sorbet.indexOf("\n}", from));
      return new Map([...body.matchAll(/--sb-([\w-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]));
    };
    for (const [mode, selector] of [["light", ":root"], ["dark", "[data-theme=\"dark\"]"]] as const) {
      const emitted = block(selector);
      const entries = Object.entries(KNOWN_BAD.colors[mode]);
      assert.ok(entries.length >= 68, `${mode}: ${entries.length} entries`);
      assert.deepEqual(entries.filter(([name, value]) => emitted.get(name) !== value).map(([name, value]) => `${name}: ${value}, golden ${emitted.get(name) ?? "nothing"}`), [], mode);
    }
  });

  test("L196 (c) L195 (f) the colour-vision gate reads what sorbet emits: chartColors(chartThemes.sorbet, mode) is chart-1 to chart-8 of presets.sorbet.colors[mode], in both modes", () => {
    for (const mode of MODES) {
      const record = shipped.sorbet!.colors[mode] as Record<string, string>;
      assert.deepEqual(tokens.chartColors(tokens.chartThemes.sorbet!, mode), Array.from({ length: 8 }, (_, n) => record[`chart-${n + 1}`]), mode);
    }
  });

  test("2.6 #4 L151 L98 L195 L197 --sb-halo-room reads 20px in each dark block, as its last line, after the edge lines (the filled buttons' hover glow, 0 0 20px -1px, 19, plus their rise, 1; 3px before L197 counted the glows)", () => {
    for (const [what, css] of sorbetFiles()) {
      modeBlocks(css).dark.forEach((block, i) => {
        const where = `${what}, dark block ${i + 1}`;
        assert.equal(block.at(-1), "--sb-halo-room: 20px;", `${where}: its last line`);
        assert.ok(block.at(-2)?.startsWith("--sb-edge-"), `${where}: the line before the halo room is not an edge line: ${block.at(-2)}`);
        assert.equal(block.filter((line) => line.startsWith("--sb-halo-room:")).length, 1, `${where}: one halo room`);
      });
    }
  });

  // ══ PR 2, step 2.3: the Sass accessors (L71) — tests first for the one silent part ═══════════════════════
  // `seam($name)` returns var(--sb-<name>, <fallback>) with the fallback from $seams; `edge($element, $fallback)`
  // validates the element against the generated list and returns its custom property with the site's fallback. An
  // unknown name is a compile error, as it is for clr(). A function Sass does not know is passed through to the CSS
  // as text, so a missing or misspelt accessor is silent: these probes compile against src/styles with the repo's sass.
  const sass = createRequire(join(repoRoot, "package.json"))("sass") as { compile: (path: string, options: { loadPaths: string[]; style: "expanded" }) => { css: string } };
  const probeDir = join(tmp, "sass-probes");
  mkdirSync(probeDir, { recursive: true });
  let probes = 0;
  /** Compile one probe partial that uses the abstracts, as every library partial does; the declarations of `.p`, or the error. */
  function compileProbe(body: string): { decls: Record<string, string> } | { error: string } {
    const file = join(probeDir, `probe-${probes++}.scss`);
    writeFileSync(file, `@use "abstracts" as *;\n.p {\n${body}\n}\n`);
    try {
      const { css } = sass.compile(file, { loadPaths: [join(pkgRoot, "src", "styles")], style: "expanded" });
      const decls = Object.fromEntries([...css.matchAll(/^\s+([\w-]+):\s*(.*);$/gm)].map((m) => [m[1]!, m[2]!.replace(/\s+/g, " ").trim()]));
      return { decls };
    } catch(error) {
      return { error: String((error as Error).message) };
    }
  }
  const compiled = (body: string, what: string) => {
    const out = compileProbe(body);
    assert.ok("decls" in out, `${what}: the probe did not compile: ${"error" in out ? out.error.split("\n")[0] : ""}`);
    return out.decls;
  };
  /** It fails the compile, and the error names the bad name — not some other mistake in the probe. */
  const refusedByCompile = (body: string, name: string, what: string) => {
    const out = compileProbe(body);
    assert.ok("error" in out, `${what}: it compiled, to ${"decls" in out ? shown(out.decls) : ""} — an unknown name must fail the Sass compile (L71)`);
    assert.ok(out.error.includes(name), `${what}: the compile failed, but not by naming ${name}: ${out.error.split("\n")[0]}`);
  };

  test("2.3 (probe) the probe harness compiles a partial against src/styles with the repo's sass, and an unknown clr() name fails it by name — the behaviour L71 says seam() shares", () => {
    assert.deepEqual(compiled("  color: clr(surface);", "clr(surface)"), { color: "var(--sb-surface)" });
    refusedByCompile("  color: clr(surfce);", "surfce", "clr(surfce)");
  });

  test("2.3 L71 L37 seam(<name>) compiles, for each of L15's 20 optional tokens, to var(--sb-<name>, <fallback>): a role's fallback as var(--sb-<role>), a css fallback as written", () => {
    for (const seam of VALUES.seams) {
      const fallback = "fallback" in seam.fallback ? `var(--sb-${seam.fallback.fallback})` : seam.fallback.css;
      assert.deepEqual(compiled(`  color: seam(${seam.name});`, `seam(${seam.name})`), { color: `var(--sb-${seam.name}, ${fallback})`.replace(/\s+/g, " ") }, `seam(${seam.name})`);
    }
  });

  test("2.3 L71 seam() with a name that is not in $seams fails the Sass compile, naming it — a role and a misspelling included", () => {
    assert.deepEqual(compiled("  color: seam(field-fill);", "seam(field-fill)"), { color: "var(--sb-field-fill, var(--sb-surface))" }, "the probe is sound: a known name compiles");
    for (const name of ["nope", "feild-fill", "field-fil", "Field-fill", "surface", "text", "edge-container", "filled-success-mark"]) {
      refusedByCompile(`  color: seam(${name});`, name, `seam(${name})`);
    }
  });

  test("2.3 L71 edge(<element>, <fallback>) compiles, for each of the 13 elements, to var(--sb-edge-<element>, <fallback>), the fallback being the site's own declaration", () => {
    for (const element of ELEMENTS) {
      for (const fallback of ["none", "0 1px 3px rgb(38 35 31 / 0.09), 0 1px 2px rgb(38 35 31 / 0.05)"]) {
        // A comma list is one argument only in parentheses, as a call site passing shadow(sm) passes one value.
        const decls = compiled(`  box-shadow: (${fallback});\n  outline: edge(${element}, (${fallback}));`, `edge(${element}, ${fallback})`);
        // The site's declaration as Sass writes it (it may respell a colour), then the same text inside the var().
        assert.equal(decls.outline, `var(--sb-edge-${element}, ${decls["box-shadow"]})`, `edge(${element}, ${fallback})`);
      }
    }
  });

  test("2.3 L71 L123 edge() with a name that is not one of the 13 elements in $edge-elements fails the Sass compile, naming it — the three withdrawn filled-X included", () => {
    assert.ok(compiled("  outline: edge(container, none);", "edge(container, none)").outline === "var(--sb-edge-container, none)", "the probe is sound: a known element compiles");
    for (const name of ["filled-success", "filled-warning", "filled-info", "card", "Container", "containers", "field-fill", "nope"]) {
      refusedByCompile(`  outline: edge(${name}, none);`, name, `edge(${name}, none)`);
    }
  });

  const FILLED = ELEMENTS.filter((element) => element.startsWith("filled-"));

  test("2.3 L143 edge($element, $fallback, $state): rest is the default and allowed on all 13; hover and press on the four filled-* elements compile to var(--sb-edge-<element>-<state>, <fallback>) — positional or by keyword", () => {
    assert.equal(FILLED.length, 4);
    for (const element of ELEMENTS) {
      const decls = compiled(`  outline: edge(${element}, none, rest);\n  box-shadow: edge(${element}, none, $state: rest);`, `edge(${element}, none, rest)`);
      assert.deepEqual([decls.outline, decls["box-shadow"]], [`var(--sb-edge-${element}, none)`, `var(--sb-edge-${element}, none)`], `edge(${element}, none, rest)`);
    }
    for (const element of FILLED) {
      for (const state of ["hover", "press"]) {
        const decls = compiled(`  box-shadow: (0 1px 3px rgb(38 35 31 / 0.09), 0 1px 2px rgb(38 35 31 / 0.05));\n  outline: edge(${element}, (0 1px 3px rgb(38 35 31 / 0.09), 0 1px 2px rgb(38 35 31 / 0.05)), ${state});\n  text-shadow: edge(${element}, none, $state: ${state});`, `edge(${element}, …, ${state})`);
        assert.equal(decls.outline, `var(--sb-edge-${element}-${state}, ${decls["box-shadow"]})`, `edge(${element}, …, ${state})`);
        assert.equal(decls["text-shadow"], `var(--sb-edge-${element}-${state}, none)`, `edge(${element}, none, $state: ${state})`);
      }
    }
  });

  test("2.3 L143 edge() refuses a state other than rest, hover and press, or hover and press on an element that is not filled-*, naming both; and a state written into the element's name", () => {
    assert.equal(compiled("  outline: edge(filled-primary, none, hover);", "edge(filled-primary, none, hover)").outline, "var(--sb-edge-filled-primary-hover, none)", "the probe is sound: a filled element's hover compiles");
    for (const state of ["hovered", "pressed", "active", "focus", "Hover", "disabled"]) {
      for (const element of ["filled-primary", "filled-danger"]) {
        refusedByCompile(`  outline: edge(${element}, none, ${state});`, state, `edge(${element}, none, ${state})`);
        refusedByCompile(`  outline: edge(${element}, none, ${state});`, element, `edge(${element}, none, ${state}): the error names the element too`);
      }
    }
    for (const element of ELEMENTS.filter((name) => !name.startsWith("filled-"))) {
      for (const state of ["hover", "press"]) {
        refusedByCompile(`  outline: edge(${element}, none, ${state});`, element, `edge(${element}, none, ${state})`);
        refusedByCompile(`  outline: edge(${element}, none, ${state});`, state, `edge(${element}, none, ${state}): the error names the state too`);
      }
    }
    for (const name of ["filled-primary-hover", "filled-danger-press", "filled-accent-rest", "container-hover"]) {
      refusedByCompile(`  outline: edge(${name}, none);`, name, `edge(${name}, none): a state is never part of the element's name`);
    }
  });

  test("2.3 L145 a quoted name is the same name: seam(\"…\") and edge(\"…\", …, \"…\") compile exactly as unquoted, and a quoted unknown name still fails", () => {
    for (const seam of VALUES.seams) {
      assert.deepEqual(compiled(`  color: seam("${seam.name}");`, `seam("${seam.name}")`), compiled(`  color: seam(${seam.name});`, `seam(${seam.name})`), `seam("${seam.name}")`);
    }
    for (const element of ELEMENTS) {
      assert.deepEqual(compiled(`  outline: edge("${element}", none);`, `edge("${element}", none)`), compiled(`  outline: edge(${element}, none);`, `edge(${element}, none)`), `edge("${element}", none)`);
    }
    for (const element of FILLED) {
      assert.deepEqual(compiled(`  outline: edge("${element}", none, "press");`, `edge("${element}", none, "press")`), { outline: `var(--sb-edge-${element}-press, none)` }, `edge("${element}", none, "press")`);
    }
    refusedByCompile("  color: seam(\"feild-fill\");", "feild-fill", "seam(\"feild-fill\")");
    refusedByCompile("  outline: edge(\"filled-success\", none);", "filled-success", "edge(\"filled-success\", none)");
  });

  // ══ PR 2, step 2.4: components by layer (L101) — the parts that can fail silently ═══════════════════════
  // The stylesheet is compiled here, from src/styles/index.scss with the repo's sass, as build:css compiles it; the
  // compiled CSS is read, never the partials (step 2.4's implementation). Acceptance #1 and #2 are the hand-run tools.
  interface CssRule {
    selectors: string[];
    decls: [property: string, value: string][];
    conditional: boolean;
    /** The full cascade layer path: "sb.atoms", or "sb.atoms.where-defined" for a rule in a nested layer. */
    layer: string | null;
    /** The conditional at-rules round it, outermost first ("@media (hover: hover)"), as one string: part of a rule's identity. */
    context: string;
  }
  /** Split at commas outside parentheses and quotes. */
  const splitTop = (text: string) => {
    const parts: string[] = [];
    let depth = 0;
    let quote = "";
    let current = "";
    for (const ch of text) {
      if (quote !== "") {
        quote = ch === quote ? "" : quote;
      } else if (ch === "\"" || ch === "'") {
        quote = ch;
      } else if (ch === "(") {
        depth++;
      } else if (ch === ")") {
        depth--;
      } else if (ch === "," && depth === 0) {
        parts.push(current.trim());
        current = "";
        continue;
      }
      current += ch;
    }
    parts.push(current.trim());
    return parts.filter((part) => part !== "");
  };
  /**
   * A compiled stylesheet read back: every style rule in source order, with whether a conditional at-rule encloses it,
   * its layer path and conditional context, and the @layer order. `@starting-style` and `@scope` are read INTO, as
   * conditional (their rules apply only at an element's first style, or only inside a scope): the library uses
   * @starting-style eleven times, and an opaque one hid a state shadow, an accessor and a `none` from every check
   * here (audit of 7a683fd, guards F5). Declarations inside the at-rules that hold no style rules (@keyframes stops,
   * @font-face, @property) are kept apart, in `otherDecls`, so L161 can still read them (guards F4).
   */
  function readCss(text: string): { rules: CssRule[]; declaredLayers: string[]; layerBlocks: string[]; atRules: string[]; otherDecls: [where: string, property: string, value: string][] } {
    const rules: CssRule[] = [];
    const layerBlocks: string[] = [];
    const atRules: string[] = [];
    const otherDecls: [where: string, property: string, value: string][] = [];
    let declaredLayers: string[] = [];
    type Frame = { rule: CssRule } | { conditional: boolean; layer: string | null; opaque: boolean; prelude: string };
    const stack: Frame[] = [];
    let buffer = "";
    let quote = "";
    let depth = 0;
    const statement = () => {
      const text = buffer.trim();
      buffer = "";
      const top = stack.at(-1);
      if (text === "") {
        return;
      }
      if (top !== undefined && "rule" in top) {
        const colon = text.indexOf(":");
        if (colon > 0) {
          top.rule.decls.push([text.slice(0, colon).trim().toLowerCase(), text.slice(colon + 1).replace(/\s*!important\s*$/i, "").replace(/\s+/g, " ").trim()]);
        }
      } else if (top !== undefined && top.opaque && text.indexOf(":") > 0) {
        const colon = text.indexOf(":");
        otherDecls.push([stack.filter((frame): frame is Exclude<Frame, { rule: CssRule }> => !("rule" in frame)).map((frame) => frame.prelude).join(" "), text.slice(0, colon).trim().toLowerCase(), text.slice(colon + 1).replace(/\s*!important\s*$/i, "").replace(/\s+/g, " ").trim()]);
      } else if (stack.length === 0 && /^@layer\s/.test(text) && declaredLayers.length === 0) {
        declaredLayers = splitTop(text.slice("@layer".length));
      }
    };
    for (const ch of text.replace(/\/\*[\s\S]*?\*\//g, "")) {
      if (quote !== "") {
        buffer += ch;
        quote = ch === quote ? "" : quote;
        continue;
      }
      if (ch === "\"" || ch === "'") {
        quote = ch;
      } else if (ch === "(") {
        depth++;
      } else if (ch === ")") {
        depth--;
      }
      if (depth > 0 || (ch !== ";" && ch !== "{" && ch !== "}")) {
        buffer += ch;
        continue;
      }
      if (ch === ";") {
        statement();
      } else if (ch === "}") {
        statement();
        stack.pop();
      } else {
        const prelude = buffer.trim().replace(/\s+/g, " ");
        buffer = "";
        const frames = stack.filter((frame): frame is Exclude<Frame, { rule: CssRule }> => !("rule" in frame));
        if (prelude.startsWith("@")) {
          atRules.push(prelude);
          const name = /^@([\w-]+)/.exec(prelude)![1]!.toLowerCase();
          const layer = name === "layer" ? prelude.slice("@layer".length).trim() : null;
          if (layer !== null && stack.length === 0) {
            layerBlocks.push(layer);
          }
          const seenInto = ["media", "supports", "container", "layer", "starting-style", "scope"];
          stack.push({ conditional: ["media", "supports", "container", "starting-style", "scope"].includes(name), layer, opaque: frames.some((frame) => frame.opaque) || !seenInto.includes(name), prelude });
        } else if (frames.some((frame) => frame.opaque)) {
          stack.push({ conditional: false, layer: null, opaque: true, prelude }); // a keyframe stop, a font-face: not a style rule
        } else {
          const rule: CssRule = {
            selectors: splitTop(prelude).map((item) => item.replace(/\s+/g, " ")),
            decls: [],
            conditional: frames.some((frame) => frame.conditional),
            layer: frames.some((frame) => frame.layer !== null) ? frames.filter((frame) => frame.layer !== null).map((frame) => frame.layer).join(".") : null,
            context: frames.filter((frame) => frame.conditional).map((frame) => frame.prelude).join(" "),
          };
          rules.push(rule);
          stack.push({ rule });
        }
      }
    }
    return { rules, declaredLayers, layerBlocks, atRules, otherDecls };
  }
  let compiledStylesheet: ReturnType<typeof readCss> | undefined;
  /** The library's stylesheet, compiled now from src/styles/index.scss as build:css compiles it. */
  const stylesheet = () => {
    compiledStylesheet ??= readCss(sass.compile(join(pkgRoot, "src", "styles", "index.scss"), { loadPaths: [join(pkgRoot, "src", "styles")], style: "expanded" }).css);
    return compiledStylesheet;
  };
  /** C11's reading: the rules whose selector list holds `selector` as one whole item, outside conditional at-rules. */
  const rulesOf = (selector: string) => stylesheet().rules.filter((rule) => !rule.conditional && rule.selectors.includes(selector));
  /** The last declaration of any of `properties` among those rules, in source order. */
  const lastOf = (selector: string, properties: string[]) => rulesOf(selector).flatMap((rule) => rule.decls).filter(([property]) => properties.includes(property)).at(-1)?.[1];
  /** C11's selectors, element by element (L79, revision 3.1). `.sb-progress` is the well's track (D1); `.sb-alert` is the info box its default tone paints. */
  const C11_SELECTORS: [element: string, selectors: string[]][] = [
    ["container", [".sb-card"]],
    ["sunken", [".sb-card--sunken", ".sb-progress"]],
    ["floating", [".sb-popover", ".sb-menu", ".sb-combobox__panel", ".sb-calendar", ".sb-color-input__panel", ".sb-toast", ".sb-modal", ".sb-drawer"]],
    ["field", [".sb-input", ".sb-textarea", ".sb-select select", ".sb-number-input", ".sb-combobox__field", ".sb-date-range__control"]],
    ["quiet", [".sb-button--outline"]],
    ["filled-primary", [".sb-button"]],
    ["filled-secondary", [".sb-button--secondary"]],
    ["filled-accent", [".sb-button--accent"]],
    ["filled-danger", [".sb-button--danger"]],
    ["status-info", [".sb-alert", ".sb-alert--info"]],
    ["status-success", [".sb-alert--success"]],
    ["status-warning", [".sb-alert--warning"]],
    ["status-danger", [".sb-alert--danger"]],
  ];
  /** A value that is var(--sb-<name>) or var(--sb-<name>, <fallback>) — clr()'s form or seam()'s. */
  const readsToken = (value: string | undefined, name: string) => value !== undefined && (value === `var(--sb-${name})` || (value.startsWith(`var(--sb-${name}, `) && value.endsWith(")")));

  test("2.4 C11 (reader) the compiled stylesheet's @layer blocks appear in the order its first line declares them, so source order is cascade order", () => {
    const { declaredLayers, layerBlocks, rules } = stylesheet();
    assert.ok(declaredLayers.length > 0, "no @layer order statement");
    assert.deepEqual([...new Set(layerBlocks)], declaredLayers.filter((layer) => layerBlocks.includes(layer)), "the layer blocks are out of the declared order");
    assert.ok(rules.length > 500 && rulesOf(".sb-card").length > 0, `the reader found ${rules.length} rules`);
  });

  test("2.4 C11 L106 each of the 27 selectors paints its element's recipe fill: the last background or background-color in source order, outside conditional at-rules, is var(--sb-<fill>) or var(--sb-<fill>, <fallback>)", () => {
    assert.equal(C11_SELECTORS.flatMap(([, selectors]) => selectors).length, 27);
    // D1 is a rule of §3's record (bg-subtle equals surface-sunken), read off the transcription: sorbet's dark record is
    // buildMode's until step 2.6, where it does not hold (see spec_problems).
    const d1 = MODES.every((mode) => VALUES.colors[mode]["bg-subtle"] === VALUES.colors[mode]["surface-sunken"]);
    assert.ok(d1, "D1 does not hold in §3's record");
    const wrong: string[] = [];
    for (const [element, selectors] of C11_SELECTORS) {
      const fill = VALUES.edges.light[element]!.fill;
      assert.equal(VALUES.edges.dark[element]!.fill, fill, `${element}: one fill in both modes`);
      for (const selector of selectors) {
        const want = selector === ".sb-progress" && d1 ? "bg-subtle" : fill;
        const got = lastOf(selector, ["background", "background-color"]);
        if (!readsToken(got, want)) {
          wrong.push(`${selector} (${element}) paints ${got ?? "nothing"}, not ${want}`);
        }
      }
    }
    assert.deepEqual(wrong, [], "fills the recipe names and the stylesheet does not paint (L106, C11)");
  });

  // legibility-spec.md L183 #50 (C11, L178; verifier N10): the five status selectors were exempt, as step 2.5's; the
  // exemption is lifted, so all 27 read their element's edge, .sb-alert and .sb-alert--info --sb-edge-status-info.
  test("2.4 C11 L70 L178 L183 #50 each of the 27 selectors reads its element's edge property, --sb-edge-<element> — the 22 since step 2.4, the five status boxes since step 2.5 (.sb-alert and .sb-alert--info read --sb-edge-status-info)", () => {
    assert.equal(C11_SELECTORS.flatMap(([, selectors]) => selectors).length, 27);
    assert.deepEqual(C11_SELECTORS.find(([element]) => element === "status-info")?.[1], [".sb-alert", ".sb-alert--info"]);
    const missing: string[] = [];
    for (const [element, selectors] of C11_SELECTORS) {
      const property = new RegExp(`--sb-edge-${element}(?![\\w-])`);
      for (const selector of selectors) {
        if (!rulesOf(selector).some((rule) => rule.decls.some(([, value]) => property.test(value)))) {
          missing.push(`${selector} does not read --sb-edge-${element}`);
        }
      }
    }
    assert.deepEqual(missing, []);
  });

  test("2.4 L113 L70 the 1px lines read their seams: the card's and the floating surfaces' through container-line, the fields' frames through field-line — each with today's colour as its fallback", () => {
    const wrong: string[] = [];
    const lines: [seam: string, fallback: string, selectors: string[]][] = [
      ["container-line", "border-subtle", [".sb-card", ".sb-popover", ".sb-menu", ".sb-combobox__panel", ".sb-calendar", ".sb-color-input__panel", ".sb-toast"]],
      ["field-line", "border-strong", [".sb-input", ".sb-textarea", ".sb-select select", ".sb-number-input", ".sb-combobox__field", ".sb-date-range__control"]],
    ];
    for (const [seam, fallback, selectors] of lines) {
      for (const selector of selectors) {
        const got = lastOf(selector, ["border", "border-color"]);
        if (got === undefined || !got.includes(`var(--sb-${seam}, var(--sb-${fallback}))`)) {
          wrong.push(`${selector}'s line is ${got ?? "nothing"}, not through ${seam}`);
        }
      }
    }
    assert.deepEqual(wrong, []);
  });

  /** fs(<size>) as the abstracts compile it: the fallbacks L19 names. */
  const fsOf = (size: string) => compiled(`  font-size: fs(${size});`, `fs(${size})`)["font-size"]!;

  test("2.4 L19 L115 button-label(md) and button-label(sm) compile to var(--sb-button-font-size, fs(sm)) and var(--sb-button-font-size-sm, fs(xs)); any other size fails the compile", () => {
    assert.deepEqual(compiled("  font-size: button-label(md);", "button-label(md)"), { "font-size": `var(--sb-button-font-size, ${fsOf("sm")})` });
    assert.deepEqual(compiled("  font-size: button-label(sm);", "button-label(sm)"), { "font-size": `var(--sb-button-font-size-sm, ${fsOf("xs")})` });
    for (const size of ["lg", "xs", "medium", "small", "nope"]) {
      refusedByCompile(`  font-size: button-label(${size});`, size, `button-label(${size})`);
    }
  });

  test("2.4 L19 the default and small buttons set their labels through button-label(): .sb-button's font-size is the md form, .sb-button--sm's the sm form, and .sb-button--lg is untouched (fs(md))", () => {
    assert.equal(lastOf(".sb-button", ["font-size"]), `var(--sb-button-font-size, ${fsOf("sm")})`, ".sb-button");
    assert.equal(lastOf(".sb-button--sm", ["font-size"]), `var(--sb-button-font-size-sm, ${fsOf("xs")})`, ".sb-button--sm");
    assert.equal(lastOf(".sb-button--lg", ["font-size"]), fsOf("md"), ".sb-button--lg");
  });

  /** Every library partial, for the source-text checks acceptance #4 and L72 state as greps. */
  const partials = () => {
    const root = join(pkgRoot, "src", "styles");
    const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : entry.name.endsWith(".scss") ? [join(dir, entry.name)] : []));
    return walk(root).map((file) => ({ path: relative(root, file).split(sep).join("/"), text: readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "") }));
  };
  const count = (text: string, call: string, name: string) => text.match(new RegExp(`\\b${call}\\(\\s*["']?${name}["']?\\s*\\)`, "g"))?.length ?? 0;

  test("2.4 #4 L70 no clr(border-strong) remains at a field frame or the switch's off track: grep finds it only at the ring and line sites (proposal §7), and the frames read seam(field-line), the switch seam(switch-off)", () => {
    // Proposal §7's 18 uses (checked at e24df74: 18 in 16 files). The six field frames go to field-line and the switch's
    // off-track to switch-off (L70, 2.4); the ring and line sites stay, the rating's empty star and the carousel's off dot
    // among them (§13, §15 item 6: they become the ring colour).
    const REMAINING: Record<string, number> = {
      "atoms/_choice.scss": 1, "atoms/_button.scss": 1, "atoms/_divider.scss": 1, "atoms/_rating.scss": 1,
      "molecules/_dropzone.scss": 2, "molecules/_calendar.scss": 1, "molecules/_carousel.scss": 2,
      "organisms/_command-palette.scss": 1, "organisms/_chart.scss": 1,
    };
    const found = Object.fromEntries(partials().map(({ path, text }) => [path, count(text, "clr", "border-strong")]).filter(([, n]) => (n as number) > 0));
    assert.deepEqual(found, REMAINING, "clr(border-strong) by file");
    const moved: [file: string, seam: string][] = [
      ["atoms/_input.scss", "field-line"], ["atoms/_number-input.scss", "field-line"], ["atoms/_color-input.scss", "field-line"],
      ["molecules/_combobox.scss", "field-line"], ["molecules/_date-range.scss", "field-line"], ["molecules/_input-group.scss", "field-line"],
      ["atoms/_switch.scss", "switch-off"],
    ];
    for (const [file, seam] of moved) {
      const text = partials().find((partial) => partial.path === file)?.text ?? "";
      assert.ok(count(text, "seam", seam) > 0, `${file} does not read seam(${seam})`);
    }
  });

  test("2.4 L72 the 47 text-subtle sites are split, none lost: clr(text-subtle) and seam(text-caption) together still number 47 (the caption rule itself needs the rendered sizes, step 2.4's table)", () => {
    const all = partials();
    const subtle = all.reduce((sum, { text }) => sum + count(text, "clr", "text-subtle"), 0);
    const caption = all.reduce((sum, { text }) => sum + count(text, "seam", "text-caption"), 0);
    assert.equal(subtle + caption, 47, `clr(text-subtle) ${subtle} and seam(text-caption) ${caption}`);
  });

  test("2.4 L146 no composed box-shadow list in the stylesheet can resolve to none: no item is none, and no item's var() fallbacks end in none — a list containing none is invalid and paints nothing", () => {
    const endsInNone = (item: string): boolean => {
      const text = item.trim();
      if (text === "none") {
        return true;
      }
      const v = /^var\(\s*--[\w-]+\s*,(.*)\)$/s.exec(text);
      return v !== null && endsInNone(v[1]!);
    };
    const wrong: string[] = [];
    for (const rule of stylesheet().rules) {
      for (const [property, value] of rule.decls) {
        const items = splitTop(value);
        if (property === "box-shadow" && items.length > 1) {
          wrong.push(...items.filter(endsInNone).map((item) => `${rule.selectors.join(", ")}: box-shadow item ${item}`));
        }
      }
    }
    assert.deepEqual(wrong, []);
  });

  // legibility-spec.md L183 #49 (S47): "2.4 #3" was "no file differs from e6fd3d5"; it is narrowed, not retired: the
  // eight files step 2.5 names under packages/component-library/src may change, and no file may be added or removed,
  // those eight included. The fixture is not re-recorded. (Step 2.7 removes organisms/token-studio.tsx the same way.)
  // L194 (b) and (l): the repair of step 2.5 adds the vanilla toast and the sortable table, by the same rule.
  // E5 of docs/existing-defects/spec.md (adversary C-1, verifier N-7): the vanilla menu, behaviors/menu.ts, is added for
  // E11's vanilla roles, by the same rule; the title and the message count it.
  const MAY_CHANGE = [
    ...["atoms/badge.tsx", "atoms/button.tsx", "atoms/icons.tsx", "atoms/index.ts", "molecules/alert.tsx", "molecules/field.tsx", "molecules/menu.tsx", "molecules/toast.tsx"].map((file) => `packages/component-library/src/${file}`),
    ...["toast.ts", "table-sort.ts", "menu.ts"].map((file) => `packages/design-system/src/behaviors/${file}`),
  ];

  test("2.4 #3 L183 #49 L194 (b) (l) E5 no file under packages/component-library/src or packages/design-system/src/behaviors differs from e6fd3d5 (step 2.3) but the eight step 2.5 names, the two behaviors its repair names and the vanilla menu E5 of docs/existing-defects/spec.md names, which may change; none added, none removed", () => {
    const base = json("step-2.4-untouched.json") as { recordedFrom: string; files: Record<string, string> };
    assert.equal(base.recordedFrom, "e6fd3d5");
    assert.deepEqual(MAY_CHANGE.filter((path) => base.files[path] === undefined), [], "each of the eleven is a file of the fixture: a misspelt name would exempt nothing");
    const now: Record<string, string> = {};
    for (const dir of ["packages/component-library/src", "packages/design-system/src/behaviors"]) {
      const walk = (path: string): string[] => readdirSync(path, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(join(path, entry.name)) : [join(path, entry.name)]));
      for (const file of walk(join(repoRoot, dir))) {
        now[posix(file)] = createHash("sha256").update(readFileSync(file)).digest("hex");
      }
    }
    const changed = [...new Set([...Object.keys(base.files), ...Object.keys(now)])].sort().filter((path) => base.files[path] !== now[path]).map((path) => `${path}: ${base.files[path] === undefined ? "added" : now[path] === undefined ? "removed" : "changed"}`);
    assert.deepEqual(changed.filter((entry) => !MAY_CHANGE.some((path) => entry === `${path}: changed`)), []);
  });

  // ══ revision 3.5 (§12.4, L148 to L161): after the audit of steps 2.3 and 2.4 ══════════════════════════════
  // Every check reads the stylesheet compiled now (stylesheet()), and where L148 asks for "the element's old value",
  // e24df74's stylesheet, recorded by record-e24df74-styles.mts.txt (step 2.2 changed no partial, so c0504b7's is the same).
  let olderStylesheet: ReturnType<typeof readCss> | undefined;
  const oldStylesheet = () => {
    olderStylesheet ??= readCss(readFileSync(join(fixtures, "compiled.at-e24df74.css"), "utf8"));
    return olderStylesheet;
  };
  const lastIn = (sheet: ReturnType<typeof readCss>, selector: string, properties: string[]) =>
    sheet.rules.filter((rule) => !rule.conditional && rule.selectors.includes(selector)).flatMap((rule) => rule.decls).filter(([property]) => properties.includes(property)).at(-1)?.[1];
  const SHADOW_PROPERTIES = ["box-shadow", "-webkit-box-shadow", "-moz-box-shadow"];
  const SEAM_NAMES = VALUES.seams.map((seam) => seam.name);
  /** The custom properties a var() in `value` reads, by name. */
  const readsOf = (value: string) => [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]!);
  /** L150's closure over a stylesheet: the custom properties composed box-shadow lists read as items, and every property any declaration of one reads as its whole value. */
  function composedClosure(sheet: ReturnType<typeof readCss>): Set<string> {
    const set = new Set<string>();
    for (const rule of sheet.rules) {
      for (const [property, value] of rule.decls) {
        const items = splitTop(value);
        if (SHADOW_PROPERTIES.includes(property) && items.length > 1) {
          for (const item of items) {
            const whole = /^var\(\s*(--[\w-]+)/.exec(item.trim());
            if (whole) {
              set.add(whole[1]!);
            }
          }
        }
      }
    }
    // Every custom property a member's value reads, anywhere in it, not only as its whole value: a member whose
    // value is `var(--sb-edge-quiet, var(--flat))`, in a theme without the edge, resolves through `--flat`, and a
    // whole-value-only closure stopped one var() short (audit of 7a683fd, guards F10).
    for (let grew = true; grew;) {
      grew = false;
      for (const rule of sheet.rules) {
        for (const [property, value] of rule.decls) {
          if (set.has(property)) {
            for (const name of readsOf(value).filter((name) => !set.has(name))) {
              set.add(name);
              grew = true;
            }
          }
        }
      }
    }
    return set;
  }
  /** `none` as the value, as an item of a list (`0 0 1px red, none`, guards F10), or at the end of a var()'s fallbacks. */
  const resolvesToNone = (value: string): boolean => splitTop(value.trim()).some((item) => {
    if (item === "none") {
      return true;
    }
    const v = /^var\(\s*--[\w-]+\s*,([\s\S]*)\)$/.exec(item);
    return v !== null && resolvesToNone(v[1]!);
  });
  /** L150: every declaration of a property in the closure that resolves to none. */
  const noneInClosure = (sheet: ReturnType<typeof readCss>) => {
    const closure = composedClosure(sheet);
    return sheet.rules.flatMap((rule) => rule.decls.filter(([property, value]) => closure.has(property) && resolvesToNone(value)).map(([property, value]) => `${rule.selectors.join(", ")} { ${property}: ${value} }`));
  };
  /** The custom properties a box-shadow value reads, directly or through other custom properties (the C2 context). */
  function shadowContext(sheet: ReturnType<typeof readCss>): Set<string> {
    const set = new Set<string>();
    for (const rule of sheet.rules) {
      for (const [property, value] of rule.decls) {
        if (SHADOW_PROPERTIES.includes(property)) {
          readsOf(value).forEach((name) => set.add(name));
        }
      }
    }
    for (let grew = true; grew;) {
      grew = false;
      for (const rule of sheet.rules) {
        for (const [property, value] of rule.decls) {
          if (set.has(property)) {
            for (const name of readsOf(value).filter((name) => !set.has(name))) {
              set.add(name);
              grew = true;
            }
          }
        }
      }
    }
    return set;
  }
  /** The locals where-defined sets: custom properties (not --sb-*) whose value reads a seam with no fallback. */
  const whereDefinedLocals = (sheet: ReturnType<typeof readCss>) => {
    const bare = new RegExp(`var\\(\\s*--sb-(${SEAM_NAMES.join("|")})\\s*\\)`);
    return new Set(sheet.rules.flatMap((rule) => rule.decls.filter(([property, value]) => property.startsWith("--") && !property.startsWith("--sb-") && bare.test(value)).map(([property]) => property)));
  };

  test("2.4 L149 seam-only(<name>) compiles to var(--sb-<name>) with no fallback, for each of the 20 optional tokens; an unknown name fails the compile, naming it", () => {
    for (const name of SEAM_NAMES) {
      assert.deepEqual(compiled(`  --probe: #{seam-only(${name})};\n  color: seam-only(${name});`, `seam-only(${name})`).color, `var(--sb-${name})`, `seam-only(${name})`);
    }
    for (const name of ["nope", "switch-rng", "surface", "edge-container"]) {
      refusedByCompile(`  color: seam-only(${name});`, name, `seam-only(${name})`);
    }
  });

  test("2.4 L148 L149 no box-shadow layer is coloured by a seam with a transparent fallback (C2's shape): not in a box-shadow, nor in a custom property a box-shadow reads", () => {
    const sheet = stylesheet();
    const context = shadowContext(sheet);
    const transparent = new RegExp(`var\\(\\s*--sb-(${SEAM_NAMES.join("|")})\\s*,\\s*transparent\\s*\\)`);
    const found = sheet.rules.flatMap((rule) => rule.decls.filter(([property, value]) => (SHADOW_PROPERTIES.includes(property) || context.has(property)) && transparent.test(value)).map(([property, value]) => `${rule.selectors.join(", ")} { ${property}: ${value} }`));
    assert.deepEqual(found, []);
  });

  test("2.4 L149 where-defined: a seam read with no fallback sits only in a local custom property; every read of that local is var(--<local>, <old>) in the rule that declares it; no local is @property-registered — and the switch, thumb and slider-track rings and the four selected bars read this way (L148)", () => {
    const sheet = stylesheet();
    const bare = new RegExp(`var\\(\\s*--sb-(${SEAM_NAMES.join("|")})\\s*\\)`, "g");
    const wrong: string[] = [];
    const sites: Record<string, number> = {};
    for (const rule of sheet.rules) {
      for (const [property, value] of rule.decls) {
        for (const m of value.matchAll(bare)) {
          sites[m[1]!] = (sites[m[1]!] ?? 0) + 1;
          if (!property.startsWith("--") || property.startsWith("--sb-")) {
            wrong.push(`${rule.selectors.join(", ")} { ${property}: ${value} }: seam-only outside a where-defined local`);
          }
        }
      }
    }
    const locals = whereDefinedLocals(sheet);
    for (const rule of sheet.rules) {
      for (const [property, value] of rule.decls) {
        for (const local of new Set(readsOf(value).filter((name) => locals.has(name)))) {
          // EVERY read, not the first: `var(--l, none), var(--l)` has one read with a fallback and one without, and
          // a test of "some read has one" passed it (audit of 7a683fd, guards F15).
          const reads = [...value.matchAll(new RegExp(`var\\(\\s*${local}\\s*(,\\s*\\S)?`, "g"))];
          if (reads.some((read) => read[1] === undefined)) {
            wrong.push(`${rule.selectors.join(", ")} { ${property}: ${value} }: reads ${local} with no fallback`);
          }
          if (!rule.decls.some(([declared]) => declared === local)) {
            wrong.push(`${rule.selectors.join(", ")}: reads ${local} without declaring it on the same element`);
          }
        }
      }
    }
    for (const prelude of sheet.atRules.filter((at) => /^@property\b/.test(at))) {
      const name = prelude.slice("@property".length).trim();
      if (locals.has(name)) {
        wrong.push(`${prelude}: a where-defined local is registered`);
      }
    }
    assert.deepEqual(wrong, []);
    assert.ok((sites["switch-ring"] ?? 0) >= 4, `the switch ring, the thumb's ring and the slider track's ring in both engines read switch-ring through where-defined (L148): ${sites["switch-ring"] ?? 0} sites`);
    assert.ok((sites["selected-bar"] ?? 0) >= 4, `the tab, pagination, navbar and sidebar bars read selected-bar through where-defined (L148): ${sites["selected-bar"] ?? 0} sites`);
  });

  test("2.4 L150 (checker) the closure resolves a fallback-less var() through its declarations: flat-elevation's --shadow-rest: none under soft-edge's --edge-layer is caught, 0 0 #0000 is not", () => {
    const sheetOf = (rest: string) => readCss(`.b { --shadow-rest: ${rest}; --edge-layer: var(--shadow-rest); box-shadow: var(--state-layer, 0 0 #0000), var(--edge-layer); }`);
    assert.equal(noneInClosure(sheetOf("none")).length, 1, "the planted flat-elevation");
    assert.deepEqual(noneInClosure(sheetOf("0 0 #0000")), [], "the fix");
    assert.equal(noneInClosure(readCss(".b { --x: var(--y, none); box-shadow: var(--state-layer, 0 0 #0000), var(--x); }")).length, 1, "a fallback that ends in none");
  });

  test("2.4 L150 no composed box-shadow list resolves to none through any var(): no declaration of a custom property such a list reads — directly, or as another's whole value — is none or a var() that ends in none", () => {
    assert.deepEqual(noneInClosure(stylesheet()), []);
  });

  test("2.4 L151 the halo room: max(|x|, |y|) + blur + spread over the all-round outset layers of container, quiet and the filled-* elements' rest, hover and press, plus the element's rise where it is hovered, rounded up — 9px in light and 3px in dark for §3's edges (8 and 1 before the rise counted: frozen lens F5), and nothing else counts", () => {
    assert.deepEqual([haloRoomOf(VALUES.edges.light), haloRoomOf(VALUES.edges.dark)], [9, 20], "L151's figures, with the rise (repair proposal for L151), and L197's glows: dark's hover glow, 19 + 1");
    // L197: a glow (no offset, a negative spread) counts; an offset layer does not; and the room is never under the focus ring's 5px.
    const glow = freshEdges();
    glow.light["filled-accent"]!.hover!.push({ inset: false, x: 0, y: 0, blur: 30, spread: -2, color: "#000000", alpha: 0.3 });
    assert.equal(haloRoomOf(glow.light), 29, "a hover glow of 30 - 2, plus the button's rise of 1");
    assert.equal(edgeTokens.haloRoom(glow.light as never), 29, "the emitter counts the glow too");
    const tiny = freshEdges();
    for (const element of ["container", "quiet", "filled-primary", "filled-secondary", "filled-accent", "filled-danger"] as const) {
      const recipe = tiny.light[element]!;
      recipe.rest = [{ inset: false, x: 0, y: 0, blur: 0, spread: 1, color: "#000000", alpha: 0.3 }];
      recipe.hover = recipe.hover === undefined ? undefined : [];
      recipe.press = recipe.press === undefined ? undefined : [];
    }
    assert.equal(haloRoomOf(tiny.light), 5, "a 1px rim (3 with the card's rise) still leaves the focus ring its 5px");
    assert.equal(edgeTokens.haloRoom(tiny.light as never), 5, "the emitter's floor is the focus ring's reach");
    const grown = freshEdges();
    grown.light.container!.rest.find(allRound)!.blur = 12.5;
    assert.equal(haloRoomOf(grown.light), 16, "12.5 + 1 + the card's rise of 2, rounded up (14 before the rise counted)");
    const ignored = freshEdges();
    ignored.light.field!.rest.push({ inset: false, x: 0, y: 0, blur: 40, spread: 4, color: "#000000", alpha: 0.5 });
    ignored.light["status-info"]!.rest.push({ inset: false, x: 0, y: 0, blur: 40, spread: 4, color: "#000000", alpha: 0.5 });
    ignored.light["filled-accent"]!.rest.push({ inset: true, x: 0, y: 0, blur: 40, spread: 4, color: "#000000", alpha: 0.5 }, { inset: false, x: 0, y: 30, blur: 40, spread: 0, color: "#000000", alpha: 0.5 });
    assert.equal(haloRoomOf(ignored.light), 9, "a field's, a status box's, an inset and an offset layer do not count (8 before the rise counted)");
    for (const [edges, mode] of [[grown, "light"], [ignored, "light"]] as const) {
      assert.ok(blocksOf(themeCss(legiblePreset({ edges }))).light.includes(haloLine(edges[mode])), `the emitted room follows the edge data: ${haloLine(edges[mode])}`);
    }
    for (const name of ["ocean", "forest", "noir", "midnight"]) {
      assert.ok(!themeCss(shipped[name]!).includes("--sb-halo-room"), `${name} emits a halo room: it has no edges`);
    }
  });

  // L162 (c): the two parents had no padding at e24df74, so the form is exactly var(--sb-halo-room, 0px), no calc();
  // scroll-padding the same, on the carousel viewport only (the marquee is overflow: hidden).
  test("2.4 L151 L162 L193 the carousel viewport pads by exactly var(--sb-halo-room, 0px), its scroll-padding by var(--sb-halo-room, auto); the marquee pads the same and sets no scroll-padding — so a frozen preset's padding stays 0", () => {
    for (const selector of [".sb-carousel__viewport", ".sb-marquee"]) {
      for (const property of ["padding", "scroll-padding"]) {
        assert.equal(lastIn(oldStylesheet(), selector, [property]), undefined, `${selector} had a ${property} at e24df74: L162 (c)'s premise`);
      }
    }
    // L193 (CORRECTION 2026-10-05): scroll-padding falls back to auto, its e24df74 value (L148: the old value exactly);
    // 0px was the one computed difference the frozen lens found in the frozen presets.
    assert.deepEqual([lastOf(".sb-carousel__viewport", ["padding"]), lastOf(".sb-carousel__viewport", ["scroll-padding"])], ["var(--sb-halo-room, 0px)", "var(--sb-halo-room, auto)"], ".sb-carousel__viewport");
    assert.deepEqual([lastOf(".sb-marquee", ["padding"]), lastOf(".sb-marquee", ["scroll-padding"])], ["var(--sb-halo-room, 0px)", undefined], ".sb-marquee");
  });

  test("L197 the focus ring's reach the halo room keeps is the stylesheet's: focus-ring-width (scales.ts) plus focus-ring's default outline-offset (abstracts/_mixins.scss) equals edges.ts's FOCUS_REACH", () => {
    const width = Number.parseFloat(/"focus-ring-width":\s*"([\d.]+)px"/.exec(readFileSync(join(pkgRoot, "src", "tokens", "scales.ts"), "utf8"))?.[1] ?? "NaN");
    const offset = Number.parseFloat(/@mixin focus-ring\(\$offset:\s*([\d.]+)px\)/.exec(readFileSync(join(pkgRoot, "src", "styles", "abstracts", "_mixins.scss"), "utf8"))?.[1] ?? "NaN");
    assert.deepEqual([width, offset], [3, 2], "the ring's width and its default offset");
    assert.equal(edgeTokens.FOCUS_REACH, width + offset);
  });

  test("2.4 L151 (lift) the rises the halo room counts are the stylesheet's: the filled buttons' --lift, the quiet button's, and the interactive card's hover translate, read off the compiled CSS, equal this file's HOVER_RISE and edges.ts's HOVER_LIFT (frozen lens F5: a rise the room did not count cut the hovered halo)", () => {
    const px = (value: string | undefined) => (value === undefined ? undefined : Math.abs(Number.parseFloat(/-?[\d.]+(?=px)|^0$/.exec(value.trim().split(/\s+/).at(-1)!)?.[0] ?? "NaN")));
    const card = stylesheet().rules.filter((rule) => rule.context === "@media (hover: hover)" && rule.selectors.includes(".sb-card--interactive:hover")).flatMap((rule) => rule.decls).filter(([property]) => property === "translate").at(-1)?.[1];
    const fromCss = { container: px(card), quiet: px(lastOf(".sb-button--outline", ["--lift"])), filled: px(lastOf(".sb-button", ["--lift"])) };
    assert.deepEqual(fromCss, HOVER_RISE, "this file's copy");
    assert.deepEqual(fromCss, { ...edgeTokens.HOVER_LIFT }, "edges.ts's HOVER_LIFT, which the emitter counts");
    assert.equal(edgeTokens.haloRoom(VALUES.edges.light as never), haloRoomOf(VALUES.edges.light), "the emitter's room is this file's");
  });

  /**
   * Every clipping or scrolling parent in the compiled stylesheet, with what it does about the all-round edge layer of
   * what it holds (L151). L151's table listed proposal §7's six; the audit of 7a683fd found a seventh it missed, the
   * accordion, whose `::details-content` clips its block axis while the body began with no padding at all, so a card
   * or a button first in the body lost the top of its halo (frozen lens F2). Derived from the stylesheet, so an eighth
   * fails here until someone decides it. "pads" is checked: the parent (or the named child that holds its content)
   * reads halo-room() on that side.
   */
  const CLIPPING_PARENTS: Record<string, string> = {
    ".sb-carousel__viewport": "pads: padding and scroll-padding",
    ".sb-marquee": "pads: padding (and its reduced-motion scroller is the same box)",
    ".sb-accordion::details-content": "pads: .sb-accordion__body's top (its sides and bottom are space(4))",
    ".sb-table-wrap": "no room: cells pad space(3) by space(4), more than the room; the compact table's space(2) block padding is under it (open: the owner's question, repair report)",
    ".sb-tabs__list": "no room: the tabs carry no all-round outset layer (an inset bar; the pills' shadow(sm) sits in the list's padding)",
    ".sb-combobox__panel": "no room: options carry no edge",
    ".sb-command__list": "no room: options carry no edge",
    ".sb-card": "no room: children sit in its body's space(4)",
    ".sb-modal__body": "no room: space(4) by space(6) of padding",
    ".sb-drawer__body": "no room: space(4) of padding",
    ".sb-layer": "no room: its content pads space(6) (--pad)",
    ".sb-frame": "no room: it frames media, no edge element",
    ".sb-app-shell__sidebar": "no room: sidebar items carry no all-round layer (their bar is inset)",
    ".sb-token-studio__failures": "no room: a list of text",
    ".sb-prose pre": "no room: code text",
    ".sb-number-input": "no room: its step buttons and field carry no halo of their own; the control's edge is on the box itself, inset",
    ".sb-avatar": "no room: an image or initials",
    ".sb-progress": "no room: its bar, flush by design",
    ".sb-rating__row--fill": "no room: star glyphs",
    ".sb-dropzone__input": "no room: visually hidden",
    ".sb-dropzone__name": "no room: text, truncated",
    ".sb-marquee__toggle": "no room: visually hidden until focused",
    ".sb-command-trigger__label": "no room: text, truncated",
    ".u-visually-hidden": "no room: hidden",
    ".u-truncate": "no room: text, truncated",
    ".sb-marquee--fade": "no room, on purpose: a mask that fades the items at both ends",
    ".sb-rating__star": "no room: a glyph mask",
    ".sb-combobox__chevron": "no room: a glyph mask",
  };
  const clippingParents = (sheet: ReturnType<typeof readCss>) => new Set(sheet.rules.flatMap((rule) => rule.decls
    .filter(([property, value]) => (/^overflow(?:-[xy]|-block|-inline)?$/.test(property) && !/^(?:visible|initial|unset)$/.test(value)) || (/^(?:mask|mask-image|-webkit-mask|-webkit-mask-image|clip-path)$/.test(property) && value !== "none"))
    .flatMap(() => rule.selectors.map((selector) => selector.replace(/["']/g, "").replace(/\s+/g, " ").trim()).filter((selector) => !/::(?:before|after)$/.test(selector) && !/^\[aria-sort/.test(selector) && !/^\.sb-stat__delta/.test(selector) && !/^\.sb-checkbox/.test(selector)))));

  test("2.4 L151 every clipping or scrolling parent in the stylesheet has a decision about the halo, and each that pads reads halo-room() (frozen lens F2: the accordion clipped a halo L151's table never listed)", () => {
    assert.deepEqual([...clippingParents(stylesheet())].sort(), Object.keys(CLIPPING_PARENTS).sort(), "a clipping parent with no decision, or a decision for one that no longer clips");
    assert.equal(lastOf(".sb-accordion__body", ["padding"]), "var(--sb-halo-room, 0px) var(--sb-space-4) var(--sb-space-4)", ".sb-accordion__body: its top is the room, its sides and bottom space(4) as before");
    assert.equal(lastIn(oldStylesheet(), ".sb-accordion__body", ["padding"]), "0 var(--sb-space-4) var(--sb-space-4)", "at e24df74 the top was 0, which halo-room() gives a frozen preset");
  });

  test("2.4 L72 L110 inside a scrim, every ink seam is re-pointed as the role it falls back to is: a theme with the seam (sorbet) paints the scrim's ink, not the page's, and a theme without it computes what it did (the audit of 7a683fd, 'outside this lens': a heading, a label and subtle text painted cocoa #472400 on the dark scrim, about 1.1:1)", () => {
    const content = ".sb-layer--scrim .sb-layer__content";
    const repointed = Object.fromEntries(rulesOf(content).flatMap((rule) => rule.decls).filter(([property]) => property.startsWith("--sb-")));
    for (const seam of VALUES.seams) {
      const fallback = (seam.fallback as { fallback?: string; css?: string });
      const role = fallback.fallback;
      if (role !== undefined && repointed[`--sb-${role}`] !== undefined) {
        assert.equal(repointed[`--sb-${seam.name}`], repointed[`--sb-${role}`], `${seam.name} falls back to ${role}, which the scrim re-points: it must be re-pointed to the same`);
      } else if (fallback.css === "inherit") {
        assert.equal(repointed[`--sb-${seam.name}`], "currentColor", `${seam.name} falls back to inherit: inside the scrim it must be currentColor, which a colour property reads as inherit`);
      } else {
        assert.equal(repointed[`--sb-${seam.name}`], undefined, `${seam.name} is not ink: the scrim leaves it alone`);
      }
    }
  });

  // L165 (c) changed this value on purpose (CORRECTION 2026-10-05): the hover reads the variant's --card-hover-edge,
  // falling back to the container edge, so a sunken interactive card keeps its own edge on hover (frozen lens F3).
  test("2.4 L152 L165 (c) the interactive card's hover is never weaker than rest: its box-shadow is var(--card-hover-edge, edge(container, shadow(lg))) and its line comes through where-defined from container-line, falling back to clr(border)", () => {
    const selector = ".sb-card--interactive:hover";
    const shadowLg = compiled("  box-shadow: shadow(lg);", "shadow(lg)")["box-shadow"];
    assert.equal(lastOf(selector, ["box-shadow"]), `var(--card-hover-edge, var(--sb-edge-container, ${shadowLg}))`, "box-shadow");
    const line = lastOf(selector, ["border-color"]);
    const local = /^var\(\s*(--[\w-]+)\s*,\s*var\(--sb-border\)\s*\)$/.exec(line ?? "");
    assert.ok(local, `border-color is ${line}, not var(--<local>, var(--sb-border))`);
    assert.ok(rulesOf(selector).some((rule) => rule.decls.some(([property, value]) => property === local[1] && value === "var(--sb-container-line)")), `${local[1]} is not set from seam-only(container-line) on the hover rule`);
  });

  /**
   * L165 (c): only the sunken variant sets --card-hover-edge, to its own edge with shadow(lg) as the fallback, so a
   * sunken interactive card's hover keeps the sunken edge (it dropped 11.21 -> 10.26 inside a card when the hover
   * swapped to the container edge), and every frozen preset still lifts to shadow(lg) on hover.
   */
  test("L165 (c) the sunken card sets --card-hover-edge to edge(sunken, shadow(lg)), and no other rule sets it", () => {
    const shadowLg = compiled("  box-shadow: shadow(lg);", "shadow(lg)")["box-shadow"];
    assert.equal(lastOf(".sb-card--sunken", ["--card-hover-edge"]), `var(--sb-edge-sunken, ${shadowLg})`, "--card-hover-edge");
    const setters = [...new Set(stylesheet().rules.filter((rule) => rule.decls.some(([property]) => property === "--card-hover-edge")).flatMap((rule) => rule.selectors))];
    assert.deepEqual(setters, [".sb-card--sunken"], "the rules that set --card-hover-edge");
  });

  /**
   * L165 (b), DECISIONS row 35: the raised card draws the container edge in a theme with edge data (2.64 on the page
   * and 0.28 in a card before), and shadow(md), its e24df74 value, everywhere else.
   */
  test("L165 (b) the raised card's box-shadow is edge(container, shadow(md))", () => {
    const shadowMd = compiled("  box-shadow: shadow(md);", "shadow(md)")["box-shadow"];
    assert.equal(lastOf(".sb-card--raised", ["box-shadow"]), `var(--sb-edge-container, ${shadowMd})`, "box-shadow");
  });

  /**
   * L153: whether a compiled selector item carries a state. The shared definition (tools/stylelint/state-definition.js),
   * which the source rule and the e24df74 recorder import too (audit of 7a683fd, guards F9: four literal copies, and
   * the test's own could lose half its terms with every check green; F6: `[data-*]` unless a fact, and `[open]`).
   */
  const isState = (selector: string): boolean => stateDefinition.isStateSelector(selector);
  const normalSelector = (selector: string) => selector.replace(/["']/g, "").replace(/\s+/g, " ").trim();
  /**
   * An allowlist entry's source path (".sb-card | &--interactive | &:hover") as the compiled selectors it becomes: each
   * part may itself be a selector list, so a path expands to every combination.
   */
  const compiledPaths = (path: string) => path.split(" | ").reduce<string[]>((done, part) => (done.length === 0
    ? splitTop(part)
    : done.flatMap((outer) => splitTop(part).map((inner) => (inner.includes("&") ? inner.replaceAll("&", outer) : `${outer} ${inner}`)))), []).map(normalSelector);
  /** A state selector with its states taken off: the element it is a state of. */
  const elementOf = (selector: string) => {
    let text = normalSelector(selector);
    for (let before = ""; before !== text;) {
      before = text;
      text = text.replace(/:(?:not|is|where|has)\(([^()]*)\)/gi, (whole, inner: string) => (isState(inner) ? "" : whole));
    }
    return stateDefinition.stripStates(text).trim();
  };
  /** Whether the element a selector names carries an edge layer: some rule for it sets or reads --edge-layer, or reads an --sb-edge-* property. */
  const carriesEdge = (sheet: ReturnType<typeof readCss>, selector: string) => {
    const element = elementOf(selector);
    return sheet.rules.some((rule) => rule.selectors.some((item) => elementOf(item) === element) && rule.decls.some(([property, value]) => property === "--edge-layer" || /var\(\s*--edge-layer\b|var\(\s*--sb-edge-/.test(value)));
  };
  /** L149's form, in one rule: box-shadow: var(--<local>, <old>), with --<local> set there from a seam read with no fallback. */
  const isWhereDefined = (rule: CssRule, value: string) => {
    const local = /^var\(\s*(--[\w-]+)\s*,[\s\S]+\)$/.exec(value)?.[1];
    return local !== undefined && rule.decls.some(([property, declared]) => property === local && new RegExp(`var\\(\\s*--sb-(${SEAM_NAMES.join("|")})\\s*\\)`).test(declared));
  };
  /**
   * L162 (a)'s six selected-bar selectors, by name: the only state selectors whose where-defined box-shadow is exempt.
   * "The element carries no edge layer", decided from selector text alone, exempted a descendant- or variant-qualified
   * selector of an element that does carry one (`.x .sb-button[aria-pressed=true]`, `.sb-button--soft[aria-pressed]`),
   * whose bar then replaced the button's edge and state layers (audit of 7a683fd, guards F2). A seventh needs a spec
   * line (repair proposal for L162 (a)).
   */
  const SELECTED_BARS = new Set([".sb-tabs__tab[aria-selected=true]", ".sb-pagination a[aria-current=page]", ".sb-pagination button[aria-current=page]", ".sb-navbar__nav a[aria-current=page]", ".sb-sidebar__item[aria-current=page]", ".sb-sidebar__item[aria-current=true]"]);
  /**
   * L153: state rules that write a box-shadow neither in the composed form (read whole by the shared definition: two
   * items, the two layers by name, no fallback but the placeholder; guards F3), nor where-defined at one of L162 (a)'s
   * six on an element with no edge layer, nor at an allowed site.
   */
  const stateShadows = (sheet: ReturnType<typeof readCss>, allowed: Set<string>) => sheet.rules.flatMap((rule) => rule.decls
    .filter(([property, value]) => SHADOW_PROPERTIES.includes(property) && !stateDefinition.isComposed(value))
    .flatMap(([property, value]) => rule.selectors
      .filter((selector) => isState(selector) && !allowed.has(normalSelector(selector)) && !(SELECTED_BARS.has(normalSelector(selector)) && isWhereDefined(rule, value) && !carriesEdge(sheet, selector)))
      .map((selector) => `${selector} { ${property}: ${value} }`)));
  const allowlistEntries = () => (JSON.parse(readFileSync(join(repoRoot, "tools", "stylelint", "state-box-shadow-allowlist.json"), "utf8")) as { entries: { file: string; selector: string; line?: number }[] }).entries;
  const allowedSelectors = () => new Set(allowlistEntries().flatMap((entry) => compiledPaths(entry.selector)));

  test("2.4 L153 (checker) a state rule is one with a state pseudo-class (inside :is, :where, :not and :has too), an [aria-*] attribute, a [data-*] attribute that is not a named fact, an [open], or a named BEM state modifier; a variant modifier or a @media condition is not", () => {
    const flagged = (css: string) => stateShadows(readCss(css), new Set()).length;
    for (const css of [".x:hover { box-shadow: 0 0 0 1px red; }", ".x:hover { -webkit-box-shadow: 0 0 0 1px red; }", ".x:is(:focus-visible) { box-shadow: none; }", ".x:has(:checked) { -moz-box-shadow: 0 0 1px red; }", ".x[aria-expanded=true] { box-shadow: none; }", ".x[data-state=open] { box-shadow: none; }", ".x--selected { box-shadow: 0 0 1px red; }", ".x__y--pressed { box-shadow: none; }", "@media (hover: hover) { .x:hover { box-shadow: none; } }"]) {
      assert.equal(flagged(css), 1, css);
    }
    for (const css of [".x--raised { box-shadow: 0 0 1px red; }", ".x--flat { box-shadow: none; }", "@media (hover: hover) { .x { box-shadow: none; } }", ".x:hover { box-shadow: var(--state-layer, 0 0 #0000), var(--edge-layer, 0 0 #0000); }", ".x:hover { box-shadow: var(--state-layer), var(--edge-layer); }", ".x:hover { --state-layer: 0 0 0 2px red; }", ".x:focus-visibles { box-shadow: none; }"]) {
      assert.equal(flagged(css), 0, css);
    }
    // Guards F9: every term of the definition, one case each, so a term dropped from it fails here; pseudo-classes
    // and attribute names in any case (`:HOVER` passed), a modifier only as written (a class name is case-sensitive).
    for (const pseudo of stateDefinition.STATE_PSEUDO_CLASSES as string[]) {
      for (const spelt of [pseudo, pseudo.toUpperCase()]) {
        assert.equal(flagged(`.x:${spelt} { box-shadow: 0 0 1px red; }`), 1, `:${spelt}`);
        assert.equal(flagged(`.x:not(:${spelt}) { box-shadow: 0 0 1px red; }`), 1, `:not(:${spelt})`);
      }
    }
    for (const modifier of stateDefinition.STATE_MODIFIERS as string[]) {
      assert.equal(flagged(`.x--${modifier} { box-shadow: 0 0 1px red; }`), 1, `--${modifier}`);
      assert.equal(flagged(`.x--${modifier}-ish { box-shadow: 0 0 1px red; }`), 0, `--${modifier}-ish is a variant`);
    }
    assert.equal(flagged(".x--Selected { box-shadow: 0 0 1px red; }"), 0, "--Selected is another class");
    // Guards F6: the library's own state attributes, which L153's [data-state] missed, and [open]; the facts are not.
    for (const attribute of ["aria-pressed", "ARIA-pressed", "data-invalid", "data-highlighted", "data-selected", "data-disabled", "data-loading", "data-in-range", "data-range-start", "data-dragover", "open", "checked", "selected", "disabled"]) {
      assert.equal(flagged(`.x[${attribute}] { box-shadow: 0 0 1px red; }`), 1, `[${attribute}]`);
      assert.equal(flagged(`.x[${attribute}="true"] { box-shadow: 0 0 1px red; }`), 1, `[${attribute}="true"]`);
    }
    for (const fact of stateDefinition.FACT_ATTRIBUTES as string[]) {
      assert.equal(flagged(`.x[${fact}] { box-shadow: 0 0 1px red; }`), 0, `[${fact}] is a fact`);
    }
    // Guards F3: the composed form is read whole — exactly the two layers, by name, with no fallback but the placeholder.
    for (const value of ["var(--state-layer, 0 0 #0000), var(--edge-layer, 0 0 #0000), 0 0 0 6px red", "var(--state-layer, 0 0 0 6px red), var(--edge-layer, 0 0 #0000)", "var(--state-layer, 0 0 #0000), var(--edge-layer, 0 0 0 6px red)", "var(--state-layer-x, 0 0 0 6px red), var(--edge-layer-x, 0 0 0 6px blue)", "var(--edge-layer), var(--state-layer)", "var(--state-layer)"]) {
      assert.equal(flagged(`.x:hover { box-shadow: ${value}; }`), 1, value);
    }
    // Guards F5: a state shadow inside @starting-style is a state shadow.
    assert.equal(flagged(".x:hover { color: red; } @starting-style { .x:hover { box-shadow: 0 0 0 6px red; } }"), 1, "@starting-style");
    assert.deepEqual(stateShadows(readCss(".sb-card--interactive:hover { box-shadow: none; }"), new Set(compiledPaths(".sb-card | &--interactive | &:hover"))), [], "an allowlisted site");
    assert.deepEqual(compiledPaths(".sb-input, .sb-textarea | &:focus-visible"), [".sb-input:focus-visible", ".sb-textarea:focus-visible"], "a path whose parts are lists");
    // L162 (a): where-defined on a state selector is exempt at the six selected-bar selectors, where the element
    // carries no edge layer — and only there (guards F2: deciding "no edge layer" from selector text exempted
    // `.x .sb-button[aria-pressed=true]`).
    const bar = (selector: string) => `${selector} { --bar: inset 3px 0 0 0 var(--sb-selected-bar); box-shadow: var(--bar, revert-layer); }`;
    assert.equal(flagged(`.sb-sidebar__item { color: red; } ${bar(".sb-sidebar__item[aria-current=page]")}`), 0, "a where-defined bar at one of the six, on an element with no edge layer");
    assert.equal(flagged(`.x { color: red; } ${bar(".x[aria-current=page]")}`), 1, "a where-defined bar on any other selector, even with no edge layer: guards F2 (was 0 before the repair)");
    assert.equal(flagged(`.sb-button { --edge-layer: 0 0 #0000; } ${bar(".pl .sb-button[aria-pressed=true]")}`), 1, "guards F2's B13: a descendant-qualified button");
    assert.equal(flagged(`.sb-sidebar__item { --edge-layer: var(--sb-edge-container, 0 0 #0000); box-shadow: var(--state-layer, 0 0 #0000), var(--edge-layer); } ${bar(".sb-sidebar__item[aria-current=page]")}`), 1, "a where-defined bar on an element WITH an edge layer still fails: it would clobber the edge");
    assert.equal(flagged(`.sb-sidebar__item { box-shadow: var(--sb-edge-quiet, none); } ${bar(".sb-sidebar__item[aria-current=page]")}`), 1, "an element whose edge is read through --sb-edge-* directly");
    assert.equal(flagged(".x:hover:not(:disabled) { --l: 0 0 0 1px var(--sb-switch-ring); box-shadow: var(--l, none); } .x { --edge-layer: 0 0 #0000; }"), 1, "the element under its :not() guard is the same element");
    assert.equal(flagged(".sb-sidebar__item[aria-current=page] { --bar: inset 3px 0 0 0 var(--sb-selected-bar, transparent); box-shadow: var(--bar, revert-layer); }"), 1, "a local set from a seam WITH a fallback is not where-defined");
  });

  test("2.4 L153 L162 no state rule in the compiled stylesheet writes box-shadow, -webkit-box-shadow or -moz-box-shadow except in the composed form, in the where-defined form on an element with no edge layer, or at an allowlisted site", () => {
    assert.deepEqual(stateShadows(stylesheet(), allowedSelectors()), []);
  });

  // The source rule, run as stylelint runs it (the repo's config), on a probe partial: it must flag what the shared
  // definition calls a state shadow, and its state test must BE the shared one — a copy is what drifted (guards F9).
  const sourceRule = (await import(join(repoRoot, "tools", "stylelint", "no-state-box-shadow.js"))) as { isStateSelector: unknown };
  const stylelintApi = createRequire(join(repoRoot, "package.json"))("stylelint") as { lint: (options: object) => Promise<{ results: { warnings: { rule: string; text: string }[] }[] }> };
  const SOURCE_PROBE = {
    flagged: ["&[data-invalid]", "&[data-highlighted]", "&[open]", "&:HOVER", "&:is(:Focus-Visible)", "&[ARIA-pressed=\"true\"]", "&--loading"],
    composedNot: ["var(--state-layer, 0 0 #0000), var(--edge-layer, 0 0 #0000), 0 0 0 6px red", "var(--state-layer, 0 0 0 6px red), var(--edge-layer, 0 0 #0000)", "var(--state-layer-x, 0 0 0 6px red), var(--edge-layer-x, 0 0 0 6px blue)"],
    passed: ["&[data-today]", "&[data-align=\"center\"]", "&--raised"],
  };
  const sourceProbe = [
    ...SOURCE_PROBE.flagged.map((selector, i) => `.zz-f${i} { ${selector} { box-shadow: 0 0 0 3px red; } }`),
    ...SOURCE_PROBE.composedNot.map((value, i) => `.zz-c${i} { &:hover { box-shadow: ${value}; } }`),
    ".zz-ok { &:hover { box-shadow: var(--state-layer, 0 0 #0000), var(--edge-layer); } }",
    ...SOURCE_PROBE.passed.map((selector, i) => `.zz-p${i} { ${selector} { box-shadow: 0 0 0 3px red; } }`),
  ].join("\n");
  const sourceLint = await stylelintApi.lint({ code: sourceProbe, codeFilename: join(pkgRoot, "src", "styles", "molecules", "_zz-probe.scss"), configFile: join(repoRoot, "stylelint.config.js"), configBasedir: repoRoot });
  const sourceFlags = sourceLint.results.flatMap((result) => result.warnings).filter((warning) => warning.rule === "sorbet/no-state-box-shadow").map((warning) => /\((\.zz-[a-z]\d+)[^)]*\)/.exec(warning.text)?.[1] ?? warning.text);

  test("2.4 L153 (source rule) the stylelint rule's state test is the shared definition itself, and run on a partial it flags the library's own state attributes, [open], any letter case, and a composed form that is not exactly the two layers — and passes the facts, the variants and the true composed form (guards F3, F6, F9)", () => {
    assert.equal(sourceRule.isStateSelector, stateDefinition.isStateSelector, "no-state-box-shadow.js carries its own state test: one definition (tools/stylelint/state-definition.js)");
    const expected = [...SOURCE_PROBE.flagged.map((_, i) => `.zz-f${i}`), ...SOURCE_PROBE.composedNot.map((_, i) => `.zz-c${i}`)];
    assert.deepEqual([...sourceFlags].sort(), [...expected].sort());
  });

  // ══ the frozen presets' cascade, held as a cascade (audit of 7a683fd: frozen lens F1, F4; guards F1, F2, F12) ═════
  // L148 promises "the element's old value exactly". The audit found it held only per selector TEXT: a selected tab
  // that is also an `.sb-button` lost the button's shadow in every frozen preset (the tab's `none` fallback, in a
  // higher layer, beat the button's rule), and `.sb-button.sb-fab` took the fab's hover shadow (the button's hover
  // shadow had moved from its 0,3,0 state rule to its 0,1,0 base rule). Neither is visible to a check that compares
  // a selector's old declaration with its new one. These checks compare the CASCADE: for every selector, in its layer
  // and its conditional context, what a frozen preset computes from it, and whether a selector that declared the
  // property still does, and whether a selector that did not now does — which can only be harmless from inside the
  // where-defined sublayer, falling back to revert-layer.
  /** The --sb-* names a frozen preset defines: the frozen goldens' declarations (check-golden.ts's FROZEN_PRESETS), and the stylesheet's own :root. */
  const definedIn = (sheet: ReturnType<typeof readCss>) => new Set([
    ...goldenGate.FROZEN_PRESETS.flatMap((preset) => [...readFileSync(join(pkgRoot, "tools", "golden", `${preset}.css`), "utf8").matchAll(/(--sb-[\w-]+)\s*:/g)].map((m) => m[1]!)),
    ...sheet.rules.filter((rule) => rule.selectors.includes(":root")).flatMap((rule) => rule.decls.map(([property]) => property).filter((property) => property.startsWith("--sb-"))),
  ]);
  const UNSET = "<unset>";
  /** The var() calls of a value, outermost only: where each is, its name, and its fallback. */
  const varCalls = (value: string) => {
    const calls: { start: number; end: number; name: string; fallback?: string }[] = [];
    for (let at = value.indexOf("var("); at !== -1; at = value.indexOf("var(", at)) {
      let depth = 0;
      let comma = -1;
      let end = at + 3;
      for (; end < value.length; end++) {
        const ch = value[end];
        if (ch === "(") {
          depth++;
        } else if (ch === ")" && --depth === 0) {
          break;
        } else if (ch === "," && depth === 1 && comma === -1) {
          comma = end;
        }
      }
      calls.push({ start: at, end: end + 1, name: value.slice(at + 4, comma === -1 ? end : comma).trim(), fallback: comma === -1 ? undefined : value.slice(comma + 1, end).trim() });
      at = end + 1;
    }
    return calls;
  };
  /**
   * A value as a frozen preset computes it, written out: a var() of a --sb-* name the frozen presets define stays; one
   * they do not define takes its fallback; a local takes its declaration at the element (`lookup`), or its fallback
   * where that is unset or invalid; UNSET where nothing is left, which is the declaration invalid at computed-value time.
   */
  function frozenText(value: string, lookup: (name: string) => string | undefined, defined: Set<string>, depth = 0): string {
    if (depth > 16) {
      return UNSET;
    }
    let out = "";
    let last = 0;
    for (const call of varCalls(value)) {
      out += value.slice(last, call.start);
      last = call.end;
      let got: string;
      if (call.name.startsWith("--sb-") && defined.has(call.name)) {
        got = `var(${call.name})`;
      } else {
        const declared = call.name.startsWith("--sb-") ? undefined : lookup(call.name);
        const resolved = declared === undefined ? UNSET : frozenText(declared, lookup, defined, depth + 1);
        got = resolved !== UNSET ? resolved : call.fallback === undefined ? UNSET : frozenText(call.fallback, lookup, defined, depth + 1);
      }
      if (got === UNSET) {
        return UNSET;
      }
      out += got;
    }
    return (out + value.slice(last)).replace(/\s+/g, " ").trim();
  }
  const SUBLAYER = ".where-defined";
  const inSublayer = (rule: CssRule) => rule.layer?.endsWith(SUBLAYER) ?? false;
  /** A selector's identity in the cascade: its layer (a where-defined rule counts as its parent's), its conditional context, the selector. */
  const cascadeKey = (rule: CssRule, selector: string) => `${(rule.layer ?? "").replace(SUBLAYER, "")} | ${rule.context} | ${normalSelector(selector)}`;
  /** A custom property's value at an element in a state: the selector's own rules (direct ones win over the sublayer), then the element's. */
  const lookupAt = (sheet: ReturnType<typeof readCss>, rule: CssRule, selector: string) => (name: string) => {
    const layer = (rule.layer ?? "").replace(SUBLAYER, "");
    for (const at of [normalSelector(selector), elementOf(selector)]) {
      const candidates = sheet.rules.filter((each) => (each.layer ?? "").replace(SUBLAYER, "") === layer && [rule.context, ""].includes(each.context) && each.selectors.some((item) => normalSelector(item) === at));
      const found = [...candidates.filter(inSublayer), ...candidates.filter((each) => !inSublayer(each))].flatMap((each) => each.decls).filter(([property]) => property === name).at(-1)?.[1];
      if (found !== undefined) {
        return found;
      }
    }
    return undefined;
  };
  /** A shadow as a frozen preset paints it: its layers less the placeholders, `none` for nothing, for an invalid declaration, or a list holding none. */
  const paintedShadow = (text: string) => {
    if (text === UNSET) {
      return "none";
    }
    if (text === "revert-layer") {
      return text;
    }
    const items = splitTop(text);
    return items.includes("none") ? "none" : items.filter((item) => !stateDefinition.PLACEHOLDER.test(item)).join(", ") || "none";
  };
  /** The last declaration of each (cascade key, property) in a sheet, direct and in the sublayer apart. */
  const lastDeclarations = (sheet: ReturnType<typeof readCss>, properties: string[], sublayer: boolean) => {
    const found = new Map<string, { rule: CssRule; selector: string; property: string; value: string }>();
    for (const rule of sheet.rules.filter((each) => inSublayer(each) === sublayer)) {
      for (const [property, value] of rule.decls.filter(([name]) => properties.includes(name))) {
        for (const selector of rule.selectors) {
          found.set(`${cascadeKey(rule, selector)} | ${property}`, { rule, selector, property, value });
        }
      }
    }
    return found;
  };
  /**
   * The cascade of `properties` in a frozen preset, now against e24df74, as findings. (a) A selector that declared the
   * property declares it still, outside the sublayer, and a frozen preset computes the same from it. (b) A selector
   * that did not declares it only from the where-defined sublayer, falling back to revert-layer, or is one of
   * `residual` and paints nothing. (c) No selector that declared it has stopped: an element that composes another
   * class would then take that class's value.
   */
  function frozenCascade(now: ReturnType<typeof readCss>, was: ReturnType<typeof readCss>, properties: string[], paint: (text: string) => string, residual: Set<string> = new Set()): string[] {
    const [definedNow, definedWas] = [definedIn(now), definedIn(was)];
    const [direct, sub, old] = [lastDeclarations(now, properties, false), lastDeclarations(now, properties, true), lastDeclarations(was, properties, false)];
    const painted = (sheet: ReturnType<typeof readCss>, defined: Set<string>, d: { rule: CssRule; selector: string; value: string }) => paint(frozenText(d.value, lookupAt(sheet, d.rule, d.selector), defined));
    const wrong: string[] = [];
    for (const [key, d] of direct) {
      const before = old.get(key);
      const nowPaints = painted(now, definedNow, d);
      if (before !== undefined) {
        const wasPaints = painted(was, definedWas, before);
        if (nowPaints !== wasPaints) {
          wrong.push(`${key}: a frozen preset computes ${nowPaints}; at e24df74, ${wasPaints}`);
        }
      } else if (!(residual.has(key.slice(0, key.lastIndexOf(" | "))) && nowPaints === "none")) {
        wrong.push(`${key}: declared where e24df74 declared nothing, outside the where-defined sublayer, so in a frozen preset it outranks whatever reached the element before (it computes ${nowPaints}); write it through where-defined or where-absent, falling back to revert-layer`);
      }
    }
    for (const [key, d] of sub) {
      const nowPaints = painted(now, definedNow, d);
      if (old.has(key)) {
        wrong.push(`${key}: moved into the where-defined sublayer, below the declarations it used to beat`);
      } else if (nowPaints !== "revert-layer") {
        wrong.push(`${key}: in the where-defined sublayer, but a frozen preset computes ${nowPaints} from it, not revert-layer`);
      }
    }
    for (const key of old.keys()) {
      if (!direct.has(key)) {
        wrong.push(`${key}: declared at e24df74 and not now, so an element that composes another class whose rule declares it in the same layer, or a lower one, now takes that class's value (frozen lens F1 (b): .sb-button.sb-fab)`);
      }
    }
    return wrong;
  }
  /**
   * The residual: six field selectors whose composed edge list (soft-edge) is new at a selector that declared no
   * box-shadow at e24df74, and which a frozen preset computes as placeholders only. They paint nothing on their own
   * element; what they could still change is an element that ALSO carries a class from a lower cascade position that
   * paints a shadow (an `.sb-input` that is also an `.sb-button`), which the library's markup never does. Recorded by
   * the repair of 7a683fd as open, not fixed: a seventh is a finding.
   */
  const FIELD_RESIDUAL = new Set(["sb.atoms |  | .sb-input", "sb.atoms |  | .sb-textarea", "sb.atoms |  | .sb-number-input", "sb.atoms |  | .sb-select select", "sb.molecules |  | .sb-combobox__field", "sb.molecules |  | .sb-date-range__control"]);
  const TRANSITION_PROPERTIES = ["transition", "transition-property", "transition-duration", "transition-timing-function", "transition-delay", "transition-behavior"];

  test("2.4 L148 (checker) the frozen cascade check finds the audit's composition defects: a literal fallback at a selector that declared nothing, a state shadow moved to the base rule, a box-shadow added to a shared transition, and a plain new layer", () => {
    const was = readCss("@layer sb.atoms { .btn { --r: 0 1px 2px red; box-shadow: var(--r); } .btn:hover:not(:disabled) { box-shadow: 0 2px 4px red; } .day { transition: color 1s; } .card { box-shadow: var(--sb-shadow-sm); } } @layer sb.molecules { .tab[aria-selected=true] { color: red; } }");
    const shadows = (css: string) => frozenCascade(readCss(css), was, SHADOW_PROPERTIES, paintedShadow);
    const good = "@layer sb.atoms { .btn { --r: var(--sb-edge-x, 0 1px 2px red); --edge-layer: var(--r); box-shadow: var(--state-layer, 0 0 #0000), var(--edge-layer); } .btn:hover:not(:disabled) { --edge-layer: 0 2px 4px red; box-shadow: var(--state-layer, 0 0 #0000), var(--edge-layer); } .day { transition: color 1s; } .card { box-shadow: var(--sb-edge-container, var(--sb-shadow-sm)); } }";
    assert.deepEqual(shadows(`${good} @layer sb.molecules { @layer where-defined { .tab[aria-selected=true] { --bar: inset 0 -3px 0 0 var(--sb-selected-bar); box-shadow: var(--bar, revert-layer); } } }`), [], "the repaired shapes");
    assert.equal(shadows(`${good} @layer sb.molecules { .tab[aria-selected=true] { --bar: inset 0 -3px 0 0 var(--sb-selected-bar); box-shadow: var(--bar, none); } }`).length, 1, "frozen lens F1 (a): a literal none where the tab declared nothing");
    assert.equal(shadows(good.replace(".btn:hover:not(:disabled) { --edge-layer: 0 2px 4px red; box-shadow: var(--state-layer, 0 0 #0000), var(--edge-layer); }", ".btn:hover:not(:disabled) { --edge-layer: 0 2px 4px red; }")).length, 1, "frozen lens F1 (b): the hover shadow moved to the base rule");
    assert.equal(shadows(good.replace("var(--sb-edge-container, var(--sb-shadow-sm))", "var(--sb-edge-container, var(--sb-shadow-sm)), inset 0 0 0 1px var(--sb-container-line, var(--sb-border-subtle))")).length, 1, "guards F12's E2: a new layer at a selector that had a shadow");
    assert.equal(shadows(`${good} @layer sb.atoms { .sw { box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0); } }`).length, 1, "guards F12's E3: a transparent ring at a selector that had none");
    assert.equal(shadows(`${good} @layer sb.atoms { @media (min-width: 1px) { .sl { box-shadow: 0 0 0 9px red; } } }`).length, 1, "guards F1's plant E: inside a conditional rule");
    assert.equal(frozenCascade(readCss(good.replace("transition: color 1s", "transition: color 1s, box-shadow 1s")), was, TRANSITION_PROPERTIES, (text) => text).length, 1, "frozen lens F4: box-shadow added to a shared transition");
  });

  test("2.4 L148 a frozen preset's box-shadow cascade is e24df74's: every selector computes what it did, none stopped declaring one, and a new one is invisible there (where-defined sublayer, revert-layer), but for the six recorded field edges", () => {
    assert.deepEqual(frozenCascade(stylesheet(), oldStylesheet(), SHADOW_PROPERTIES, paintedShadow, FIELD_RESIDUAL), []);
  });

  test("2.4 L148 a frozen preset's transitions are e24df74's: no transition anywhere changed, and none is new (frozen lens F4: box-shadow in color-transition faded the calendar's today ring where it vanished)", () => {
    assert.deepEqual(frozenCascade(stylesheet(), oldStylesheet(), TRANSITION_PROPERTIES, (text) => text), []);
  });

  test("2.4 L148 the where-defined sublayer holds nothing a frozen preset can see: every declaration in it is a custom property or computes to revert-layer there, so C11's source-order reading of fills is not disturbed by it", () => {
    const sheet = stylesheet();
    const defined = definedIn(sheet);
    const wrong = sheet.rules.filter(inSublayer).flatMap((rule) => rule.decls.filter(([property]) => !property.startsWith("--")).flatMap(([property, value]) => rule.selectors
      .filter((selector) => frozenText(value, lookupAt(sheet, rule, selector), defined) !== "revert-layer")
      .map((selector) => `${selector} { ${property}: ${value} }`)));
    assert.ok(sheet.rules.some(inSublayer), "no rule is in a where-defined sublayer: the selected bars, the switch, the slider tracks and the progress track are");
    assert.deepEqual(wrong, []);
  });

  // legibility-spec.md L183 #51 (L178, S44): a read in the sublayer fell back to exactly revert-layer; it falls back to
  // revert-layer, or to an edge read whose own fallback is revert-layer (var(--sb-edge-<element>, revert-layer), the
  // element one of the thirteen), which a frozen preset also computes as revert-layer. The one such read is
  // .sb-alert--danger's (its rim and edge in one local, falling back to the edge alone).
  const EDGE_THEN_REVERT = new RegExp(`^var\\(\\s*--sb-edge-(?:${ELEMENTS.join("|")})\\s*,\\s*revert-layer\\s*\\)$`);

  test("2.4 L148 L183 #51 each where-defined read falls back to the element's old value exactly: at a selector that declared the property, that value, in the same rule's place; at one that declared none, revert-layer from the where-defined sublayer (never a literal none, frozen lens F1 (a)), or there an edge read falling back to revert-layer, at .sb-alert--danger only (L178) — conditional rules included (guards F1)", () => {
    const sheet = stylesheet();
    const locals = whereDefinedLocals(sheet);
    const old = lastDeclarations(oldStylesheet(), [...SHADOW_PROPERTIES, "border-color"], false);
    const [definedNow, definedWas] = [definedIn(sheet), definedIn(oldStylesheet())];
    const wrong: string[] = [];
    const edgeFallbacks: string[] = [];
    let reads = 0;
    for (const rule of sheet.rules) {
      for (const [property, value] of rule.decls.filter(([name]) => SHADOW_PROPERTIES.includes(name) || name === "border-color")) {
        const read = /^var\(\s*(--[\w-]+)\s*,([\s\S]*)\)$/.exec(value);
        if (read === null || !locals.has(read[1]!)) {
          continue;
        }
        reads++;
        const fallback = read[2]!.trim();
        for (const selector of rule.selectors) {
          const key = `${cascadeKey(rule, selector)} | ${property}`;
          const before = old.get(key);
          if (inSublayer(rule)) {
            const edgeRead = EDGE_THEN_REVERT.test(fallback);
            if (edgeRead) {
              edgeFallbacks.push(normalSelector(selector));
            }
            if ((fallback !== "revert-layer" && !edgeRead) || before !== undefined) {
              wrong.push(`${selector} { ${property}: ${value} } is in the where-defined sublayer: its fallback must be revert-layer, or an edge read whose own fallback is revert-layer (L183 #51), at a selector that declared no ${property} (it ${before === undefined ? "declared none" : `declared ${before.value}`})`);
            }
          } else if (before === undefined) {
            wrong.push(`${selector} { ${property}: ${value} } falls back to ${fallback} where e24df74 declared no ${property}: that outranks whatever reached the element before; write it through where-defined with revert-layer`);
          } else if (frozenText(fallback, lookupAt(sheet, rule, selector), definedNow) !== frozenText(before.value, lookupAt(oldStylesheet(), before.rule, before.selector), definedWas)) {
            wrong.push(`${selector} { ${property}: ${value} } falls back to ${fallback}, and its old value is ${before.value}`);
          }
        }
      }
    }
    assert.ok(reads >= 9, `${reads} where-defined reads: the switch, thumb, two slider tracks, four bars and the card hover's line (L148, L152)`);
    assert.deepEqual(wrong, []);
    assert.deepEqual([...new Set(edgeFallbacks)].filter((selector) => selector !== ".sb-alert--danger"), [], "an edge read as a where-defined fallback anywhere but .sb-alert--danger (L183 #51: the one such read is its)");
  });

  /** L154 (1), as L162 (b) rules: e24df74's sites are the state selectors the COMPILED check finds there, allowing nothing. */
  const STATE_SITES = json("state-box-shadow-sites.at-e24df74.json") as { recordedFrom: string; sites: { selector: string; property: string; value: string }[] };
  const siteSelector = (finding: string) => normalSelector(finding.slice(0, finding.indexOf(" { ")));

  test("2.4 L154 L162 (fixture) the two e24df74 fixtures are byte for byte what record-e24df74-styles.mts.txt records from `git archive e24df74`: pinned by sha256, so a site appended to both the stylesheet and the site list (and then to the allowlist) fails here (audit of 7a683fd, guards F8)", () => {
    const sha = (name: string) => createHash("sha256").update(readFileSync(join(fixtures, name))).digest("hex");
    assert.equal(sha("compiled.at-e24df74.css"), "b7539bdfe409baeafa5c5cfb40237e66e0c2f89ba6cb27de1cc79897e0d7b017", "compiled.at-e24df74.css");
    assert.equal(sha("state-box-shadow-sites.at-e24df74.json"), "2bc974e8e289f72c07e8d9847aa7e122531b0f32573c63897bdb880e65db808f", "state-box-shadow-sites.at-e24df74.json");
  });

  test("2.4 L154 L162 (fixture) the e24df74 sites are exactly what this file's compiled check finds in e24df74's stylesheet, allowing nothing", () => {
    assert.equal(STATE_SITES.recordedFrom, "e24df74");
    assert.deepEqual(STATE_SITES.sites.map((site) => normalSelector(site.selector)).sort(), [...new Set(stateShadows(oldStylesheet(), new Set()).map(siteSelector))].sort());
    assert.ok(STATE_SITES.sites.some((site) => site.selector === ".sb-segmented__option[aria-checked=true]"), "L162 (b): the segmented option, which the source rule missed");
  });

  test("2.4 L154 L162 may only shrink: the allowlist and the append-only removed list ({ file, selector }) are disjoint and together are e24df74's sites; every allowlisted site is still one", () => {
    const removedPath = join(repoRoot, "tools", "stylelint", "state-box-shadow-removed.json");
    assert.ok(existsSync(removedPath), "tools/stylelint/state-box-shadow-removed.json, the append-only list of removed sites, does not exist (L154 (2))");
    const removed = JSON.parse(readFileSync(removedPath, "utf8")) as { file: string; selector: string }[];
    assert.ok(Array.isArray(removed) && removed.every((entry) => typeof entry.file === "string" && typeof entry.selector === "string"), "L162 (d): an array of { file, selector }");
    const place = (entry: { file: string; selector: string }) => `${entry.file} | ${entry.selector}`;
    const allow = allowlistEntries();
    assert.deepEqual(allow.map(place).filter((entry) => removed.map(place).includes(entry)), [], "an entry both allowed and removed");
    const union = [...new Set([...allow, ...removed].flatMap((entry) => compiledPaths(entry.selector)))].sort();
    assert.deepEqual(union, STATE_SITES.sites.map((site) => normalSelector(site.selector)).sort(), "the allowlist and the removed list are not, together, the sites at e24df74");
    const still = new Set(stateShadows(stylesheet(), new Set()).map(siteSelector));
    assert.deepEqual(allow.flatMap((entry) => compiledPaths(entry.selector)).filter((selector) => !still.has(selector)), [], "an allowlisted site that is no longer one: move it to the removed list");
  });

  test("2.4 L154 (3) a CI step, tools/check-allowlist-base.ts, holds the removed list to its base branch's, beside check-golden-base.ts: a `run:` line of build.yml runs it against the pull request's base (a comment naming the file is not a step, guards F7)", () => {
    assert.ok(existsSync(join(repoRoot, "tools", "check-allowlist-base.ts")), "tools/check-allowlist-base.ts does not exist");
    const workflow = readFileSync(join(repoRoot, ".github", "workflows", "build.yml"), "utf8");
    assert.match(workflow, /^\s+run: node tools\/check-allowlist-base\.ts "origin\/\$\{BASE_REF\}"\s*$/m, "build.yml has no step whose run: line is the base check against origin/${BASE_REF}");
  });

  /** tools/check-allowlist-base.ts, loaded as a module: its main block runs only as a script (import.meta.main). */
  const allowlistBase = (await import(join(repoRoot, "tools", "check-allowlist-base.ts"))) as { droppedFromBase: (base: { file: string; selector: string }[] | undefined, now: { file: string; selector: string }[]) => { file: string; selector: string }[]; removedAt: (ref: string, cwd: string) => { file: string; selector: string }[] | undefined; parseRemoved: (text: string, where: string) => unknown; PATH: string };

  test("2.4 L154 (3) (checker) droppedFromBase names each base entry missing here, and only those; parseRemoved refuses what is not an array of { file, selector } (guards F7: replacing its body with `return []` left pnpm test green)", () => {
    const a = { file: "atoms/_button.scss", selector: ".sb-button | &:hover" };
    const b = { file: "atoms/_chip.scss", selector: ".sb-chip | &:hover" };
    assert.deepEqual(allowlistBase.droppedFromBase([a, b], [b]), [a], "an entry the base has and this tree lacks");
    assert.deepEqual(allowlistBase.droppedFromBase([a], [a, b]), [], "an entry appended here");
    assert.deepEqual(allowlistBase.droppedFromBase([{ ...a, selector: `${a.selector} ` }], [a]).length, 1, "a selector edited by a space is a different entry");
    assert.deepEqual(allowlistBase.droppedFromBase(undefined, [a]), [], "a base with no list yet");
    for (const text of ["{", "{}", "[{\"file\": 1}]", "[1]"]) {
      assert.throws(() => allowlistBase.parseRemoved(text, "probe"), /probe/, text);
    }
  });

  test("2.4 L154 (3) the base check still bites, run as CI runs it, against a throwaway repository: a dropped entry fails; an unknown ref, an unparsable list at the base and an unparsable list here each fail; a base with no list yet passes; and from a path with a space and through a symlink it still runs (guards F7: an unknown ref passed as \"has no list yet\", and such paths printed nothing)", () => {
    const repo = join(tmp, "allowlist base");
    mkdirSync(join(repo, "tools", "stylelint"), { recursive: true });
    cpSync(join(repoRoot, "tools", "check-allowlist-base.ts"), join(repo, "tools", "check-allowlist-base.ts"));
    const listPath = join(repo, allowlistBase.PATH);
    const git = (...args: string[]) => {
      const done = spawnSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "-c", "commit.gpgsign=false", ...args], { cwd: repo, encoding: "utf8" });
      assert.equal(done.status, 0, `git ${args.join(" ")}: ${done.stderr}`);
    };
    git("init", "-q", "-b", "main");
    git("add", "-A");
    git("commit", "-q", "-m", "no list yet");
    git("tag", "nolist");
    const a = { file: "atoms/_button.scss", selector: ".sb-button | &:hover" };
    const b = { file: "atoms/_chip.scss", selector: ".sb-chip | &:hover" };
    writeFileSync(listPath, JSON.stringify([a, b]));
    git("add", "-A");
    git("commit", "-q", "-m", "two removed");
    git("tag", "base");
    writeFileSync(join(repo, "tools", "stylelint", "x.json"), "");
    git("add", "-A");
    git("commit", "-q", "-m", "x");
    writeFileSync(listPath, "not json");
    git("add", "-A");
    git("commit", "-q", "-m", "garbled");
    git("tag", "garbled");
    const run = (ref: string, script = join(repo, "tools", "check-allowlist-base.ts")) => spawnSync(process.execPath, [script, ref], { cwd: repo, encoding: "utf8" });
    writeFileSync(listPath, JSON.stringify([b]));
    const dropped = run("base");
    assert.equal(dropped.status, 1, `a dropped entry: ${dropped.stdout}${dropped.stderr}`);
    assert.match(dropped.stderr, /atoms\/_button\.scss: \.sb-button \| &:hover/, `it names the entry: ${dropped.stderr}`);
    writeFileSync(listPath, JSON.stringify([a, b, { file: "c", selector: "d" }]));
    assert.equal(run("base").status, 0, "entries appended");
    assert.equal(run("nolist").status, 0, "a base that exists with no list yet");
    const unknown = run("origin/nope");
    assert.equal(unknown.status, 1, `an unknown ref fails closed: ${unknown.stdout}`);
    assert.match(unknown.stderr, /does not know origin\/nope/);
    assert.equal(run("garbled").status, 1, "a list at the base that does not parse");
    writeFileSync(listPath, "[");
    assert.equal(run("base").status, 1, "a list here that does not parse");
    writeFileSync(listPath, JSON.stringify([b]));
    const linked = join(tmp, "linked check.ts");
    symlinkSync(join(repo, "tools", "check-allowlist-base.ts"), linked);
    const viaLink = run("base", linked);
    assert.equal(viaLink.status, 1, `through a symlink, from a path with a space, it still runs and fails: ${viaLink.stdout}${viaLink.stderr}`);
  });

  /**
   * A start bar's horizontal offset: an inset layer with a horizontal offset and no vertical one, whatever its
   * spelling (`inset 3px 0px 0 0`, `inset 3px 0 0`, `inset 0.1875rem 0 0 0` were all unmirrored and green while the
   * test knew only `inset 3px 0 0 0`: audit of 7a683fd, guards F11). null for any other layer.
   */
  const startBarOf = (item: string) => {
    const words = item.trim().split(/\s+/);
    const lengths: string[] = [];
    for (const word of words.slice(1)) {
      if (!/^-?(?:\d+\.?\d*|\.\d+)(?:[a-z%]+)?$/i.test(word)) {
        break;
      }
      lengths.push(word);
    }
    const zero = (word: string) => /^-?(?:0+\.?0*|\.0+)(?:[a-z%]+)?$/i.test(word);
    return words[0] === "inset" && lengths.length >= 2 && !zero(lengths[0]!) && zero(lengths[1]!) ? lengths[0]! : null;
  };
  /** Every layer of a value, inside var() fallbacks too. */
  const layersOf = (value: string): string[] => splitTop(value).flatMap((item) => {
    const v = /^var\(\s*--[\w-]+\s*,([\s\S]*)\)$/.exec(item.trim());
    return v === null ? [item] : layersOf(v[1]!);
  });

  test("2.4 L156 every start bar (an inset layer with a horizontal offset and no vertical one, any spelling) is mirrored under :dir(rtl) to the negated offset, on the same element and property", () => {
    const mirrored = (sheet: ReturnType<typeof readCss>) => {
      const wrong: string[] = [];
      let bars = 0;
      for (const rule of sheet.rules) {
        for (const [property, value] of rule.decls) {
          for (const x of layersOf(value).map(startBarOf).filter((offset): offset is string => offset !== null && !offset.startsWith("-"))) {
            for (const selector of rule.selectors.filter((item) => !item.includes(":dir("))) {
              bars++;
              const mirror = sheet.rules.some((other) => other.selectors.some((item) => normalSelector(item) === normalSelector(`${selector}:dir(rtl)`)) && other.decls.some(([name, mirroredValue]) => name === property && layersOf(mirroredValue).map(startBarOf).includes(`-${x}`)));
              if (!mirror) {
                wrong.push(`${selector} { ${property}: ${value} } has no :dir(rtl) mirror`);
              }
            }
          }
        }
      }
      return { bars, wrong };
    };
    for (const bar of ["inset 3px 0px 0 0 red", "inset 3px 0 0 red", "inset 0.1875rem 0 0 0 red", "inset 3px 0 0 0 red, 0 1px 2px blue"]) {
      assert.equal(mirrored(readCss(`.x[aria-current=page] { --b: ${bar}; }`)).wrong.length, 1, `(checker) ${bar}`);
    }
    assert.deepEqual(mirrored(readCss(".x[aria-current=page] { --b: inset 3px 0px 0 0 red; } .x[aria-current=page]:dir(rtl) { --b: inset -3px 0 0 0 red; }")).wrong, [], "(checker) a mirror in another spelling");
    assert.equal(mirrored(readCss(".x { box-shadow: inset 0 -3px 0 0 red; }")).bars, 0, "(checker) the bottom bar is not a start bar");
    const { bars, wrong } = mirrored(stylesheet());
    assert.ok(bars > 0, "no start bar in the stylesheet: the probe finds nothing to hold");
    assert.deepEqual(wrong, []);
  });

  /** L161: CSS functions — the spec's list, and those the stylesheet already used at f9add57 (recorded here: blur, inset, minmax, polygon, repeat, rgba, translateX, translateY). */
  const CSS_FUNCTIONS = new Set([
    "var", "calc", "min", "max", "clamp", "color-mix", "rgb", "hsl", "oklch", "oklab", "linear-gradient", "radial-gradient", "repeating-conic-gradient",
    "url", "translate", "scale", "rotate", "cubic-bezier", "steps", "attr", "env",
    "blur", "inset", "minmax", "polygon", "repeat", "rgba", "translateX", "translateY",
  ]);
  /** What an at-rule's prelude may call besides: `@supports selector(…)`, `@container style(…)`. */
  const PRELUDE_FUNCTIONS = new Set(["selector", "style", "not", "and", "or"]);
  /**
   * The function calls in a value, by name, quoted strings skipped (a `content: "a(b)"` is text, guards F17). A name
   * with a leading `-` is a call too: `-space(2)` compiles to the literal `-space(2)` and `- space(1)` to `-var(…)`,
   * both invalid and silent, and the old pattern could not see either (audit of 7a683fd, guards F4). Only a vendor
   * spelling of a listed function (`-webkit-…`, `-moz-…`) is a CSS function with a leading dash.
   */
  const callsIn = (value: string) => [...value.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, "\"\"").matchAll(/(?:^|[^\w:-])(-?[a-zA-Z_][\w-]*)\(/g)].map((m) => m[1]!);
  const isCssFunction = (name: string, extra: Set<string> = new Set()) => CSS_FUNCTIONS.has(name) || extra.has(name) || /^-(?:webkit|moz)-/.test(name) && CSS_FUNCTIONS.has(name.replace(/^-(?:webkit|moz)-/, ""));
  /**
   * Every call that is not a CSS function: in style rules (inside @starting-style too, which readCss now reads into,
   * guards F5), in the declarations of @keyframes stops, @font-face and @property, and in at-rule preludes
   * (`@media (min-width: spcae(4))`, guards F4).
   */
  const unknownFunctions = (sheet: ReturnType<typeof readCss>) => [
    ...sheet.rules.flatMap((rule) => rule.decls.flatMap(([property, value]) => callsIn(value).filter((name) => !isCssFunction(name)).map((name) => `${rule.selectors.join(", ")} { ${property}: … ${name}(… }`))),
    ...sheet.otherDecls.flatMap(([where, property, value]) => callsIn(value).filter((name) => !isCssFunction(name)).map((name) => `${where} { ${property}: … ${name}(… }`)),
    ...sheet.atRules.flatMap((prelude) => callsIn(prelude.replace(/^@[\w-]+/, "")).filter((name) => !isCssFunction(name, PRELUDE_FUNCTIONS)).map((name) => `${prelude}: … ${name}(…`)),
  ];

  test("2.4 L161 (checker) a misspelt accessor, which Sass passes through as text, is a function call not on the list — negated, inside @starting-style or @keyframes, or in an at-rule's prelude too; a quoted string is text", () => {
    assert.deepEqual(unknownFunctions(readCss(".p { color: seem(field-fill); box-shadow: egde(container, none); font-size: button-lable(md); }")).length, 3);
    assert.deepEqual(unknownFunctions(readCss(".p { color: var(--a, rgb(0 0 0 / 0.5)); width: calc(100% - min(2px, 1vw)); content: \"seem(x)\"; }")), []);
    for (const css of [".p { margin-inline-start: -space(2); }", ".p { margin-block-start: -var(--sb-space-1); }", ".p { color: -seem(x); }", ".p:hover { color: red; } @starting-style { .p:hover { color: seem(x); } }", "@keyframes k { from { color: seem(x); } }", "@media (min-width: spcae(4)) { .p { color: red; } }", "@supports (color: seem(x)) { .p { color: red; } }"]) {
      assert.equal(unknownFunctions(readCss(css)).length, 1, css);
    }
    assert.deepEqual(unknownFunctions(readCss("@supports selector(:has(a)) { .p { -webkit-mask-image: -webkit-linear-gradient(red, blue); } } .q { margin: calc(1px - var(--x)); }")), [], "a prelude's selector(), a vendor spelling of a listed function, a subtraction");
  });

  test("2.4 L161 every function call in the compiled stylesheet's declarations, keyframes and at-rule preludes is a CSS function: no accessor is left uncompiled", () => {
    assert.deepEqual(unknownFunctions(stylesheet()), []);
  });

  // ── tools/shots-provenance.ts: where a screenshot baseline came from (L155) ─────────────────────────────────────────
  // The audit of the step-2.3/2.4 repair found the hand-run comparer could print "The frozen presets are
  // pixel-identical" over a baseline of the tree under test (F14, guards lens), and could never give the verdict
  // against e24df74 at all, because that baseline was e24df74's whole playground, whose own text counts the design
  // system's checks (F6, frozen lens). shots.ts now swaps only the library stylesheet into this tree's playground and
  // asks this module whether a compare may use a baseline. It is loaded, not imported, for the reason seams.ts is.
  let provenance: {
    baselineRefusal: (manifest: Record<string, unknown>, here: { resolve: (ref: string) => string | undefined; chromium: string; playground?: string }) => string | null;
    digestPlayground: (dist: string) => string;
    linkedStylesheet: (html: string) => string;
  } | undefined;
  let provenanceMissing = "";
  try {
    provenance = await import(new URL("../../../tools/shots-provenance.ts", import.meta.url).href);
  } catch(error) {
    provenanceMissing = (error as Error).message;
  }
  const shotsProvenance = () => {
    assert.ok(provenance, `tools/shots-provenance.ts does not load: ${provenanceMissing}`);
    return provenance;
  };
  const HEAD_SHA = "21fdd26691240a1adf594f61034fdb4e03fd829a";
  const BASE_SHA = "e24df74000000000000000000000000000000000";
  const here = { resolve: (ref: string) => ({ HEAD: HEAD_SHA, "21fdd26": HEAD_SHA, e24df74: BASE_SHA } as Record<string, string>)[ref], chromium: "153.0.0.0", playground: "p1" };
  const goodManifest = { libraryCss: "e24df74", playground: "p1", mechanism: "library-css-swap", tree: "21fdd26", chromium: "153.0.0.0", takenAt: "2026-10-05T12:00:00Z", shots: 1000 };

  test("L155 F14 (shots) a compare refuses a baseline of the tree under test: its library stylesheet at this checkout's HEAD, or from a working tree with uncommitted changes", () => {
    const { baselineRefusal } = shotsProvenance();
    assert.match(baselineRefusal({ ...goodManifest, libraryCss: "21fdd26" }, here) ?? "", /own HEAD/, "the stylesheet of HEAD itself (the audit's stub S10 printed the success line)");
    assert.match(baselineRefusal({ ...goodManifest, libraryCss: "21fdd26+dirty" }, here) ?? "", /uncommitted/, "a dirty working tree's stylesheet");
    assert.match(baselineRefusal({ ...goodManifest, libraryCss: "e24df74+dirty" }, here) ?? "", /uncommitted/, "dirty, even on another commit");
    assert.match(baselineRefusal({ ...goodManifest, libraryCss: "c0ffee0" }, here) ?? "", /not a commit/, "a stylesheet commit this checkout does not have");
  });

  test("L155 F14 F6 (shots) a compare refuses a baseline that does not say where it came from, one from another Chromium, and one shot on another playground", () => {
    const { baselineRefusal } = shotsProvenance();
    const old = Object.fromEntries(Object.entries(goodManifest).filter(([key]) => key !== "libraryCss" && key !== "playground")) as typeof goodManifest;
    assert.match(baselineRefusal(old, here) ?? "", /does not record/, "a manifest from before provenance was recorded");
    assert.match(baselineRefusal({ ...goodManifest, chromium: "152.0.0.0" }, here) ?? "", /Chromium 152/, "another Chromium");
    assert.match(baselineRefusal({ ...goodManifest, playground: "p0" }, here) ?? "", /another playground/, "another playground: a difference would not be the stylesheet's alone (F6)");
    assert.equal(baselineRefusal(goodManifest, here), null, "e24df74's stylesheet in this playground, by this Chromium, is accepted");
    assert.equal(baselineRefusal(goodManifest, { ...here, playground: undefined }), null, "before the build, the playground is not yet asked about");
  });

  test("L155 F6 (shots) the playground digest is the same for two builds that differ only in the library stylesheet, and differs for any other change", () => {
    const { digestPlayground, linkedStylesheet } = shotsProvenance();
    const site = (name: string, css: string, script: string, scriptName: string, theme: string) => {
      const dist = join(tmp, `shots-digest-${name}`);
      mkdirSync(join(dist, "assets"), { recursive: true });
      writeFileSync(join(dist, "index.html"), `<html><head><script type="module" crossorigin src="/assets/${scriptName}"></script><link rel="stylesheet" crossorigin href="/assets/index-${name}.css"></head></html>`);
      writeFileSync(join(dist, "assets", `index-${name}.css`), css);
      writeFileSync(join(dist, "assets", scriptName), script);
      writeFileSync(join(dist, "assets", "ocean-AAAA.css"), theme);
      return digestPlayground(dist);
    };
    const now = site("now", ".sb-card{box-shadow:0 0 1px red}", "render(823)", "index-N.js", ":root{--sb-bg:#fff}");
    // The bundler names the entry script after the stylesheet it ships with: same bytes, another name (measured).
    assert.equal(site("base", ".sb-card{box-shadow:none}", "render(823)", "index-B.js", ":root{--sb-bg:#fff}"), now, "another library stylesheet, same script bytes under another name");
    assert.notEqual(site("text", ".sb-card{box-shadow:none}", "render(700)", "index-B.js", ":root{--sb-bg:#fff}"), now, "the playground's own text (e24df74's whole playground, F6)");
    assert.notEqual(site("theme", ".sb-card{box-shadow:none}", "render(823)", "index-B.js", ":root{--sb-bg:#000}"), now, "a theme file");
    assert.throws(() => linkedStylesheet('<link rel="stylesheet" href="/a.css"><link rel="stylesheet" href="/b.css">'), /2 stylesheets/, "two linked stylesheets: which is the library's is not known");
  });

  const pngTools = (await import(new URL("../../../tools/png.ts", import.meta.url).href)) as { untilStable: (take: () => Promise<Buffer>, settle: () => Promise<void>, tries?: number) => Promise<Buffer> };
  const takes = (frames: string[]) => {
    let at = 0;
    return { take: async() => Buffer.from(frames[Math.min(at++, frames.length - 1)]!), count: () => at };
  };
  const unpainted = takes(["half-painted", "painted", "painted"]);
  const never = takes(["a", "b", "c", "d", "e", "f", "g", "h", "i"]);
  let [settled, unsettled, untilStableMissing] = [Buffer.from(""), Buffer.from(""), ""];
  try {
    settled = await pngTools.untilStable(unpainted.take, async() => undefined);
    unsettled = await pngTools.untilStable(never.take, async() => undefined, 4);
  } catch(error) {
    untilStableMissing = (error as Error).message;
  }

  test("L155 (shots) a shot is kept only once two takes in a row agree, and every screenshot shots.ts keeps goes through untilStable (the slider's forced :active was not always painted on the first frame: 2 of 6 fresh pages differed by up to 49 levels, read as unstable, which blocks the frozen verdict)", () => {
    assert.equal(untilStableMissing, "", "tools/png.ts has no untilStable");
    assert.equal(settled.toString(), "painted", "the first, half-painted take is not kept");
    assert.equal(unpainted.count(), 3, "it stops as soon as two takes agree");
    assert.equal([unsettled.toString(), never.count()].join(" "), "d 4", "a shot that never settles: the last of `tries` takes");
    const source = readFileSync(join(repoRoot, "tools", "shots.ts"), "utf8");
    const screenshots = [...source.matchAll(/(?:page|this\.page)\.screenshot\(/g)].length;
    const wrapped = [...source.matchAll(/untilStable\(\(\) => \(?(?:box === null \? )?(?:page|this\.page)\.screenshot\(/g)].length;
    assert.ok(screenshots > 0 && wrapped >= 2, `shots.ts takes ${screenshots} screenshot call(s), ${wrapped} of the kept ones through untilStable`);
    assert.equal(source.split("\n").filter((line) => /(?:page|this\.page)\.screenshot\(/.test(line) && !/untilStable/.test(line)).length, 0, "a screenshot taken outside untilStable");
  });

  // ══ PR 2, step 2.5 (revision 3.6, §12.5, L166 to L191): statuses carry an icon and a word ══════════════════════
  // Tests first for C10 (L182), C11's status half (L183 #50, above) and the compiled forms of L190, read off the
  // stylesheet compiled now, as C11 reads it. That each status component renders its icon and its word, and that its
  // markup is otherwise 9b83e50's, is packages/component-library/tools/test-status.ts (L181, L187 to L189), which
  // reads the built components; nothing here imports React.

  /** L182: whether the custom property --sb-<name> is read whole (the next character not a letter, a digit or `-`) in a var(--sb-<name> inside some declaration's value. */
  const readWhole = (sheet: ReturnType<typeof readCss>, name: string) => {
    const pattern = new RegExp(`var\\(\\s*--sb-${name}(?![A-Za-z0-9-])`);
    return [...sheet.rules.flatMap((rule) => rule.decls.map(([, value]) => value)), ...sheet.otherDecls.map(([, , value]) => value)].some((value) => pattern.test(value));
  };

  test("2.5 C10 L182 (checker) a read counts only as a whole name inside a declaration's value: not a longer name it begins, not a comment, not a custom property's own name; a seam-only read in a local and a keyframe's declaration count", () => {
    const sheet = readCss("/* var(--sb-a) */ .x { --sb-b: red; color: var(--sb-c-hover); --l: var(--sb-d); border: 1px solid var(--sb-e, red); } @keyframes k { from { color: var(--sb-f); } }");
    assert.deepEqual(["a", "b", "c", "c-hover", "d", "e", "f"].filter((name) => readWhole(sheet, name)), ["c-hover", "d", "e", "f"]);
  });

  test("2.5 C10 L182 every name in SEAMS, every edge property sorbet emits (each --sb-edge-X and each -hover and -press, L53), --sb-halo-room (L151) and the two label sizes (L19) is read whole in a var(--sb-<name> inside some declaration's value of the compiled stylesheet: a token no site reads is a rule passing on a value nobody paints", () => {
    assert.ok(seamsModule !== undefined, `src/tokens/seams.ts does not load: ${seamsMissing}`);
    const seams = Object.keys(seamsModule.SEAMS as Record<string, unknown>);
    assert.equal(seams.length, 20, "the 20 names of SEAMS (L15)");
    const edges = [...new Set([...themeCss(shipped.sorbet!).matchAll(/--sb-(edge-[\w-]+)\s*:/g)].map((m) => m[1]!))];
    assert.equal(edges.length, 21, `sorbet emits ${edges.length} edge properties, not L53's 21`);
    const names = [...seams, ...edges, "halo-room", "button-font-size", "button-font-size-sm"];
    assert.deepEqual(names.filter((name) => !readWhole(stylesheet(), name)).map((name) => `--sb-${name}`), [], "read by no declaration of the compiled stylesheet");
  });

  // L190: the last declaration among the rules whose selector list holds the selector as a whole item, outside
  // conditional at-rules; values compared with whitespace runs collapsed to one space, the placeholder in either
  // spelling PLACEHOLDER accepts (Sass writes `0 0 #0000` as written, and inside #{} evaluates it to
  // `0 0 rgba(0, 0, 0, 0)`). `where` narrows the rules to one cascade layer, or to those outside the sublayer.
  const PLACEHOLDER_ANYWHERE = new RegExp(`(?<![\\w.#-])${stateDefinition.PLACEHOLDER.source.replace(/^\^/, "").replace(/\$$/, "")}(?![\\w-])`, "gi");
  const asCompared = (value: string) => value.replace(/\s+/g, " ").trim().replace(PLACEHOLDER_ANYWHERE, "0 0 #0000");
  type Where = "any" | "outside the sublayer" | `sb.${string}`;
  const lastAt = (sheet: ReturnType<typeof readCss>, selector: string, property: string, where: Where) => sheet.rules
    .filter((rule) => !rule.conditional && rule.selectors.some((item) => normalSelector(item) === selector) && (where === "any" || (where === "outside the sublayer" ? !inSublayer(rule) : rule.layer === where)))
    .flatMap((rule) => rule.decls).filter(([name]) => name === property).at(-1)?.[1];
  interface FormRow {
    row: string;
    selector: string;
    where: Where;
    decls: [property: string, value: string][];
  }
  const STATUS_TONES = ["success", "warning", "danger", "info"];
  /** L175's falloff in each state, textually .sb-button--secondary's ($shadow-rest, -hover, -press). */
  const FALLOFF: Record<string, string> = {
    rest: "0 1px 2px color-mix(in oklab, var(--edge) 22%, transparent), 0 2px 6px color-mix(in oklab, var(--edge) 12%, transparent)",
    hover: "0 2px 4px color-mix(in oklab, var(--edge) 26%, transparent), 0 6px 14px color-mix(in oklab, var(--edge) 14%, transparent)",
    press: "0 1px 1px color-mix(in oklab, var(--edge) 26%, transparent), 0 1px 2px color-mix(in oklab, var(--edge) 14%, transparent)",
  };
  const edgeOfState = (element: string, state: string) => `--sb-edge-${element}${state === "rest" ? "" : `-${state}`}`;
  /** L190's table, row by row, typed in from the spec. */
  const FORMS: FormRow[] = [
    // L194 (a): inline-block round an inline glyph, so the slot has the text's baseline (it was inline-flex, -0.125em).
    { row: "(a)", selector: ".sb-status", where: "outside the sublayer", decls: [["position", "relative"], ["display", "inline-block"], ["flex-shrink", "0"], ["vertical-align", "baseline"]] },
    { row: "(b)", selector: ".sb-status", where: "sb.atoms.where-defined", decls: [["--status-ink", "var(--sb-text-strong)"], ["color", "var(--status-ink, revert-layer)"]] },
    // L170: "in the atoms layer itself, which outranks its sublayer".
    { row: "(c)", selector: ".sb-badge--solid > .sb-status", where: "sb.atoms", decls: [["color", "inherit"]] },
    { row: "(c)", selector: ".sb-button > .sb-status", where: "sb.atoms", decls: [["color", "inherit"]] },
    { row: "(e)", selector: ".sb-status-icon", where: "any", decls: [["display", "inline-block"], ["vertical-align", "middle"], ["inline-size", "1.1em"], ["block-size", "1.1em"]] },
    { row: "(e)", selector: ".sb-menu__item .sb-status-icon", where: "any", decls: [["inline-size", "1em"], ["block-size", "1em"]] },
    { row: "(e)", selector: ".sb-alert__icon > .sb-status-icon", where: "any", decls: [["display", "block"], ["inline-size", "100%"], ["block-size", "100%"]] },
    { row: "(e)", selector: ".sb-toast__icon > .sb-status-icon", where: "any", decls: [["display", "block"], ["inline-size", "100%"], ["block-size", "100%"]] },
    { row: "(e)", selector: ".sb-toast__icon", where: "any", decls: [["flex-shrink", "0"], ["inline-size", "1.25rem"], ["block-size", "1.25rem"], ["margin-block-start", "0.05em"]] },
    // L175's four lines, exactly.
    { row: "(f)", selector: ".sb-button--danger", where: "any", decls: [
      ["--danger-rim", "inset 0 0 0 2px var(--sb-danger-mark)"],
      ...["rest", "hover", "press"].map((state): [string, string] => [`--shadow-${state}`, `var(--danger-rim, 0 0 #0000), var(${edgeOfState("filled-danger", state)}, ${FALLOFF[state]})`]),
    ] },
    ...[".sb-alert", ".sb-alert--info", ".sb-alert--success", ".sb-alert--warning"].map((selector): FormRow => ({ row: "(g)", selector, where: "sb.molecules.where-defined", decls: [["box-shadow", `var(--sb-edge-status-${selector === ".sb-alert" ? "info" : selector.slice(".sb-alert--".length)}, revert-layer)`]] })),
    { row: "(h)", selector: ".sb-alert--danger", where: "sb.molecules.where-defined", decls: [["--danger-box", "inset 0 0 0 2px var(--sb-danger-mark), var(--sb-edge-status-danger, 0 0 #0000)"], ["box-shadow", "var(--danger-box, var(--sb-edge-status-danger, revert-layer))"]] },
    ...STATUS_TONES.map((tone): FormRow => ({ row: "(i)", selector: `.sb-toast--${tone}`, where: "any", decls: [["border-inline-start", `3px solid var(--sb-${tone}-mark, var(--sb-${tone}))`]] })),
    ...STATUS_TONES.map((tone): FormRow => ({ row: "(i)", selector: `.sb-icon--${tone}`, where: "any", decls: [["color", `var(--sb-${tone}-mark, var(--sb-${tone}))`]] })),
    // L194 (e): only beside the octagon, so a danger item written by hand, with no slot, keeps its glyph.
    { row: "(j)", selector: ".sb-menu__item[data-danger]:has(> .sb-status) > svg", where: "any", decls: [["display", "none"]] },
    { row: "(j)", selector: ".sb-menu__item[data-danger]:has(> .sb-status) > .sb-icon", where: "any", decls: [["display", "none"]] },
    { row: "(k)", selector: ".sb-field__error > .sb-status", where: "any", decls: [["margin-inline-end", "var(--sb-space-1)"]] },
  ];
  /** Each declaration of the rows that is not L190's form, read as L190 reads it. */
  const formFindings = (sheet: ReturnType<typeof readCss>, rows: FormRow[]) => rows.flatMap(({ row, selector, where, decls }) => decls.flatMap(([property, want]) => {
    const got = lastAt(sheet, selector, property, where);
    return got !== undefined && asCompared(got) === asCompared(want) ? [] : [`${row} ${selector}${where === "any" ? "" : ` (${where === "outside the sublayer" ? where : `in ${where}`})`} { ${property}: ${got ?? "nothing"} }, not ${want}`];
  }));
  const formsOf = (...rows: string[]) => FORMS.filter((form) => rows.includes(form.row));
  /** A selector item that names the status slot or its glyph, as a whole class. */
  const NAMES_STATUS = /\.sb-status(?:-icon)?(?![\w-])/;
  /** L194 (k): a selector item that names the slot, its glyph, or a box class the slot carries (.sb-alert__icon, .sb-toast__icon). */
  const NAMES_SLOT = /\.(?:sb-status(?:-icon)?|sb-alert__icon|sb-toast__icon)(?![\w-])/;
  /** A selector item's last compound selector, its parenthesised arguments emptied (so :has(> .x) is not split). */
  const lastCompound = (item: string) => item.replace(/\([^()]*\)/g, "()").trim().split(/\s*[>+~]\s*|\s+/).at(-1) ?? "";
  /** L194 (k): a rule whose selector item's subject is a slot (by its class or a box class it carries) declares no position but relative and no display but (a)'s, in any layer or conditional at-rule. */
  const slotBoxFindings = (sheet: ReturnType<typeof readCss>) => sheet.rules.flatMap((rule) => rule.selectors.filter((item) => /\.(?:sb-status|sb-alert__icon|sb-toast__icon)(?![\w-])/.test(lastCompound(item))).flatMap((item) => rule.decls
    .filter(([property, value]) => (property === "position" && value.trim() !== "relative") || (property === "display" && value.trim() !== "inline-block"))
    .map(([property, value]) => `${rule.layer ?? "(no layer)"}${rule.context === "" ? "" : ` ${rule.context}`} ${item} { ${property}: ${value} }`)));
  /** L170, L190 (b) and (c): the only colour declarations that may reach the slot or its glyph, by layer and selector. */
  const COLOUR_RULES = new Set(["sb.atoms.where-defined | .sb-status", "sb.atoms | .sb-badge--solid > .sb-status", "sb.atoms | .sb-button > .sb-status"]);
  /** L190 (d), widened by L194 (k): a color or a fill declared by any other rule whose selector list names the slot, its glyph or a box class the slot carries, in any layer or conditional at-rule. */
  const strayColours = (sheet: ReturnType<typeof readCss>) => sheet.rules.flatMap((rule) => rule.selectors.filter((item) => NAMES_SLOT.test(item)).flatMap((item) => rule.decls
    .filter(([property]) => property === "fill" || (property === "color" && (rule.conditional || !COLOUR_RULES.has(`${rule.layer ?? ""} | ${normalSelector(item)}`))))
    .map(([property, value]) => `${rule.layer ?? "(no layer)"}${rule.context === "" ? "" : ` ${rule.context}`} ${item} { ${property}: ${value} }`)));
  /** L169, L190: sizes are inline-size and block-size, never width or height, on the slot, its glyph and the toast's slot box. */
  const physicalSizes = (sheet: ReturnType<typeof readCss>) => sheet.rules.flatMap((rule) => rule.selectors.filter((item) => NAMES_STATUS.test(item) || /\.sb-toast__icon(?![\w-])/.test(item)).flatMap((item) => rule.decls
    .filter(([property]) => /^(?:min-|max-)?(?:width|height)$/.test(property)).map(([property, value]) => `${item} { ${property}: ${value} }`)));
  /** L190 (f): every selector but .sb-button--danger that declares --danger-rim. */
  const otherRims = (sheet: ReturnType<typeof readCss>) => sheet.rules.filter((rule) => rule.decls.some(([property]) => property === "--danger-rim")).flatMap((rule) => rule.selectors.map(normalSelector)).filter((selector) => selector !== ".sb-button--danger");
  /** L175: the danger button's three shadows, each the rim and then .sb-button--secondary's falloff for the same state; the other three filled variants as today, no rim. */
  const filledShadowFindings = (sheet: ReturnType<typeof readCss>) => ["rest", "hover", "press"].flatMap((state) => {
    const property = `--shadow-${state}`;
    const secondary = lastAt(sheet, ".sb-button--secondary", property, "any") ?? "";
    const falloff = varCalls(secondary)[0]?.fallback;
    const findings: string[] = [];
    if (falloff === undefined || asCompared(secondary) !== asCompared(`var(${edgeOfState("filled-secondary", state)}, ${falloff})`)) {
      findings.push(`.sb-button--secondary { ${property}: ${secondary} } is not an edge read with its falloff`);
    } else {
      const danger = lastAt(sheet, ".sb-button--danger", property, "any");
      if (danger === undefined || asCompared(danger) !== asCompared(`var(--danger-rim, 0 0 #0000), var(${edgeOfState("filled-danger", state)}, ${falloff})`)) {
        findings.push(`.sb-button--danger { ${property}: ${danger ?? "nothing"} }: not the rim and then .sb-button--secondary's falloff`);
      }
    }
    for (const [selector, element] of [[".sb-button", "filled-primary"], [".sb-button--secondary", "filled-secondary"], [".sb-button--accent", "filled-accent"]]) {
      const got = lastAt(sheet, selector!, property, "any");
      if (got === undefined || asCompared(got) !== asCompared(`var(${edgeOfState(element!, state)}, ${FALLOFF[state]})`)) {
        findings.push(`${selector} { ${property}: ${got ?? "nothing"} }: a filled variant other than danger passes no rim and compiles as today (L175)`);
      }
    }
    return findings;
  });

  test("2.5 L190 (checker) the readings of L190 pass the compiled forms the spec gives, in either spelling of the placeholder, and each fails when one of its declarations is removed, moved to another layer, or added elsewhere", () => {
    const good = `@layer sb.atoms {
  .sb-button { --shadow-rest: var(--sb-edge-filled-primary, ${FALLOFF.rest}); --shadow-hover: var(--sb-edge-filled-primary-hover, ${FALLOFF.hover}); --shadow-press: var(--sb-edge-filled-primary-press, ${FALLOFF.press}); }
  .sb-button--secondary { --shadow-rest: var(--sb-edge-filled-secondary, ${FALLOFF.rest}); --shadow-hover: var(--sb-edge-filled-secondary-hover, ${FALLOFF.hover}); --shadow-press: var(--sb-edge-filled-secondary-press, ${FALLOFF.press}); }
  .sb-button--accent { --shadow-rest: var(--sb-edge-filled-accent, ${FALLOFF.rest}); --shadow-hover: var(--sb-edge-filled-accent-hover, ${FALLOFF.hover}); --shadow-press: var(--sb-edge-filled-accent-press, ${FALLOFF.press}); }
  .sb-button--danger { --edge: var(--sb-danger); --danger-rim: inset 0 0 0 2px var(--sb-danger-mark); --shadow-rest: var(--danger-rim, 0 0 #0000), var(--sb-edge-filled-danger, ${FALLOFF.rest}); --shadow-hover: var(--danger-rim, 0 0 #0000), var(--sb-edge-filled-danger-hover, ${FALLOFF.hover}); --shadow-press: var(--danger-rim, 0 0 #0000), var(--sb-edge-filled-danger-press, ${FALLOFF.press}); }
  .sb-button > .sb-status { color: inherit; }
  .sb-badge--solid > .sb-status { color: inherit; }
  .sb-status { position: relative; display: inline-block; flex-shrink: 0; vertical-align: baseline; }
  .sb-status-icon { display: inline-block; vertical-align: middle; inline-size: 1.1em; block-size: 1.1em; }
  ${STATUS_TONES.map((tone) => `.sb-icon--${tone} { color: var(--sb-${tone}-mark, var(--sb-${tone})); }`).join("\n  ")}
  @layer where-defined {
    .sb-status { --status-ink: var(--sb-text-strong); color: var(--status-ink, revert-layer); }
  }
}
@layer sb.molecules {
  .sb-alert__icon { flex-shrink: 0; inline-size: 1.25rem; block-size: 1.25rem; margin-block-start: 0.05em; }
  .sb-alert__icon > .sb-status-icon { display: block; inline-size: 100%; block-size: 100%; }
  .sb-toast__icon { flex-shrink: 0; inline-size: 1.25rem; block-size: 1.25rem; margin-block-start: 0.05em; }
  .sb-toast__icon > .sb-status-icon { display: block; inline-size: 100%; block-size: 100%; }
  .sb-menu__item .sb-status-icon { inline-size: 1em; block-size: 1em; }
  .sb-menu__item[data-danger]:has(> .sb-status) > svg, .sb-menu__item[data-danger]:has(> .sb-status) > .sb-icon { display: none; }
  .sb-field__error > .sb-status { margin-inline-end: var(--sb-space-1); }
  ${STATUS_TONES.map((tone) => `.sb-toast--${tone} { border-inline-start: 3px solid var(--sb-${tone}-mark, var(--sb-${tone})); }`).join("\n  ")}
  @layer where-defined {
    .sb-alert { box-shadow: var(--sb-edge-status-info, revert-layer); }
    .sb-alert--success { box-shadow: var(--sb-edge-status-success, revert-layer); }
    .sb-alert--warning { box-shadow: var(--sb-edge-status-warning, revert-layer); }
    .sb-alert--danger { --danger-box: inset 0 0 0 2px var(--sb-danger-mark), var(--sb-edge-status-danger, 0 0 rgba(0, 0, 0, 0)); box-shadow: var(--danger-box, var(--sb-edge-status-danger, revert-layer)); }
    .sb-alert--info { box-shadow: var(--sb-edge-status-info, revert-layer); }
  }
}`;
    const all = (css: string) => [...formFindings(readCss(css), FORMS), ...strayColours(readCss(css)), ...slotBoxFindings(readCss(css)), ...physicalSizes(readCss(css)), ...otherRims(readCss(css)), ...filledShadowFindings(readCss(css))];
    assert.deepEqual(all(good), [], "the spec's forms");
    const swap = (from: string, to: string) => {
      assert.ok(good.includes(from), from);
      return all(good.replace(from, to));
    };
    assert.deepEqual(swap("0 0 rgba(0, 0, 0, 0))", "0 0 #0000)"), [], "the placeholder in the other spelling");
    assert.equal(swap("position: relative; ", "").length, 1, "L186: (a) without position: relative");
    assert.equal(swap("display: inline-block; flex-shrink: 0; vertical-align: baseline;", "display: inline-flex; flex-shrink: 0; vertical-align: -0.125em;").length, 3, "L194 (a): the inline-flex slot that lifted the badge off the text: (a) twice, and a display (k) refuses");
    assert.equal(swap(".sb-status-icon { display: inline-block; vertical-align: middle; ", ".sb-status-icon { ").length, 2, "L194 (a): the glyph not inline and centred");
    assert.equal(swap(".sb-alert__icon > .sb-status-icon { display: block; ", ".sb-alert__icon > .sb-status-icon { ").length, 1, "L194 (a): the alert's glyph not a block in its box");
    // L194 (k): rules that reach the slot through another selector, each of which once passed and broke the page.
    assert.equal(all(`${good} @layer sb.atoms { .sb-badge > .sb-status { position: static; } }`).length, 1, "(k) the slot made static through the badge (the page 625px wide at 390)");
    assert.equal(all(`${good} @layer sb.molecules { .sb-alert__icon { position: static; } }`).length, 1, "(k) the alert's slot made static through its box class (633px)");
    assert.equal(all(`${good} @layer sb.molecules { .sb-toast__icon { display: flex; } }`).length, 1, "(k) the toast's slot given another display through its box class");
    assert.equal(all(`${good} @layer sb.molecules { .sb-alert__icon { color: red; } }`).length, 1, "(k) the alert's icon recoloured through its box class");
    assert.equal(all(`${good} @layer sb.molecules { .sb-toast__icon { color: red; } }`).length, 1, "(k) the toast's icon recoloured through its box class");
    assert.equal(all(`${good} @layer sb.molecules { .sb-alert__icon > .sb-status-icon { position: absolute; } }`).length, 0, "(k) reads the slot, not its glyph: the glyph's own position is not the word's containing block");
    assert.equal(swap("@layer where-defined {\n    .sb-status { --status-ink", "@layer other {\n    .sb-status { --status-ink").length, 3, "(b) outside the sublayer: two declarations not found there, and its color a stray (d)");
    assert.equal(swap(".sb-button > .sb-status { color: inherit; }", "@layer where-defined { .sb-button > .sb-status { color: inherit; } }").length, 2, "(c) in the sublayer it would not outrank: not found in sb.atoms, and a stray (d)");
    assert.equal(swap(".sb-status-icon { inline-size", ".sb-status-icon { color: red; fill: red; inline-size").length, 2, "(d) a color and a fill on the glyph");
    assert.equal(all(`${good} @media (min-width: 1px) { .sb-alert .sb-status { color: red; } }`).length, 1, "(d) inside a conditional rule");
    assert.equal(swap(".sb-status-icon { display: inline-block; vertical-align: middle; inline-size: 1.1em; block-size: 1.1em; }", ".sb-status-icon { display: inline-block; vertical-align: middle; width: 1.1em; height: 1.1em; }").length, 4, "(e) width and height instead of inline-size and block-size");
    assert.equal(swap(".sb-toast__icon { flex-shrink: 0; ", ".sb-toast__icon { ").length, 1, "(e) the toast's slot box");
    assert.equal(swap(".sb-button--accent { --shadow-rest", ".sb-button--accent { --danger-rim: inset 0 0 0 2px red; --shadow-rest").length, 1, "(f) --danger-rim declared on another selector");
    assert.ok(swap("--shadow-hover: var(--danger-rim, 0 0 #0000), ", "--shadow-hover: ").length >= 2, "(f) the rim missing from the hover shadow (L152: it never vanishes on hover)");
    assert.ok(swap(`.sb-button--secondary { --shadow-rest: var(--sb-edge-filled-secondary, ${FALLOFF.rest})`, ".sb-button--secondary { --shadow-rest: var(--sb-edge-filled-secondary, 0 1px 3px red)").length >= 2, "(f) the falloff is .sb-button--secondary's: secondary changed alone, so danger's no longer matches it");
    assert.equal(swap(".sb-button--accent { --shadow-rest: var(--sb-edge-filled-accent, ", ".sb-button--accent { --shadow-rest: var(--danger-rim, 0 0 #0000), var(--sb-edge-filled-accent, ").length, 1, "L175: another filled variant gained the rim");
    assert.equal(swap("    .sb-alert { box-shadow: var(--sb-edge-status-info, revert-layer); }\n", "").length + all(good.replace("    .sb-alert { box-shadow: var(--sb-edge-status-info, revert-layer); }\n", "").replace("@layer sb.molecules {", "@layer sb.molecules {\n  .sb-alert { box-shadow: var(--sb-edge-status-info, revert-layer); }")).length, 2, "(g) .sb-alert's edge missing, or outside the sublayer");
    assert.equal(swap("var(--sb-edge-status-danger, 0 0 rgba(0, 0, 0, 0))", "var(--sb-edge-status-danger, 0 0 1px red)").length, 1, "(h) a fallback that is not the placeholder");
    assert.equal(swap("var(--danger-box, var(--sb-edge-status-danger, revert-layer))", "var(--danger-box, revert-layer)").length, 1, "(h) the danger box without the edge alone as its fallback (S44)");
    assert.equal(swap(".sb-toast--success { border-inline-start: 3px solid var(--sb-success-mark, var(--sb-success)); }", ".sb-toast--success { border-inline-start: 3px solid var(--sb-success); }").length, 1, "(i) the stripe not re-pointed (L179)");
    assert.equal(swap(".sb-icon--info { color: var(--sb-info-mark, var(--sb-info)); }", ".sb-icon--info { color: var(--sb-info); }").length, 1, "(i) the Icon atom's info tone not re-pointed (L179)");
    assert.equal(swap(", .sb-menu__item[data-danger]:has(> .sb-status) > .sb-icon { display", " { display").length, 1, "(j) a consumer's .sb-icon left beside the octagon (L176)");
    assert.equal(swap(".sb-menu__item[data-danger]:has(> .sb-status) > svg, .sb-menu__item[data-danger]:has(> .sb-status) > .sb-icon", ".sb-menu__item[data-danger] > svg, .sb-menu__item[data-danger] > .sb-icon").length, 2, "L194 (e): the glyph hidden in a danger item with no octagon too");
    assert.equal(swap("margin-inline-end: var(--sb-space-1)", "margin-inline-end: 4px").length, 1, "(k)");
  });

  test("2.5 L186 L190 (a) L194 (a) (k) the status slot is its word's containing block and keeps the text's baseline: among the rules whose selector list holds .sb-status, outside conditional at-rules and the where-defined sublayer, the last position is relative and the last display inline-block; flex-shrink 0 and vertical-align baseline; and no rule whose subject is a slot, by any of its classes, declares another position or display", () => {
    assert.deepEqual([...formFindings(stylesheet(), formsOf("(a)")), ...slotBoxFindings(stylesheet())], []);
  });

  test("2.5 L170 L190 (b) the slot's ink: in sb.atoms.where-defined, .sb-status sets --status-ink from text-strong with no fallback and reads color: var(--status-ink, revert-layer), so a theme without text-strong computes the colour the slot inherits", () => {
    assert.deepEqual(formFindings(stylesheet(), formsOf("(b)")), []);
  });

  test("2.5 L170 L190 (c) on a full-strength fill the slot takes the label's ink: .sb-badge--solid > .sb-status and .sb-button > .sb-status set color: inherit, in the atoms layer itself, which outranks its sublayer", () => {
    assert.deepEqual(formFindings(stylesheet(), formsOf("(c)")), []);
  });

  test("2.5 L170 L190 (d) L194 (k) those are the only colour declarations that reach a status slot or its glyph: no other rule whose selector list names .sb-status, .sb-status-icon, .sb-alert__icon or .sb-toast__icon declares color, and none declares fill", () => {
    assert.deepEqual(strayColours(stylesheet()), []);
  });

  test("2.5 L169 L172 L173 L190 (e) L194 (a) the glyph's sizes: 1.1em, inline and centred on the text; 1em in a menu item; a block of 100% of the 1.25rem slot leading an alert or a toast, the toast's slot box copying the alert's; always inline-size and block-size, never width or height", () => {
    assert.deepEqual([...formFindings(stylesheet(), formsOf("(e)")), ...physicalSizes(stylesheet())], []);
  });

  test("2.5 L175 L190 (f) the danger button's rim: .sb-button--danger reads L175's four lines, the falloff in each textually .sb-button--secondary's for the same state; no other selector declares --danger-rim; the other filled variants pass no rim and compile as today", () => {
    assert.deepEqual([...formFindings(stylesheet(), formsOf("(f)")), ...filledShadowFindings(stylesheet()), ...otherRims(stylesheet()).map((selector) => `${selector} declares --danger-rim`)], []);
  });

  test("2.5 L178 L190 (g) the status boxes' edges: in sb.molecules.where-defined, .sb-alert and .sb-alert--info read box-shadow: var(--sb-edge-status-info, revert-layer), .sb-alert--success and --warning their own tone's", () => {
    assert.deepEqual(formFindings(stylesheet(), formsOf("(g)")), []);
  });

  test("2.5 L178 L190 (h) the danger box's rim and edge: in sb.molecules.where-defined, --danger-box is the rim over the edge read with the placeholder, and box-shadow reads it falling back to the edge alone, then to revert-layer", () => {
    assert.deepEqual(formFindings(stylesheet(), formsOf("(h)")), []);
  });

  test("2.5 L179 L190 (i) the two colours re-pointed to the marks: each status toast's stripe is 3px solid var(--sb-X-mark, var(--sb-X)), and the Icon atom's four status tones are color: var(--sb-X-mark, var(--sb-X))", () => {
    assert.deepEqual(formFindings(stylesheet(), formsOf("(i)")), []);
  });

  test("2.5 L176 L190 (j) L194 (e) in a danger menu item a consumer's leading glyph is hidden beside the octagon, which takes its place: .sb-menu__item[data-danger]:has(> .sb-status) > svg and > .sb-icon are display: none, and a hand-written danger item with no slot keeps its glyph", () => {
    assert.deepEqual(formFindings(stylesheet(), formsOf("(j)")), []);
  });

  test("2.5 L177 L190 (k) the field's error message spaces its slot from the message: .sb-field__error > .sb-status has margin-inline-end: var(--sb-space-1)", () => {
    assert.deepEqual(formFindings(stylesheet(), formsOf("(k)")), []);
  });

  test("2.5 L167 (shots) shots.ts declares the constant MASK, exactly .sb-status{display:none!important}, and its success line says the status icons were masked, after the variants and before the parenthesis", () => {
    const source = readFileSync(join(repoRoot, "tools", "shots.ts"), "utf8");
    assert.match(source, /\bconst MASK\s*=\s*"\.sb-status\{display:none!important\}";/, "no `const MASK = \".sb-status{display:none!important}\";` in tools/shots.ts");
    const line = source.split("\n").find((text) => text.includes("The frozen presets are pixel-identical to"));
    assert.ok(line !== undefined, "no success line in tools/shots.ts");
    assert.match(line, /in both modes, in \$\{[^}]*\}, with the status icons masked \(.* shots, control stable\)\./, line.trim());
  });

  legibilityCount = ran - legibilityFrom;

  // ══ docs/existing-defects/spec.md (revision 3): the source and built-CSS checks of E6, E7 and E10 ═══════════════
  // Written from the spec before the fix (E4). E6 and E7 read the BUILT stylesheet, packages/design-system/dist/css/
  // sorbet.css, as the spec says: CI's build job builds before this step; locally, run pnpm build first.
  const builtCss = () => {
    const file = join(pkgRoot, "dist", "css", "sorbet.css");
    assert.ok(existsSync(file), `${posix(file)} does not exist: run pnpm build first`);
    return readFileSync(file, "utf8");
  };
  /** A plain number with no unit: "2", "-1.5", ".5", "1e3". */
  const UNITLESS = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;

  test("E6 (existing-defects) the built dist/css/sorbet.css has no outline-offset whose value is a number other than 0 without a unit (red on main: three, _color-input.scss's focus-ring(2) twice and focus-ring(1))", () => {
    const sheet = readCss(builtCss());
    const bad = (value: string) => UNITLESS.test(value) && Number(value) !== 0;
    const wrong = [
      ...sheet.rules.flatMap((rule) => rule.decls.filter(([property, value]) => property === "outline-offset" && bad(value)).map(([, value]) => `${rule.selectors.join(", ")} { outline-offset: ${value} }`)),
      ...sheet.otherDecls.filter(([, property, value]) => property === "outline-offset" && bad(value)).map(([where, , value]) => `${where} { outline-offset: ${value} }`),
    ];
    assert.deepEqual(wrong, []);
  });

  test("E6 (guard) focus-ring-style (abstracts/_mixins.scss) raises a Sass @error for a unitless offset other than 0, so it cannot recur: focus-ring-style(1) and focus-ring(2) fail the compile; 0, 2px and -2px compile", () => {
    for (const body of ["@include focus-ring-style(1);", "@include focus-ring(2);"]) {
      const out = compileProbe(body);
      assert.ok("error" in out, `${body} compiled, to ${"decls" in out ? shown(out.decls) : ""}: a unitless offset other than 0 must be a Sass @error (E6)`);
    }
    for (const offset of ["0", "2px", "-2px"]) {
      compiled(`@include focus-ring-style(${offset});`, `focus-ring-style(${offset})`);
    }
  });

  test("E7 (existing-defects) with comments removed, the declaration outline: token(focus-ring-width) solid clr(focus-ring) occurs in the library Sass exactly twice, once in abstracts/_mixins.scss and once in atoms/_color-input.scss (red on main: three, base/_root.scss's too)", () => {
    const declaration = /\boutline\s*:\s*token\(\s*focus-ring-width\s*\)\s+solid\s+clr\(\s*focus-ring\s*\)/g;
    const found = Object.fromEntries(partials().map(({ path, text }) => [path, text.match(declaration)?.length ?? 0]).filter(([, n]) => (n as number) > 0));
    assert.deepEqual(found, { "abstracts/_mixins.scss": 1, "atoms/_color-input.scss": 1 }, "the declaration, by file");
  });

  // Main's rule, text for text: recorded from the built stylesheet of 9fae5d5, whose code is origin/main's (E7).
  const FOCUS_VISIBLE_AT_MAIN = "  :focus-visible {\n    outline: var(--sb-focus-ring-width) solid var(--sb-focus-ring);\n    outline-offset: 2px;\n  }";
  test("E7 (existing-defects) the built CSS's :focus-visible rule in sb.base equals main's, text for text", () => {
    const text = builtCss();
    const sheet = readCss(text);
    const rules = sheet.rules.filter((rule) => rule.layer === "sb.base" && !rule.conditional && rule.selectors.length === 1 && rule.selectors[0] === ":focus-visible");
    assert.equal(rules.length, 1, "one :focus-visible rule in sb.base");
    assert.deepEqual(rules[0]!.decls, [["outline", "var(--sb-focus-ring-width) solid var(--sb-focus-ring)"], ["outline-offset", "2px"]], "its declarations");
    const base = /^@layer sb\.base \{\n([\s\S]*?)\n\}$/m.exec(text)?.[1] ?? "";
    const raw = [...base.matchAll(/^ {2}:focus-visible \{\n[\s\S]*?\n {2}\}/gm)].map((m) => m[0]);
    assert.deepEqual(raw, [FOCUS_VISIBLE_AT_MAIN], "the rule's text in the @layer sb.base block");
  });

  test("E10 (existing-defects) src/tokens/semantics.ts no longer contains \"PRIMARY is exempt\" (red on main: its comment at :51-61), nor across a comment's line break", () => {
    const text = readFileSync(join(pkgRoot, "src", "tokens", "semantics.ts"), "utf8");
    assert.ok(!text.includes("PRIMARY is exempt"), "semantics.ts contains \"PRIMARY is exempt\"");
    const joined = text.replace(/\s*\n\s*(?:\*(?!\/)|\/\/)?\s*/g, " ");
    assert.ok(!joined.includes("PRIMARY is exempt"), "semantics.ts contains \"PRIMARY is exempt\" across a line break of its comment");
  });

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
