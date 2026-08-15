/**
 * Semantic color tokens — the only colors components are allowed to use.
 *
 * A recipe maps primitive ramps onto semantic roles. Shade selection is
 * contrast-driven: instead of hardcoding "primary = 600", we walk the ramp
 * until the pairing (e.g. white text on a solid button) measures ≥ 4.5:1.
 * That is what lets every preset guarantee WCAG AA in both modes.
 */

import { chartColors, chartMuted, type ChartTheme } from "./charts.ts";
import { compositeOver, contrast, withAlpha, type Hex } from "./color.ts";
import { RAMP_STEPS, type Ramp, type RampStep } from "./ramps.ts";

export const SEMANTIC_COLOR_NAMES = [
  "bg", "bg-subtle", "surface", "surface-raised", "surface-sunken", "scrim", "on-scrim", "on-scrim-muted",
  "text", "text-muted", "text-subtle", "text-inverse",
  "border", "border-subtle", "border-strong",
  "focus-ring",
  "primary", "primary-hover", "primary-active", "primary-subtle", "primary-text", "on-primary",
  "secondary", "secondary-hover", "secondary-active", "secondary-subtle", "secondary-text", "on-secondary",
  "accent", "accent-hover", "accent-active", "accent-subtle", "accent-text", "on-accent",
  "success", "success-hover", "success-subtle", "success-text", "on-success",
  "warning", "warning-hover", "warning-subtle", "warning-text", "on-warning",
  "danger", "danger-hover", "danger-active", "danger-subtle", "danger-text", "on-danger",
  "info", "info-hover", "info-subtle", "info-text", "on-info",
  "link", "link-hover",
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6", "chart-7", "chart-8", "chart-muted",
] as const;

export type SemanticColorName = (typeof SEMANTIC_COLOR_NAMES)[number];
export type SemanticColors = Record<SemanticColorName, string>;
export type Mode = "light" | "dark";

export interface SemanticRecipe {
  neutral: Ramp;
  primary: Ramp;
  secondary: Ramp;
  accent: Ramp;
  success: Ramp;
  warning: Ramp;
  danger: Ramp;
  info: Ramp;
  /** Fixed-order categorical palette for data visualization. */
  charts: ChartTheme;
  /** true → pure white page + surfaces; false → softly tinted neutral-50 page */
  pureSurfaces?: boolean;
  /**
   * "vivid" (default): light-mode brand fills are saturated mid-ramp solids
   * with white text. "pastel": secondary and accent fills sit at the ramp's
   * light end with near-black text — the walk dark mode always uses, pointed
   * the other way. PRIMARY is exempt on purpose: it paints unlabeled control
   * affordances (checkbox fill, slider track, tab indicator), which the
   * 3:1-on-bg rule protects, and no pastel can clear 3:1 against a light
   * page. The deep primary is the palette's anchor; the pastels are the
   * palette. Dark mode is unaffected — its fills are already pastel-adjacent
   * by construction.
   */
  brandStyle?: "vivid" | "pastel";
  overrides?: Partial<Record<Mode, Partial<SemanticColors>>>;
}

const WHITE: Hex = "#ffffff";

function darker(step: RampStep, by = 1): RampStep {
  const i = Math.min(RAMP_STEPS.indexOf(step) + by, RAMP_STEPS.length - 1);
  return RAMP_STEPS[i]!;
}

function lighter(step: RampStep, by = 1): RampStep {
  const i = Math.max(RAMP_STEPS.indexOf(step) - by, 0);
  return RAMP_STEPS[i]!;
}

/** First step whose contrast against every `against` color meets `min`. */
function pick(ramp: Ramp, candidates: readonly RampStep[], against: readonly string[], min: number): RampStep {
  for (const step of candidates) {
    if (against.every((bg) => contrast(ramp[step], bg) >= min)) {
      return step;
    }
  }
  return candidates[candidates.length - 1]!;
}

/**
 * Muted text over the scrim: the darkest light step that still clears AA over
 * the scrim's worst-case composites (a pure-white and a pure-black image
 * behind it) — muted must read as muted, but legibly, over ANY photo.
 */
function onScrimMuted(neutral: Ramp, scrim: string): Hex {
  const worst = [compositeOver(scrim, "#ffffff"), compositeOver(scrim, "#000000")];
  return neutral[pick(neutral, [300, 200, 100, 50], worst, 4.5)];
}

interface Solid {
  base: string;
  hover: string;
  active: string;
  on: string;
}

/**
 * A solid fill (buttons, badges). `onColor` is fixed; the fill shade is chosen
 * so the pairing measures ≥ 4.5:1. Hover direction is the caller's choice:
 * away from the text color and contrast improves by construction; toward it
 * (the pastel scheme rests pale and deepens on hover) and every state must be
 * — and is — gate-verified, including active.
 */
function solid(ramp: Ramp, onColor: string, candidates: readonly RampStep[], hoverDir: "darker" | "lighter"): Solid {
  const move = hoverDir === "darker" ? darker : lighter;
  const base = pick(ramp, candidates, [onColor], 4.5);
  return {
    base: ramp[base],
    hover: ramp[move(base)],
    active: ramp[move(base, 2)],
    on: onColor,
  };
}

