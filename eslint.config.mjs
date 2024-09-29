import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    ignores: ["node_modules/**", "dist/**", "public/**"],
  },
  { languageOptions: { globals: globals.browser } },
  {
    rules: {
      eqeqeq: "error",
      "no-unused-vars": "warn",
      "prefer-const": ["error", { ignoreReadBeforeAssign: true }],
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat["jsx-runtime"],
  {
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  eslintPluginPrettierRecommended,
  {
    rules: {
      "prettier/prettier": [
        "error",
        {
          singleQuote: false,
          semi: true,
          useTabs: false,
          tabWidth: 2,
          bracketSpacing: true,
        },
      ],
    },
  },
  {
    ignores: ["**/components/ui/*.tsx"]
  },
];
