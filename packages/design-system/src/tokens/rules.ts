/**
 * The accessibility contract's rules: which pairs of semantic colours are
 * compared. A preset must hold every pair its contract lists, in both modes;
 * the build fails otherwise.
 *
 * A rule carries no number. It names a pair, the tier the pair belongs to and
 * why the pair is here. What a tier owes is the contract's to say
 * (contracts.ts, where every floor is written beside its reason), and which
 * contract judges a preset is the preset's to declare (presets.ts, read by
 * `contractOf` below). The number used to sit on the rule, which made this
 * list the only contract there could be.
 *
 * The list is RULES; the measurement is `measureColors`, and there is one of
 * it. Everything that speaks for the contract reads its result — the build
 * gate (`checkPreset`), the reports (tools/check-contrast.ts, `sorbet
 * contrast`, the scaffold's copy) and Token Studio's live check
 * (`checkColors`). Nothing else walks RULES.
 *
 * One measurement is not yet one answer: each surface hands it colours from a
 * different place. The gate and the reports read the presets; Token Studio
 * reads text back off the page, where a minifier may have respelled every
 * value. So the colours are read in one place too — `parseColor` in color.ts —
 * and a colour measures the same however it arrives.
 */

import { worstCaseContrast } from "./color.ts";
import { contractNamed, contracts, floorFor, TIER_KIND, TIERS, type ContractName, type Kind, type Tier } from "./contracts.ts";

import type { Preset } from "./presets.ts";
import type { Mode, SemanticColorName, SemanticColors } from "./semantics.ts";

/** One pair of the contract: `fg` must be told from `bg`. How far apart is the contract's to say, by tier. */
export interface Rule {
  fg: SemanticColorName;
  bg: SemanticColorName;
  /** The group of rules this one owes the same floor as (contracts.ts). The tier's kind and its floor are read from there, never restated here. */
  tier: Tier;
  /** One sentence: why this pair is in the contract. A pair nobody can give a reason for is a pair nobody dares remove. */
  why: string;
  /** Restrict the rule to one mode (default: checked in both). */
  mode?: Mode;
}

type Pair = readonly [fg: SemanticColorName, bg: SemanticColorName];

/** The rules for pairs that share a tier and a reason: the reason is written once, for every pair it covers. */
const held = (tier: Tier, why: string, pairs: readonly Pair[]): Rule[] => pairs.map(([fg, bg]) => ({ fg, bg, tier, why }));

const onSurfaces = (fg: SemanticColorName): Pair[] =>
  (["bg", "bg-subtle", "surface", "surface-raised", "surface-sunken"] as const).map((bg) => [fg, bg]);

