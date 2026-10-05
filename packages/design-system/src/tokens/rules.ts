/**
 * The accessibility contract's rules: which pairs of colours are compared. A
 * preset must hold every pair its contract lists, in both modes; the build
 * fails otherwise.
 *
 * A rule carries no number. It names a pair, the tier the pair belongs to and
 * why the pair is here. What a tier owes is the contract's to say
 * (contracts.ts, where every floor is written beside its reason and its
 * metric), and which contract judges a preset is the preset's to declare
 * (presets.ts, read by `contractOf` below). The number used to sit on the
 * rule, which made this list the only contract there could be.
 *
 * A side of a rule names a role, an optional colour token (seams.ts), or the
 * edge of an element (`edge:<element>`, edges.ts). The first 86 rules are the
 * ones `wcag-aa` was written against, unchanged; the 191 after them are added
 * for the `legibility` contract (legibility-spec.md, appendix A), which holds
 * those 191 and the two scrim rules among the first 86: 193 in each mode.
 *
 * The list is RULES; the measurement is `measureColors`, and there is one of
 * it. A preset is measured through `measurePreset`, which hands it the
 * preset's colours, its edges and the contract it declares, so no surface can
 * forget one of the three. Everything that speaks for the contract reads that
 * — the build gate (`checkPreset`), the reports (tools/check-contrast.ts,
 * `sorbet contrast`, the scaffold's copy) — and Token Studio's live check
 * reads `checkColors`. Nothing else walks RULES.
 *
 * One measurement is not yet one answer: each surface hands it colours from a
 * different place. The gate and the reports read the presets; Token Studio
 * reads text back off the page, where a minifier may have respelled every
 * value. So the colours are read in one place too — `parseColor` in color.ts —
 * and a colour measures the same however it arrives.
 */

import { apcaLc, compositeOver, oklabOf, parseColor, rgbToHex, simulateCvd, worstCaseContrast, type Hex, type ParsedColor } from "./color.ts";
import { contractNamed, contracts, floorFor, metricFor, TIER_KIND, TIERS, type CheckName, type Contract, type ContractName, type Kind, type Metric, type Tier, type View } from "./contracts.ts";
import { allRound, EDGE_ELEMENTS, edgeColor, edgeDataOf, edgePixels, isEdgeElement, presenceIn, presetEdgesOf, separationIn, type EdgeData, type EdgeElement } from "./edges.ts";
import { isSeam, presetColorsOf, resolveColor, type ColorRecord, type SeamName } from "./seams.ts";
import { SEMANTIC_COLOR_NAMES } from "./semantics.ts";

import type { Preset } from "./presets.ts";
import type { Mode, SemanticColorName } from "./semantics.ts";

/** What a side of a rule names: a role, an optional colour token, or the edge of an element. */
export type ColorRef = SemanticColorName | SeamName | `edge:${EdgeElement}`;

/** One pair of the contract: `fg` must be told from `bg`. How far apart is the contract's to say, by tier. */
export interface Rule {
  fg: ColorRef;
  bg: ColorRef;
  /** The group of rules this one owes the same floor as (contracts.ts). The tier's kind and its floor are read from there, never restated here. */
  tier: Tier;
  /** One sentence: why this pair is in the contract. A pair nobody can give a reason for is a pair nobody dares remove. */
  why: string;
  /** Restrict the rule to one mode (default: checked in both). */
  mode?: Mode;
}

