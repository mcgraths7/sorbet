/**
 * The optional colour tokens: colours a theme may define that are no role.
 *
 * A legibility theme needs colours the 69 roles do not name — the fill inside
 * a text field, the track of a switch, the bar on a selected row, a status
 * colour strong enough to be a mark with no label. Each is an optional token:
 * only a theme that wants it defines it (in `preset.colors[mode]`, beside the
 * roles), and the stylesheet site that paints it is to read it through a
 * seam, `var(--sb-<name>, <fallback>)`, whose fallback is what that site
 * paints without it. So a theme that defines none of them — every WCAG preset
 * — emits exactly what it did before they existed.
 *
 * The fallback is written here and nowhere else: `generatedScss()` writes it
 * into the Sass as `$seams`, and the measurement reads it through
 * `resolveColor` below, so the checker and the stylesheet cannot disagree
 * about what an undefined token paints.
 */

import { parseColor } from "./color.ts";
import { SEMANTIC_COLOR_NAMES, type SemanticColorName, type SemanticColors } from "./semantics.ts";

/**
 * What the stylesheet paints where a theme does not define the token: a role
 * (`var(--sb-<role>)`), or CSS that is not a colour the measurement can read
 * (`inherit`, `transparent`, a `color-mix()`, a variable). A role fallback is
 * always a role, never another optional token, so a seam is one hop.
 */
export type SeamFallback = { fallback: SemanticColorName } | { css: string };

const seams = {
  "text-strong": { fallback: "text" },
  "heading-ink": { css: "inherit" },
  "text-caption": { fallback: "text-subtle" },
  "field-fill": { fallback: "surface" },
  "control-checked": { fallback: "primary-solid" },
  "switch-off": { fallback: "border-strong" },
  "slider-track": { css: "color-mix(in oklab, currentColor, transparent 80%)" },
  "switch-ring": { css: "transparent" },
  "selected-wash": { css: "transparent" },
  "selected-bar": { css: "transparent" },
  "container-line": { fallback: "border-subtle" },
  "field-line": { fallback: "border-strong" },
  "filled-line": { css: "var(--edge)" },
  "quiet-fill": { css: "transparent" },
  "success-mark": { fallback: "success" },
  "warning-mark": { fallback: "warning" },
  "danger-mark": { fallback: "danger" },
  "info-mark": { fallback: "info" },
  "secondary-mark": { fallback: "secondary" },
  "accent-mark": { fallback: "accent" },
} satisfies Record<string, SeamFallback>;

/** The name of an optional colour token. */
export type SeamName = keyof typeof seams;

/** Every optional colour token, in the order a theme lists them, each with its fallback. */
export const SEAMS: Readonly<Record<SeamName, SeamFallback>> = seams;

/** A colour record as a preset holds one: the roles, and any optional tokens beside them. */
export type ColorRecord = Partial<SemanticColors & Record<SeamName, string>>;

/** Whether `name` is an optional colour token (an own key of SEAMS, so "toString" is not one). */
export const isSeam = (name: unknown): name is SeamName => typeof name === "string" && Object.hasOwn(SEAMS, name);

/** The record's own value for `name`, when it is a string that is not blank. */
function own(record: Readonly<Record<string, unknown>>, name: string): string | undefined {
  const value = Object.hasOwn(record, name) ? record[name] : undefined;
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

/**
 * What `var(--sb-<name>, var(--sb-<fallback>))` computes against a colour
 * record: the record's own value for `name`; or, for an optional token with a
 * role fallback, the record's value for that role; or nothing. A value that is
 * empty or blank counts as not set — it is what a browser returns for a custom
 * property that is not set, and so what Token Studio reads back off a page. A
 * CSS fallback is no colour the measurement can read, so an optional token
 * that has one has no value until a theme defines it: undefined, never the
 * fallback's text.
 *
 * It answers "what is painted", not "is it a colour": the value comes back as
 * written, for `parseColor` to read or refuse.
 */
export function resolveColor(record: ColorRecord | undefined, name: string): string | undefined {
  const colors = (record ?? {}) as Readonly<Record<string, unknown>>;
  const value = own(colors, name);
  if (value !== undefined || !isSeam(name)) {
    return value;
  }
  const fallback = SEAMS[name];
  return "fallback" in fallback ? own(colors, fallback.fallback) : undefined;
}

const shown = (value: unknown): string => (typeof value === "number" ? String(value) : JSON.stringify(value) ?? String(value));
const ROLES: ReadonlySet<unknown> = new Set(SEMANTIC_COLOR_NAMES);

/**
 * A PRESET's colour record for one mode, checked before it is emitted or
 * measured: a TypeError naming the preset, the mode and the key for
 *
 *   - a key that is neither a role nor an optional token (`feild-fill`): it
 *     would be emitted as a stray property while the real token silently took
 *     its fallback;
 *   - an optional token that is present — an own key whose value is not
 *     `undefined` — and is not a string `parseColor` reads (`null`, `""`, a
 *     blank, a number, unreadable text): the gate would measure its fallback
 *     while the theme file painted the bad value.
 *
 * An own key holding `undefined` is absent: not emitted, measured as its
 * fallback. A role is not judged here: a role that cannot be read is a named
 * failure of the measurement, as it always was. This is the preset's own
 * record; a record read back off a page (Token Studio) goes straight to
 * `measureColors`, where a blank value is a property nobody set.
 */
export function presetColorsOf(preset: { name: string; colors: Readonly<Record<string, unknown>> }, mode: "light" | "dark"): ColorRecord | undefined {
  const record: unknown = preset.colors[mode];
  if (typeof record !== "object" || record === null) {
    return record === undefined || record === null ? undefined : (record as ColorRecord);
  }
  for (const key of Object.keys(record)) {
    const value = (record as Record<string, unknown>)[key];
    if (!ROLES.has(key) && !isSeam(key)) {
      throw new TypeError(`the preset ${shown(preset.name)} (${mode} mode): its colours have the key ${shown(key)}, which is neither a role nor an optional colour token, so it would be emitted as a property nothing reads`);
    }
    if (isSeam(key) && value !== undefined && (typeof value !== "string" || value.trim() === "" || parseColor(value) === null)) {
      throw new TypeError(`the preset ${shown(preset.name)} (${mode} mode): its optional token ${key} is ${shown(value)}, and a value a preset defines must be a colour parseColor reads (leave the key out, or undefined, to mean unset)`);
    }
  }
  return record as ColorRecord;
}