export const RULES: Rule[] = [
  ...held("text", "Body copy is set on the page and on every surface laid over it, so it has to read on all five.", onSurfaces("text")),
  ...held("text", "Secondary copy — captions, help text, metadata — is still read, on the page and on every surface laid over it.", onSurfaces("text-muted")),
  ...held("text-subtle", "Placeholders, separators and icon-weight hints sit on the page and on a surface, and have to be seen there.", [
    ["text-subtle", "bg"],
    ["text-subtle", "surface"],
  ]),
  ...held("control-border", "`border-strong` is the edge that says where an input is, against the page and against a surface (WCAG 1.4.11).", [
    ["border-strong", "bg"],
    ["border-strong", "surface"],
  ]),
  ...held("focus", "The focus ring is the only sign of where the keyboard is, and it is drawn against the page or a surface.", [
    ["focus-ring", "bg"],
    ["focus-ring", "surface"],
  ]),
  ...held("text", "A link is text in the middle of body copy, on the page or on a surface.", [
    ["link", "bg"],
    ["link", "surface"],
  ]),
  ...held("text", "A link is still being read while the pointer is over it.", [["link-hover", "bg"]]),

  // The scrim is translucent, so these are checked as worst-case composites:
  // the scrim over pure white AND over pure black — the extremes of whatever
  // image sits behind it. Text over a scrim is a promise about ANY photo.
  ...held("scrim", "Text over the scrim has to read over ANY image behind it, so the pair is measured at the scrim's worst composite, between pure white and pure black.", [
    ["on-scrim", "scrim"],
    ["on-scrim-muted", "scrim"],
  ]),

  ...held("text", "A primary button's label is read on its fill in every state the fill takes: at rest, hovered and pressed.", [
    ["on-primary", "primary"],
    ["on-primary", "primary-hover"],
    ["on-primary", "primary-active"],
  ]),
  ...held("text", "`primary-text` is brand-coloured text: on the page, on a surface, and on its own subtle tint (badges, alerts).", [
    ["primary-text", "bg"],
    ["primary-text", "surface"],
    ["primary-text", "primary-subtle"],
  ]),
  // The shape-maker answers to the page (WCAG 1.4.11 non-text contrast): it
  // paints affordances that have no label to carry them. `primary` itself is
  // exempt because it is always the fill BEHIND a label, which `on-primary`
  // covers; holding it to the shape floor as well is what forced every pastel
  // brand deep.
  ...held("shape", "`primary-solid` paints affordances that have no label to carry them — checkbox fills, slider tracks, tab indicators, switch tracks, spinners — so the fill itself has to stand out from the page and from a surface (WCAG 1.4.11).", [
    ["primary-solid", "bg"],
    ["primary-solid", "surface"],
  ]),
  ...held("shape", "Secondary and accent paint no affordances, but a pastel fill still needs an edge that can be seen against the page: its `-solid` is the button's border.", [
    ["secondary-solid", "bg"],
    ["accent-solid", "bg"],
  ]),

  ...held("text", "A secondary button's label is read on its fill at rest, hovered and pressed.", [
    ["on-secondary", "secondary"],
    ["on-secondary", "secondary-hover"],
    ["on-secondary", "secondary-active"],
  ]),
  ...held("text", "`secondary-text` is brand-coloured text, on the page and on its own subtle tint.", [
    ["secondary-text", "bg"],
    ["secondary-text", "secondary-subtle"],
  ]),

  ...held("text", "An accent button's label is read on its fill at rest, hovered and pressed.", [
    ["on-accent", "accent"],
    ["on-accent", "accent-hover"],
    ["on-accent", "accent-active"],
  ]),
  ...held("text", "`accent-text` is brand-coloured text, on the page and on its own subtle tint.", [
    ["accent-text", "bg"],
    ["accent-text", "accent-subtle"],
  ]),

  ...held("text", "The label on a success fill (a button, a badge) is read on it.", [["on-success", "success"]]),
  ...held("text", "`success-text` is the status said in words, on the page and on its own subtle tint (alerts, badges).", [
    ["success-text", "bg"],
    ["success-text", "success-subtle"],
  ]),
  ...held("text", "The label on a warning fill (a button, a badge) is read on it.", [["on-warning", "warning"]]),
  ...held("text", "`warning-text` is the status said in words, on the page and on its own subtle tint (alerts, badges).", [
    ["warning-text", "bg"],
    ["warning-text", "warning-subtle"],
  ]),
  ...held("text", "A destructive button's label is read on its fill at rest and hovered.", [
    ["on-danger", "danger"],
    ["on-danger", "danger-hover"],
  ]),
  ...held("text", "`danger-text` is the status said in words, on the page and on its own subtle tint (alerts, badges, field errors).", [
    ["danger-text", "bg"],
    ["danger-text", "danger-subtle"],
  ]),
  ...held("text", "The label on an info fill (a button, a badge) is read on it.", [["on-info", "info"]]),
  ...held("text", "`info-text` is the status said in words, on the page and on its own subtle tint (alerts, badges).", [
    ["info-text", "bg"],
    ["info-text", "info-subtle"],
  ]),

  // Chart marks are non-text UI. Each slot is still one entry per mode, as it
  // was when each entry carried its own number: what the two modes owe is the
  // `chart` tier's to say now (a floor per mode, in contracts.ts, with the
  // reason dark mode's is lower), and the list keeps its entries and their
  // order so that what is measured can be shown not to have moved. (CVD
  // adjacency and lightness-band checks ran at design time; see charts.ts.)
  ...(["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6", "chart-7", "chart-8"] as const).flatMap((slot): Rule[] => {
    const why = "A chart mark — a bar, a line, a point — is non-text UI that has to be told from the surface or the page it is drawn on, in the palette of the mode it is drawn in.";
    return [
      { fg: slot, bg: "surface", tier: "chart", why, mode: "light" },
      { fg: slot, bg: "bg", tier: "chart", why, mode: "light" },
      { fg: slot, bg: "surface", tier: "chart", why, mode: "dark" },
      { fg: slot, bg: "bg", tier: "chart", why, mode: "dark" },
    ];
  }),
];

