/**
 * What a STATE is, and the one form a state may write a shadow in
 * (legibility-spec.md L153, L162 (a)). The ONE definition: the source rule
 * (`no-state-box-shadow.js`), the compiled check in
 * `packages/design-system/tools/test-contracts.ts` and the e24df74 recorder
 * (`tools/fixtures/contracts/record-e24df74-styles.mts.txt`) all import it.
 *
 * THE DEFECTS THIS EXISTS TO CATCH (audit of 7a683fd, guards lens):
 * - F9: there were four literal copies of the state list, and dropping half of
 *   one copy's terms left every test green. One definition cannot drift from
 *   itself, and `test-contracts.ts` holds every term below with a case of its
 *   own.
 * - F9: `:HOVER` passed both checks; CSS pseudo-classes and HTML attribute
 *   names are case-insensitive, so both are matched without case. A BEM
 *   modifier is part of a class name, which is case-sensitive, and is not.
 * - F6: the attribute list named `[data-state]`, which the library never uses,
 *   and missed `[data-invalid]`, `[data-highlighted]`, `[data-selected]`,
 *   `[data-disabled]`, `[data-loading]` and `[open]`, which it does. A
 *   `data-*` attribute is a state unless it is on the named list of FACTS
 *   below: something true of the element that no user action changes. A new
 *   attribute is a state until someone argues otherwise in a spec line.
 * - F3: the composed form was a regex on the start of the value, so a third
 *   layer appended after it, a visible fallback on either layer, or another
 *   custom property whose name merely starts `--state-layer` all passed.
 *   `isComposed` reads the whole value: exactly two items, the two layers by
 *   their exact names, each with no fallback or the placeholder.
 *
 * Depends on a spec correction not yet approved (repair proposal for L153):
 * the `[data-*]`-unless-a-fact rule and the HTML state attributes replace
 * L153's `[data-state]`.
 */

/** User-action and form pseudo-classes (L153), also inside :is(), :where(), :not() and :has(). */
export const STATE_PSEUDO_CLASSES = ["hover", "active", "focus", "focus-visible", "focus-within", "checked", "indeterminate", "disabled", "enabled", "invalid", "user-invalid", "open", "popover-open", "target"];

/** BEM state modifiers (L153's named list). Anything else after `--` is a style variant. */
export const STATE_MODIFIERS = ["selected", "active", "current", "open", "checked", "pressed", "expanded", "invalid", "disabled", "loading"];

/** HTML attributes that are states: an open <details>/<dialog>, and the boolean form states. */
export const STATE_ATTRIBUTES = ["open", "checked", "selected", "disabled"];

/**
 * `data-*` attributes that are FACTS, not states: true of the element whatever
 * the user does. L163 named the first (`data-today`, a fact about a date); the
 * rest are every other fact the library's partials use: where a date falls
 * (outside the month), how content is laid out (align, numeric, reverse), what
 * a figure or a step says (trend, status), how a field is marked (optional,
 * required), what an item is (danger), and a configuration (pause-on-hover).
 * Every other `data-*` attribute, the range a user picked included, is a state.
 */
export const FACT_ATTRIBUTES = ["data-today", "data-outside", "data-align", "data-numeric", "data-reverse", "data-trend", "data-status", "data-optional", "data-required", "data-danger", "data-pause-on-hover"];

const PSEUDO = new RegExp(`:(?:${STATE_PSEUDO_CLASSES.join("|")})(?![\\w-])`, "i");
const PSEUDO_ALL = new RegExp(PSEUDO.source, "gi");
const MODIFIER = new RegExp(`--(?:${STATE_MODIFIERS.join("|")})(?![\\w-])`);
const MODIFIER_ALL = new RegExp(MODIFIER.source, "g");
const ATTRIBUTE_ALL = /\[\s*([\w-]+)\s*(?:[~|^$*]?=\s*(?:"[^"]*"|'[^']*'|[^\]\s]*)\s*(?:[is]\s*)?)?\]/gi;

/** Whether an attribute name (as written in a selector) is a state. */
export function isStateAttribute(name) {
  const lower = name.toLowerCase();
  return lower.startsWith("aria-") || (lower.startsWith("data-") && !FACT_ATTRIBUTES.includes(lower)) || STATE_ATTRIBUTES.includes(lower);
}

/** Whether a selector (compiled, or as written with `&`) carries a state anywhere in it. */
export function isStateSelector(selector) {
  return PSEUDO.test(selector) || MODIFIER.test(selector) || [...selector.matchAll(ATTRIBUTE_ALL)].some((m) => isStateAttribute(m[1]));
}

/** The selector with every state taken off: a state pseudo-class, a state attribute, a state modifier. */
export function stripStates(selector) {
  return selector.replace(PSEUDO_ALL, "").replace(MODIFIER_ALL, "").replace(ATTRIBUTE_ALL, (whole, name) => (isStateAttribute(name) ? "" : whole));
}

/** Split at commas outside parentheses and quotes. */
export function splitTop(text) {
  const parts = [];
  let depth = 0;
  let quote = "";
  let current = "";
  for (const ch of text) {
    if (quote !== "") {
      quote = ch === quote ? "" : quote;
    } else if (ch === "\"" || ch === "'") {
      quote = ch;
    } else if (ch === "(") {
      depth++;
    } else if (ch === ")") {
      depth--;
    } else if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  parts.push(current.trim());
  return parts.filter((part) => part !== "");
}

/** The placeholder layer (L146): no offset, blur, spread or colour, in each spelling Sass or a person writes it. */
export const PLACEHOLDER = /^0\s+0\s+(?:#0000|#00000000|transparent|rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)|rgb\(\s*0\s+0\s+0\s*\/\s*0\s*\))$/i;

/** `var(<name>)` or `var(<name>, <placeholder>)`, and nothing else. */
const layerRead = (item, name) => {
  const m = /^var\(\s*(--[\w-]+)\s*(?:,\s*([\s\S]*))?\)$/.exec(item.trim());
  return m !== null && m[1] === name && (m[2] === undefined || PLACEHOLDER.test(m[2].trim()));
};

/** L153's composed form, whole: `var(--state-layer[, 0 0 #0000]), var(--edge-layer[, 0 0 #0000])`. */
export function isComposed(value) {
  const items = splitTop(value.replace(/\s*!important\s*$/i, ""));
  return items.length === 2 && layerRead(items[0], "--state-layer") && layerRead(items[1], "--edge-layer");
}
