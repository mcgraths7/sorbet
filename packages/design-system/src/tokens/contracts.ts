/**
 * The contracts: what a preset is held to, as data.
 *
 * rules.ts says WHICH pairs of colours are compared. This file says what each
 * pair owes. A rule belongs to a tier — a group of rules that owe the same
 * floor — and a contract gives a tier its floor: the metric, the least value
 * that passes, why that value, and what would make it wrong. A preset declares
 * the contract it is held to, one per mode (presets.ts), and `contractOf` in
 * rules.ts is the one place that reads the declaration.
 *
 * It exists because the number used to sit on the rule (`min`), so the rule
 * list WAS the contract and every preset was judged by it. Holding one preset
 * to something else meant a second list or a branch inside the measurement —
 * either way a second place that decides, and the one the next change forgets.
 * Now a rule carries no number, and "which contract" is a value a preset
 * points at.
 *
 * There are two contracts. `wcag-aa` is the old list re-expressed: the same
 * pairs, the same floors, in the same order, and tools/test-contracts.ts holds
 * it to what the code answered before this file existed. `legibility` is
 * calibrated for one reader (docs/pastel-legibility-evidence/legibility-spec.md):
 * it measures text by APCA's Lc, shapes and edges by how far apart two colours
 * look, in typical vision and three simulations of colour blindness, and it
 * lists six true-or-false checks besides (`checkStructure` in rules.ts).
 */

import type { Mode } from "./semantics.ts";

/**
 * What a tier protects: text that is read, a shape that carries meaning
 * unlabelled, the focus indicator, a chart mark, two colours whose difference
 * is the message, or where an element ends.
 */
export type Kind = "text" | "shape" | "focus" | "chart" | "distinction" | "edge";

/** A group of rules that owe the same floor under a contract. Every rule belongs to exactly one. */
export type Tier =
  | "text" | "text-subtle" | "scrim" | "control-border" | "shape" | "focus" | "chart"
  | "body" | "secondary" | "on-wash" | "tinted" | "label" | "placeholder"
  | "mark-area" | "mark-line" | "divider"
  | "focus-visible"
  | "tell-apart" | "palette"
  | "chart-mark"
  | "edge-container" | "edge-floating" | "edge-field" | "edge-sunken" | "edge-quiet" | "edge-filled" | "edge-status";

/**
 * The rulers a tier can be measured with. `ratio` is the WCAG 2 contrast
 * ratio; `lc` the size of APCA's lightness contrast, text first; `sep` how far
 * apart two colours look (OKLab distance × 100); `presence` how clearly an
 * element's edge shows against what it sits on (edges.ts).
 */
export type Metric = "ratio" | "lc" | "sep" | "presence";

/** One way of seeing a pair: typical vision, or one complete kind of colour blindness as `simulateCvd` models it. */
export type View = "typical" | "protan" | "deutan" | "tritan";

/** The true-or-false checks a contract may hold besides its floors (`checkStructure` in rules.ts). */
export type CheckName = "roles-complete" | "hierarchy" | "edge-not-fill" | "fills-steady" | "edge-direction" | "label-type";

/**
 * What each tier protects. The one place a tier's kind is written: a rule
 * names its tier and nothing more, so a rule and its tier cannot disagree
 * about what is being protected.
 */
export const TIER_KIND: Readonly<Record<Tier, Kind>> = {
  text: "text",
  "text-subtle": "text",
  scrim: "text",
  "control-border": "shape",
  shape: "shape",
  focus: "focus",
  chart: "chart",
  body: "text",
  secondary: "text",
  "on-wash": "text",
  tinted: "text",
  label: "text",
  placeholder: "text",
  "mark-area": "shape",
  "mark-line": "shape",
  divider: "shape",
  "focus-visible": "focus",
  "tell-apart": "distinction",
  palette: "distinction",
  "chart-mark": "chart",
  "edge-container": "edge",
  "edge-floating": "edge",
  "edge-field": "edge",
  "edge-sunken": "edge",
  "edge-quiet": "edge",
  "edge-filled": "edge",
  "edge-status": "edge",
};