/** One rule of the contract, measured against one colour record. */
export interface Measurement {
  fg: SemanticColorName;
  bg: SemanticColorName;
  /** The rule's tier. */
  tier: Tier;
  /** What that tier protects: TIER_KIND[tier]. */
  kind: Kind;
  /** The floor the CONTRACT set for this pair in this mode: its tier's floor. */
  min: number;
  /**
   * The measured ratio — or null: the pair could NOT be measured. That is a
   * translucent foreground, or a value on either side that is missing or that
   * `parseColor` cannot read. A translucent BACKGROUND is measurable: the
   * worst case over every backdrop from white to black.
   */
  actual: number | null;
  /** True only for a pair that was measured and met its floor. */
  holds: boolean;
}

const MODES: readonly Mode[] = ["light", "dark"];

/** A value as an error message shows it: a string in its quotes, so `"text "` and `""` can be told from what they are not, and a number as itself (JSON turns NaN into null). */
const shown = (value: unknown): string => (typeof value === "number" ? String(value) : JSON.stringify(value) ?? String(value));

/** Null for anything worstCaseContrast cannot read, a value that is not there included. */
function measure(fg: string | undefined, bg: string | undefined): number | null {
  if (typeof fg !== "string" || typeof bg !== "string") {
    return null;
  }
  return worstCaseContrast(fg, bg);
}

/**
 * THE measurement: every rule that applies in `mode` and that `contract`
 * holds, in RULES order, each with the floor the contract set for it and what
 * it measured.
 *
 * It exists because the contract used to be measured in five places that did
 * not agree. The gate measured every pair; the three reports each carried a
 * hand copy of the loop that skipped any pair with a translucent side — the
 * two scrim pairs — and then printed RULES.length as the number of pairings
 * that pass: 86, when 70 apply in a mode and 68 had been measured. So a list
 * goes out, not a verdict, and a surface prints the length of what it was
 * handed. tools/test-contrast.ts fails if one of them measures for itself again.
 *
 * It never skips a pair the contract holds, and no colour makes it throw. A
 * pair it cannot measure comes back with `actual: null` and `holds: false` — a
 * failure that names the pair. "No claim" used to be dropped here in silence,
 * which reads exactly like a pass. A record that is not there at all is every
 * pair unmeasurable, the same answer as an empty one.
 *
 * The contract is REQUIRED. There is no default: a default is a second place
 * that decides which contract a preset is held to, and the one a later change
 * forgets to flip. A caller that measures a preset passes
 * `contractOf(preset, mode)`.
 *
 * One kind of rule produces no measurement, and it is not a failure: a rule
 * whose tier is a known tier the contract does not list. The contract does not
 * hold it. (A rule of the other mode is not measured either, as ever.) What
 * could be MISTAKEN for either is refused with a TypeError, because each one
 * would otherwise read as a pass:
 *
 *   - a mode that does not exist ("system", "Light", undefined — reachable
 *     only past the type checker). There is no list to return for one: the
 *     chart rules belong to a mode each, so the old filter quietly returned 54
 *     pairs instead of 70 and reported nothing about the 16. It is checked
 *     first, so it is the error a bad mode gets whatever else is wrong;
 *   - a contract that does not exist, or one that is not sound as a whole: a
 *     key in its tier map that is not a tier, a floor nothing can be judged
 *     by in EITHER mode, a name that is not its key (`contractNamed`, through
 *     `floorFor`). An unknown name is never treated as `wcag-aa`;
 *   - a rule whose tier is not one of TIERS — in ANY rule of the list, not
 *     only those of this mode. A mistyped tier matches no contract's list, so
 *     without this it is a rule nobody is held to, and nothing says so;
 *   - a rule whose `mode` is there and is not "light" or "dark" ("Dark",
 *     "both") — again in ANY rule. Such a rule belongs to no mode, so it used
 *     to be skipped in both and never measured at all;
 *   - a contract that ends up holding nothing in this mode: an empty tier map,
 *     or one that lists only tiers no rule uses. A contract over nothing
 *     passes everything.
 *
 * What is NOT refused here: a rule naming a colour that does not exist. It is
 * measured, comes back `actual: null`, and fails by name.
 */
