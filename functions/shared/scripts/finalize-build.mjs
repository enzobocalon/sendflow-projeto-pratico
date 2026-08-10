import { rename, rm } from "node:fs/promises";

const distUrl = new URL("../dist/", import.meta.url);
const cjsUrl = new URL("cjs/", distUrl);
const esmUrl = new URL("esm/", distUrl);

await Promise.all([
  rm(new URL("index.js", distUrl), { force: true }),
  rm(new URL("index.d.ts", distUrl), { force: true }),
  rm(new URL("index.cjs", cjsUrl), { force: true }),
  rm(new URL("index.d.cts", cjsUrl), { force: true }),
  rm(new URL("index.mjs", esmUrl), { force: true }),
  rm(new URL("index.d.mts", esmUrl), { force: true }),
]);

await Promise.all([
  rename(new URL("index.js", cjsUrl), new URL("index.cjs", cjsUrl)),
  rename(new URL("index.d.ts", cjsUrl), new URL("index.d.cts", cjsUrl)),
  rename(new URL("index.js", esmUrl), new URL("index.mjs", esmUrl)),
  rename(new URL("index.d.ts", esmUrl), new URL("index.d.mts", esmUrl)),
]);