/**
 * Every tier, in the order TIER_KIND writes them. This is the list a tier is
 * checked against: a rule or a question naming anything else is refused, not
 * read as a tier no contract happens to list.
 */
export const TIERS: readonly Tier[] = Object.keys(TIER_KIND) as Tier[];

export type ContractName = "wcag-aa" | "legibility";

/** The metrics, the views and the checks there are: what a contract's words are checked against (`contractNamed`). */
const METRICS: readonly Metric[] = ["ratio", "lc", "sep", "presence"];
const VIEWS: readonly View[] = ["typical", "protan", "deutan", "tritan"];
const CHECK_NAMES: readonly CheckName[] = ["roles-complete", "hierarchy", "edge-not-fill", "fills-steady", "edge-direction", "label-type"];

/**
 * The kinds each metric may measure. A metric on a kind it does not suit is
 * refused, not measured: a `presence` floor on a text tier would be measured
 * as nothing at all, and an edge tier read by `lc` would compare an edge
 * pixel as if it were text.
 */
const SUITS: Readonly<Record<Metric, readonly Kind[]>> = {
  ratio: ["text", "shape", "focus", "chart"],
  lc: ["text"],
  sep: ["shape", "focus", "chart", "distinction"],
  presence: ["edge"],
};

/** The word a report prints before a measured value of each metric. The ratio prints none, as it always has. */
export const METRIC_WORD: Readonly<Record<Metric, string>> = { ratio: "", lc: "Lc", sep: "separation", presence: "edge presence" };

/** What a contract asks of one tier. */
export interface TierFloor {
  /** What is measured (Metric). */
  metric: Metric;
  /** The least value that passes: one number, or one per mode. */
  min: number | Record<Mode, number>;
  /** One sentence: why this floor. */
  why: string;
  /** One sentence: what would make this floor wrong. A floor with no way out is kept long after its reason has gone. */
  retire: string;
  /** Only on a tier whose floor is true at one type size: what the preset's `buttonLabel` must reach (check `label-type`). */
  requires?: { buttonLabelPx: number; buttonLabelSmallPx: number; buttonLabelWeight: number };
}

export interface Contract {
  name: ContractName;
  /** One sentence: who this contract was calibrated for. */
  calibratedFor: string;
  /** The views `lc`, `sep` and `presence` tiers are measured in. Absent means typical vision only. A `ratio` tier is measured in typical vision whatever this says. */
  views?: readonly View[];
  /** The true-or-false checks this contract holds (`checkStructure`). Absent means none. */
  checks?: readonly CheckName[];
  /**
   * The floor of each tier the contract holds. A KNOWN tier it does not list
   * is a rule it does not hold — on purpose, and not a failure. A key that is
   * not one of TIERS is never read that way: it refuses the whole contract
   * (`contractNamed`), as a name that is not a tier is refused when asked of
   * `floorFor` or met on a rule by `measureColors`.
   */
  tiers: Partial<Record<Tier, TierFloor>>;
}

/**
 * The scrim's floor, which both contracts hold with the same metric, number
 * and reasons: it is written once, and each contract takes its own copy of it.
 */
const SCRIM: TierFloor = {
  metric: "ratio",
  min: 4.5,
  why: "Text over the scrim is text at normal size (SC 1.4.3) and a promise about ANY image behind it, so the ratio held to 4.5:1 is the worst the translucent scrim can come to, anywhere between its composite over white and its composite over black.",
  retire: "Wrong if the scrim becomes opaque (its pairs are then ordinary `text`), or if nothing set over it is ever text.",
};

/** The reason every edge tier gives, and what would retire it (legibility-spec.md L66). */
const edgeFloor = (edge: string, min: Record<Mode, number>): TierFloor => ({
  metric: "presence",
  min,
  why: `${edge} against what it sits on, pinned a little under sheet 2's approved recipe, so a recipe that drifts from the one the owner passed fails here.`,
  retire: "The owner reporting a page where things run together while the gate is green: the floor then goes to that page's measurement.",
});

