/**
 * Shadows as data, and what an edge measures.
 *
 * A theme's shadows used to be strings built in emit.ts, so nothing could
 * measure the edge a card or a button shows. A preset that wants its edges
 * held writes them here as data (`preset.edges`): each element's own fill,
 * and the shadow layers drawn round it at rest (and, for display only, when
 * hovered and pressed). The theme file's `--sb-edge-<element>` string and the
 * checker's number are both made from that one record, so they cannot drift.
 *
 * The arithmetic is legibility-spec.md §5.3, and it is a heuristic, not a
 * bound: blur is ignored and layers are not stacked, so an edge can render
 * stronger or weaker than its number. What the number does guarantee is that
 * a recipe has not drifted from the one the owner approved.
 */

import { compositeOver, separation, withAlpha, type Hex } from "./color.ts";
import { isSeam, type SeamName } from "./seams.ts";
import { SEMANTIC_COLOR_NAMES, type SemanticColorName } from "./semantics.ts";

import type { View } from "./contracts.ts";

/** The elements whose edges a preset may describe, in the order a theme file lists them. */
export const EDGE_ELEMENTS = [
  "container", "floating", "field", "sunken", "quiet",
  "filled-primary", "filled-secondary", "filled-accent", "filled-danger",
  "status-success", "status-warning", "status-danger", "status-info",
] as const;

/** An element whose edge a preset may describe. */
export type EdgeElement = (typeof EDGE_ELEMENTS)[number];

/** One layer of a box-shadow. */
export interface ShadowLayer {
  /** True: drawn inside the element's box. */
  inset: boolean;
  /** Px, how far right. */
  x: number;
  /** Px, how far down. */
  y: number;
  /** Px, at least 0. */
  blur: number;
  /** Px, how far it grows past the box (may be negative). */
  spread: number;
  /** Six-digit hex, opaque. */
  color: Hex;
  /** Its strength: greater than 0, at most 1. */
  alpha: number;
}

export interface EdgeRecipe {
  /** The element's own fill, as its Sass site paints it; "backdrop" when it paints none. */
  fill: SemanticColorName | SeamName | "backdrop";
  /** The edge at rest: the only state the gate measures. An empty list is an element with no shadow. */
  rest: ShadowLayer[];
  /** Emitted as `--sb-edge-<element>-hover`; not measured. */
  hover?: ShadowLayer[];
  /** Emitted as `--sb-edge-<element>-press`; not measured. */
  press?: ShadowLayer[];
}

/** One mode's edges. An element left out is not an error: the rules that read it cannot be measured. */
export type EdgeData = Partial<Record<EdgeElement, EdgeRecipe>>;

const STATES = ["rest", "hover", "press"] as const;
/** Whether `name` is one of the edge elements. */
export const isEdgeElement = (name: unknown): name is EdgeElement => typeof name === "string" && (EDGE_ELEMENTS as readonly string[]).includes(name);
const shown = (value: unknown): string => (typeof value === "number" ? String(value) : JSON.stringify(value) ?? String(value));

/** The keys a layer holds, every one required; and the keys a recipe may hold. */
const LAYER_KEYS = ["inset", "x", "y", "blur", "spread", "color", "alpha"] as const;
const RECIPE_KEYS: readonly string[] = ["fill", ...STATES];

/**
 * A plain object: its prototype is `Object.prototype` or `null`. Edge data is
 * read through own keys only, so an object that could hand a reader a value
 * through its prototype — an inherited recipe, a class instance, a Map — is
 * refused rather than read one way by the validation and another by the CSS.
 */
function plainProblem(value: unknown, what: string): string | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return `${what} is ${shown(value)}, and it must be a plain object`;
  }
  const proto: unknown = Object.getPrototypeOf(value);
  if (proto === Object.prototype || proto === null) {
    return undefined;
  }
  const inherited: string[] = [];
  for (const key in value) {
    if (!Object.hasOwn(value, key)) {
      inherited.push(key);
    }
  }
  return `${what} is not a plain object (its prototype is neither Object.prototype nor null)${inherited.length > 0 ? `, and it inherits ${inherited.join(", ")}` : ""}: it is read through its own keys only`;
}

