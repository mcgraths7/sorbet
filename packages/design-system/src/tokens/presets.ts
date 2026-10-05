/**
 * Theme presets. Each preset is a personality: ramp assignments, radius
 * style, font stacks, and a shadow tint. Semantic colors are derived — and
 * contrast-verified — by `buildMode`, never hand-tuned per component; the one
 * exception is sorbet's light record, written whole from the values its
 * legibility contract was approved on, and held to them by the tests.
 */

import { chartThemes } from "./charts.ts";
import { ramps } from "./ramps.ts";
import { buildMode, type Mode, type SemanticColors, type SemanticRecipe } from "./semantics.ts";

import type { Hex } from "./color.ts";
import type { ContractName } from "./contracts.ts";
import type { EdgeData, ShadowLayer } from "./edges.ts";
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
   * edge tiers. A theme or a mode without it emits no edge line, and an edge
   * rule its contract holds cannot be measured.
   */
  edges?: Partial<Record<Mode, EdgeData>>;
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

/**
 * Sorbet's recipe, which still builds its DARK record. Its light record is no
 * longer built: it is written whole below, as the legibility contract's
 * values were approved (docs/pastel-legibility-evidence/legibility-spec.md,
 * §3), and its dark record is rebuilt the same way in a later step.
 */
const SORBET_RECIPE: SemanticRecipe = {
  neutral: ramps.sand,
  charts: chartThemes.sorbet,
  primary: ramps.aqua,
  secondary: ramps.raspberry,
  accent: ramps.lemon,
  brandStyle: "pastel",
  ...STATUS,
};

/**
 * Sorbet in light mode, every value as legibility-spec.md §3 states it: the
 * 69 roles in the order of SEMANTIC_COLOR_NAMES (L12), then the 20 optional
 * colour tokens in the order of SEAMS (L15). Typed, not derived: each value is
 * a hex the owner approved on a sample sheet, or follows from one by a stated
 * rule (D1 to D12), and tools/test-contracts.ts holds every one to the spec.
 * The chart colours are the shipped ones, unchanged (decision A3).
 */
const SORBET_LIGHT = {
  bg: "#fef4dc",
  "bg-subtle": "#f7ecd1",
  surface: "#fffbf1",
  "surface-raised": "#fffbf1",
  "surface-sunken": "#f7ecd1",
  scrim: "rgb(0 0 0 / 0.6)",
  "on-scrim": "#fffbf1",
  "on-scrim-muted": "#f3e7ce",
  text: "#693800",
  "text-muted": "#844d16",
  "text-subtle": "#975e2a",
  "text-inverse": "#fef4dc",
  border: "#e3d2b0",
  "border-subtle": "#e3d2b0",
  "border-strong": "#b096d7",
  "focus-ring": "#8e6ac7",
  primary: "#dac5fc",
  "primary-hover": "#dac5fc",
  "primary-active": "#dac5fc",
  "primary-subtle": "#ede0f7",
  "primary-text": "#472400",
  "on-primary": "#472400",
  "primary-solid": "#b096d7",
  "secondary-solid": "#d29397",
  "accent-solid": "#ccb563",
  secondary: "#f9c3c6",
  "secondary-hover": "#f9c3c6",
  "secondary-active": "#f9c3c6",
  "secondary-subtle": "#fcdfdc",
  "secondary-text": "#693800",
  "on-secondary": "#472400",
  accent: "#f5e3a2",
  "accent-hover": "#f5e3a2",
  "accent-active": "#f5e3a2",
  "accent-subtle": "#faefca",
  "accent-text": "#693800",
  "on-accent": "#472400",
  success: "#a6edee",
  "success-hover": "#a6edee",
  "success-subtle": "#d3f4f0",
  "success-text": "#693800",
  "on-success": "#472400",
  warning: "#f5e3a2",
  "warning-hover": "#f5e3a2",
  "warning-subtle": "#faefca",
  "warning-text": "#693800",
  "on-warning": "#472400",
  danger: "#f9c3c6",
  "danger-hover": "#f9c3c6",
  "danger-active": "#f9c3c6",
  "danger-subtle": "#fcdfdc",
  "danger-text": "#693800",
  "on-danger": "#472400",
  info: "#dac5fc",
  "info-hover": "#dac5fc",
  "info-subtle": "#ede0f7",
  "info-text": "#693800",
  "on-info": "#472400",
  link: "#654199",
  "link-hover": "#654199",
  "chart-1": "#008289",
  "chart-2": "#9e6400",
  "chart-3": "#ec5198",
  "chart-4": "#8a6f00",
  "chart-5": "#0f70d5",
  "chart-6": "#e8672e",
  "chart-7": "#5761db",
  "chart-8": "#598100",
  "chart-muted": "#b8b2a9",
  "text-strong": "#472400",
  "heading-ink": "#472400",
  "text-caption": "#472400",
  "field-fill": "#fffbf1",
  "control-checked": "#dac5fc",
  "switch-off": "#f7ecd1",
  "slider-track": "#f7ecd1",
  "switch-ring": "#b096d7",
  "selected-wash": "#ede0f7",
  "selected-bar": "#b096d7",
  "container-line": "transparent",
  "field-line": "transparent",
  "filled-line": "transparent",
  "quiet-fill": "#fffbf1",
  "success-mark": "#00b5b8",
  "warning-mark": "#bb9c12",
  "danger-mark": "#d77784",
  "info-mark": "#b096d7",
  "secondary-mark": "#d29397",
  "accent-mark": "#ccb563",
} satisfies SemanticColors & Partial<Record<SeamName, string>>;

