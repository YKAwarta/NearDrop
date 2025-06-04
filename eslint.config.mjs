import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginPrettier from 'eslint-plugin-prettier';
import parser from "@babel/eslint-parser";
import { defineConfig } from "eslint/config";


export default defineConfig([
  {
    files: ["**/*.{js, mjs, cjs, jsx}"],
    languageOptions: {
      parser: parser,
      parserOptions: {
        requireConfigFile: false,
        ecmaVersion: "latest",
        sourceType: "module",
        babelOptions: {
          presets: ['@babel/preset-react'],
        },
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: "detect",
      }
    },
    plugins: {
      js,
      react: pluginReact,
      prettier: pluginPrettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,
      "prettier/prettier": "error",
      "react/prop-types": "off",
    },
  },
]);