/**
 * Every contract, by name. A plain object, as RULES is a plain array: a later
 * change adds an entry here, a preset names it, and nothing else moves.
 *
 * `legibility`'s floors are regression baselines (legibility-spec.md §6): the
 * weakest pair of each tier as the approved sorbet values measure it at the
 * worst view, in that mode, less a margin (2.0 Lc; 5% of a separation or
 * presence, never under 0.5), rounded down to one decimal. Only the owner
 * re-pins one, by approving a new sample sheet.
 */
export const contracts: Record<ContractName, Contract> = {
  "wcag-aa": {
    name: "wcag-aa",
    calibratedFor: "Anyone: WCAG 2.x level AA is a published standard, calibrated for no one person's eyes, screen or room.",
    tiers: {
      text: {
        metric: "ratio",
        min: 4.5,
        why: "WCAG 2.x SC 1.4.3 (level AA) asks 4.5:1 of text at normal size, and these pairs are body copy, links and the labels on fills, read at any size.",
        retire: "Wrong once the standard a product is judged by stops measuring body text with this ratio, or if every one of these pairs were only ever set large and bold, which owes 3:1.",
      },
      "text-subtle": {
        metric: "ratio",
        min: 3,
        why: "`text-subtle` paints what is not body copy — placeholders, separators, icons and the hints beside a control — and is held to the 3:1 WCAG 2.x AA asks of large text and of non-text marks (SC 1.4.3, SC 1.4.11).",
        retire: "Wrong the day `text-subtle` is the colour of text a reader needs at normal size, which WCAG holds to 4.5:1; input placeholders are the closest it comes today.",
      },
      scrim: { ...SCRIM },
      "control-border": {
        metric: "ratio",
        min: 3,
        why: "WCAG 2.x SC 1.4.11 (level AA) asks 3:1 of the visual information needed to identify a control, and `border-strong` is the edge that says where an input is.",
        retire: "Wrong if inputs gain another boundary that clears 3:1 by itself (a fill, say), which leaves the border decorative and outside SC 1.4.11.",
      },
      shape: {
        metric: "ratio",
        min: 3,
        why: "WCAG 2.x SC 1.4.11 (level AA) asks 3:1 of a graphic that carries meaning with no label beside it, and the `-solid` colours paint exactly those: checkbox fills, slider tracks, tab indicators, switch tracks, spinners and the edge of a pastel button.",
        retire: "Wrong if a `-solid` colour stops being the whole of the shape: every such affordance labelled, or outlined in a colour that clears the floor itself.",
      },
      focus: {
        metric: "ratio",
        min: 3,
        why: "The focus ring is the only sign of where the keyboard is (SC 2.4.7), and as a non-text indicator it owes 3:1 to what it is drawn against (SC 1.4.11).",
        retire: "Wrong if the ring is drawn against anything but `bg` and `surface`, or becomes a two-colour ring that shows on any background, which one ratio no longer describes.",
      },
      chart: {
        metric: "ratio",
        min: { light: 3, dark: 2.25 },
        why: "Chart marks are non-text UI and owe 3:1 (SC 1.4.11), which light mode meets; dark mode's usable lightness band (about 0.48–0.67 OKLCH L) cannot always reach it on the dark surfaces, so the floor there is 2.25 and every Chart ships a legend, tooltips and a table view as the relief.",
        retire: "The dark 2.25 is wrong the day a dark palette can reach 3:1 inside the band the colour-vision gate needs (raise it to 3), or the day a Chart ships without its legend, tooltips and table view.",
      },
    },
  },
  legibility: {
    name: "legibility",
    calibratedFor: "Calibrated for one reader, the owner, by eye on sample sheets 1 and 2 on 2026-10-03; the three colour-blindness simulations stand in for a colour-vision type that has not been formally tested.",
    views: ["typical", "protan", "deutan", "tritan"],
    checks: ["roles-complete", "hierarchy", "edge-not-fill", "fills-steady", "edge-direction", "label-type"],
    tiers: {
      scrim: { ...SCRIM },
      body: {
        metric: "lc",
        min: { light: 82.8, dark: 83.2 },
        why: "Paragraph text and headings on the page and on the surfaces laid over it, held at the Lc the owner chose the ink at.",
        retire: "The owner picking a new ink on a sample sheet, or body type changing size.",
      },
      secondary: {
        metric: "lc",
        min: { light: 74.2, dark: 64.7 },
        why: "Secondary text, links and brand-coloured text on the page and on the surfaces laid over it.",
        retire: "The owner finding small text hard to read while the gate is green (decision 21).",
      },
      "on-wash": {
        metric: "lc",
        min: { light: 73.3, dark: 76.2 },
        why: "Status and selected text on its own wash, which keeps a floor of its own instead of sharing one pinned to muted text on a raised surface.",
        retire: "The wash strength changing, or status text no longer being the ordinary ink.",
      },
      tinted: {
        metric: "lc",
        min: { light: 64.4, dark: 57.7 },
        why: "Secondary text and links on a tinted ground: the well, or a wash.",
        retire: "The owner finding small text hard to read while the gate is green (decision 21), as for `secondary`.",
      },
      label: {
        metric: "lc",
        min: 68.9,
        why: "A label on a full-strength fill: approved by eye for the default button at 16px semi-bold (decision 6), and for the small button at 14px semi-bold on the figure alone (DECISIONS row 31). The label-type check holds the button to both sizes; the 12px solid badge paints the same pairs and is not size-checked.",
        retire: "A fill getting lighter or darker, or either button label size changing (decision 6, DECISIONS row 31).",
        requires: { buttonLabelPx: 16, buttonLabelSmallPx: 14, buttonLabelWeight: 600 },
      },
      placeholder: {
        metric: "lc",
        min: { light: 62.1, dark: 45 },
        why: "Placeholder and disabled text: nothing a reader needs.",
        retire: "`text-subtle` being used for text a reader needs.",
      },
      "mark-area": {
        metric: "sep",
        min: { light: 12.4, dark: 45.7 },
        why: "A filled shape that carries a state with no label (a bar, a switch, a checked box), against what it is read against.",
        retire: "A bar or switch state missed on a real screen.",
      },
      "mark-line": {
        metric: "sep",
        min: { light: 19.5, dark: 22 },
        why: "A ring, a bar or a status mark 3px or thinner, against what it is drawn on.",
        retire: "The ring or a status mark proving faint or heavy in use.",
      },
      divider: {
        metric: "sep",
        min: { light: 11.3, dark: 10.5 },
        why: "A dividing line against the surface it is drawn on: an edge colour may never equal its fill (proposal §4).",
        retire: "Dividers being dropped from the look.",
      },
      "focus-visible": {
        metric: "sep",
        min: { light: 24.8, dark: 17 },
        why: "The focus ring is the one deliberately firm edge, and it is held against everything it can be drawn on.",
        retire: "Never by this change; it may go up.",
      },
      "tell-apart": {
        metric: "sep",
        min: 11.5,
        why: "Two edges whose difference is the message: invalid, focused and resting.",
        retire: "Each of them gaining a second cue that needs no colour.",
      },
      palette: {
        metric: "sep",
        min: 4.8,
        why: "No two brand fills may become one colour for one kind of reader.",
        retire: "A formal colour-vision test: then one view is checked.",
      },
      "chart-mark": {
        metric: "sep",
        min: { light: 28.4, dark: 41.9 },
        why: "A chart mark against the surface and the page: a regression baseline of the shipped chart colours on the new surfaces (DECISIONS row 25).",
        retire: "The chart proposal (decision A3).",
      },
      "edge-container": edgeFloor("A card's edge", { light: 15.8, dark: 15.2 }),
      "edge-floating": edgeFloor("A floating surface's edge (a menu, popover, modal or toast)", { light: 16.8, dark: 20.4 }),
      "edge-field": edgeFloor("A text field's edge", { light: 10.4, dark: 30.1 }),
      "edge-sunken": edgeFloor("A well's edge", { light: 8.1, dark: 13.3 }),
      "edge-quiet": edgeFloor("A quiet (outline) button's edge", { light: 16, dark: 16.3 }),
      "edge-filled": edgeFloor("A filled button's edge", { light: 17.7, dark: 54.7 }),
      "edge-status": edgeFloor("A status box's edge", { light: 14.6, dark: 20.3 }),
    },
  },
};

