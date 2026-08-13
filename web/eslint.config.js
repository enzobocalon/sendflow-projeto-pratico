import js from "@eslint/js";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        tsconfigRootDir,
      },
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@mui/material",
              message:
                "Importe cada componente diretamente, por exemplo @mui/material/Button.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportDefaultDeclaration",
          message: "Use exports nomeados nos arquivos da aplicação.",
        },
        {
          selector:
            "FunctionDeclaration[id.name=/^[A-Z]/] > ObjectPattern.params",
          message:
            "Componentes devem receber props tipadas e desestruturá-las no corpo da função.",
        },
        {
          selector:
            "VariableDeclarator[id.name=/^[A-Z]/] > ArrowFunctionExpression > ObjectPattern.params",
          message:
            "Componentes devem receber props tipadas e desestruturá-las no corpo da função.",
        },
      ],
    },
  },
  eslintConfigPrettier,
]);
