/**
 * Emitters: turn token data into CSS custom properties and Sass.
 *
 * - One theme file per preset (`dist/themes/<name>.css`): colors, fonts,
 *   radius, shadows for light + dark — and, for a preset that has the data,
 *   its optional colour tokens, its button label size and its edges.
 *   Swapping themes = swapping one file.
 * - One generated Sass partial: breakpoint maps (media queries can't read
 *   custom properties), the preset-independent scales, and the names the
 *   accessors validate against — the seams with their fallbacks, and the
 *   edge elements.
 *
 * A preset with no optional data emits exactly the lines it always has: no
 * code path asks "is this a WCAG preset"; the absence of the data is the whole
 * switch, and the frozen golden files hold it to that.
 */

import { withAlpha, type Hex } from "./color.ts";
import { EDGE_ELEMENTS, edgeProperties, haloRoom, presetEdgesOf, shadowText, type EdgeData } from "./edges.ts";
import { contractOf } from "./rules.ts";
import {
  breakpoints,
  containers,
  fontSize,
  fontWeight,
  lineHeight,
  misc,
  motion,
  radiusStyles,
  space,
  tracking,
  zIndex,
} from "./scales.ts";
import { isSeam, presetColorsOf, SEAMS } from "./seams.ts";
import { SEMANTIC_COLOR_NAMES, type Mode } from "./semantics.ts";

import type { Preset } from "./presets.ts";

const decl = (name: string, value: string) => `  --sb-${name}: ${value};`;

/** The present colours of a record, in record order: an own key holding `undefined` is absent and writes nothing. */
function colorDecls(colors: Preset["colors"][Mode]): string[] {
  return Object.entries(colors).flatMap(([name, value]) => (value === undefined ? [] : [decl(name, value)]));
}

function shadowDecls(mode: Mode, tint: Hex): string[] {
  const t = (a: number) => withAlpha(mode === "light" ? tint : "#000000", mode === "light" ? a : Math.min(a * 2.4, 0.7));
  return [
    decl("shadow-xs", `0 1px 2px ${t(0.06)}`),
    decl("shadow-sm", `0 1px 3px ${t(0.09)}, 0 1px 2px ${t(0.05)}`),
    decl("shadow-md", `0 4px 10px -2px ${t(0.12)}, 0 2px 4px -2px ${t(0.06)}`),
    decl("shadow-lg", `0 12px 24px -6px ${t(0.16)}, 0 4px 8px -4px ${t(0.06)}`),
    decl("shadow-xl", `0 24px 48px -12px ${t(0.24)}`),
  ];
}

const MODES: readonly Mode[] = ["light", "dark"];
const shown = (value: unknown): string => (typeof value === "number" ? String(value) : JSON.stringify(value) ?? String(value));

/** A preset's edge data for each mode, checked whole before a line is written: malformed data is a TypeError naming the preset and the element, never a quietly weaker edge. */
const edgesOf = (preset: Preset): Partial<Record<Mode, EdgeData>> => Object.fromEntries(MODES.map((mode) => [mode, presetEdgesOf(preset, mode)]));

/** `--sb-button-font-size` and `-sm`, px / 16 in rem: written once, in the light block, because the size is the same in both modes. */
function buttonLabelDecls(preset: Preset): string[] {
  const label: unknown = preset.buttonLabel;
  if (label === undefined) {
    return [];
  }
  const { px, smallPx } = (label ?? {}) as Record<string, unknown>;
  for (const [key, value] of [["px", px], ["smallPx", smallPx]] as const) {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      throw new TypeError(`the preset ${shown(preset.name)}: its buttonLabel.${key} is ${shown(value)}, and it must be a finite number of px greater than 0`);
    }
  }
  return [decl("button-font-size", `${(px as number) / 16}rem`), decl("button-font-size-sm", `${(smallPx as number) / 16}rem`)];
}

/** The custom properties a mode's optional data emits, in the order the block writes them: the present optional colour tokens of its record, then its edge properties and the halo room (L151). */
const optionalNames = (preset: Preset, mode: Mode, edges: EdgeData | undefined): string[] => [
  ...Object.entries(preset.colors[mode]).filter(([name, value]) => isSeam(name) && value !== undefined).map(([name]) => name),
  ...(edges === undefined ? [] : [...edgeProperties(edges).map(([property]) => property), "halo-room"]),
];

/** A mode's edge lines, then the room a clipping parent leaves for their all-round layers (L151). */
const edgeDecls = (edges: EdgeData | undefined): string[] =>
  edges === undefined ? [] : [...edgeProperties(edges).map(([property, layers]) => decl(property, shadowText(layers))), decl("halo-room", `${haloRoom(edges)}px`)];

/**
 * One mode's declarations: the colour scheme, the colours (roles and optional
 * tokens, in record order), the shadows, then — light only — the button
 * label's size, then the mode's edges and their halo room. A dark block ends by resetting, with
 * `initial`, every property the light block emits from optional data and the
 * dark block does not, one property at a time: `initial` makes a custom
 * property count as not set, so the stylesheet's fallback paints in dark
 * instead of the light value the dark block would otherwise inherit from
 * `:root`.
 */