/**
 * Every contract's name, as the names stood when this module loaded: a
 * contract added to `contracts` later is not on it. It is a list for showing
 * and for typing, and nothing may decide by it. What decides whether a name is
 * a contract is `contracts` itself, asked by `contractNamed`.
 */
export const CONTRACT_NAMES: readonly ContractName[] = Object.keys(contracts) as ContractName[];

/** A value as an error message shows it: a string in its quotes, so `"text "` and `""` can be told from what they are not, and a number or a symbol as itself (JSON turns NaN into null and has no word for a symbol). */
const shown = (value: unknown): string => (typeof value === "number" || typeof value === "symbol" ? String(value) : JSON.stringify(value) ?? String(value));

const MODES: readonly Mode[] = ["light", "dark"];

/**
 * A floor a measurement can fail. For the ratio: a finite number GREATER than
 * 1 — no ratio is below 1, so a floor of exactly 1 passes every pair, as 0,
 * `null` or a string would (`ratio >= null` is true). For Lc, separation and
 * presence: a finite number greater than 0, for the same reason: none of them
 * measures below 0.
 */
const usable = (floor: unknown, metric: Metric): floor is number => typeof floor === "number" && Number.isFinite(floor) && floor > (metric === "ratio" ? 1 : 0);

const refused = (contract: unknown, problem: string) => new TypeError(`the contract ${shown(contract)} cannot be used: ${problem}`);