type Pair = readonly [fg: ColorRef, bg: ColorRef];

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
  // ── the legibility contract's pairs (legibility-spec.md §7, appendix A: R087 to R283) ──
  // Appended after the 86 above, which keep their order: `wcag-aa` lists none
  // of these tiers, so what it measures does not move. Every one applies in
  // both modes; what differs by mode is the floor. Their order is the order of
  // their rule numbers, R280 to R283 last.

  // body (R087 to R101)
  ...held("body", "Body text is read on the page, on the surfaces laid over it, and inside a text field.", [
    ["text", "bg"], ["text", "surface"], ["text", "surface-raised"], ["text", "field-fill"],
  ]),
  ...held("body", "Strong text — field labels — is read on the page and on the surfaces laid over it.", [
    ["text-strong", "bg"], ["text-strong", "surface"], ["text-strong", "surface-raised"],
  ]),
  ...held("body", "Headings are read on the page and on the surfaces laid over it.", [
    ["heading-ink", "bg"], ["heading-ink", "surface"], ["heading-ink", "surface-raised"],
  ]),
  ...held("body", "12px captions are set in the label ink, on the page and on the surfaces laid over it.", [
    ["text-caption", "bg"], ["text-caption", "surface"], ["text-caption", "surface-raised"],
  ]),
  ...held("body", "A tooltip paints the page colour on the ink (atoms/_tooltip.scss), and that is what is read.", [["bg", "text"]]),
  ...held("body", "`text-inverse` is text on the ink, wherever a component sets it there.", [["text-inverse", "text"]]),

  // secondary (R102 to R127)
  ...held("secondary", "Secondary text is read on the page, on the surfaces laid over it, and inside a text field.", [
    ["text-muted", "bg"], ["text-muted", "surface"], ["text-muted", "surface-raised"], ["text-muted", "field-fill"],
  ]),
  ...held("secondary", "Body text is read in the well too: a sunken panel, a hovered row, a disabled field's ground.", [
    ["text", "bg-subtle"], ["text", "surface-sunken"],
  ]),
  ...held("secondary", "A link is text in the middle of the copy around it, on the page and on the surfaces laid over it, at rest and hovered.", [
    ["link", "bg"], ["link", "surface"], ["link", "surface-raised"],
    ["link-hover", "bg"], ["link-hover", "surface"], ["link-hover", "surface-raised"],
  ]),
  ...held("secondary", "Brand and status text (`-text`) is read on the page and on a card.", [
    ["primary-text", "bg"], ["primary-text", "surface"],
    ["secondary-text", "bg"], ["secondary-text", "surface"],
    ["accent-text", "bg"], ["accent-text", "surface"],
    ["success-text", "bg"], ["success-text", "surface"],
    ["warning-text", "bg"], ["warning-text", "surface"],
    ["danger-text", "bg"], ["danger-text", "surface"],
    ["info-text", "bg"], ["info-text", "surface"],
  ]),

  // on-wash (R128 to R135)
  ...held("on-wash", "Status and brand text is read on its own wash: alerts, soft badges, selected text.", [
    ["primary-text", "primary-subtle"], ["secondary-text", "secondary-subtle"], ["accent-text", "accent-subtle"],
    ["success-text", "success-subtle"], ["warning-text", "warning-subtle"], ["danger-text", "danger-subtle"], ["info-text", "info-subtle"],
  ]),
  ...held("on-wash", "A selected tab's or row's text is read on the selected wash.", [["primary-text", "selected-wash"]]),

  // tinted (R136 to R152)
  ...held("tinted", "Secondary text is read on a tinted ground: the well, a selected row, and every wash.", [
    ["text-muted", "bg-subtle"], ["text-muted", "surface-sunken"], ["text-muted", "selected-wash"],
    ["text-muted", "primary-subtle"], ["text-muted", "secondary-subtle"], ["text-muted", "accent-subtle"],
    ["text-muted", "success-subtle"], ["text-muted", "warning-subtle"], ["text-muted", "danger-subtle"], ["text-muted", "info-subtle"],
  ]),
  ...held("tinted", "A link inside an alert or a soft badge is read on that wash.", [
    ["link", "primary-subtle"], ["link", "secondary-subtle"], ["link", "accent-subtle"],
    ["link", "success-subtle"], ["link", "warning-subtle"], ["link", "danger-subtle"], ["link", "info-subtle"],
  ]),

  // label (R153 to R171)
  ...held("label", "A label is read on its full-strength fill: a button, a solid badge.", [
    ["on-primary", "primary"], ["on-secondary", "secondary"], ["on-accent", "accent"],
    ["on-success", "success"], ["on-warning", "warning"], ["on-danger", "danger"], ["on-info", "info"],
  ]),
  ...held("label", "A label is still read while its fill is hovered.", [
    ["on-primary", "primary-hover"], ["on-secondary", "secondary-hover"], ["on-accent", "accent-hover"],
    ["on-success", "success-hover"], ["on-warning", "warning-hover"], ["on-danger", "danger-hover"], ["on-info", "info-hover"],
  ]),
  ...held("label", "A label is still read while its fill is pressed, for every fill that has a pressed role.", [
    ["on-primary", "primary-active"], ["on-secondary", "secondary-active"], ["on-accent", "accent-active"], ["on-danger", "danger-active"],
  ]),
  ...held("label", "The tick and the radio dot are drawn on the checked fill.", [["on-primary", "control-checked"]]),

  // placeholder (R172 to R177)
  ...held("placeholder", "Placeholder and disabled text sits on the page, on the surfaces laid over it, inside a field and in the well.", [
    ["text-subtle", "bg"], ["text-subtle", "surface"], ["text-subtle", "surface-raised"],
    ["text-subtle", "field-fill"], ["text-subtle", "bg-subtle"], ["text-subtle", "surface-sunken"],
  ]),

  // mark-area (R178 to R186)
  ...held("mark-area", "A progress bar on its track.", [["primary-solid", "bg-subtle"]]),
  ...held("mark-area", "A switch that is on, against one that is off.", [["primary-solid", "switch-off"]]),
  ...held("mark-area", "A slider's thumb on its track.", [["primary-solid", "slider-track"]]),
  ...held("mark-area", "A checked box against an unchecked one.", [["control-checked", "field-fill"]]),
  ...held("mark-area", "A toned progress bar on its track.", [
    ["success-mark", "bg-subtle"], ["warning-mark", "bg-subtle"], ["danger-mark", "bg-subtle"], ["secondary-mark", "bg-subtle"], ["accent-mark", "bg-subtle"],
  ]),

  // mark-line (R187 to R203)
  ...held("mark-line", "The control ring round a checkbox or a radio, on every ground it is drawn on.", [
    ["border-strong", "surface"], ["border-strong", "bg"], ["border-strong", "surface-raised"], ["border-strong", "field-fill"],
  ]),
  ...held("mark-line", "A switch's ring on its off track.", [["switch-ring", "switch-off"]]),
  ...held("mark-line", "The tab indicator, on a card, on the page and on the selected tab's wash.", [
    ["primary-solid", "surface"], ["primary-solid", "bg"], ["primary-solid", "selected-wash"],
  ]),
  ...held("mark-line", "A selected row's bar on its wash.", [["selected-bar", "selected-wash"]]),
  ...held("mark-line", "A status mark with no label, on a card and on its own wash (decision A5).", [
    ["success-mark", "surface"], ["success-mark", "success-subtle"],
    ["warning-mark", "surface"], ["warning-mark", "warning-subtle"],
    ["danger-mark", "surface"], ["danger-mark", "danger-subtle"],
    ["info-mark", "surface"], ["info-mark", "info-subtle"],
  ]),

  // focus-visible (R204 to R223)
  ...held("focus-visible", "The focus ring against everything it can be drawn on or beside: the five surfaces, a field, every brand fill and every wash.", [
    ["focus-ring", "bg"], ["focus-ring", "bg-subtle"], ["focus-ring", "surface"], ["focus-ring", "surface-raised"], ["focus-ring", "surface-sunken"], ["focus-ring", "field-fill"],
    ["focus-ring", "primary"], ["focus-ring", "secondary"], ["focus-ring", "accent"], ["focus-ring", "success"], ["focus-ring", "warning"], ["focus-ring", "danger"], ["focus-ring", "info"],
    ["focus-ring", "primary-subtle"], ["focus-ring", "secondary-subtle"], ["focus-ring", "accent-subtle"], ["focus-ring", "success-subtle"],
    ["focus-ring", "warning-subtle"], ["focus-ring", "danger-subtle"], ["focus-ring", "info-subtle"],
  ]),

  // tell-apart (R224 to R227)
  ...held("tell-apart", "An invalid field's rim against the resting field edge.", [["danger-mark", "edge:field"]]),
  ...held("tell-apart", "An invalid field's rim against the focus ring.", [["danger-mark", "focus-ring"]]),
  ...held("tell-apart", "The focus ring against the control ring.", [["focus-ring", "border-strong"]]),
  ...held("tell-apart", "The focus ring against the resting field edge.", [["focus-ring", "edge:field"]]),

  // palette (R228 to R233)
  ...held("palette", "The four brand fills, two by two: no two may become one colour for one kind of reader.", [
    ["primary", "secondary"], ["primary", "accent"], ["primary", "success"], ["secondary", "accent"], ["secondary", "success"], ["accent", "success"],
  ]),

  // divider (R234 to R235)
  ...held("divider", "A dividing line on a card, the placement sheet 2 drew.", [["border", "surface"], ["border-subtle", "surface"]]),

  // chart-mark (R236 to R251)
  ...(["chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6", "chart-7", "chart-8"] as const).flatMap((slot) =>
    held("chart-mark", "A chart mark against the surface and the page it is drawn on.", [[slot, "surface"], [slot, "bg"]])),

  // the edges (R252 to R279; R268 to R271, R274 and R275 are withdrawn)
  ...held("edge-container", "A card's edge, on the page and in a well.", [["edge:container", "bg"], ["edge:container", "surface-sunken"]]),
  ...held("edge-floating", "A menu's, popover's, modal's or toast's edge, on a card and on the page.", [["edge:floating", "surface"], ["edge:floating", "bg"]]),
  ...held("edge-field", "A text field's edge, on a card, on the page and on a raised surface.", [["edge:field", "surface"], ["edge:field", "bg"], ["edge:field", "surface-raised"]]),
  ...held("edge-sunken", "A well's edge, on a card.", [["edge:sunken", "surface"]]),
  ...held("edge-quiet", "A quiet (outline) button's edge, on a card and on the page.", [["edge:quiet", "surface"], ["edge:quiet", "bg"]]),
  ...held("edge-filled", "A filled button's edge, on a card and on the page.", [
    ["edge:filled-primary", "surface"], ["edge:filled-primary", "bg"],
    ["edge:filled-secondary", "surface"], ["edge:filled-secondary", "bg"],
    ["edge:filled-accent", "surface"], ["edge:filled-accent", "bg"],
    ["edge:filled-danger", "surface"], ["edge:filled-danger", "bg"],
  ]),
  ...held("edge-status", "A status box's edge, on a card.", [
    ["edge:status-success", "surface"], ["edge:status-warning", "surface"], ["edge:status-danger", "surface"], ["edge:status-info", "surface"],
  ]),

  // mark-line, again (R280 to R283): added after the rest, so last in RULES.
  ...held("mark-line", "A status mark on a raised surface: the toast's stripe (molecules/_toast.scss).", [
    ["success-mark", "surface-raised"], ["warning-mark", "surface-raised"], ["danger-mark", "surface-raised"], ["info-mark", "surface-raised"],
  ]),
];