function modeBlock(preset: Preset, mode: Mode, edges: Partial<Record<Mode, EdgeData>>): string[] {
  const own = edges[mode];
  const lines = [
    `  color-scheme: ${mode};`,
    ...colorDecls(preset.colors[mode]),
    ...shadowDecls(mode, preset.shadowTint),
    ...(mode === "light" ? buttonLabelDecls(preset) : []),
    ...edgeDecls(own),
  ];
  if (mode === "dark") {
    const defined = new Set(optionalNames(preset, "dark", own));
    lines.push(...optionalNames(preset, "light", edges.light).filter((name) => !defined.has(name)).map((name) => decl(name, "initial")));
  }
  return lines;
}

export function themeCss(preset: Preset): string {
  const radius = radiusStyles[preset.radiusStyle];
  for (const mode of MODES) {
    presetColorsOf(preset, mode);
  }
  const edges = edgesOf(preset);
  const light = modeBlock(preset, "light", edges).join("\n");
  const dark = modeBlock(preset, "dark", edges).join("\n");

  return `/* Sorbet DS theme: ${preset.name} — ${preset.tagline}
 * GENERATED by \`npm run build:tokens\` — edit src/tokens/, not this file. */

:root {
${decl("font-sans", preset.fonts.sans)}
${decl("font-display", preset.fonts.display)}
${decl("font-mono", preset.fonts.mono)}
${Object.entries(radius)
  .map(([k, v]) => decl(`radius-${k}`, v))
  .join("\n")}
${decl("radius-full", "999px")}
${light}
}

/* Explicit opt-in: <html data-theme="dark"> */
[data-theme="dark"] {
${dark}
}

/* System preference, unless the page opted out with data-theme="light" */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${dark}
  }
}
`;
}

const group = (obj: Record<string, string>, prefix: string) =>
  Object.entries(obj).map(([k, v]) => decl(prefix ? `${prefix}-${k}` : k, v));

export function generatedScss(): string {
  const mapEntries = (obj: Record<string, string>) =>
    Object.entries(obj)
      .map(([k, v]) => `  ${JSON.stringify(k)}: ${v},`)
      .join("\n");

  const list = (items: readonly string[]) => items.map((i) => JSON.stringify(i)).join(", ");
  const strip = (obj: Record<string, string>, prefix: string) =>
    Object.keys(obj).map((k) => k.replace(`${prefix}-`, ""));

  return `// GENERATED by \`npm run build:tokens\` — edit src/tokens/ (scales.ts, seams.ts, edges.ts), not this file.
// Breakpoints live in Sass because media queries cannot read custom properties.

$breakpoints: (
${mapEntries(breakpoints)}
);

$containers: (
${mapEntries(containers)}
);

// Known token names — the abstracts validate against these at compile time,
// so a typo'd token is a build error instead of a silently-broken var().
$semantic-colors: (${list(SEMANTIC_COLOR_NAMES)});

// The optional colour tokens (src/tokens/seams.ts), each with its fallback —
// a role, or CSS written as it is — for the stylesheet to take a seam's
// fallback from the same definition the checker reads, so the two cannot
// disagree about what an undefined token paints.
$seams: (
${Object.entries(SEAMS)
  .map(([name, fallback]) => `  ${JSON.stringify(name)}: (${"fallback" in fallback ? `"fallback": ${JSON.stringify(fallback.fallback)}` : `"css": ${JSON.stringify(fallback.css)}`}),`)
  .join("\n")}
);

// The elements a theme may give an edge (src/tokens/edges.ts), emitted as
// --sb-edge-<element>, -hover and -press.
$edge-elements: (${list(EDGE_ELEMENTS)});

$scale-keys: (
  "space": (${list(Object.keys(space))}),
  "text": (${list(Object.keys(fontSize))}),
  "leading": (${list(Object.keys(lineHeight))}),
  "weight": (${list(Object.keys(fontWeight))}),
  "tracking": (${list(Object.keys(tracking))}),
  "radius": ("xs", "sm", "md", "lg", "xl", "full"),
  "shadow": ("xs", "sm", "md", "lg", "xl"),
  "duration": (${list(strip(motion, "duration").filter((k) => !k.startsWith("ease")))}),
  "ease": (${list(strip(motion, "ease").filter((k) => !k.startsWith("duration")))}),
  "z": (${list(strip(zIndex, "z"))}),
  "font": ("sans", "display", "mono"),
  "misc": (${list(Object.keys(misc))}),
);

// Preset-independent tokens, emitted once from base/_root.scss.
@mixin static-tokens {
${[
  ...group(space, "space"),
  ...group(fontSize, "text"),
  ...group(lineHeight, "leading"),
  ...group(fontWeight, "weight"),
  ...group(tracking, "tracking"),
  ...group(motion, ""),
  ...group(zIndex, ""),
  ...group(misc, ""),
].join("\n")}
}
`;
}

/**
 * What a consumer can know about each preset without loading its theme. The
 * LAST key of an entry is the contract the preset is held to in each mode —
 * asked of `contractOf`, as everything else asks, so the manifest cannot
 * publish a declaration the gate would refuse. It goes after the five keys a
 * consumer already reads, so nothing that reads those sees a change.
 */
export function manifest(all: Record<string, Preset>): string {
  return JSON.stringify(
    Object.values(all).map((preset) => ({
      name: preset.name,
      label: preset.label,
      tagline: preset.tagline,
      defaultMode: preset.defaultMode,
      radiusStyle: preset.radiusStyle,
      contract: { light: contractOf(preset, "light"), dark: contractOf(preset, "dark") },
    })),
    null,
    2,
  );
}