export function measureColors(mode: Mode, colors: Partial<SemanticColors> | undefined, contract: ContractName): Measurement[] {
  if (!(MODES as readonly unknown[]).includes(mode)) {
    throw new TypeError(`measureColors: the mode must be "light" or "dark", got ${shown(mode)}`);
  }
  // Each tier's floor, asked once and for every tier. floorFor validates the
  // whole contract, so an unknown or unsound one is refused before anything
  // is measured, whichever rules happen to apply.
  const floors = new Map(TIERS.map((tier): [Tier, number | undefined] => [tier, floorFor(contract, tier, mode)]));
  const record = colors ?? {};
  const pairs: Measurement[] = [];
  for (const { fg, bg, tier, mode: only } of RULES) {
    if (!(TIERS as readonly unknown[]).includes(tier)) {
      throw new TypeError(`measureColors: the rule ${fg} on ${bg} has a tier that is not one of TIERS: ${shown(tier)}. A mistyped tier would read as a rule no contract holds`);
    }
    if (only !== undefined && !(MODES as readonly unknown[]).includes(only)) {
      throw new TypeError(`measureColors: the rule ${fg} on ${bg} is restricted to a mode that is not "light" or "dark": ${shown(only)}. It would be measured in neither`);
    }
    const min = floors.get(tier);
    if ((only !== undefined && only !== mode) || min === undefined) {
      continue;
    }
    const actual = measure(record[fg], record[bg]);
    pairs.push({ fg, bg, tier, kind: TIER_KIND[tier], min, actual, holds: actual !== null && actual >= min });
  }
  if (pairs.length === 0) {
    throw new TypeError(`measureColors: the contract ${shown(contract)} holds no rule in ${mode} mode. A contract over nothing would pass everything`);
  }
  return pairs;
}

/**
 * A measured ratio as every surface prints it: two decimals — unless the pair
 * FAILS and two decimals would round it up onto its floor. 4.4990 under a
 * floor of 4.5 printed as "4.50 < 4.5", a comparison that is false as written;
 * it gets the digits it needs to read as what it is ("4.499 < 4.5").
 */
export function ratioText(actual: number, min: number): string {
  for (let digits = 2; digits < 12; digits++) {
    const text = actual.toFixed(digits);
    if (actual >= min || Number(text) < min) {
      return text;
    }
  }
  return String(actual);
}

/** What a report prints about one mode, counted from the measurements themselves. */
export interface Tally {
  /** Pairs that produced a ratio — the only number a report may call measured. */
  measured: number;
  /** Pairs that apply but produced none. Every one of them is in `failures`. */
  unmeasurable: number;
  /** Every pair that does not hold: under its floor, or not measured at all. */
  failures: Measurement[];
  /** The smallest ratio ÷ floor among the measured pairs. Infinity when nothing was measured. */
  tightest: number;
}

