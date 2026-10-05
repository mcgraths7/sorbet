import { readFileSync } from "node:fs";

import stylelint from "stylelint";

const { createPlugin, utils } = stylelint;
const ruleName = "sorbet/no-state-box-shadow";
const messages = utils.ruleMessages(ruleName, {
  rejected: (selector) =>
    `box-shadow on a state selector (${selector}). An element's shadow is a state layer over an edge layer, composed in abstracts/ (control-glow, soft-edge): set the layer's custom property here, or use those mixins (or where-defined, on an element with no edge layer), instead of writing box-shadow, which replaces the edge.`,
  stale: (selector) =>
    `allowlist entry no longer matches anything (${selector}): move it from tools/stylelint/state-box-shadow-allowlist.json to state-box-shadow-removed.json. The allowlist only shrinks.`,
});

const ALLOWLIST = new URL("./state-box-shadow-allowlist.json", import.meta.url);

// What a state is: legibility-spec.md L153, the one definition, which the
// compiled check in test-contracts.ts shares. A user-action or form
// pseudo-class (also inside :is, :where, :not and :has), an [aria-*] or
// [data-state] attribute, or a BEM modifier from the named list. A modifier not
// on the list is a style variant (--raised, --flat, --sm), and another [data-*]
// attribute is a fact about the element (L163: [data-today]), not a state.
const STATE_PSEUDO = /:(?:hover|active|focus|focus-visible|focus-within|checked|indeterminate|disabled|enabled|invalid|user-invalid|open|popover-open|target)(?![\w-])/;
const STATE_ATTRIBUTE = /\[\s*(?:aria-[\w-]+|data-state)\s*[\]=~|^$*]/;
const STATE_MODIFIER = /--(?:selected|active|current|open|checked|pressed|expanded|invalid|disabled|loading)(?![\w-])/;

// What writes a shadow: the property, its vendor spellings, and the abstracts'
// mixins that write one outright. A list composed of the two layers is the
// allowed form (L153), as is any other mixin (control-glow composes; where-defined
// is held by the compiled check, L162 (a)). An interpolated property name is
// left to the compiled check, which sees it once Sass has resolved it.
const SHADOW_PROPERTY = /^(?:-webkit-|-moz-)?box-shadow$/i;
const SHADOW_MIXIN = /^(?:elevate|popover-surface)\b/;
const COMPOSED = /^var\(--state-layer\b[\s\S]*\),\s*var\(--edge-layer\b/;

const tidy = (text) => text.replace(/\s+/g, " ").trim();

/** Whether one selector (as written, nesting `&` and all) names a state. */
export function isStateSelector(selector) {
  return STATE_PSEUDO.test(selector) || STATE_ATTRIBUTE.test(selector) || STATE_MODIFIER.test(selector);
}

/** The partial's path under src/styles/, or undefined for a file that is not one. */
export function partialOf(file) {
  const at = file?.replace(/\\/g, "/").lastIndexOf("/src/styles/");
  return at === undefined || at < 0 ? undefined : file.replace(/\\/g, "/").slice(at + "/src/styles/".length);
}

/**
 * Every shadow written under a state selector, with the chain of enclosing
 * rules and at-rules that identifies it. The chain, not the line, is the key:
 * a line moves whenever something above it does; a chain moves only when the
 * site itself is rewritten. `@at-root <selector>` counts as a selector.
 */
export function stateBoxShadows(root) {
  const found = [];
  const visit = (node) => {
    const chain = [];
    let state = false;
    for (let parent = node.parent; parent && parent.type !== "root"; parent = parent.parent) {
      if (parent.type === "rule") {
        chain.unshift(tidy(parent.selector));
        state ||= isStateSelector(parent.selector);
      } else if (parent.type === "atrule") {
        chain.unshift(tidy(`@${parent.name} ${parent.params}`));
        state ||= parent.name === "at-root" && isStateSelector(parent.params);
      }
    }
    if (state) {
      found.push({ decl: node, selector: chain.join(" | ") });
    }
  };
  root.walkDecls(SHADOW_PROPERTY, (decl) => {
    if (!COMPOSED.test(decl.value.trim())) {
      visit(decl);
    }
  });
  root.walkAtRules("include", (include) => {
    if (SHADOW_MIXIN.test(include.params.trim())) {
      visit(include);
    }
  });
  return found;
}

const readAllowlist = () => JSON.parse(readFileSync(ALLOWLIST, "utf8")).entries;

const rule = (primary, secondary) => {
  return (root, result) => {
    const file = partialOf(root.source?.input.file);
    if (!primary || file === undefined || file.startsWith("abstracts/")) {
      return;
    }
    // `{ allowlist: false }` reports every site: what the generator runs on a ref.
    const entries = secondary?.allowlist === false ? [] : readAllowlist().filter((e) => e.file === file);
    const unmatched = new Set(entries.map((e) => e.selector));
    for (const { decl, selector } of stateBoxShadows(root)) {
      if (unmatched.delete(selector) || entries.some((e) => e.selector === selector)) {
        continue;
      }
      utils.report({ message: messages.rejected(selector), node: decl, result, ruleName });
    }
    for (const selector of unmatched) {
      utils.report({ message: messages.stale(selector), node: root, result, ruleName });
    }
  };
};

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = {
  url: "https://github.com/mcgraths7/sorbet/blob/main/tools/stylelint/no-state-box-shadow.js",
};

export default createPlugin(ruleName, rule);