/** One rule of the contract, measured against one colour record. */
export interface Measurement {
  fg: ColorRef;
  bg: ColorRef;
  /** The rule's tier. */
  tier: Tier;
  /** What that tier protects: TIER_KIND[tier]. */
  kind: Kind;
  /** The ruler the CONTRACT measures this tier with. */
  metric: Metric;
  /** The floor the CONTRACT set for this pair in this mode: its tier's floor. */
  min: number;
  /**
   * What was measured — or null: the pair could NOT be measured. That is a
   * side with no value, a value `parseColor` cannot read, a see-through value
   * where the metric has nothing stated to put under it, or an edge with no
   * data. Under `ratio` a translucent BACKGROUND is measurable: the worst case
   * over every backdrop from white to black. Under `lc` and `sep` a
   * see-through FOREGROUND is: it is blended over the background.
   */
  actual: number | null;
  /** The view `actual` was taken in: the first of the contract's views that reaches the smallest value. Null when `actual` is. */
  view: View | null;
  /** True only for a pair that was measured and met its floor. */
  holds: boolean;
}

const MODES: readonly Mode[] = ["light", "dark"];

/** A value as an error message shows it: a string in its quotes, so `"text "` and `""` can be told from what they are not, and a number as itself (JSON turns NaN into null). */
const shown = (value: unknown): string => (typeof value === "number" ? String(value) : JSON.stringify(value) ?? String(value));

const ROLES: ReadonlySet<string> = new Set(SEMANTIC_COLOR_NAMES);

