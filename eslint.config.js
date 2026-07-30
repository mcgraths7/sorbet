import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import importX from "eslint-plugin-import-x";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

const sourceFiles = ["**/*.{js,mjs,cjs,ts,tsx}"];

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "packages/cli/scaffold/**"],
  },
  {
    files: sourceFiles,
    extends: [js.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@stylistic": stylistic,
      "import-x": importX,
    },
    rules: {
      curly: "error",
      // `value != null` is the concise, intentional check for both null and undefined.
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-else-return": "error",
      "no-implicit-coercion": "error",
      "no-lonely-if": "error",
      "no-return-assign": "error",
      "no-throw-literal": "error",
      "object-shorthand": ["error", "properties"],
      "prefer-const": "error",
      "prefer-template": "error",
      "import-x/no-duplicates": "error",
      "import-x/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index", "object", "type"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "@stylistic/array-bracket-spacing": ["error", "never"],
      "@stylistic/brace-style": ["error", "1tbs", { allowSingleLine: false }],
      "@stylistic/comma-dangle": ["error", "always-multiline"],
      "@stylistic/comma-spacing": "error",
      "@stylistic/eol-last": ["error", "always"],
      "@stylistic/indent": ["error", 2, { SwitchCase: 1 }],
      "@stylistic/keyword-spacing": "error",
      "@stylistic/linebreak-style": ["error", "unix"],
      "@stylistic/no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
      "@stylistic/no-trailing-spaces": "error",
      "@stylistic/object-curly-spacing": ["error", "always"],
      "@stylistic/padded-blocks": ["error", "never"],
      "@stylistic/quotes": ["error", "double", { avoidEscape: true }],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/space-before-blocks": "error",
      "@stylistic/space-before-function-paren": ["error", "never"],
      "@stylistic/space-infix-ops": "error",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [tseslint.configs.recommended],
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    // Supply the plugin object ourselves — react-hooks' preset still ships
    // legacy array-form `plugins`, which flat config (eslint 10) rejects.
    plugins: { "react-hooks": reactHooks },
    rules: {
      // The full react-hooks 7 preset: the classic two plus the React-Compiler
      // era rules (set-state-in-effect, purity, refs, immutability, …).
      ...reactHooks.configs["recommended-latest"].rules,
      // The preset ships this as a warning; we've always treated it as an error.
      "react-hooks/exhaustive-deps": "error",
    },
  },
  {
    files: ["apps/playground/**/*.{jsx,tsx}"],
    ...reactRefresh.configs.vite,
  },
  {
    // Playground demo files pair their component with a `demo` metadata export
    // (that pairing is what makes registration zero-touch) — allow it alongside
    // the component without losing fast refresh.
    files: ["apps/playground/src/demos/**/*.tsx"],
    rules: {
      "react-refresh/only-export-components": ["error", { allowExportNames: ["demo"] }],
    },
  },
);