/** An array whose every index from 0 to length − 1 is its own: a hole is refused, never skipped or read through the prototype. */
const dense = (value: unknown): value is unknown[] => Array.isArray(value) && Array.from({ length: value.length }, (_, i) => Object.hasOwn(value, i)).every(Boolean);

/** What is wrong with one layer, or undefined. */
function layerProblem(layer: unknown): string | undefined {
  const plain = plainProblem(layer, "it");
  if (plain !== undefined) {
    return plain;
  }
  const keys = Object.keys(layer as object);
  const stray = keys.find((key) => !(LAYER_KEYS as readonly string[]).includes(key));
  if (stray !== undefined) {
    return `it has the key ${shown(stray)}, and a layer holds exactly ${LAYER_KEYS.join(", ")}`;
  }
  const missing = LAYER_KEYS.find((key) => !keys.includes(key));
  if (missing !== undefined) {
    return `it has no ${missing}, and a layer holds exactly ${LAYER_KEYS.join(", ")}`;
  }
  const { inset, x, y, blur, spread, color, alpha } = layer as Record<string, unknown>;
  if (typeof inset !== "boolean") {
    return `its inset is ${shown(inset)}, and it must be true or false`;
  }
  for (const [key, value] of [["x", x], ["y", y], ["blur", blur], ["spread", spread], ["alpha", alpha]] as const) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return `its ${key} is ${shown(value)}, and it must be a finite number`;
    }
  }
  if ((blur as number) < 0) {
    return `its blur is ${shown(blur)}, and a blur is at least 0`;
  }
  if (!((alpha as number) > 0 && (alpha as number) <= 1)) {
    return `its alpha is ${shown(alpha)}, and a strength is greater than 0 and at most 1`;
  }
  if (typeof color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return `its color is ${shown(color)}, and it must be a six-digit hex`;
  }
  return undefined;
}

/**
 * One mode's edge data, checked whole: a TypeError for anything malformed,
 * naming `who` (the preset when it is emitted or measured through the preset;
 * on the measuring path through `measureColors`, the caller), the element and
 * the layer's position counted from 1. A mistyped recipe must never be read
 * as a weak edge, and a key nothing reads — a mistyped element, one of the
 * withdrawn `filled-success`, `filled-warning`, `filled-info`, a recipe's
 * `hovr`, a layer's `colour` — must never pass quietly.
 *
 * Everything is read through own keys of plain objects and dense arrays, and
 * what comes back is a fresh copy built from those own values alone (with a
 * null prototype at the top), so the emitter and the measurement read exactly
 * what was validated and nothing a prototype could add.
 *
 * `undefined` and `null` are no edge data at all, which is not an error: a
 * rule that reads an edge then cannot be measured.
 */