/** Whether `name` is something a rule's side may name: a role, an optional colour token, or `edge:` and an edge element. */
const isColorRef = (name: unknown): name is ColorRef =>
  typeof name === "string" && (ROLES.has(name) || isSeam(name) || (name.startsWith("edge:") && isEdgeElement(name.slice("edge:".length))));

const isEdge = (name: ColorRef): name is `edge:${EdgeElement}` => name.startsWith("edge:");

/** An opaque colour as a six-digit hex, or undefined for anything else: no value, a value `parseColor` cannot read, or one that is see-through. */
function opaque(value: string | undefined): Hex | undefined {
  const parsed = value === undefined ? null : parseColor(value);
  return parsed?.alpha === 1 ? rgbToHex(parsed.rgb) : undefined;
}

/** What one colour record and one mode's edge data give a measurement to read. */
interface Source {
  record: ColorRecord | undefined;
  edges: EdgeData | undefined;
}

/** An element's own fill as an opaque colour — `backdrop` being the backdrop's — or undefined where it cannot be read. */
function fillOf(element: EdgeElement, { record, edges }: Source, backdrop: Hex | undefined): Hex | undefined {
  const recipe = edges?.[element];
  if (recipe === undefined) {
    return undefined;
  }
  return recipe.fill === "backdrop" ? backdrop : opaque(resolveColor(record, recipe.fill));
}

/**
 * What a side of a rule names, as the stylesheet computes it (legibility-spec
 * L37): `edge:<element>` is that element's edge pixel (L52); anything else is
 * what `var(--sb-<name>, var(--sb-<role fallback>))` computes against the
 * record. Undefined where there is no value.
 */
function valueOf(name: ColorRef, source: Source): string | undefined {
  if (!isEdge(name)) {
    return resolveColor(source.record, name);
  }
  const element = name.slice("edge:".length) as EdgeElement;
  const recipe = source.edges?.[element];
  // An edge used as a colour is blended over the element's own fill, and no backdrop is known here, so an
  // element that paints no fill of its own ("backdrop") has no such colour.
  const fill = fillOf(element, source, undefined);
  return recipe === undefined || fill === undefined ? undefined : edgeColor(recipe, fill);
}

/**
 * The two opaque colours an `lc` or `sep` rule compares (L38): the background
 * as it is, and the foreground — blended over that background when it is
 * see-through, `transparent` included, rounded to whole channels. Null when
 * either cannot be read, or the background is see-through: nothing stated is
 * under it.
 */
function sidesOf(fg: ColorRef, bg: ColorRef, source: Source): [fg: Hex, bg: Hex] | null {
  const back = opaque(valueOf(bg, source));
  const front = valueOf(fg, source);
  const parsed = front === undefined ? null : parseColor(front);
  if (back === undefined || front === undefined || parsed === null) {
    return null;
  }
  return [parsed.alpha === 1 ? rgbToHex(parsed.rgb) : compositeOver(front, back), back];
}

/** The smallest value among the views, and the FIRST view, in the order given, that reaches it. */
function worstOf(views: readonly View[], at: (view: View) => number): { actual: number; view: View } {
  let worst: { actual: number; view: View } | undefined;
  for (const view of views) {
    const actual = at(view);
    if (worst === undefined || actual < worst.actual) {
      worst = { actual, view };
    }
  }
  return worst!;
}

/** The size of Lc, text first. Under a simulation it is taken on the 8-bit hexes `simulateCvd` returns, because APCA is defined on 8-bit sRGB. */
const lcIn = (view: View, text: Hex, ground: Hex): number => Math.abs((view === "typical" ? apcaLc(text, ground) : apcaLc(simulateCvd(text, view), simulateCvd(ground, view)))!);

/** What one rule measures under `metric`, in `views` — or null where it cannot be measured (L39). */
function measured(fg: ColorRef, bg: ColorRef, metric: Metric, views: readonly View[], source: Source): { actual: number; view: View } | null {
  if (metric === "ratio") {
    // As PR 1 measured it, and in typical vision only, whatever views the contract lists: the published
    // floor is defined on the colours as written, translucent background and all.
    const actual = measure(valueOf(fg, source), valueOf(bg, source));
    return actual === null ? null : { actual, view: "typical" };
  }
  if (metric === "presence") {
    const element = fg.slice("edge:".length) as EdgeElement;
    const recipe = source.edges?.[element];
    const backdrop = opaque(valueOf(bg, source));
    const fill = fillOf(element, source, backdrop);
    if (recipe === undefined || backdrop === undefined || fill === undefined) {
      return null;
    }
    const pixels = edgePixels(recipe, fill, backdrop);
    return worstOf(views, (view) => presenceIn(view, fill, backdrop, pixels));
  }
  const sides = sidesOf(fg, bg, source);
  if (sides === null) {
    return null;
  }
  const [front, back] = sides;
  return worstOf(views, (view) => (metric === "lc" ? lcIn(view, front, back) : separationIn(view, front, back)));
}

/** Null for anything worstCaseContrast cannot read, a value that is not there included. */
function measure(fg: string | undefined, bg: string | undefined): number | null {
  if (typeof fg !== "string" || typeof bg !== "string") {
    return null;
  }
  return worstCaseContrast(fg, bg);
}

