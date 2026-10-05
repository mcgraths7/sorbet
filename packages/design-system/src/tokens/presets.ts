/**
 * Theme presets. Each preset is a personality: ramp assignments, radius
 * style, font stacks, and a shadow tint. Semantic colors are derived — and
 * contrast-verified — by `buildMode`, never hand-tuned per component.
 */

import { chartThemes } from "./charts.ts";
import { ramps } from "./ramps.ts";
import { buildMode, type Mode, type SemanticColors, type SemanticRecipe } from "./semantics.ts";

import type { Hex } from "./color.ts";
import type { ContractName } from "./contracts.ts";
import type { EdgeData } from "./edges.ts";
import type { RadiusStyle } from "./scales.ts";
import type { SeamName } from "./seams.ts";

export interface Preset {
  name: string;
  label: string;
  tagline: string;
  defaultMode: "light" | "dark" | "system";
  radiusStyle: RadiusStyle;
  fonts: { sans: string; display: string; mono: string };
  shadowTint: Hex;
  /**
   * The roles, and beside them any optional colour tokens the theme defines
   * (seams.ts). Both are emitted as `--sb-<name>`, and both reach the
   * measurement in the one record, so a caller cannot hand it the roles and
   * forget the rest. No other key is allowed, and an optional token that is
   * present must be a colour `parseColor` reads (`presetColorsOf`); one held
   * as `undefined` is absent.
   */
  colors: Record<Mode, SemanticColors & Partial<Record<SeamName, string>>>;
  /**
   * The edges of the elements this theme describes, per mode, as data
   * (edges.ts), read through own keys of plain objects only
   * (`presetEdgesOf`): emitted as `--sb-edge-<element>` and measured by the
   * edge tiers. A theme without it emits no edge line, and an edge rule its
   * contract holds cannot be measured.
   */
  edges?: Record<Mode, EdgeData>;
  /**
   * The type of a button's label at the default and the small size, and its
   * weight. Emitted once, in the light block, as `--sb-button-font-size` and
   * `--sb-button-font-size-sm` (px / 16, in rem); the `label-type` check holds
   * it to what the contract's label tier requires. A theme without it emits
   * neither line.
   */
  buttonLabel?: { px: number; smallPx: number; weight: number };
  /**
   * The contract this preset is held to, one per mode (contracts.ts). Required,
   * and with no default anywhere: a preset that does not say is refused by
   * `contractOf` in rules.ts, which is the only thing that reads this — the
   * type alone stops nothing, because the tools run without type-checking.
   */
  contract: Record<Mode, ContractName>;
}

const SANS = "system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif";
const ROUNDED = `ui-rounded, "SF Pro Rounded", "Nunito", "Comfortaa", ${SANS}`;
const SERIF = "\"Iowan Old Style\", \"Palatino Linotype\", Palatino, Georgia, serif";
const GROTESK = "\"Helvetica Neue\", Helvetica, Arial, system-ui, sans-serif";
const MONO = "ui-monospace, \"SF Mono\", \"Cascadia Code\", Menlo, Consolas, \"Liberation Mono\", monospace";

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
    tagline: "Light and fun: robin's-egg blue, blossom pink, and butter yellow on warm cream.",
    defaultMode: "light",
    radiusStyle: "round",
    fonts: { sans: ROUNDED, display: ROUNDED, mono: MONO },
    shadowTint: ramps.sand[950],
    contract: { light: "wcag-aa", dark: "wcag-aa" },
    colors: build({
      neutral: ramps.sand,
      charts: chartThemes.sorbet,
      primary: ramps.aqua,
      secondary: ramps.raspberry,
      accent: ramps.lemon,
      brandStyle: "pastel",
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
    contract: { light: "wcag-aa", dark: "wcag-aa" },
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
    contract: { light: "wcag-aa", dark: "wcag-aa" },
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
    contract: { light: "wcag-aa", dark: "wcag-aa" },
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
    contract: { light: "wcag-aa", dark: "wcag-aa" },
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