export function edgeDataOf(data: unknown, who: string): EdgeData | undefined {
  if (data === undefined || data === null) {
    return undefined;
  }
  const refused = (problem: string) => new TypeError(`${who}: the edge data cannot be used: ${problem}`);
  const plain = plainProblem(data, "it");
  if (plain !== undefined) {
    throw refused(plain);
  }
  const copy = Object.create(null) as Record<EdgeElement, EdgeRecipe>;
  for (const element of Reflect.ownKeys(data as object)) {
    if (!isEdgeElement(element)) {
      throw refused(`it has the key ${shown(typeof element === "symbol" ? String(element) : element)}, which is not an edge element, so nothing would read it. The elements are ${EDGE_ELEMENTS.join(", ")}`);
    }
    const recipe: unknown = (data as Record<string, unknown>)[element];
    const notPlain = plainProblem(recipe, `the element ${shown(element)}`);
    if (notPlain !== undefined) {
      throw refused(`${notPlain}; a recipe is { fill, rest, hover?, press? }`);
    }
    const own = recipe as Record<string, unknown>;
    const stray = Object.keys(own).find((key) => !RECIPE_KEYS.includes(key));
    if (stray !== undefined) {
      throw refused(`the element ${shown(element)} has the key ${shown(stray)}, and a recipe holds only fill, rest, hover and press`);
    }
    const { fill } = own;
    if (!Object.hasOwn(own, "fill") || (fill !== "backdrop" && !isSeam(fill) && !(SEMANTIC_COLOR_NAMES as readonly unknown[]).includes(fill))) {
      throw refused(`the element ${shown(element)} has the fill ${shown(fill)}, which is no role, no optional token and not "backdrop"`);
    }
    const states: Partial<Record<(typeof STATES)[number], ShadowLayer[]>> = {};
    for (const state of STATES) {
      const layers = Object.hasOwn(own, state) ? own[state] : undefined;
      if (state !== "rest" && layers === undefined) {
        continue;
      }
      if (!dense(layers)) {
        throw refused(`the element ${shown(element)} has a ${state} of ${shown(layers)}, and it must be an array of layers with no holes`);
      }
      layers.forEach((layer, i) => {
        const problem = layerProblem(layer);
        if (problem !== undefined) {
          throw refused(`the element ${shown(element)}, ${state} layer ${i + 1}: ${problem}`);
        }
      });
      states[state] = layers.map((layer) => {
        const { inset, x, y, blur, spread, color, alpha } = layer as ShadowLayer;
        return { inset, x, y, blur, spread, color, alpha };
      });
    }
    copy[element] = { fill: fill as EdgeRecipe["fill"], rest: states.rest!, hover: states.hover, press: states.press };
  }
  return copy;
}

/**
 * A preset's edge data for one mode, read as `edgeDataOf` reads a mode's:
 * `preset.edges` itself must be a plain object whose own keys are modes, and
 * the mode is read as an own key. Undefined when the preset has no `edges`,
 * or none for that mode.
 */
export function presetEdgesOf(preset: { name: string; edges?: unknown }, mode: "light" | "dark"): EdgeData | undefined {
  const who = `the preset ${shown(preset.name)} (${mode} mode)`;
  const edges = preset.edges;
  if (edges === undefined) {
    return undefined;
  }
  const plain = plainProblem(edges, "its `edges`");
  if (plain !== undefined) {
    throw new TypeError(`${who}: ${plain}, and it must be { light?, dark? }`);
  }
  const stray = Object.keys(edges as object).find((key) => key !== "light" && key !== "dark");
  if (stray !== undefined) {
    throw new TypeError(`${who}: its \`edges\` has the key ${shown(stray)}, which is not a mode, so nothing would emit it`);
  }
  return edgeDataOf(Object.hasOwn(edges as object, mode) ? (edges as Record<string, unknown>)[mode] : undefined, who);
}

/** Every edge property a mode's data emits, in the order a theme file writes them: `--sb-edge-<element>`, then its `-hover` and `-press`. */
export function edgeProperties(data: EdgeData): [property: string, layers: ShadowLayer[]][] {
  return EDGE_ELEMENTS.flatMap((element) => {
    const recipe = data[element];
    if (recipe === undefined) {
      return [];
    }
    const properties: [string, ShadowLayer[]][] = [[`edge-${element}`, recipe.rest]];
    for (const state of ["hover", "press"] as const) {
      const layers = recipe[state];
      if (layers !== undefined) {
        properties.push([`edge-${element}-${state}`, layers]);
      }
    }
    return properties;
  });
}

/** A layer list as CSS writes a box-shadow: `[inset ]<x> <y> <blur> <spread> <colour>`, each length `0` or `<n>px`, joined by `, `; for no layers `0 0 #0000`, a transparent zero shadow, never `none`: the stylesheet composes an edge into a box-shadow list, where `none` is invalid and would erase the whole list (L146). */
export function shadowText(layers: readonly ShadowLayer[]): string {
  const length = (n: number) => (n === 0 ? "0" : `${n}px`);
  return layers.length === 0
    ? "0 0 #0000"
    : layers.map((layer) => `${layer.inset ? "inset " : ""}${[layer.x, layer.y, layer.blur, layer.spread].map(length).join(" ")} ${withAlpha(layer.color, layer.alpha)}`).join(", ");
}

