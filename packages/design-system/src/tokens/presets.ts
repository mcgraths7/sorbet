/**
 * Theme presets. Each preset is a personality: ramp assignments, radius
 * style, font stacks, and a shadow tint. Semantic colors are derived — and
 * contrast-verified — by `buildMode`, never hand-tuned per component.
 */

import type { Hex } from "./color.ts";
import { ramps } from "./ramps.ts";
import { chartThemes } from "./charts.ts";
import { buildMode, type Mode, type SemanticColors, type SemanticRecipe } from "./semantics.ts";
import type { RadiusStyle } from "./scales.ts";

export interface Preset {
  name: string;
  label: string;
  tagline: string;
  defaultMode: "light" | "dark" | "system";
  radiusStyle: RadiusStyle;
  fonts: { sans: string; display: string; mono: string };
  shadowTint: Hex;
  colors: Record<Mode, SemanticColors>;
}

const SANS = `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
const ROUNDED = `ui-rounded, "SF Pro Rounded", "Nunito", "Comfortaa", ${SANS}`;
const SERIF = `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`;
const GROTESK = `"Helvetica Neue", Helvetica, Arial, system-ui, sans-serif`;
const MONO = `ui-monospace, "SF Mono", "Cascadia Code", Menlo, Consolas, "Liberation Mono", monospace`;

const STATUS = {
  success: ramps.green,
  warning: ramps.amber,
  danger: ramps.red,
  info: ramps.blue,
} satisfies Partial<SemanticRecipe>;

function build(recipe: SemanticRecipe): Record<Mode, SemanticColors> {
  return { light: buildMode(recipe, "light"), dark: buildMode(recipe, "dark") };
}

export const presets = {
  sorbet: {
    name: "sorbet",
    label: "Sorbet",
    tagline: "Light and fun: raspberry, mint, and grape on a warm, sun-washed page.",
    defaultMode: "light",
    radiusStyle: "round",
    fonts: { sans: ROUNDED, display: ROUNDED, mono: MONO },
    shadowTint: ramps.mauve[950],
    colors: build({
      neutral: ramps.mauve,
      charts: chartThemes.sorbet,
      primary: ramps.raspberry,
      secondary: ramps.teal,
      accent: ramps.grape,
      ...STATUS,
    }),
  },
  ocean: {
    name: "ocean",
    label: "Ocean",
    tagline: "Clean corporate SaaS: confident blues on crisp white.",
    defaultMode: "system",
    radiusStyle: "soft",
    fonts: { sans: SANS, display: SANS, mono: MONO },
    shadowTint: ramps.slate[950],
    colors: build({
      neutral: ramps.slate,
      primary: ramps.blue,
      charts: chartThemes.ocean,
      secondary: ramps.cyan,
      accent: ramps.indigo,
      pureSurfaces: true,
      ...STATUS,
    }),
  },
  forest: {
    name: "forest",
    label: "Forest",
    tagline: "Organic and grounded: deep greens and terracotta on warm sand.",
    defaultMode: "light",
    radiusStyle: "soft",
    fonts: { sans: SANS, display: SERIF, mono: MONO },
    shadowTint: ramps.sand[950],
    colors: build({
      neutral: ramps.sand,
      charts: chartThemes.forest,
      primary: ramps.green,
      secondary: ramps.teal,
      accent: ramps.coral,
      ...STATUS,
    }),
  },
  noir: {
    name: "noir",
    label: "Noir",
    tagline: "Minimal editorial monochrome with a single shot of lemon.",
    defaultMode: "system",
    radiusStyle: "sharp",
    fonts: { sans: GROTESK, display: GROTESK, mono: MONO },
    shadowTint: ramps.gray[950],
    colors: build({
      neutral: ramps.gray,
      charts: chartThemes.noir,
      primary: ramps.gray,
      secondary: ramps.gray,
      accent: ramps.lemon,
      pureSurfaces: true,
      ...STATUS,
      overrides: {
        light: {
          primary: ramps.gray[900],
          "primary-hover": ramps.gray[800],
          "primary-active": ramps.gray[700],
          "on-primary": "#ffffff",
          "primary-text": ramps.gray[900],
          link: ramps.gray[900],
          "link-hover": ramps.gray[700],
          "focus-ring": ramps.gray[700],
        },
        dark: {
          primary: ramps.gray[100],
          "primary-hover": ramps.gray[200],
          "primary-active": ramps.gray[300],
          "on-primary": ramps.gray[950],
          "primary-text": ramps.gray[100],
          link: ramps.gray[100],
          "link-hover": ramps.gray[300],
          "focus-ring": ramps.gray[300],
        },
      },
    }),
  },
  midnight: {
    name: "midnight",
    label: "Midnight",
    tagline: "Sleek and electric: violet and cyan built dark-first.",
    defaultMode: "dark",
    radiusStyle: "soft",
    fonts: { sans: SANS, display: SANS, mono: MONO },
    shadowTint: ramps.violet[950],
    colors: build({
      neutral: ramps.slate,
      primary: ramps.violet,
      charts: chartThemes.midnight,
      secondary: ramps.fuchsia,
      accent: ramps.cyan,
      ...STATUS,
    }),
  },
} satisfies Record<string, Preset>;

export type PresetName = keyof typeof presets;
export const PRESET_NAMES = Object.keys(presets) as PresetName[];
export const DEFAULT_PRESET: PresetName = "sorbet";