export function buildMode(recipe: SemanticRecipe, mode: Mode): SemanticColors {
  const { neutral } = recipe;
  const out: Partial<SemanticColors> = {};

  const brand = (role: "primary" | "secondary" | "accent", ramp: Ramp) => {
    if (mode === "light") {
      const pastel = recipe.brandStyle === "pastel" && role !== "primary";
      // Pastel rests at the palest step that carries its text and DEEPENS on
      // hover — the pale shade is the identity, the saturated one the response.
      const s = pastel
        ? solid(ramp, neutral[950], [200, 300, 100], "darker")
        : solid(ramp, WHITE, [500, 600, 700, 800], "darker");
      out[role] = s.base;
      out[`${role}-hover`] = s.hover;
      out[`${role}-active`] = s.active;
      out[`on-${role}`] = s.on;
      out[`${role}-subtle`] = ramp[100];
      out[`${role}-text`] = ramp[pick(ramp, [600, 700, 800, 900], [out.bg!, out.surface!, ramp[100]], 4.5)];
    } else {
      const s = solid(ramp, neutral[950], [400, 300, 500, 200], "lighter");
      out[role] = s.base;
      out[`${role}-hover`] = s.hover;
      out[`${role}-active`] = s.active;
      out[`on-${role}`] = s.on;
      out[`${role}-subtle`] = ramp[900];
      out[`${role}-text`] = ramp[pick(ramp, [300, 200, 100], [out.bg!, out.surface!, ramp[900]], 4.5)];
    }
  };

  const status = (role: "success" | "warning" | "danger" | "info", ramp: Ramp, darkOn: boolean) => {
    const s =
      mode === "light"
        ? darkOn
          ? solid(ramp, neutral[950], [400, 500, 300], "lighter")
          : solid(ramp, WHITE, [500, 600, 700, 800], "darker")
        : solid(ramp, neutral[950], [400, 300, 500, 200], "lighter");
    out[role] = s.base;
    out[`${role}-hover`] = s.hover;
    out[`on-${role}`] = s.on;
    if (mode === "light") {
      out[`${role}-subtle`] = ramp[100];
      out[`${role}-text`] = ramp[pick(ramp, [600, 700, 800, 900], [out.bg!, out.surface!, ramp[100]], 4.5)];
    } else {
      out[`${role}-subtle`] = ramp[900];
      out[`${role}-text`] = ramp[pick(ramp, [300, 200, 100], [out.bg!, out.surface!, ramp[900]], 4.5)];
    }
  };

  if (mode === "light") {
    const pageBg = recipe.pureSurfaces ? WHITE : neutral[50];
    out.bg = pageBg;
    out["bg-subtle"] = neutral[100];
    out.surface = WHITE;
    out["surface-raised"] = WHITE;
    out["surface-sunken"] = neutral[100];
    // 0.6 black, same as dark mode: the worst-case rules (scrim composited
    // over a pure-white image) need this much wash for AA — a neutral tint at
    // 0.5 composites too light and fails the very contract the scrim exists
    // to keep. Verified by the gate, not by eye.
    out.scrim = withAlpha("#000000", 0.6);
    // Content sitting ON the scrim. The scrim is dark in BOTH modes, so this
    // is always the lightest neutral — unlike text-inverse, which flips with
    // the mode and would go dark exactly when the scrim needs light text.
    out["on-scrim"] = neutral[50];
    out["on-scrim-muted"] = onScrimMuted(neutral, out.scrim);
    out.text = neutral[900];
    out["text-muted"] = neutral[pick(neutral, [600, 700], [pageBg, WHITE, neutral[100]], 4.5)];
    out["text-subtle"] = neutral[pick(neutral, [500, 600], [pageBg, WHITE], 3)];
    out["text-inverse"] = neutral[50];
    out.border = neutral[200];
    out["border-subtle"] = neutral[100];
    out["border-strong"] = neutral[pick(neutral, [500, 600], [pageBg, WHITE], 3)];
  } else {
    out.bg = neutral[950];
    out["bg-subtle"] = neutral[900];
    out.surface = neutral[900];
    out["surface-raised"] = neutral[800];
    out["surface-sunken"] = neutral[950];
    out.scrim = withAlpha("#000000", 0.6);
    out["on-scrim"] = neutral[50];
    out["on-scrim-muted"] = onScrimMuted(neutral, out.scrim);
    out.text = neutral[100];
    out["text-muted"] = neutral[pick(neutral, [400, 300], [neutral[950], neutral[900], neutral[800]], 4.5)];
    out["text-subtle"] = neutral[pick(neutral, [500, 400], [neutral[950], neutral[900]], 3)];
    out["text-inverse"] = neutral[950];
    out.border = neutral[800];
    out["border-subtle"] = neutral[900];
    out["border-strong"] = neutral[pick(neutral, [600, 500], [neutral[950], neutral[900]], 3)];
  }

  brand("primary", recipe.primary);
  brand("secondary", recipe.secondary);
  brand("accent", recipe.accent);
  status("success", recipe.success, false);
  status("warning", recipe.warning, true);
  status("danger", recipe.danger, false);
  status("info", recipe.info, false);

  chartColors(recipe.charts, mode).forEach((hex, i) => {
    out[`chart-${i + 1}` as SemanticColorName] = hex;
  });
  out["chart-muted"] = chartMuted(recipe.neutral, mode);

  const primary = recipe.primary;
  out["focus-ring"] =
    mode === "light"
      ? primary[pick(primary, [500, 600, 700], [out.bg, out.surface], 3)]
      : primary[pick(primary, [400, 300], [out.bg, out.surface], 3)];
  out.link = out["primary-text"]!;
  out["link-hover"] = mode === "light" ? primary[darker(600, 2)] : primary[100];

  return { ...(out as SemanticColors), ...recipe.overrides?.[mode] };
}
