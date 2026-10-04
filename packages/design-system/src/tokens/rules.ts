/**
 * The accessibility contract. Every preset must satisfy these WCAG 2.x
 * pairings in both modes; the build fails otherwise.
 *
 * 4.5:1 — AA for normal text. 3:1 — AA for large text and non-text UI
 * (borders of inputs, focus indicators).
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

import type { Preset } from "./presets.ts";
import type { Mode, SemanticColorName, SemanticColors } from "./semantics.ts";

interface Rule {
  fg: SemanticColorName;
  bg: SemanticColorName;
  min: number;
  /** Restrict the rule to one mode (default: checked in both). */
  mode?: Mode;
}

const onSurfaces = (fg: SemanticColorName, min: number): Rule[] =>
  (["bg", "bg-subtle", "surface", "surface-raised", "surface-sunken"] as const).map((bg) => ({ fg, bg, min }));

export const RULES: Rule[] = [
  ...onSurfaces("text", 4.5),
  ...onSurfaces("text-muted", 4.5),
  { fg: "text-subtle", bg: "bg", min: 3 },
  { fg: "text-subtle", bg: "surface", min: 3 },
  { fg: "border-strong", bg: "bg", min: 3 },
  { fg: "border-strong", bg: "surface", min: 3 },
  { fg: "focus-ring", bg: "bg", min: 3 },
  { fg: "focus-ring", bg: "surface", min: 3 },
  { fg: "link", bg: "bg", min: 4.5 },
  { fg: "link", bg: "surface", min: 4.5 },
  { fg: "link-hover", bg: "bg", min: 4.5 },

  // The scrim is translucent, so these are checked as worst-case composites:
  // the scrim over pure white AND over pure black — the extremes of whatever
  // image sits behind it. Text over a scrim is a promise about ANY photo.
  { fg: "on-scrim", bg: "scrim", min: 4.5 },
  { fg: "on-scrim-muted", bg: "scrim", min: 4.5 },

  { fg: "on-primary", bg: "primary", min: 4.5 },
  { fg: "on-primary", bg: "primary-hover", min: 4.5 },
  { fg: "on-primary", bg: "primary-active", min: 4.5 },
  { fg: "primary-text", bg: "bg", min: 4.5 },
  { fg: "primary-text", bg: "surface", min: 4.5 },
  { fg: "primary-text", bg: "primary-subtle", min: 4.5 },
  // The shape-maker owes 3:1 to the page (WCAG 1.4.11 non-text contrast): it
  // paints affordances that have no label to carry them — checkbox fills,
  // slider tracks, tab indicators, switch tracks, spinners. `primary` itself is
  // exempt because it is always the fill BEHIND a label, which `on-primary`
  // covers; holding it to 3:1 as well is what forced every pastel brand deep.
  { fg: "primary-solid", bg: "bg", min: 3 },
  { fg: "primary-solid", bg: "surface", min: 3 },
  // Secondary and accent paint no affordances, but a pastel fill still needs an
  // edge that can be seen: their `-solid` carries the button border.
  { fg: "secondary-solid", bg: "bg", min: 3 },
  { fg: "accent-solid", bg: "bg", min: 3 },

  { fg: "on-secondary", bg: "secondary", min: 4.5 },
  { fg: "on-secondary", bg: "secondary-hover", min: 4.5 },
  { fg: "on-secondary", bg: "secondary-active", min: 4.5 },
  { fg: "secondary-text", bg: "bg", min: 4.5 },
  { fg: "secondary-text", bg: "secondary-subtle", min: 4.5 },

  { fg: "on-accent", bg: "accent", min: 4.5 },
  { fg: "on-accent", bg: "accent-hover", min: 4.5 },
  { fg: "on-accent", bg: "accent-active", min: 4.5 },
  { fg: "accent-text", bg: "bg", min: 4.5 },
  { fg: "accent-text", bg: "accent-subtle", min: 4.5 },

  { fg: "on-success", bg: "success", min: 4.5 },
  { fg: "success-text", bg: "bg", min: 4.5 },
  { fg: "success-text", bg: "success-subtle", min: 4.5 },
  { fg: "on-warning", bg: "warning", min: 4.5 },
  { fg: "warning-text", bg: "bg", min: 4.5 },
  { fg: "warning-text", bg: "warning-subtle", min: 4.5 },
  { fg: "on-danger", bg: "danger", min: 4.5 },
  { fg: "on-danger", bg: "danger-hover", min: 4.5 },
  { fg: "danger-text", bg: "bg", min: 4.5 },
  { fg: "danger-text", bg: "danger-subtle", min: 4.5 },
  { fg: "on-info", bg: "info", min: 4.5 },
  { fg: "info-text", bg: "bg", min: 4.5 },
  { fg: "info-text", bg: "info-subtle", min: 4.5 },

  // Chart marks are non-text UI: ≥3:1 in light mode. Dark mode's usable
  // lightness band (~0.48–0.67 OKLCH L) can't always reach 3:1 on our dark
  // surfaces, so the floor is 2.25 there and the relief rule applies: every
  // Chart ships a legend, tooltips, and a table view. (CVD adjacency and
  // lightness-band checks ran at design time; see charts.ts.)
  ...(["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6", "chart-7", "chart-8"] as const).flatMap(
    (slot): Rule[] => [
      { fg: slot, bg: "surface", min: 3, mode: "light" },
      { fg: slot, bg: "bg", min: 3, mode: "light" },
      { fg: slot, bg: "surface", min: 2.25, mode: "dark" },
      { fg: slot, bg: "bg", min: 2.25, mode: "dark" },
    ],
  ),
];

