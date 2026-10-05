import { readFileSync } from "node:fs";

import stylelint from "stylelint";

const { createPlugin, utils } = stylelint;
const ruleName = "sorbet/no-state-box-shadow";
const messages = utils.ruleMessages(ruleName, {
  rejected: (selector) =>
    `box-shadow on a state selector (${selector}). An element's shadow is a state layer over an edge layer, composed in abstracts/ (control-glow, soft-edge): set the layer's custom property here, or use those mixins, instead of writing box-shadow, which replaces the edge.`,
  stale: (selector) =>
    `allowlist entry no longer matches anything (${selector}): delete it from tools/stylelint/state-box-shadow-allowlist.json. The allowlist only shrinks.`,
});

const ALLOWLIST = new URL("./state-box-shadow-allowlist.json", import.meta.url);

// A state is a pseudo-class a user or the page turns on and off, or an
// attribute the library sets to say so (aria-*, data-*, open). What sits
// inside :not(…) is a condition on the state, not a state of its own, so it is
// removed before testing: `.x:not(:disabled)` is the element at rest.
const STATE_PSEUDO = /:(?:hover|focus|focus-visible|focus-within|active|checked|indeterminate|disabled|enabled|invalid|user-invalid|valid|user-valid|open|popover-open|target|placeholder-shown|autofill|visited|current)(?![\w-])/;
const STATE_ATTRIBUTE = /\[\s*(?:aria-[\w-]+|data-[\w-]+|open)\s*[\]=~|^$*]/;
const NOT = /:not\((?:[^()]|\([^()]*\))*\)/g;

const tidy = (text) => text.replace(/\s+/g, " ").trim();

/** Whether one selector (as written, nesting `&` and all) names a state. */
export function isStateSelector(selector) {
  const bare = selector.replace(NOT, "");
  return STATE_PSEUDO.test(bare) || STATE_ATTRIBUTE.test(bare);
}

/** The partial's path under src/styles/, or undefined for a file that is not one. */
export function partialOf(file) {
  const at = file?.replace(/\\/g, "/").lastIndexOf("/src/styles/");
  return at === undefined || at < 0 ? undefined : file.replace(/\\/g, "/").slice(at + "/src/styles/".length);
}

/**
 * Every box-shadow declaration under a state selector, with the chain of
 * enclosing rules and at-rules that identifies it. The chain, not the line,
 * is the key: a line moves whenever something above it does; a chain moves
 * only when the site itself is rewritten.
 */
export function stateBoxShadows(root) {
  const found = [];
  root.walkDecls(/^box-shadow$/i, (decl) => {
    const chain = [];
    let state = false;
    for (let node = decl.parent; node && node.type !== "root"; node = node.parent) {
      if (node.type === "rule") {
        chain.unshift(tidy(node.selector));
        state ||= isStateSelector(node.selector);
      } else if (node.type === "atrule") {
        chain.unshift(tidy(`@${node.name} ${node.params}`));
      }
    }
    if (state) {
      found.push({ decl, selector: chain.join(" | ") });
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
    // `{ allowlist: false }` reports every site: what the generator runs on main.
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
