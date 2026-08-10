import { existsSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";

export default {
  plugins: [
    {
      enforce: "pre",
      name: "resolve-functions-local-modules",
      resolveId(source, importer) {
        if (!importer || !source.startsWith(".") || extname(source)) {
          return;
        }

        const modulePath = resolve(dirname(importer), source);

        for (const extension of [".ts", ".js"]) {
          const candidate = `${modulePath}${extension}`;

          if (existsSync(candidate)) {
            return candidate;
          }
        }
      },
    },
  ],
  resolve: {
    extensions: [".ts", ".js"],
  },
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      thresholds: {
        branches: 95,
        functions: 95,
        lines: 95,
        perFile: true,
        statements: 95,
      },
    },
  },
};