/** An own key whose value is not `undefined`: what "present" means for `views`, `checks` and `requires`. `null` is present, and malformed. */
const present = (object: object, key: string): boolean => Object.hasOwn(object, key) && (object as Record<string, unknown>)[key] !== undefined;

/** A list of distinct names, each one of `allowed` — or a sentence saying why it is not. */
function listProblem(value: unknown, allowed: readonly string[], what: string, nonEmpty: boolean): string | undefined {
  if (!Array.isArray(value)) {
    return `its \`${what}\` is ${shown(value)}, and it must be an array`;
  }
  const hole = Array.from({ length: value.length }, (_, i) => i).find((i) => !Object.hasOwn(value, i));
  if (hole !== undefined) {
    return `its \`${what}\` has a hole at ${hole}, and a hole is skipped or read as nothing: it must name one at every index`;
  }
  if (nonEmpty && value.length === 0) {
    return `its \`${what}\` is empty: leave it out to mean typical vision only`;
  }
  const stray = value.find((item) => !allowed.includes(item as string));
  if (stray !== undefined || value.some((item) => item === undefined)) {
    return `its \`${what}\` names ${shown(stray)}, which is not one of ${allowed.map(shown).join(", ")}`;
  }
  if (new Set(value).size !== value.length) {
    return `its \`${what}\` names the same one twice: ${shown(value)}`;
  }
  return undefined;
}

/** `requires`: exactly the three button-label figures, each a finite positive number — or a sentence saying why not. */
function requiresProblem(requires: unknown): string | undefined {
  const keys = ["buttonLabelPx", "buttonLabelSmallPx", "buttonLabelWeight"];
  if (typeof requires !== "object" || requires === null || Array.isArray(requires)) {
    return `it is ${shown(requires)}, and it must be { ${keys.join(", ")} }`;
  }
  const stray = Object.keys(requires).find((key) => !keys.includes(key));
  if (stray !== undefined) {
    return `it has the key ${shown(stray)}, which is none of ${keys.join(", ")}`;
  }
  const bad = keys.find((key) => {
    const value = (requires as Record<string, unknown>)[key];
    return typeof value !== "number" || !Number.isFinite(value) || value <= 0;
  });
  return bad === undefined ? undefined : `its ${bad} is ${shown((requires as Record<string, unknown>)[bad])}, and it must be a finite number greater than 0`;
}