/**
 * THE measurement: every rule that applies in `mode` and that `contract`
 * holds, in RULES order, each with the metric and floor the contract set for
 * it, what it measured and the view it was measured in.
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
 * pair it cannot measure comes back with `actual: null`, `view: null` and
 * `holds: false` — a failure that names the pair. "No claim" used to be
 * dropped here in silence, which reads exactly like a pass. A record that is
 * not there at all is every pair unmeasurable, the same answer as an empty
 * one; so is an edge rule with no `edges` given, or none for its element.
 *
 * The four metrics (legibility-spec.md §4.2): `ratio` is PR 1's worst-case
 * WCAG ratio, in typical vision only; `lc` is the size of APCA's Lc, the text
 * first; `sep` is OKLab separation; `presence` is an element's edge against
 * its backdrop (edges.ts). The last three are taken in each of the contract's
 * views (typical vision only when it lists none), and the worst is kept.
 *
 * The contract is REQUIRED. There is no default: a default is a second place
 * that decides which contract a preset is held to, and the one a later change
 * forgets to flip. A caller that measures a preset calls `measurePreset`.
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
 *   - a contract that does not exist, or one that is not sound as a whole
 *     (`contractNamed`, through `floorFor`). An unknown name is never treated
 *     as `wcag-aa`;
 *   - edge data that is malformed (`edgeDataOf`): a mistyped recipe must
 *     never be read as a weak edge;
 *   - a rule whose tier is not one of TIERS — in ANY rule of the list, not
 *     only those of this mode. A mistyped tier matches no contract's list, so
 *     without this it is a rule nobody is held to, and nothing says so;
 *   - a rule whose `mode` is there and is not "light" or "dark" ("Dark",
 *     "both") — again in ANY rule. Such a rule belongs to no mode, so it used
 *     to be skipped in both and never measured at all;
 *   - a rule naming a colour that is no role, no optional token and no
 *     `edge:` of an edge element — in ANY rule. That is a mistake in the
 *     rules, not a theme's failure (PR 1 measured it, and reported a theme
 *     failing on a name that does not exist);
 *   - a measured rule that puts an `edge:` where it cannot stand: as the text
 *     of an `lc` rule, as the backdrop of a `presence` rule, or a `presence`
 *     rule whose element is not an `edge:`;
 *   - a contract that ends up holding nothing in this mode: an empty tier map,
 *     or one that lists only tiers no rule uses. A contract over nothing
 *     passes everything.
 */
export function measureColors(mode: Mode, colors: ColorRecord | undefined, contract: ContractName, edges?: EdgeData): Measurement[] {
  if (!(MODES as readonly unknown[]).includes(mode)) {
    throw new TypeError(`measureColors: the mode must be "light" or "dark", got ${shown(mode)}`);
  }
  // Each tier's floor and metric, asked once and for every tier. floorFor validates the whole contract, so an
  // unknown or unsound one is refused before anything is measured, whichever rules happen to apply.
  const floors = new Map(TIERS.map((tier): [Tier, number | undefined] => [tier, floorFor(contract, tier, mode)]));
  const metrics = new Map(TIERS.map((tier): [Tier, Metric | undefined] => [tier, metricFor(contract, tier)]));
  const views = contractNamed(contract).views ?? ["typical"];
  const source: Source = { record: colors ?? undefined, edges: edgeDataOf(edges, "measureColors") };
  const pairs: Measurement[] = [];
  for (const { fg, bg, tier, mode: only } of RULES) {
    if (!(TIERS as readonly unknown[]).includes(tier)) {
      throw new TypeError(`measureColors: the rule ${fg} on ${bg} has a tier that is not one of TIERS: ${shown(tier)}. A mistyped tier would read as a rule no contract holds`);
    }
    if (only !== undefined && !(MODES as readonly unknown[]).includes(only)) {
      throw new TypeError(`measureColors: the rule ${fg} on ${bg} is restricted to a mode that is not "light" or "dark": ${shown(only)}. It would be measured in neither`);
    }
    for (const side of [fg, bg]) {
      if (!isColorRef(side)) {
        throw new TypeError(`measureColors: the rule ${shown(fg)} on ${shown(bg)} names ${shown(side)}, which is no role, no optional colour token and no edge: of an edge element. A mistyped name is a mistake in the rules, not a theme's failure`);
      }
    }
    const min = floors.get(tier);
    const metric = metrics.get(tier);
    if ((only !== undefined && only !== mode) || min === undefined || metric === undefined) {
      continue;
    }
    if (metric === "presence" ? !isEdge(fg) || isEdge(bg) : metric === "lc" && isEdge(fg)) {
      throw new TypeError(`measureColors: the rule ${fg} on ${bg} cannot be measured by ${metric}: a presence rule measures an edge: (its fg) on a backdrop that is not one, and an lc rule's fg is text, never an edge:`);
    }
    const found = measured(fg, bg, metric, views, source);
    const actual = found?.actual ?? null;
    pairs.push({ fg, bg, tier, kind: TIER_KIND[tier], metric, min, actual, view: found?.view ?? null, holds: actual !== null && actual >= min });
  }
  if (pairs.length === 0) {
    throw new TypeError(`measureColors: the contract ${shown(contract)} holds no rule in ${mode} mode. A contract over nothing would pass everything`);
  }
  return pairs;
}

/**
 * How many rules apply in `mode`, whatever any contract holds. A report says
 * how many of them the declared contract leaves unheld, and counts them here,
 * so it never takes RULES itself. Refuses a mode that is not a mode, as
 * `measureColors` does.
 */
export function applyingCount(mode: Mode): number {
  if (!(MODES as readonly unknown[]).includes(mode)) {
    throw new TypeError(`applyingCount: the mode must be "light" or "dark", got ${shown(mode)}`);
  }
  return RULES.filter((rule) => rule.mode === undefined || rule.mode === mode).length;
}