/** One rule of the contract, measured against one colour record. */
export interface Measurement {
  fg: SemanticColorName;
  bg: SemanticColorName;
  /** The floor the rule sets for this pair. */
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

const MODES: readonly unknown[] = ["light", "dark"] satisfies Mode[];

/** Null for anything worstCaseContrast cannot read, a value that is not there included. */
function measure(fg: string | undefined, bg: string | undefined): number | null {
  if (typeof fg !== "string" || typeof bg !== "string") {
    return null;
  }
  return worstCaseContrast(fg, bg);
}

/**
 * THE measurement: every rule that applies in `mode`, in contract order, each
 * with what it measured.
 *
 * It exists because the contract used to be measured in five places that did
 * not agree. The gate measured every pair; the three reports each carried a
 * hand copy of the loop that skipped any pair with a translucent side — the
 * two scrim pairs — and then printed RULES.length as the number of pairings
 * that pass: 86, when 70 apply in a mode and 68 had been measured. So a list
 * goes out, not a verdict, and a surface prints the length of what it was
 * handed. tools/test-contrast.ts fails if one of them measures for itself again.
 *
 * It never skips a pair, and no colour makes it throw. A pair it cannot
 * measure comes back with `actual: null` and `holds: false` — a failure that
 * names the pair. "No claim" used to be dropped here in silence, which reads
 * exactly like a pass. A record that is not there at all is every pair
 * unmeasurable, the same answer as an empty one.
 *
 * The one thing it throws on is a mode that does not exist ("system", "Light",
 * undefined — reachable only past the type checker). There is no list to
 * return for one: the chart rules belong to a mode each, so the old filter
 * quietly returned 54 pairs instead of 70 and reported nothing about the 16.
 */
export function measureColors(mode: Mode, colors: Partial<SemanticColors> | undefined): Measurement[] {
  if (!MODES.includes(mode)) {
    throw new TypeError(`measureColors: the mode must be "light" or "dark", got ${JSON.stringify(mode) ?? String(mode)}`);
  }
  const record = colors ?? {};
  return RULES.filter((rule) => !rule.mode || rule.mode === mode).map(({ fg, bg, min }) => {
    const actual = measure(record[fg], record[bg]);
    return { fg, bg, min, actual, holds: actual !== null && actual >= min };
  });
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

/** The gate's reading of the measurement: the pairs that do not hold. */
export function checkColors(presetName: string, mode: Mode, colors: Partial<SemanticColors> | undefined): Failure[] {
  return measureColors(mode, colors)
    .filter((pair) => !pair.holds)
    .map(({ fg, bg, min, actual }) => ({ preset: presetName, mode, fg, bg, min, actual }));
}

export function checkPreset(preset: Preset): Failure[] {
  return [
    ...checkColors(preset.name, "light", preset.colors.light),
    ...checkColors(preset.name, "dark", preset.colors.dark),
  ];
}