/**
 * The contract registered under `name` — validated WHOLE, before any of it is
 * used. This is the one place that reads `contracts` to decide: `floorFor`
 * and `metricFor` ask here, and so does `contractOf` in rules.ts, so the
 * measurement, the gates, the reports and the manifest all refuse the same
 * contracts.
 *
 * It exists because a contract used to be read one floor at a time, and each
 * of these then read as a pass somewhere. Every one is a TypeError that names
 * the key the contract was reached by:
 *
 *   - a name that is not an own key of `contracts` ("wcag-aaa", "toString"):
 *     it must not be read as a contract that lists nothing, nor as `wcag-aa`;
 *   - a value that is not an object, or whose `name` is not the key it is
 *     registered under;
 *   - `tiers` that is not a plain map (null, absent, an array);
 *   - an own key of `tiers` that is not one of TIERS. A contract whose map
 *     said `txet` for `text` measured 28 pairs instead of 70, and every gate
 *     printed its success line. Leaving a tier out is how a contract says "not
 *     held"; a key that is not a tier says nothing a reader can trust;
 *   - a listed tier whose floor is unusable: the entry is not an object, its
 *     metric is not one of METRICS or does not suit the tier's kind (SUITS),
 *     or its number is not finite and above the metric's least (greater than
 *     1 for the ratio, greater than 0 for the others). A per-mode floor must
 *     carry a usable number for BOTH modes, whichever mode is being asked: a
 *     caller that measures only light would otherwise never meet a bad dark
 *     half;
 *   - a `requires` on a tier, `views` or `checks` that is present and
 *     malformed: a wrong name in a list, or a hole in one, is refused, never
 *     ignored, because an ignored view is a view nobody is measured in;
 *   - a tier that carries `requires` in a contract whose `checks` do not list
 *     "label-type": the contract would state a size condition and not hold it.
 *
 * An empty `tiers` is a valid shape; `measureColors` refuses a contract that
 * holds nothing.
 */
export function contractNamed(name: ContractName): Contract {
  if (typeof name !== "string" || !Object.hasOwn(contracts, name)) {
    throw new TypeError(`there is no contract called ${shown(name)}. A contract has to be named, there is no default; the contracts are ${Object.keys(contracts).map(shown).join(", ")}`);
  }
  const contract: unknown = contracts[name];
  if (typeof contract !== "object" || contract === null) {
    throw refused(name, `it is ${shown(contract)}, and a contract is an object`);
  }
  const { name: own, tiers } = contract as { name?: unknown; tiers?: unknown };
  if (own !== name) {
    throw refused(name, `it is registered under that key and its \`name\` is ${shown(own)}`);
  }
  if (typeof tiers !== "object" || tiers === null || Array.isArray(tiers)) {
    throw refused(name, `its \`tiers\` must be an object that gives a tier its floor, and it is ${shown(tiers)}`);
  }
  for (const [key, allowed, nonEmpty] of [["views", VIEWS, true], ["checks", CHECK_NAMES, false]] as const) {
    if (present(contract, key)) {
      const problem = listProblem((contract as Record<string, unknown>)[key], allowed, key, nonEmpty);
      if (problem !== undefined) {
        throw refused(name, problem);
      }
    }
  }
  for (const key of Reflect.ownKeys(tiers)) {
    if (!(TIERS as readonly unknown[]).includes(key)) {
      throw refused(name, `its tier map has the key ${shown(key)}, which is not a tier, so the rules it was meant for would go unheld. The tiers are ${TIERS.map(shown).join(", ")}`);
    }
    const tier = key as Tier;
    const entry: unknown = (tiers as Record<PropertyKey, unknown>)[key];
    if (typeof entry !== "object" || entry === null) {
      throw refused(name, `its ${tier} tier is ${shown(entry)}, and a tier's floor is an object: { metric, min, why, retire }`);
    }
    const { metric, min } = entry as { metric?: unknown; min?: unknown };
    if (!(METRICS as readonly unknown[]).includes(metric)) {
      throw refused(name, `it measures its ${tier} tier by ${shown(metric)}, and the metrics are ${METRICS.map(shown).join(", ")}`);
    }
    const ruler = metric as Metric;
    if (!SUITS[ruler].includes(TIER_KIND[tier])) {
      throw refused(name, `it measures its ${tier} tier, whose kind is ${TIER_KIND[tier]}, by ${shown(ruler)}, which measures only ${SUITS[ruler].join(", ")} tiers`);
    }
    const least = ruler === "ratio" ? "greater than 1, because no contrast ratio is below 1 and a floor of 1 or less is one every pair clears" : "greater than 0, because nothing measures below 0 and a floor of 0 or less is one every pair clears";
    if (typeof min === "object" && min !== null) {
      for (const mode of MODES) {
        if (!Object.hasOwn(min, mode) || !usable((min as Record<Mode, unknown>)[mode], ruler)) {
          throw refused(name, `it gives its ${tier} tier a floor per mode, ${shown(min)}, and the one for ${mode} mode is not a finite number ${least} (a per-mode floor needs one for light and one for dark)`);
        }
      }
    } else if (!usable(min, ruler)) {
      throw refused(name, `it gives its ${tier} tier a floor of ${shown(min)}: a floor is a finite number ${least}`);
    }
    if (present(entry, "requires")) {
      const problem = requiresProblem((entry as Record<string, unknown>).requires);
      if (problem !== undefined) {
        throw refused(name, `the \`requires\` of its ${tier} tier cannot be read: ${problem}`);
      }
      // Validated above: when present, `checks` is a dense list of check names.
      const checks = present(contract, "checks") ? ((contract as Record<string, unknown>).checks as readonly unknown[]) : [];
      if (!checks.includes("label-type")) {
        throw refused(name, `its ${tier} tier carries \`requires\`, and its \`checks\` do not list "label-type": a size condition the contract states and does not hold`);
      }
    }
  }
  return contract as Contract;
}