/**
 * A measured value as every surface prints it: two decimals — unless the pair
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
  /** Pairs that produced a value — the only number a report may call measured. */
  measured: number;
  /** Pairs that apply but produced none. Every one of them is in `failures`. */
  unmeasurable: number;
  /** Every pair that does not hold: under its floor, or not measured at all. */
  failures: Measurement[];
  /** The smallest value ÷ floor among the measured pairs. Infinity when nothing was measured. */
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
  fg: ColorRef;
  bg: ColorRef;
  min: number;
  /** Null: the pair could not be measured. Print that — there is no value to format. */
  actual: number | null;
  /** The rule's tier: a gate prints its `why` and `retire` under its failures. */
  tier: Tier;
  /** What `actual` measures, and so how it is printed. */
  metric: Metric;
  /** The view `actual` was taken in; null when it could not be measured. */
  view: View | null;
}

const failureOf = (preset: string, mode: Mode) => ({ fg, bg, min, actual, tier, metric, view }: Measurement): Failure => ({ preset, mode, fg, bg, min, actual, tier, metric, view });

/** The gate's reading of the measurement: the pairs that do not hold under `contract`. */
export function checkColors(presetName: string, mode: Mode, colors: ColorRecord | undefined, contract: ContractName, edges?: EdgeData): Failure[] {
  return measureColors(mode, colors, contract, edges).filter((pair) => !pair.holds).map(failureOf(presetName, mode));
}

/**
 * The contract a preset declares for a mode — validated, because nothing else
 * will: the tools run TypeScript without checking it, so `Preset.contract`
 * being required by the type stops nobody at run time.
 *
 * This is the ONE place a declaration is read. Everything that measures a
 * preset asks here (`measurePreset`, and through it `checkPreset`, the three
 * reports, tools/check-cli.ts and the playground's count; `checkStructure`;
 * the manifest), so a bad declaration is the same TypeError everywhere, naming
 * the preset and what it declared. It is not caught and it has no fallback: a
 * preset with no declaration, or with a mistyped one, must never be measured
 * against some other contract, and must never come back as "no failures".
 * The mode has to be the declaration's OWN property (one it only inherits is
 * not a declaration), and the name has to be a contract's OWN name in
 * `contracts`, so "toString" and "__proto__" are not names.
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

/**
 * The one way a PRESET is measured: its colours, its edges and the contract
 * it declares for the mode. Every surface that measures a preset calls this
 * and nothing else — a surface that called `measureColors` itself could
 * forget the edges, and for a `wcag-aa` preset nothing would show.
 *
 * The preset's own data is checked first, as the emitter checks it
 * (`presetColorsOf`, `presetEdgesOf`): a stray colour key, an optional token
 * whose value no colour reader can read, or edge data that is not plain is a
 * TypeError here, before any rule is measured — never measured as a fallback
 * the theme file does not paint.
 */
export function measurePreset(preset: Preset, mode: Mode): Measurement[] {
  const contract = contractOf(preset, mode);
  return measureColors(mode, presetColorsOf(preset, mode), contract, presetEdgesOf(preset, mode));
}

/** The build gate: each mode of a preset, measured against the contract the preset declares for THAT mode. */
export function checkPreset(preset: Preset): Failure[] {
  return MODES.flatMap((mode) => measurePreset(preset, mode).filter((pair) => !pair.holds).map(failureOf(preset.name, mode)));
}

/**
 * Which contracts the presets declare, and for how many preset-modes, as the
 * reports and the gates print it: "wcag-aa × 8, legibility × 2". Each
 * declaration is read through `contractOf`; the contracts are listed in the
 * order of `contracts`, and one nobody declares is left out.
 */
export function declaredContracts(all: Iterable<Preset>): string {
  const declared = [...all].flatMap((preset) => MODES.map((mode) => contractOf(preset, mode)));
  return Object.keys(contracts)
    .map((name) => [name, declared.filter((each) => each === name).length] as const)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => `${name} × ${count}`)
    .join(", ");
}

// ── the checks with no number (legibility-spec.md §9) ─────────────────────

/** A structure check that does not hold, for one preset in one mode. */
export interface StructureFailure {
  preset: string;
  mode: Mode;
  check: CheckName;
  /** What is wrong, naming every colour or element it is wrong about. */
  detail: string;
}

/** What a structure check reads. */
interface Subject extends Source {
  preset: Preset;
  mode: Mode;
  contract: Contract;
}

/** A name's value, read as L37 reads it, or the sentence saying why there is none to compare. */
function readable(name: string, record: ColorRecord | undefined): { value: string; parsed: ParsedColor } | string {
  const value = resolveColor(record, name);
  if (value === undefined) {
    return `${name} has no value`;
  }
  const parsed = parseColor(value);
  return parsed === null ? `${name} is ${shown(value)}, which cannot be read as a colour` : { value, parsed };
}

/** The 11 roles that move a fill, each with the resting fill it must equal (D6). */
const MOVING_FILLS: readonly [moving: SemanticColorName, rest: SemanticColorName][] = [
  ["primary-hover", "primary"], ["primary-active", "primary"], ["secondary-hover", "secondary"], ["secondary-active", "secondary"],
  ["accent-hover", "accent"], ["accent-active", "accent"], ["success-hover", "success"], ["warning-hover", "warning"],
  ["danger-hover", "danger"], ["danger-active", "danger"], ["info-hover", "info"],
];

