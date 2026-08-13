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

const importOrganizationPlugin = {
  rules: {
    "group-by-origin": {
      meta: {
        type: "layout",
        schema: [],
        messages: {
          blankLine:
            "Separe imports externos, absolutos e relativos com uma linha em branco.",
          groupOrder:
            "Ordene imports em: bibliotecas externas, módulos absolutos com @/ e arquivos relativos.",
          sameGroup:
            "Não use linhas em branco entre imports pertencentes ao mesmo grupo.",
        },
      },
      create(context) {
        const getGroup = (source) => {
          if (source.startsWith("@/")) return 1;
          if (source.startsWith(".")) return 2;
          return 0;
        };

        return {
          Program(node) {
            const imports = node.body.filter(
              (statement) => statement.type === "ImportDeclaration",
            );

            for (let index = 1; index < imports.length; index += 1) {
              const previousImport = imports[index - 1];
              const currentImport = imports[index];
              const previousGroup = getGroup(previousImport.source.value);
              const currentGroup = getGroup(currentImport.source.value);
              const lineGap =
                currentImport.loc.start.line - previousImport.loc.end.line;

              if (currentGroup < previousGroup) {
                context.report({
                  node: currentImport,
                  messageId: "groupOrder",
                });
                continue;
              }

              if (currentGroup > previousGroup && lineGap < 2) {
                context.report({ node: currentImport, messageId: "blankLine" });
              }

              if (currentGroup === previousGroup && lineGap > 1) {
                context.report({ node: currentImport, messageId: "sameGroup" });
              }
            }
          },
        };
      },
    },
  },
};

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
    plugins: {
      "import-organization": importOrganizationPlugin,
    },
    rules: {
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "import-organization/group-by-origin": "error",
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
          patterns: [
            {
              regex: "^\\.\\./\\.\\./",
              message:
                "Use o alias @/ para módulos compartilhados ou de outras features.",
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
