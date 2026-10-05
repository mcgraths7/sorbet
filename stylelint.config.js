export default {
  extends: ["stylelint-config-standard-scss"],
  plugins: ["./tools/stylelint/no-undeclared-custom-property.js", "./tools/stylelint/no-state-box-shadow.js"],
  ignoreFiles: ["**/dist/**", "**/node_modules/**", "**/_generated.scss"],
  rules: {
    // These are intentional Sorbet conventions, not formatting mistakes.
    "at-rule-empty-line-before": null,
    "declaration-block-no-redundant-longhand-properties": null,
    "declaration-block-single-line-max-declarations": null,
    "media-feature-range-notation": null,
    "property-no-vendor-prefix": null,
    "scss/comment-no-empty": null,
    "scss/double-slash-comment-empty-line-before": null,
    "selector-class-pattern": "^(?:sb|u)(?:(?:--|__|-)[a-z0-9]+)*$",
    "unit-no-unknown": null,
    "value-keyword-case": ["lower", { ignoreKeywords: ["currentColor"] }],

    // Every var() reference must be backed by a local declaration. _tokens.scss
    // is the intentional exception: it implements the validated token accessors.
    "sorbet/no-undeclared-custom-property": true,

    // box-shadow is one property: a state selector that writes it replaces the
    // element's edge. Outside abstracts/, a state sets a layer's custom
    // property instead (see control-glow and soft-edge). The sites that did so
    // on main are allowlisted in tools/stylelint/state-box-shadow-allowlist.json,
    // generated from main and only ever shrinking.
    "sorbet/no-state-box-shadow": true,
  },
};