/** The pairs C3 (a) compares: a line, and what it must not disappear into. */
const LINES_AND_FILLS: readonly [line: ColorRef, fill: ColorRef][] = [
  ["border", "surface"], ["border", "surface-raised"], ["border", "bg"],
  ["border-subtle", "surface"], ["border-subtle", "surface-raised"], ["border-subtle", "bg"],
  ["border-strong", "field-fill"], ["border-strong", "surface"], ["border-strong", "bg"],
  ["switch-ring", "switch-off"],
];

/** The edge tiers whose edges must be darker than the backdrop in light and lighter in dark. A sunken thing is edged the other way on purpose. */
const RAISED_EDGES: ReadonlySet<Tier> = new Set(["edge-container", "edge-floating", "edge-quiet", "edge-filled", "edge-status"]);

/** The backdrops the rules of `mode` measure an element's edge on. */
const backdropsOf = (element: EdgeElement, mode: Mode, tiers?: ReadonlySet<Tier>): ColorRef[] => [
  ...new Set(RULES.filter((rule) => (rule.mode === undefined || rule.mode === mode) && rule.fg === `edge:${element}` && (tiers === undefined || tiers.has(rule.tier))).map((rule) => rule.bg)),
];

/** An element's fill and backdrop as opaque colours, or the sentences saying why they cannot be. */
function grounds(element: EdgeElement, backdrop: ColorRef, source: Source): { fill: Hex; back: Hex } | string[] {
  const back = opaque(valueOf(backdrop, source));
  const fill = fillOf(element, source, back);
  if (back !== undefined && fill !== undefined) {
    return { fill, back };
  }
  const recipe = source.edges![element]!;
  return [
    ...(back === undefined ? [`${element}'s backdrop ${backdrop} has no opaque value`] : []),
    ...(fill === undefined && recipe.fill !== "backdrop" ? [`${element}'s fill ${recipe.fill} has no opaque value`] : []),
  ];
}

/** C3 (c): the 1px line tokens, each with the elements whose border it paints. */
const LINE_TOKENS: readonly [token: SeamName, serves: readonly EdgeElement[]][] = [
  ["container-line", ["container", "floating"]],
  ["field-line", ["field"]],
  ["filled-line", ["filled-primary", "filled-secondary", "filled-accent", "filled-danger"]],
];

/** The elements a mode's edge data describes, in EdgeElement order. */
const elementsIn = (edges: EdgeData | undefined): EdgeElement[] => EDGE_ELEMENTS.filter((element) => edges?.[element] !== undefined);

