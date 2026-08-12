process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.GCLOUD_PROJECT ??= "sendflow-dev-prova";

export let db: (typeof import("../firebase.ts"))["db"];

export const initializeIntegrationContext = async () => {
  ({ db } = await import("../firebase.ts"));
};

export const terminateIntegrationContext = async () => {
  await db?.terminate();
};
