export default {
  extends: ["stylelint-config-standard-scss"],
  plugins: ["./tools/stylelint/no-undeclared-custom-property.js"],
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
  },
};
