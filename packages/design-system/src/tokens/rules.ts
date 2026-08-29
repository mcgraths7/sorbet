/**
 * The accessibility contract. Every preset must satisfy these WCAG 2.x
 * pairings in both modes; the build fails otherwise.
 *
 * 4.5:1 — AA for normal text. 3:1 — AA for large text and non-text UI
 * (borders of inputs, focus indicators).
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

export interface Failure {
  preset: string;
  mode: Mode;
  fg: SemanticColorName;
  bg: SemanticColorName;
  min: number;
  actual: number;
}

export function checkColors(presetName: string, mode: Mode, colors: SemanticColors): Failure[] {
  const failures: Failure[] = [];
  for (const rule of RULES) {
    if (rule.mode && rule.mode !== mode) {
      continue;
    }
    const fg = colors[rule.fg];
    const bg = colors[rule.bg];
    // Null = unmeasurable (translucent fg or exotic value): no claim is made,
    // and no rule should name such a pair. Translucent BACKGROUNDS are
    // measurable — worst-case composite over white and black.
    const actual = worstCaseContrast(fg, bg);
    if (actual === null) {
      continue;
    }
    if (actual < rule.min) {
      failures.push({ preset: presetName, mode, ...rule, actual });
    }
  }
  return failures;
}

export function checkPreset(preset: Preset): Failure[] {
  return [
    ...checkColors(preset.name, "light", preset.colors.light),
    ...checkColors(preset.name, "dark", preset.colors.dark),
  ];
}
