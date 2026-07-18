import stylelint from "stylelint";

const { createPlugin, utils } = stylelint;
const ruleName = "sorbet/no-undeclared-custom-property";
const messages = utils.ruleMessages(ruleName, {
  rejected: (customProperty) =>
    `${customProperty} must be declared in this Sass file to be used with var().`,
});
const customPropertyVar = /var\(\s*(--(?:[a-z0-9_-]|\\.)+)/gi;

const rule = (primary) => {
  return (root, result) => {
    // _tokens.scss deliberately implements the token accessors themselves.
    if (!primary || root.source?.input.file?.endsWith("/abstracts/_tokens.scss")) {
      return;
    }

    const declaredCustomProperties = new Set();

    root.walkDecls((declaration) => {
      if (declaration.prop.startsWith("--")) {
        declaredCustomProperties.add(declaration.prop);
      }
    });

    root.walkAtRules("property", (atRule) => {
      const [customProperty] = atRule.params.trim().split(/\s+/, 1);
      if (customProperty?.startsWith("--")) {
        declaredCustomProperties.add(customProperty);
      }
    });

    const reportUndeclaredCustomProperties = (value, node) => {
      for (const match of value.matchAll(customPropertyVar)) {
        const customProperty = match[1];
        if (declaredCustomProperties.has(customProperty)) {
          continue;
        }
        utils.report({
          message: messages.rejected(customProperty),
          node,
          result,
          ruleName,
        });
      }
    };

    root.walkDecls((declaration) => {
      reportUndeclaredCustomProperties(declaration.value, declaration);
    });

    root.walkAtRules((atRule) => {
      reportUndeclaredCustomProperties(atRule.params, atRule);
    });
  };
};

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = {
  url: "https://github.com/mcgraths7/sorbet/blob/main/packages/design-system/src/styles/abstracts/_tokens.scss",
};

export default createPlugin(ruleName, rule);
