import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import importPlugin from "eslint-plugin-import";
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
      import: importPlugin,
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
      "import/no-duplicates": "error",
      "import/order": [
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
    ...reactHooks.configs["recommended-latest"],
  },
  {
    files: ["apps/playground/**/*.{jsx,tsx}"],
    ...reactRefresh.configs.vite,
  },
);
