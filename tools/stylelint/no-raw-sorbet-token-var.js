import stylelint from "stylelint";

const { createPlugin, utils } = stylelint;
const ruleName = "sorbet/no-raw-token-var";
const messages = utils.ruleMessages(ruleName, {
  rejected: (token) =>
    `Use the validated accessor from styles/abstracts/_tokens.scss instead of var(${token}).`,
});
const rawTokenVar = /var\(\s*(--sb-[a-z0-9-]+)/gi;

const rule = (primary) => {
  return (root, result) => {
    // This is the one implementation point for the validated accessors.
    if (!primary || root.source?.input.file?.endsWith("/abstracts/_tokens.scss")) {
      return;
    }

    const reportRawTokenVars = (value, node) => {
      for (const match of value.matchAll(rawTokenVar)) {
        utils.report({
          message: messages.rejected(match[1]),
          node,
          result,
          ruleName,
        });
      }
    };

    root.walkDecls((declaration) => {
      reportRawTokenVars(declaration.value, declaration);
    });

    root.walkAtRules((atRule) => {
      reportRawTokenVars(atRule.params, atRule);
    });
  };
};

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = {
  url: "https://github.com/mcgraths7/sorbet/blob/main/packages/design-system/src/styles/abstracts/_tokens.scss",
};

export default createPlugin(ruleName, rule);