/**
 * The floor a contract sets for a tier in a mode — or `undefined`, when the
 * tier is a known one the contract does not list (it does not hold that tier).
 *
 * `undefined` is the ONLY quiet answer, and it is reserved for that one case.
 * It answers for a tier of any metric. Everything else that is not a floor
 * is a TypeError, because each of them
 * would otherwise turn into a pass somewhere downstream:
 *
 *   - a mode that does not exist has no floor to give (checked first);
 *   - a contract that does not exist, or one `contractNamed` refuses: the
 *     WHOLE contract is validated on every call, so a bad floor on another
 *     tier, a bad half of a per-mode floor or a key that is not a tier is
 *     refused here whichever tier and mode were asked;
 *   - a tier that is not one of TIERS is a typing mistake, and "not listed"
 *     would report it as a rule nobody is held to.
 */
export function floorFor(contract: ContractName, tier: Tier, mode: Mode): number | undefined {
  if (!(MODES as readonly unknown[]).includes(mode)) {
    throw new TypeError(`floorFor: the mode must be "light" or "dark", got ${shown(mode)}`);
  }
  const { tiers } = contractNamed(contract);
  if (!(TIERS as readonly unknown[]).includes(tier)) {
    throw new TypeError(`floorFor: ${shown(tier)} is not a tier: the tiers are ${TIERS.map(shown).join(", ")}`);
  }
  if (!Object.hasOwn(tiers, tier)) {
    return undefined;
  }
  // Validated above: the entry is there, and its floor is usable in both modes.
  const { min } = tiers[tier]!;
  return typeof min === "object" ? min[mode] : min;
}

/**
 * The metric a contract measures a tier with — or `undefined`, when the tier
 * is a known one the contract does not list. It refuses what `floorFor`
 * refuses, by the same call (`contractNamed`), so the ruler and the floor a
 * measurement reads cannot come from two differently-validated readings of
 * one contract.
 */
export function metricFor(contract: ContractName, tier: Tier): Metric | undefined {
  const { tiers } = contractNamed(contract);
  if (!(TIERS as readonly unknown[]).includes(tier)) {
    throw new TypeError(`metricFor: ${shown(tier)} is not a tier: the tiers are ${TIERS.map(shown).join(", ")}`);
  }
  return Object.hasOwn(tiers, tier) ? tiers[tier]!.metric : undefined;
}
