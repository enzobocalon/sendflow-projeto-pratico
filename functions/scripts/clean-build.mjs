import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const buildDirectory = fileURLToPath(new URL("../lib/", import.meta.url));

await rm(buildDirectory, { force: true, recursive: true });