/** Each check: the problems it finds in one mode; none means it holds. */
const STRUCTURE: Readonly<Record<CheckName, (subject: Subject) => string[]>> = {
  // C1: every role has a value `parseColor` reads. What makes `danger-active` exist for a legibility theme.
  "roles-complete": ({ record }) => SEMANTIC_COLOR_NAMES.flatMap((name) => {
    const found = readable(name, record);
    return typeof found === "string" ? [found] : [];
  }),

  // C2: by the size of Lc on the page, typical vision: heading-ink ≥ text > text-muted > text-subtle.
  hierarchy: ({ record }) => {
    const page = opaque(resolveColor(record, "bg"));
    const inks = ["heading-ink", "text", "text-muted", "text-subtle"] as const;
    const read = inks.map((name) => readable(name, record));
    const problems = [...(page === undefined ? ["bg has no opaque value to measure the inks on"] : []), ...read.filter((found) => typeof found === "string")];
    if (problems.length > 0) {
      return problems;
    }
    const lc = read.map((found) => {
      const { value, parsed } = found as Exclude<typeof found, string>;
      return lcIn("typical", parsed.alpha === 1 ? rgbToHex(parsed.rgb) : compositeOver(value, page!), page!);
    });
    const at = (i: number) => `${inks[i]} (Lc ${lc[i]!.toFixed(2)})`;
    return [
      ...(lc[0]! >= lc[1]! ? [] : [`${at(0)} is under ${at(1)} on bg`]),
      ...(lc[1]! > lc[2]! ? [] : [`${at(2)} is not under ${at(1)} on bg`]),
      ...(lc[2]! > lc[3]! ? [] : [`${at(3)} is not under ${at(2)} on bg`]),
    ];
  },

  // C3: (a) no line is the hex of what it is drawn on, blended over it when see-through; (b) every element in the
  // mode's edges has an all-round layer, and no edge pixel is the hex of the element's fill on any backdrop its rules
  // name; (c) below.
  "edge-not-fill": (subject) => {
    const problems = new Set<string>();
    for (const [line, fill] of LINES_AND_FILLS) {
      const [front, back] = [readable(line, subject.record), readable(fill, subject.record)];
      for (const found of [front, back]) {
        if (typeof found === "string") {
          problems.add(found);
        }
      }
      if (typeof front === "string" || typeof back === "string") {
        continue;
      }
      if (back.parsed.alpha !== 1) {
        problems.add(`${fill} is see-through, so ${line} cannot be compared with it`);
        continue;
      }
      const ground = rgbToHex(back.parsed.rgb);
      const seen = front.parsed.alpha === 1 ? rgbToHex(front.parsed.rgb) : compositeOver(front.value, ground);
      if (seen === ground) {
        problems.add(`${line} on ${fill} is ${seen}, the same hex as ${fill}`);
      }
    }
    for (const element of elementsIn(subject.edges)) {
      const recipe = subject.edges![element]!;
      if (!recipe.rest.some(allRound)) {
        problems.add(`${element} has no all-round layer in rest, so nothing draws its edge`);
      }
      for (const backdrop of backdropsOf(element, subject.mode)) {
        const found = grounds(element, backdrop, subject);
        if (Array.isArray(found)) {
          found.forEach((problem) => problems.add(problem));
          continue;
        }
        for (const pixel of edgePixels(recipe, found.fill, found.back)) {
          if (pixel === found.fill) {
            problems.add(`${element} on ${backdrop}: an edge pixel is ${pixel}, the fill's own hex`);
          }
        }
      }
    }
    // (c) the 1px line tokens of the elements the mode's edges define: defined, and fully transparent. In this
    // look an element's edge is its recipe, and a visible line would be a second edge no rule or floor speaks for.
    const defined = new Set(elementsIn(subject.edges));
    for (const [token, serves] of LINE_TOKENS) {
      const served = serves.filter((element) => defined.has(element));
      if (served.length === 0) {
        continue;
      }
      const record = (subject.record ?? {}) as Readonly<Record<string, unknown>>;
      const value = Object.hasOwn(record, token) ? record[token] : undefined;
      const parsed = typeof value === "string" ? parseColor(value) : null;
      if (value === undefined) {
        problems.add(`${token} is not defined, and ${served.join(", ")} would draw the fallback line beside its edge`);
      } else if (parsed?.alpha !== 0) {
        problems.add(`${token} is ${String(value)}, and it must be fully transparent: ${served.join(", ")} has its edge from its recipe, not a line`);
      }
    }
    return [...problems];
  },

  // C7: each -hover and -active role is its resting fill (D6): hover and pressed move the shadow, never the fill.
  "fills-steady": ({ record }) => [...new Set(MOVING_FILLS.flatMap(([moving, rest]) => {
    const [a, b] = [readable(moving, record), readable(rest, record)];
    if (typeof a === "string" || typeof b === "string") {
      return [a, b].filter((found): found is string => typeof found === "string");
    }
    const same = a.parsed.alpha === b.parsed.alpha && rgbToHex(a.parsed.rgb) === rgbToHex(b.parsed.rgb);
    return same ? [] : [`${moving} is ${a.value}, and ${rest} is ${b.value}`];
  }))],

  // C8: every edge pixel of a raised element is darker than its backdrop in light and lighter in dark, by OKLab
  // lightness in typical vision. An element with no data is not this check's failure: its rules already fail by name.
  "edge-direction": (subject) => {
    const problems: string[] = [];
    for (const element of elementsIn(subject.edges)) {
      const recipe = subject.edges![element]!;
      for (const backdrop of backdropsOf(element, subject.mode, RAISED_EDGES)) {
        const found = grounds(element, backdrop, subject);
        if (Array.isArray(found)) {
          problems.push(...found);
          continue;
        }
        const ground = oklabOf(found.back)![0];
        for (const pixel of edgePixels(recipe, found.fill, found.back)) {
          const lightness = oklabOf(pixel)![0];
          if (subject.mode === "light" ? !(lightness < ground) : !(lightness > ground)) {
            problems.push(`${element} on ${backdrop}: the edge pixel ${pixel} is not ${subject.mode === "light" ? "darker" : "lighter"} than the backdrop ${found.back}`);
          }
        }
      }
    }
    return problems;
  },

  // C9: the preset's buttonLabel reaches what each tier with `requires` asks — the button, at both its sizes.
  "label-type": ({ preset, contract }) => Object.entries(contract.tiers).flatMap(([tier, entry]) => {
    const requires = entry?.requires;
    if (requires === undefined) {
      return [];
    }
    const label: unknown = preset.buttonLabel;
    if (typeof label !== "object" || label === null) {
      return [`the preset has no buttonLabel, and the ${tier} tier requires ${requires.buttonLabelPx}px, ${requires.buttonLabelSmallPx}px small, at weight ${requires.buttonLabelWeight}`];
    }
    const { px, smallPx, weight } = label as Record<string, unknown>;
    return ([["px", px, requires.buttonLabelPx], ["smallPx", smallPx, requires.buttonLabelSmallPx], ["weight", weight, requires.buttonLabelWeight]] as const).flatMap(([key, value, least]) =>
      (typeof value === "number" && value >= least ? [] : [`buttonLabel.${key} is ${shown(value)}, and the ${tier} tier requires at least ${least}`]));
  }),
};

/**
 * The true-or-false checks of a preset (legibility-spec.md §9): for each mode,
 * every check the contract it declares lists, in the contract's order, each
 * failing check once with every problem it found. `wcag-aa` lists none, so a
 * mode that declares it is held to nothing here. The build gate and the
 * reports run this beside `checkPreset`, and a failure fails them exactly as
 * a contrast failure does.
 *
 * Every name a check compares is read as the measurement reads it (L37), and
 * one with no value, or one `parseColor` cannot read, is a failure of the
 * check that names it — never a skip, and never a pass.
 */
export function checkStructure(preset: Preset): StructureFailure[] {
  return MODES.flatMap((mode) => {
    const contract = contractNamed(contractOf(preset, mode));
    // The preset's own data is checked whatever the contract holds, as measurePreset and the emitter check it.
    const record = presetColorsOf(preset, mode);
    const edges = presetEdgesOf(preset, mode);
    const checks = contract.checks ?? [];
    if (checks.length === 0) {
      return [];
    }
    const subject: Subject = { preset, mode, contract, record, edges };
    return checks.flatMap((check): StructureFailure[] => {
      const problems = STRUCTURE[check](subject);
      return problems.length === 0 ? [] : [{ preset: preset.name, mode, check, detail: problems.join("; ") }];
    });
  });
}