/** One shadow layer, written in the order a box-shadow is: `[inset] x y blur spread colour`, then its strength. */
const layer = (inset: boolean, x: number, y: number, blur: number, spread: number, color: Hex, alpha: number): ShadowLayer => ({ inset, x, y, blur, spread, color, alpha });
const IN = true;
const OUT = false;

/**
 * Sorbet's light edges, as legibility-spec.md §5.2 writes them (L45): sheet
 * 2's recipes on the cream page, each element's fill the token its Sass site
 * paints (L106). The danger button's recipe is the blush one's (L46).
 */
const SORBET_EDGES_LIGHT: EdgeData = {
  container: {
    fill: "surface",
    rest: [layer(OUT, 0, 0, 6, 1, "#a16e32", 0.38), layer(OUT, 0, 2, 4, 0, "#a16e32", 0.18), layer(OUT, 0, 10, 28, -8, "#a16e32", 0.26)],
  },
  floating: {
    fill: "surface-raised",
    rest: [layer(OUT, 0, 0, 10, 2, "#a16e32", 0.44), layer(OUT, 0, 4, 8, 0, "#a16e32", 0.2), layer(OUT, 0, 18, 44, -10, "#a16e32", 0.36)],
  },
  field: {
    fill: "field-fill",
    rest: [layer(IN, 0, 0, 0, 1, "#815b1f", 0.24), layer(IN, 0, 2, 3, 0, "#815b1f", 0.14), layer(OUT, 0, 1, 0, 0, "#ffffff", 0.9)],
  },
  sunken: {
    fill: "surface-sunken",
    rest: [layer(IN, 0, 1, 3, 0, "#a16e32", 0.3), layer(IN, 0, 0, 0, 1, "#a16e32", 0.12)],
  },
  quiet: {
    fill: "quiet-fill",
    rest: [layer(OUT, 0, 0, 4, 1, "#a16e32", 0.42), layer(OUT, 0, 1, 2, 0, "#a16e32", 0.3), layer(OUT, 0, 4, 10, -2, "#a16e32", 0.24)],
  },
  "filled-primary": {
    fill: "primary",
    rest: [layer(OUT, 0, 0, 4, 1, "#af88e6", 0.7), layer(OUT, 0, 1, 2, 0, "#af88e6", 0.6), layer(OUT, 0, 4, 10, -2, "#7f5fab", 0.26)],
    hover: [layer(OUT, 0, 0, 6, 2, "#af88e6", 0.75), layer(OUT, 0, 2, 4, 0, "#af88e6", 0.6), layer(OUT, 0, 9, 18, -3, "#7f5fab", 0.32)],
    press: [layer(OUT, 0, 0, 2, 1, "#af88e6", 0.8), layer(IN, 0, 1, 3, 0, "#7f5fab", 0.38)],
  },
  "filled-secondary": {
    fill: "secondary",
    rest: [layer(OUT, 0, 0, 4, 1, "#e87783", 0.7), layer(OUT, 0, 1, 2, 0, "#e87783", 0.6), layer(OUT, 0, 4, 10, -2, "#ac505b", 0.26)],
    hover: [layer(OUT, 0, 0, 6, 2, "#e87783", 0.75), layer(OUT, 0, 2, 4, 0, "#e87783", 0.6), layer(OUT, 0, 9, 18, -3, "#ac505b", 0.32)],
    press: [layer(OUT, 0, 0, 2, 1, "#e87783", 0.8), layer(IN, 0, 1, 3, 0, "#ac505b", 0.38)],
  },
  "filled-accent": {
    fill: "accent",
    rest: [layer(OUT, 0, 0, 4, 1, "#bb9c12", 0.7), layer(OUT, 0, 1, 2, 0, "#bb9c12", 0.6), layer(OUT, 0, 4, 10, -2, "#877000", 0.26)],
    hover: [layer(OUT, 0, 0, 6, 2, "#bb9c12", 0.75), layer(OUT, 0, 2, 4, 0, "#bb9c12", 0.6), layer(OUT, 0, 9, 18, -3, "#877000", 0.32)],
    press: [layer(OUT, 0, 0, 2, 1, "#bb9c12", 0.8), layer(IN, 0, 1, 3, 0, "#877000", 0.38)],
  },
  "filled-danger": {
    fill: "danger",
    rest: [layer(OUT, 0, 0, 4, 1, "#e87783", 0.7), layer(OUT, 0, 1, 2, 0, "#e87783", 0.6), layer(OUT, 0, 4, 10, -2, "#ac505b", 0.26)],
    hover: [layer(OUT, 0, 0, 6, 2, "#e87783", 0.75), layer(OUT, 0, 2, 4, 0, "#e87783", 0.6), layer(OUT, 0, 9, 18, -3, "#ac505b", 0.32)],
    press: [layer(OUT, 0, 0, 2, 1, "#e87783", 0.8), layer(IN, 0, 1, 3, 0, "#ac505b", 0.38)],
  },
  "status-success": {
    fill: "success-subtle",
    rest: [layer(OUT, 0, 0, 5, 1, "#00b5b8", 0.6), layer(OUT, 0, 1, 2, 0, "#00b5b8", 0.5)],
  },
  "status-warning": {
    fill: "warning-subtle",
    rest: [layer(OUT, 0, 0, 5, 1, "#bb9c12", 0.6), layer(OUT, 0, 1, 2, 0, "#bb9c12", 0.5)],
  },
  "status-danger": {
    fill: "danger-subtle",
    rest: [layer(OUT, 0, 0, 5, 1, "#e87783", 0.6), layer(OUT, 0, 1, 2, 0, "#e87783", 0.5)],
  },
  "status-info": {
    fill: "info-subtle",
    rest: [layer(OUT, 0, 0, 5, 1, "#af88e6", 0.6), layer(OUT, 0, 1, 2, 0, "#af88e6", 0.5)],
  },
};

export const presets = {
  sorbet: {
    name: "sorbet",
    label: "Sorbet",
    tagline: "Light and fun: lilac, blush pink, butter yellow and robin's-egg blue on warm cream.",
    defaultMode: "light",
    radiusStyle: "round",
    fonts: { sans: ROUNDED, display: ROUNDED, mono: MONO },
    shadowTint: "#a16e32",
    contract: { light: "legibility", dark: "wcag-aa" },
    colors: { light: SORBET_LIGHT, dark: buildMode(SORBET_RECIPE, "dark") },
    edges: { light: SORBET_EDGES_LIGHT },
    buttonLabel: { px: 16, smallPx: 14, weight: 600 },
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