/** The elements whose all-round outset layers a clipping parent must make room for (L151): the ones that sit in flow beside their neighbours. */
const HALO_ELEMENTS: readonly EdgeElement[] = ["container", "quiet", "filled-primary", "filled-secondary", "filled-accent", "filled-danger"];

/**
 * How far a mode's all-round layers reach past an element's box, in whole px
 * (L151): the largest `max(|x|, |y|) + blur + spread` of any all-round layer
 * drawn outside the box, in the rest, hover and press of the container, the
 * quiet element and the four filled ones, rounded up. A clipping or scrolling
 * parent pads by it, so it never cuts the layer presence measures. 0 when no
 * such layer exists.
 */
export function haloRoom(data: EdgeData): number {
  const reaches = HALO_ELEMENTS.flatMap((element) => {
    const recipe = data[element];
    return recipe === undefined ? [] : [...recipe.rest, ...(recipe.hover ?? []), ...(recipe.press ?? [])];
  })
    .filter((layer) => allRound(layer) && !layer.inset)
    .map((layer) => Math.max(Math.abs(layer.x), Math.abs(layer.y)) + layer.blur + layer.spread);
  return Math.ceil(Math.max(0, ...reaches));
}

/**
 * A layer that reaches every side alike: no offset and a positive spread.
 * Only such a layer can stand in for a border, so it is the only kind whose
 * colour counts as the edge. Computed from the numbers; nothing is flagged by
 * hand.
 */
export const allRound = (layer: ShadowLayer): boolean => layer.x === 0 && layer.y === 0 && layer.spread > 0;

/**
 * The colour one layer makes where it is strongest: its colour at its
 * strength over what is under it, channel by channel, rounded to a whole
 * number. One layer alone — never over the element's other layers.
 */
export const edgePixel = (layer: ShadowLayer, under: Hex): Hex => compositeOver(withAlpha(layer.color, layer.alpha), under);

/**
 * The edge pixels of an element: each all-round layer of `rest` over what is
 * under it — the backdrop `K` for a layer drawn outside the box, the element's
 * own fill `F` for one drawn inside it.
 */
export const edgePixels = (recipe: EdgeRecipe, fill: Hex, backdrop: Hex): Hex[] =>
  recipe.rest.filter(allRound).map((layer) => edgePixel(layer, layer.inset ? fill : backdrop));

/**
 * An element's edge used as a colour (`edge:<element>` as a side of a
 * separation rule): defined only when `rest` has exactly one all-round layer
 * and that layer is drawn inside the box, because only then does it depend on
 * nothing but the element. Undefined otherwise.
 */
export function edgeColor(recipe: EdgeRecipe, fill: Hex): Hex | undefined {
  const layers = recipe.rest.filter(allRound);
  return layers.length === 1 && layers[0]!.inset ? edgePixel(layers[0]!, fill) : undefined;
}

/** How far apart two opaque colours look in one view: under a simulation, of the unrounded simulated colours (`separation` keeps floats). */
export const separationIn = (view: View, a: Hex, b: Hex): number => (view === "typical" ? separation(a, b) : separation(a, b, view))!;

/**
 * Presence in one view: crossing the element's boundary, the eye meets three
 * steps — backdrop to fill, backdrop to each edge pixel, each edge pixel to the
 * fill — and the edge is as present as the largest of them. With no all-round
 * layer it is the fill step alone.
 */
export const presenceIn = (view: View, fill: Hex, backdrop: Hex, pixels: readonly Hex[]): number =>
  Math.max(separationIn(view, fill, backdrop), ...pixels.map((pixel) => separationIn(view, pixel, backdrop)), ...pixels.map((pixel) => separationIn(view, pixel, fill)));
