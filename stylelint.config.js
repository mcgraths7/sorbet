export default {
  extends: ["stylelint-config-standard-scss"],
  plugins: ["./tools/stylelint/no-raw-sorbet-token-var.js"],
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

    // Sorbet tokens must be validated by the Sass accessors in _tokens.scss.
    // Unprefixed custom properties remain permitted as component knob APIs.
    "sorbet/no-raw-token-var": true,
  },
};