export function tally(pairs: readonly Measurement[]): Tally {
  let measured = 0;
  let tightest = Infinity;
  for (const pair of pairs) {
    if (pair.actual !== null) {
      measured++;
      tightest = Math.min(tightest, pair.actual / pair.min);
    }
  }
  return { measured, unmeasurable: pairs.length - measured, failures: pairs.filter((pair) => !pair.holds), tightest };
}

export interface Failure {
  preset: string;
  mode: Mode;
  fg: SemanticColorName;
  bg: SemanticColorName;
  min: number;
  /** Null: the pair could not be measured. Print that — there is no ratio to format. */
  actual: number | null;
}

/** The gate's reading of the measurement: the pairs that do not hold under `contract`. */
export function checkColors(presetName: string, mode: Mode, colors: Partial<SemanticColors> | undefined, contract: ContractName): Failure[] {
  return measureColors(mode, colors, contract)
    .filter((pair) => !pair.holds)
    .map(({ fg, bg, min, actual }) => ({ preset: presetName, mode, fg, bg, min, actual }));
}

/**
 * The contract a preset declares for a mode — validated, because nothing else
 * will: the tools run TypeScript without checking it, so `Preset.contract`
 * being required by the type stops nobody at run time.
 *
 * This is the ONE place a declaration is read. Everything that measures a
 * preset asks here (`checkPreset`, the three reports, tools/check-cli.ts, the
 * playground's count, the manifest), so a bad declaration is the same
 * TypeError everywhere, naming the preset and what it declared. It is not
 * caught and it has no fallback: a preset with no declaration, or with a
 * mistyped one, must never be measured against some other contract, and must
 * never come back as "no failures". The mode has to be the declaration's OWN
 * property (one it only inherits is not a declaration), and the name has to
 * be a contract's OWN name in `contracts`, so "toString" and "__proto__" are
 * not names.
 *
 * The contract it reaches is validated too (`contractNamed`): a declaration
 * of a contract that cannot be used is refused here, naming the contract, so
 * a report that reads every declaration first prints nothing above the error.
 * Only the contract of the mode asked is reached; `checkPreset` and the
 * reports ask both modes.
 *
 * A mode that is not "light" or "dark" is the CALLER's mistake, not the
 * preset's: it is refused first, and the error does not name the preset.
 */
export function contractOf(preset: Preset, mode: Mode): ContractName {
  if (!(MODES as readonly unknown[]).includes(mode)) {
    throw new TypeError(`contractOf: ${shown(mode)} is not a mode: the mode must be "light" or "dark"`);
  }
  const declared: unknown = preset.contract;
  if (typeof declared !== "object" || declared === null) {
    throw new TypeError(`the preset ${shown(preset.name)} does not say which contract it is held to: \`contract\` must be { light, dark }, and it is ${shown(declared)}`);
  }
  if (!Object.hasOwn(declared, mode)) {
    throw new TypeError(`the preset ${shown(preset.name)} declares no contract for ${shown(mode)}: its \`contract\` is ${shown(declared)}`);
  }
  const name: unknown = (declared as Record<string, unknown>)[mode];
  if (typeof name !== "string" || !Object.hasOwn(contracts, name)) {
    throw new TypeError(`the preset ${shown(preset.name)} declares a contract that does not exist for ${mode} mode: ${shown(name)}. The contracts are ${Object.keys(contracts).map(shown).join(", ")}`);
  }
  return contractNamed(name as ContractName).name;
}

/** The build gate: each mode of a preset, measured against the contract the preset declares for THAT mode. */
export function checkPreset(preset: Preset): Failure[] {
  return MODES.flatMap((mode) => checkColors(preset.name, mode, preset.colors[mode], contractOf(preset, mode)));
}
